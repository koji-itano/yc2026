export type TaskPriority = "high" | "medium" | "low";

export type AdminTask = {
  eta: string;
  id: string;
  lane: string;
  location: string;
  locationArea: string;
  markerLabel: string;
  priority: TaskPriority;
  requiredSkill: string;
  reward: string;
  summary: string;
  title: string;
  type: string;
};

export type WorkerAvailability = "available" | "busy" | "offline";

export type Worker = {
  availability: WorkerAvailability;
  currentLoad: number;
  homeArea: string;
  id: string;
  languages: string[];
  name: string;
  rating: number;
  skills: string[];
};

export type RankedCandidate = {
  distanceLabel: string;
  reasons: string[];
  score: number;
  worker: Worker;
};

export type AdminCandidate = {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  headline: string;
  distanceLabel: string;
  profileConfidence: "high" | "medium" | "low";
  roleFitLabel: string;
  reasons: string[];
  score: number;
  linkedinUrl?: string;
};

export type TaskRecommendation = {
  task: AdminTask;
  score: number;
  reason: string;
};

const areaProximity: Record<string, Record<string, number>> = {
  Ginza: {
    Ginza: 1,
    Marunouchi: 2,
    Minato: 3,
    Shibuya: 5,
    Shinjuku: 6,
    Ueno: 7,
  },
  Marunouchi: {
    Ginza: 2,
    Marunouchi: 1,
    Minato: 3,
    Shibuya: 6,
    Shinjuku: 7,
    Ueno: 5,
  },
  Minato: {
    Ginza: 3,
    Marunouchi: 3,
    Minato: 1,
    Shibuya: 3,
    Shinjuku: 5,
    Ueno: 7,
  },
  Shibuya: {
    Ginza: 5,
    Marunouchi: 6,
    Minato: 3,
    Shibuya: 1,
    Shinjuku: 2,
    Ueno: 8,
  },
  Shinjuku: {
    Ginza: 6,
    Marunouchi: 7,
    Minato: 5,
    Shibuya: 2,
    Shinjuku: 1,
    Ueno: 6,
  },
  Ueno: {
    Ginza: 7,
    Marunouchi: 5,
    Minato: 7,
    Shibuya: 8,
    Shinjuku: 6,
    Ueno: 1,
  },
};

function getDistanceScore(task: AdminTask, worker: Worker) {
  const rawDistance = areaProximity[task.locationArea]?.[worker.homeArea] ?? 9;

  if (rawDistance <= 1) {
    return { distanceLabel: "same zone", points: 24 };
  }

  if (rawDistance <= 3) {
    return { distanceLabel: "nearby", points: 16 };
  }

  if (rawDistance <= 5) {
    return { distanceLabel: "cross-district", points: 8 };
  }

  return { distanceLabel: "far transfer", points: 2 };
}

function getAvailabilityScore(worker: Worker) {
  if (worker.availability === "available") {
    return { label: "available now", points: 14 };
  }

  if (worker.availability === "busy") {
    return { label: "busy, can re-route", points: 5 };
  }

  return { label: "offline fallback", points: -4 };
}

function getSkillScore(task: AdminTask, worker: Worker) {
  const normalizedRequiredSkill = task.requiredSkill.toLowerCase();
  const normalizedType = task.type.toLowerCase();
  const normalizedSkills = worker.skills.map((skill) => skill.toLowerCase());

  if (normalizedSkills.includes(normalizedRequiredSkill)) {
    return { label: `strong ${task.requiredSkill} fit`, points: 42 };
  }

  if (normalizedSkills.includes(normalizedType)) {
    return { label: `good ${task.type} coverage`, points: 28 };
  }

  return { label: "adjacent field experience", points: 10 };
}

export function rankCandidates(task: AdminTask, workers: Worker[]): RankedCandidate[] {
  return workers
    .map((worker) => {
      const skill = getSkillScore(task, worker);
      const distance = getDistanceScore(task, worker);
      const availability = getAvailabilityScore(worker);
      const ratingPoints = Math.round(worker.rating * 4);
      const loadPoints = Math.max(0, 10 - worker.currentLoad * 2);
      const score = skill.points + distance.points + availability.points + ratingPoints + loadPoints;

      return {
        distanceLabel: distance.distanceLabel,
        reasons: [skill.label, distance.distanceLabel, availability.label],
        score,
        worker,
      };
    })
    .sort((left, right) => right.score - left.score || right.worker.rating - left.worker.rating);
}

/**
 * Inverse of rankCandidates — given a candidate profile, score every task
 * and return the top `limit` recommendations.
 */
export function recommendTasksForCandidate(
  candidate: AdminCandidate,
  tasks: AdminTask[],
  limit = 3,
): TaskRecommendation[] {
  const priorityPoints: Record<string, number> = { high: 20, medium: 10, low: 4 };

  const candidateTokens = [
    ...candidate.headline.toLowerCase().split(/\W+/),
    ...candidate.title.toLowerCase().split(/\W+/),
    ...candidate.roleFitLabel.toLowerCase().split(/\W+/),
  ];

  return tasks
    .map((task) => {
      const taskSkill = task.requiredSkill.toLowerCase();
      const taskType = task.type.toLowerCase();

      // Skill fit
      const skillMatch = candidateTokens.includes(taskSkill)
        ? 40
        : candidateTokens.includes(taskType)
          ? 25
          : 8;

      // Location fit (reuse existing proximity table)
      const candidateArea = candidate.location.split(",")[0].trim();
      const rawDistance = areaProximity[task.locationArea]?.[candidateArea] ?? 9;
      const locationPoints =
        rawDistance <= 1 ? 20 : rawDistance <= 3 ? 14 : rawDistance <= 5 ? 7 : 2;

      // Priority weight
      const priorityPts = priorityPoints[task.priority] ?? 4;

      // Profile confidence bonus
      const confidenceBonus =
        candidate.profileConfidence === "high"
          ? 10
          : candidate.profileConfidence === "medium"
            ? 5
            : 0;

      const score = skillMatch + locationPoints + priorityPts + confidenceBonus;

      const reason =
        skillMatch >= 40
          ? `Strong skill match for ${task.requiredSkill}`
          : skillMatch >= 25
            ? `Good coverage for ${task.type} tasks`
            : "Adjacent experience — worth exploring";

      return { task, score, reason };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
