import { NextResponse } from "next/server";
import incomingTasksData from "../../data/incomingTasks.json";
import { searchCandidatesForTask } from "../../lib/crustdataAdmin";
import {
  recommendTasksForCandidate,
  type AdminCandidate,
  type AdminTask,
} from "../../lib/adminMatching";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const tasks = incomingTasksData as AdminTask[];

/**
 * Demo-mode mock candidate — used when Crustdata API is unavailable.
 * Represents a strong all-round Tokyo field operator so the recommend
 * logic fires realistically even without live data.
 */
const DEMO_CANDIDATE: AdminCandidate = {
  id: "demo-candidate-1",
  name: "Yuki Tanaka",
  title: "Field Operations Manager",
  company: "Mobility Solutions KK",
  location: "Shibuya, Tokyo, Japan",
  headline: "Field operations & dispatch specialist with 6 years in Tokyo mobility",
  distanceLabel: "same zone",
  profileConfidence: "high",
  roleFitLabel: "role fit: strong navigation match",
  reasons: ["role fit: strong navigation match", "location fit: same zone", "profile confidence: high"],
  score: 82,
  linkedinUrl: undefined,
};

/**
 * GET /api/recommend
 *
 * Picks the highest-priority task, fetches its top Crustdata candidate,
 * then recommends tasks for that candidate profile.
 * Falls back to a demo candidate if Crustdata is unavailable.
 *
 * Returns:
 *   { candidate, recommendations: Array<{ task, score, reason }> }
 */
export async function GET() {
  const pivotTask = tasks[0];
  if (!pivotTask) {
    return NextResponse.json({ recommendations: [] });
  }

  // Try live Crustdata; fall back to demo candidate if anything fails
  let topCandidate: AdminCandidate = DEMO_CANDIDATE;
  let isDemo = true;

  try {
    const candidates = await searchCandidatesForTask(pivotTask);
    if (candidates[0]) {
      topCandidate = candidates[0];
      isDemo = false;
    }
  } catch {
    // swallow — use demo fallback
  }

  const recommendations = recommendTasksForCandidate(topCandidate, tasks, 3);

  return NextResponse.json({
    candidate: {
      name: topCandidate.name,
      title: topCandidate.title,
      company: topCandidate.company,
      score: topCandidate.score,
      isDemo,
    },
    recommendations,
  });
}
