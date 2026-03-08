import "server-only";

import type { AdminCandidate, AdminTask, CrustdataPerson, CrustdataRequestPayload } from "./adminMatching";
import { rerankCandidates } from "./adminMatching";

const CRUSTDATA_API_URL = "https://api.crustdata.com/screener/person/search";

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
        value: task.searchProfile.functions,
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

export async function searchCandidatesForTask(task: AdminTask): Promise<AdminCandidate[]> {
  const primaryProfiles = await fetchCrustdataProfiles(buildCrustdataPayload(task));
  let candidates = rerankCandidates(task, primaryProfiles);

  if (candidates.length >= 6) {
    return candidates;
  }

  const fallbackProfiles = await fetchCrustdataProfiles({
    filters: [
      {
        filter_type: "REGION",
        type: "in",
        value: ["Tokyo, Japan"],
      },
    ],
    page: 1,
  });

  const mergedProfiles = [...primaryProfiles];
  const seenIds = new Set(
    mergedProfiles.map(
      (profile) =>
        profile.linkedin_profile_urn ??
        profile.query_person_linkedin_urn ??
        profile.linkedin_profile_url ??
        `${profile.name ?? ""}:${profile.current_title ?? ""}`,
    ),
  );

  fallbackProfiles.forEach((profile) => {
    const id =
      profile.linkedin_profile_urn ??
      profile.query_person_linkedin_urn ??
      profile.linkedin_profile_url ??
      `${profile.name ?? ""}:${profile.current_title ?? ""}`;

    if (!seenIds.has(id)) {
      seenIds.add(id);
      mergedProfiles.push(profile);
    }
  });

  candidates = rerankCandidates(task, mergedProfiles);
  return candidates;
}
