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
