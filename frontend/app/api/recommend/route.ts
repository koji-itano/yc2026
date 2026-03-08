import { NextResponse } from "next/server";
import incomingTasksData from "../../data/incomingTasks.json";
import { searchCandidatesForTask } from "../../lib/crustdataAdmin";
import {
  recommendTasksForCandidate,
  type AdminTask,
} from "../../lib/adminMatching";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const tasks = incomingTasksData as AdminTask[];

/**
 * GET /api/recommend
 *
 * Picks the highest-priority unassigned task, fetches its top Crustdata
 * candidate, then recommends tasks for that candidate profile.
 *
 * Returns:
 *   { recommendations: Array<{ task, score, reason }> }
 */
export async function GET() {
  // Use the first (highest-priority) task to drive the Crustdata search
  const pivotTask = tasks[0];
  if (!pivotTask) {
    return NextResponse.json({ recommendations: [] });
  }

  try {
    const candidates = await searchCandidatesForTask(pivotTask);
    const topCandidate = candidates[0];

    if (!topCandidate) {
      return NextResponse.json({ recommendations: [] });
    }

    const recommendations = recommendTasksForCandidate(topCandidate, tasks, 3);

    return NextResponse.json({
      candidate: {
        name: topCandidate.name,
        title: topCandidate.title,
        company: topCandidate.company,
        score: topCandidate.score,
      },
      recommendations,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load recommendations right now." },
      { status: 502 },
    );
  }
}
