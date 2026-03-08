import { NextResponse } from "next/server";
import incomingTasksData from "../../../data/incomingTasks.json";
import type { AdminTask } from "../../../lib/adminMatching";
import {
  generateAcceptanceReply,
  type AcceptanceConversationMessage,
  type AcceptanceLanguage,
} from "../../../lib/voiceAcceptance";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const tasks = incomingTasksData as AdminTask[];

export async function POST(request: Request) {
  const body = (await request.json()) as {
    history?: AcceptanceConversationMessage[];
    language?: AcceptanceLanguage;
    taskId?: string;
    userTranscript?: string;
  };

  if (!body.taskId) {
    return NextResponse.json({ error: "Task id is required." }, { status: 400 });
  }

  const task = tasks.find((item) => item.id === body.taskId);

  if (!task) {
    return NextResponse.json({ error: "Task was not found." }, { status: 404 });
  }

  try {
    const reply = await generateAcceptanceReply({
      history: Array.isArray(body.history) ? body.history : [],
      language: body.language === "en" ? "en" : "ja",
      task,
      userTranscript: typeof body.userTranscript === "string" ? body.userTranscript : "",
    });

    return NextResponse.json(reply);
  } catch {
    return NextResponse.json(
      {
        error: "Voice assistance is unavailable right now. Please try again shortly.",
      },
      { status: 502 },
    );
  }
}
