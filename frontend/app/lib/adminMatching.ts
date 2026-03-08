export type TaskPriority = "high" | "medium" | "low";

export type TaskSearchProfile = {
  functions: string[];
  titleKeywords: string[];
};

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
  searchProfile: TaskSearchProfile;
  summary: string;
  title: string;
  type: string;
};

export type CrustdataFilter = {
  filter_type: string;
  type: string;
  value: string[];
};

export type CrustdataRequestPayload = {
  filters: CrustdataFilter[];
  page: number;
};

export type CrustdataEmployer = {
  company_name?: string | null;
  is_default?: boolean | null;
  location?: string | null;
  title?: string | null;
};

export type CrustdataPerson = {
  current_title?: string | null;
  default_position_title?: string | null;
  employer?: CrustdataEmployer[] | null;
  headline?: string | null;
  linkedin_profile_url?: string | null;
  linkedin_profile_urn?: string | null;
  location?: string | null;
  name?: string | null;
  query_person_linkedin_urn?: string | null;
};

export type ProfileConfidence = "high" | "medium" | "low";

export type AdminCandidate = {
  company: string;
  distanceLabel: string;
  headline: string;
  id: string;
  linkedinUrl?: string;
  location: string;
  name: string;
  profileConfidence: ProfileConfidence;
  reasons: string[];
  roleFitLabel: string;
  score: number;
  title: string;
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

const areaAliases: Record<string, string[]> = {
  Ginza: ["ginza", "chuo"],
  Marunouchi: ["marunouchi", "tokyo station", "chiyoda"],
  Minato: ["minato", "roppongi", "toranomon", "azabu"],
  Shibuya: ["shibuya"],
  Shinjuku: ["shinjuku"],
  Ueno: ["ueno", "taito"],
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "").toLowerCase();
}

function includesOneOf(value: string, patterns: string[]) {
  return patterns.some((pattern) => value.includes(pattern.toLowerCase()));
}

function getDistanceScore(task: AdminTask, candidate: AdminCandidate) {
  const location = normalizeText(candidate.location);
  const aliases = areaAliases[task.locationArea] ?? [];

  if (includesOneOf(location, aliases)) {
    return { distanceLabel: "same zone", points: 24 };
  }

  if (location.includes("tokyo")) {
    return { distanceLabel: "tokyo-wide", points: 14 };
  }

  if (location.includes("japan")) {
    return { distanceLabel: "regional transfer", points: 8 };
  }

  return { distanceLabel: "remote profile", points: 2 };
}

function getProfileConfidence(candidate: AdminCandidate) {
  const hasLinkedin = Boolean(candidate.linkedinUrl);
  const hasHeadline = Boolean(candidate.headline);
  const hasCompany = candidate.company !== "Independent";

  if (hasLinkedin && hasHeadline && hasCompany) {
    return { label: "profile confidence: high", level: "high" as const, points: 14 };
  }

  if ((hasLinkedin && hasHeadline) || (hasHeadline && hasCompany)) {
    return { label: "profile confidence: medium", level: "medium" as const, points: 9 };
  }

  return { label: "profile confidence: low", level: "low" as const, points: 4 };
}

function getRoleFit(task: AdminTask, candidate: AdminCandidate) {
  const title = normalizeText(candidate.title);
  const headline = normalizeText(candidate.headline);
  const company = normalizeText(candidate.company);
  const combined = `${title} ${headline} ${company}`;
  const requiredSkill = normalizeText(task.requiredSkill);
  const type = normalizeText(task.type);
  const titleKeywords = task.searchProfile.titleKeywords.map((keyword) => keyword.toLowerCase());

  if (combined.includes(requiredSkill) || includesOneOf(combined, titleKeywords)) {
    return { label: `role fit: strong ${task.requiredSkill.toLowerCase()} match`, points: 42 };
  }

  if (combined.includes(type)) {
    return { label: `role fit: good ${task.type.toLowerCase()} alignment`, points: 28 };
  }

  return { label: "role fit: adjacent ops profile", points: 11 };
}

function getCompanyFit(task: AdminTask, candidate: AdminCandidate) {
  const company = normalizeText(candidate.company);

  if (company.includes("rail") || company.includes("mobility") || company.includes("logistics")) {
    return { label: "company context: field operations adjacent", points: 10 };
  }

  if (company.includes("travel") || company.includes("hotel") || company.includes("retail")) {
    return { label: "company context: service environment relevant", points: 8 };
  }

  return { label: "company context: generalist background", points: 4 };
}

function mapCrustdataPerson(person: CrustdataPerson): AdminCandidate {
  const defaultEmployer =
    person.employer?.find((employer) => employer.is_default) ?? person.employer?.[0] ?? undefined;
  const title = person.current_title ?? defaultEmployer?.title ?? person.default_position_title ?? "Unknown title";
  const company = defaultEmployer?.company_name ?? "Independent";
  const location = person.location ?? defaultEmployer?.location ?? "Tokyo, Japan";
  const name = person.name ?? "Unnamed profile";
  const headline = person.headline ?? title;
  const id =
    person.linkedin_profile_urn ??
    person.query_person_linkedin_urn ??
    person.linkedin_profile_url ??
    `${name}:${title}:${company}`;

  return {
    company,
    distanceLabel: "regional transfer",
    headline,
    id,
    linkedinUrl: person.linkedin_profile_url ?? undefined,
    location,
    name,
    profileConfidence: "medium",
    reasons: [],
    roleFitLabel: "",
    score: 0,
    title,
  };
}

export function rerankCandidates(task: AdminTask, profiles: CrustdataPerson[]): AdminCandidate[] {
  return profiles
    .map((profile) => {
      const candidate = mapCrustdataPerson(profile);
      const roleFit = getRoleFit(task, candidate);
      const distance = getDistanceScore(task, candidate);
      const companyFit = getCompanyFit(task, candidate);
      const confidence = getProfileConfidence(candidate);
      const score = roleFit.points + distance.points + companyFit.points + confidence.points;

      return {
        distanceLabel: distance.distanceLabel,
        headline: candidate.headline,
        id: candidate.id,
        linkedinUrl: candidate.linkedinUrl,
        location: candidate.location,
        name: candidate.name,
        profileConfidence: confidence.level,
        reasons: [roleFit.label, `location fit: ${distance.distanceLabel}`, confidence.label],
        roleFitLabel: roleFit.label,
        score,
        title: candidate.title,
        company: candidate.company,
      };
    })
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));
}
