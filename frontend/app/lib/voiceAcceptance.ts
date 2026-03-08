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
Ask one thing at a time.
Keep replies concise, operational, and calm.
Only use facts that are included in the task context and conversation.
Your job is to guide the user through this exact sequence:
1. Brief the task.
2. Confirm availability.
3. Confirm ETA.
4. Confirm safety/prerequisites.
5. Confirm accept or decline.
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

function parseAssistantPayload(content: string | undefined): AcceptanceReply {
  const fallback: AcceptanceReply = {
    assistantText: "I can help you confirm this task. Can you take it and head over safely?",
    nextStep: "availability",
    statusHint: "continue",
  };

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
        assistantText: parsed.assistantText,
        nextStep: parsed.nextStep as AcceptanceStep,
        statusHint: parsed.statusHint as AcceptanceStatusHint,
      };
    }
  } catch {
    return {
      assistantText: trimmed,
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
            ? "会話を開始してください。最初にタスク概要を短く伝えて、その後で今すぐ対応できるかを確認してください。"
            : "Start the conversation. Brief the task in one short message, then ask if the user is available now.",
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

  return parseAssistantPayload(content);
}
