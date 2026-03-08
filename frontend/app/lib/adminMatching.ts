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
  searchProfile: {
    functions: string[];
    titleKeywords: string[];
  };
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

type CrustdataFilterType = "FUNCTION" | "REGION";

export type CrustdataRequestPayload = {
  filters: Array<{
    filter_type: CrustdataFilterType;
    type: "in";
    value: string[];
  }>;
  page: number;
};

export type CrustdataPerson = {
  about?: string | null;
  current_company?: string | null;
  current_company_name?: string | null;
  current_employer?: string | null;
  current_location?: string | null;
  current_title?: string | null;
  headline?: string | null;
  linkedin_profile_url?: string | null;
  linkedin_profile_urn?: string | null;
  location?: string | null;
  name?: string | null;
  query_person_linkedin_urn?: string | null;
  summary?: string | null;
  title?: string | null;
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

function getLocationTokens(location: string) {
  return location
    .toLowerCase()
    .split(/[,\s/()-]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function getCandidateDistance(task: AdminTask, location: string) {
  const candidateArea = location.split(",")[0]?.trim() ?? "";
  const rawDistance = areaProximity[task.locationArea]?.[candidateArea] ?? 9;

  if (rawDistance <= 1) {
    return { distanceLabel: "same zone", points: 20 };
  }

  if (rawDistance <= 3) {
    return { distanceLabel: "nearby", points: 14 };
  }

  if (rawDistance <= 5) {
    return { distanceLabel: "cross-district", points: 7 };
  }

  return { distanceLabel: "far transfer", points: 2 };
}

function getProfileConfidence(profile: CrustdataPerson) {
  const signals = [
    profile.linkedin_profile_url,
    profile.headline,
    profile.current_title ?? profile.title,
    profile.current_company_name ?? profile.current_company ?? profile.current_employer,
    profile.current_location ?? profile.location,
  ].filter((value) => typeof value === "string" && value.trim().length > 0).length;

  if (signals >= 4) {
    return "high" as const;
  }

  if (signals >= 2) {
    return "medium" as const;
  }

  return "low" as const;
}

function getRoleFit(task: AdminTask, profile: CrustdataPerson) {
  const requiredSkill = task.requiredSkill.toLowerCase();
  const taskType = task.type.toLowerCase();
  const keywords = task.searchProfile.titleKeywords.map((keyword) => keyword.toLowerCase());
  const haystack = [
    profile.current_title,
    profile.title,
    profile.headline,
    profile.summary,
    profile.about,
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .toLowerCase();

  if (haystack.includes(requiredSkill)) {
    return { label: `role fit: strong ${task.requiredSkill.toLowerCase()} match`, points: 42 };
  }

  if (haystack.includes(taskType)) {
    return { label: `role fit: good ${task.type.toLowerCase()} coverage`, points: 30 };
  }

  const matchedKeyword = keywords.find((keyword) => haystack.includes(keyword));
  if (matchedKeyword) {
    return { label: `role fit: matched ${matchedKeyword}`, points: 22 };
  }

  return { label: "role fit: adjacent operations background", points: 10 };
}

export function rerankCandidates(task: AdminTask, profiles: CrustdataPerson[]): AdminCandidate[] {
  return profiles
    .map((profile) => {
      const location = profile.current_location ?? profile.location ?? "Tokyo, Japan";
      const normalizedTitle = profile.current_title ?? profile.title ?? "Unknown title";
      const headline = profile.headline ?? profile.summary ?? profile.about ?? normalizedTitle;
      const company =
        profile.current_company_name ?? profile.current_company ?? profile.current_employer ?? "Unknown company";
      const distance = getCandidateDistance(task, location);
      const roleFit = getRoleFit(task, profile);
      const profileConfidence = getProfileConfidence(profile);
      const confidencePoints =
        profileConfidence === "high" ? 12 : profileConfidence === "medium" ? 6 : 0;
      const locationTokens = getLocationTokens(location);
      const tokyoBonus = locationTokens.includes("tokyo") ? 6 : 0;
      const score = roleFit.points + distance.points + confidencePoints + tokyoBonus;

      return {
        id:
          profile.linkedin_profile_urn ??
          profile.query_person_linkedin_urn ??
          profile.linkedin_profile_url ??
          `${profile.name ?? ""}:${normalizedTitle}`,
        name: profile.name?.trim() || "Unknown candidate",
        title: normalizedTitle,
        company,
        location,
        headline,
        distanceLabel: distance.distanceLabel,
        profileConfidence,
        roleFitLabel: roleFit.label,
        reasons: [roleFit.label, `location fit: ${distance.distanceLabel}`, `profile confidence: ${profileConfidence}`],
        score,
        linkedinUrl: profile.linkedin_profile_url ?? undefined,
      } satisfies AdminCandidate;
    })
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));
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
