import "server-only";

import type { AdminTask } from "./adminMatching";

export type AcceptanceLanguage = "en" | "ja";
export type AcceptanceStep = "availability" | "briefing" | "eta" | "final" | "safety";
export type AcceptanceStatusHint = "confirmed" | "continue" | "declined" | "needs_help";

export type AcceptanceConversationMessage = {
  content: string;
  role: "assistant" | "user";
};

export type AcceptanceReply = {
  assistantText: string;
  nextStep: AcceptanceStep;
  statusHint: AcceptanceStatusHint;
};

type ShisaChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const SHISA_CHAT_COMPLETIONS_URL = "https://api.shisa.ai/openai/v1/chat/completions";
const SHISA_MODEL = "shisa-ai/shisa-v2.1-llama3.3-70b";

function getShisaToken() {
  const token = process.env.shsk_token;

  if (!token) {
    throw new Error("Shisa token is not configured.");
  }

  return token;
}

function buildSystemPrompt(language: AcceptanceLanguage) {
  const languageInstruction =
    language === "ja"
      ? "Respond in Japanese unless the user explicitly switches to English."
      : "Respond in English unless the user explicitly switches to Japanese.";

  return `
You are a hands-free job acceptance assistant for field work tasks.
${languageInstruction}
Keep the conversation natural, polite, and easy to say out loud.
Ask only one thing at a time and keep each reply to one short spoken turn.
Sound like a calm human coordinator, not a script or a manual.
Only use facts that are included in the task context and conversation.
Guide the user through this exact sequence:
1. Brief the task.
2. Confirm availability.
3. Confirm ETA.
4. Confirm safety/prerequisites.
5. Confirm accept or decline.
For Japanese replies, use polite and natural spoken Japanese.
Do not sound robotic, overly formal, repetitive, or overly stiff.
Avoid bullet-point phrasing, checklist phrasing, or repeating the same stock opener every turn.
It is fine to use a short bridge such as "お願いします", "では", or "念のため" when it sounds natural.
The assistantText value must contain only the spoken reply that the worker should hear.
If the user is uncertain, offer a short clarification or escalation to human support.
If the user declines, mark the status as declined.
If the user says they need help, cannot understand, or cannot safely proceed, mark the status as needs_help.
Return valid JSON only with this shape:
{"assistantText":"...","nextStep":"briefing|availability|eta|safety|final","statusHint":"continue|confirmed|declined|needs_help"}
Do not wrap the JSON in markdown.
`.trim();
}

function buildTaskContext(task: AdminTask) {
  return [
    `Task title: ${task.title}`,
    `Task summary: ${task.summary}`,
    `Location: ${task.location}`,
    `ETA target: ${task.eta}`,
    `Reward: ${task.reward}`,
    `Required skill: ${task.requiredSkill}`,
    `Dispatch lane: ${task.lane}`,
    `Priority: ${task.priority}`,
  ].join("\n");
}

function getFallbackReply(language: AcceptanceLanguage): AcceptanceReply {
  return language === "ja"
    ? {
        assistantText: "この案件を確認します。今から対応できそうか、まず教えてください。",
        nextStep: "availability",
        statusHint: "continue",
      }
    : {
        assistantText: "I can help confirm this task. Are you available to take it and head over safely?",
        nextStep: "availability",
        statusHint: "continue",
      };
}

function normalizeAssistantText(text: string, language: AcceptanceLanguage) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return getFallbackReply(language).assistantText;
  }

  if (language === "ja") {
    return normalized
      .replace(/^会話を開始してください。?/u, "")
      .replace(/^タスク概要を短く伝えて、?/u, "")
      .replace(/^その後で/u, "")
      .replace(/^確認してください。?/u, "")
      .trim();
  }

  return normalized
    .replace(/^Start the conversation\.?\s*/i, "")
    .replace(/^Brief the task in one short message,?\s*/i, "")
    .replace(/^then ask if the user is available now\.?\s*/i, "")
    .trim();
}

function parseAssistantPayload(content: string | undefined, language: AcceptanceLanguage): AcceptanceReply {
  const fallback = getFallbackReply(language);

  if (!content) {
    return fallback;
  }

  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(trimmed) as Partial<AcceptanceReply>;

    if (
      typeof parsed.assistantText === "string" &&
      typeof parsed.nextStep === "string" &&
      typeof parsed.statusHint === "string"
    ) {
      return {
        assistantText: normalizeAssistantText(parsed.assistantText, language),
        nextStep: parsed.nextStep as AcceptanceStep,
        statusHint: parsed.statusHint as AcceptanceStatusHint,
      };
    }
  } catch {
    return {
      assistantText: normalizeAssistantText(trimmed, language),
      nextStep: "availability",
      statusHint: "continue",
    };
  }

  return fallback;
}

export async function generateAcceptanceReply(input: {
  history: AcceptanceConversationMessage[];
  language: AcceptanceLanguage;
  task: AdminTask;
  userTranscript: string;
}): Promise<AcceptanceReply> {
  const { history, language, task, userTranscript } = input;

  const messages = [
    {
      content: buildSystemPrompt(language),
      role: "system" as const,
    },
    {
      content: `Task context:\n${buildTaskContext(task)}`,
      role: "system" as const,
    },
    ...history.map((message) => ({
      content: message.content,
      role: message.role,
    })),
    {
      content:
        userTranscript.trim().length > 0
          ? userTranscript
          : language === "ja"
            ? "会話を始めてください。案件の要点をひとこと自然に伝えたうえで、今から動けそうかを丁寧に確認してください。"
            : "Start the conversation with one natural spoken reply: briefly explain the task, then politely ask if the user is available now.",
      role: "user" as const,
    },
  ];

  const response = await fetch(SHISA_CHAT_COMPLETIONS_URL, {
    body: JSON.stringify({
      messages,
      model: SHISA_MODEL,
      stream: false,
      temperature: 0.2,
    }),
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${getShisaToken()}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Shisa upstream request failed.");
  }

  const data = (await response.json()) as ShisaChatResponse;
  const content = data.choices?.[0]?.message?.content;

  return parseAssistantPayload(content, language);
}
