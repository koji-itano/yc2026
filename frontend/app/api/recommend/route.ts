import { NextResponse } from "next/server";
import incomingTasksData from "../../data/incomingTasks.json";
import workersData from "../../data/workers.json";
import { rankCandidates, type AdminTask, type Worker } from "../../lib/adminMatching";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const tasks = incomingTasksData as AdminTask[];
const workers = workersData as Worker[];

/**
 * GET /api/recommend
 *
 * Picks the highest-priority task, ranks workers, and returns the top
 * candidate with task recommendations.
 */
export async function GET() {
  const pivotTask = tasks[0];
  if (!pivotTask) {
    return NextResponse.json({ recommendations: [] });
  }

  const ranked = rankCandidates(pivotTask, workers);
  const topRanked = ranked[0];

  if (!topRanked) {
    return NextResponse.json({ recommendations: [] });
  }

  const recommendations = tasks.slice(0, 3).map((task) => {
    const taskRanked = rankCandidates(task, [topRanked.worker]);
    const match = taskRanked[0];
    return {
      task: { id: task.id, title: task.title, type: task.type, reward: task.reward },
      score: match?.score ?? 0,
      reason: match?.reasons.join(", ") ?? "",
    };
  });

  return NextResponse.json({
    candidate: {
      name: topRanked.worker.name,
      score: topRanked.score,
      isDemo: true,
    },
    recommendations,
  });
}
