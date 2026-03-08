import "server-only";

import type { AdminTask } from "./adminMatching";

const CRUSTDATA_API_URL = "https://api.crustdata.com/screener/person/search";

type CrustdataRequestPayload = {
  filters: Array<{
    filter_type: string;
    type: string;
    value: string[];
  }>;
  page: number;
};

type CrustdataPerson = {
  current_company_name?: string;
  current_title?: string;
  linkedin_profile_url?: string;
  linkedin_profile_urn?: string;
  name?: string;
  query_person_linkedin_urn?: string;
};

export type CrustdataCandidate = {
  company: string;
  id: string;
  linkedinUrl: string | undefined;
  name: string;
  title: string;
};

function getToken() {
  const token = process.env.cstdata_token;

  if (!token) {
    throw new Error("Crustdata token is not configured.");
  }

  return token;
}

function buildCrustdataPayload(task: AdminTask): CrustdataRequestPayload {
  return {
    filters: [
      {
        filter_type: "REGION",
        type: "in",
        value: ["Tokyo, Japan"],
      },
      {
        filter_type: "FUNCTION",
        type: "in",
        value: ["Operations"],
      },
    ],
    page: 1,
  };
}

async function fetchCrustdataProfiles(payload: CrustdataRequestPayload): Promise<CrustdataPerson[]> {
  const response = await fetch(CRUSTDATA_API_URL, {
    body: JSON.stringify(payload),
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Crustdata upstream request failed.");
  }

  const data = (await response.json()) as {
    profiles?: CrustdataPerson[];
  };

  if (!Array.isArray(data.profiles)) {
    throw new Error("Crustdata response shape was unexpected.");
  }

  return data.profiles;
}

function toCandidates(profiles: CrustdataPerson[]): CrustdataCandidate[] {
  return profiles.map((p, i) => ({
    company: p.current_company_name ?? "",
    id: p.linkedin_profile_urn ?? `crustdata-${i}`,
    linkedinUrl: p.linkedin_profile_url,
    name: p.name ?? "Unknown",
    title: p.current_title ?? "",
  }));
}

export async function searchCandidatesForTask(task: AdminTask): Promise<CrustdataCandidate[]> {
  const profiles = await fetchCrustdataProfiles(buildCrustdataPayload(task));
  return toCandidates(profiles);
}
