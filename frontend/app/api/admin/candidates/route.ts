import { NextResponse } from "next/server";
import incomingTasksData from "../../../data/incomingTasks.json";
import { searchCandidatesForTask } from "../../../lib/crustdataAdmin";
import type { AdminTask } from "../../../lib/adminMatching";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const tasks = incomingTasksData as AdminTask[];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId");

  if (!taskId) {
    return NextResponse.json({ error: "Task id is required." }, { status: 400 });
  }

  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    return NextResponse.json({ error: "Task was not found." }, { status: 404 });
  }

  try {
    const candidates = await searchCandidatesForTask(task);
    return NextResponse.json({ candidates });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to load candidates right now. Please try again in a moment.",
      },
      { status: 502 },
    );
  }
}
