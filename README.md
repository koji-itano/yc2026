# Yaorozu God OS

![Next.js](https://img.shields.io/badge/Next.js-App-black?logo=next.js)
![React](https://img.shields.io/badge/React-Latest-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-Map_UI-199900?logo=leaflet&logoColor=white)
![Shisa.ai](https://img.shields.io/badge/Shisa.ai-LLM_Voice_Flow-ff6b35)
![CrustData](https://img.shields.io/badge/CrustData-B2B_Data_Matching-0f766e)
![Hackathon](https://img.shields.io/badge/Hackathon-YC_RFS_2026-f97316)

AI dispatch for physical work: map live tasks, guide workers by voice, rank operators, and keep an auditable quest feed for agent-issued jobs.

This repository was developed during a hackathon around YC's "AI Guidance for Physical Work" theme. In some strategy documents, the concept also appears as `Guidance OS`, which is the internal working name for the same idea.

## What is Yaorozu God OS?

Yaorozu God OS is a demo platform for AI-managed physical work. It shows how an AI system can issue real-world tasks, guide a human operator through acceptance, help dispatch teams assign the right person, and maintain a structured operational log of what was pushed into the system.

Instead of focusing on autonomous robots, the product focuses on the execution layer around human workers: task routing, voice-based acceptance, operator matching, and quest visibility for companies running agent-driven operations.

## How It Works

1. A worker opens the map experience and sees active quests placed on a Tokyo city map.
2. The worker can start a voice-based acceptance flow that briefs the task and confirms availability, ETA, and safety checks.
3. An admin operator reviews open tasks in a dispatch console and assigns the best available human using skill and distance ranking.
4. A company-side dashboard monitors quests pushed by an agent and tracks platform-level quest activity.

## Demo Surfaces

| Route         | Purpose                                                                    |
| ------------- | -------------------------------------------------------------------------- |
| `/`           | Worker-facing demo with map UI, quest discovery, and voice acceptance flow |
| `/admin`      | Dispatch console for ranking and assigning human operators                 |
| `/company`    | Company dashboard for agent activity and quest monitoring                  |
| `/api/quests` | API endpoint for listing quests and ingesting agent-issued quests          |

## Setup

### Run locally

Run following under frontend directory. Create `frontend/.env` from `frontend/.env.example` and set the values needed for the integrations you want to use. Open `http://localhost:3000` after the dev server starts.

```bash
# Install node packages
pnpm install
# Running frontend server
pnpm dev
```

## Sponsor Tool Integration

We built Yaorozu God OS by deeply integrating hackathon sponsor tools into every layer of the product:

### CrustData — Operator Matching Engine

CrustData's person search API powers the core of our dispatch system. When a quest is generated, we query CrustData to find the best-matched field operators in Tokyo based on job function, location, and profile confidence. The admin console (`/admin`) uses CrustData to rank and recommend candidates for each incoming task.

- **Files**: `app/lib/crustdataAdmin.ts`, `app/api/admin/candidates/route.ts`
- **Usage**: Real-time person search → profile scoring → candidate ranking
- **Impact**: Without CrustData, operator matching would be limited to static mock data. CrustData gives us access to real professional profiles for realistic dispatching.

### Shisa AI — Voice Acceptance & TTS

Shisa AI's chat completion API (`shisa-v2.1-llama3.3-70b`) drives our hands-free voice acceptance flow. When a worker taps "Accept with voice", Shisa generates a natural-language briefing in Japanese or English, guides the worker through availability/ETA/safety checks, and confirms acceptance — all as a spoken conversation. Shisa's TTS endpoint converts each AI reply into audio so the worker can operate completely hands-free.

- **Files**: `app/lib/voiceAcceptance.ts`, `app/api/voice/acceptance/route.ts`, `app/api/voice/tts/route.ts`
- **Usage**: LLM chat completion → structured acceptance flow → TTS audio playback → speech recognition loop
- **Impact**: Shisa enables bilingual (JA/EN) voice-first task acceptance — critical for field workers whose hands are occupied.

### Blaxel — Autonomous Shrine Agent

The Blaxel agent (`agent/blaxel_agent.ts`) acts as the "AI soul" of a physical asset (Yaoyorozu Shrine). It runs autonomously in a Blaxel sandbox, monitoring 6 simulated camera zones. When it detects an anomaly (fallen branches, vandalism, crowding), it auto-generates a quest and pushes it to our API. The company dashboard (`/company`) shows live agent activity.

- **Files**: `agent/blaxel_agent.ts`, `app/api/quests/route.ts`, `app/company/page.tsx`
- **Usage**: Persistent agent process → anomaly detection → auto quest dispatch → live dashboard
- **Impact**: Blaxel turns our product from a passive task board into an autonomous system where physical assets proactively request human help.

### 8th Wall — AR Guidance (Experimental)

8th Wall's open-source WebAR SDK is integrated for on-site AR guidance. Workers can point their phone camera at a target and receive overlay instructions without installing an app.

- **Files**: `8thwall/`
- **Usage**: Browser-based AR overlay for field task guidance
- **Impact**: Enables visual step-by-step guidance at the job site, bridging the gap between AI instructions and physical execution.

### Summary

| Sponsor | Where Used | Role |
|---------|-----------|------|
| **CrustData** | Admin dispatch console, `/api/admin/candidates` | Real-time operator matching from professional profiles |
| **Shisa AI** | Voice acceptance flow, `/api/voice/acceptance`, `/api/voice/tts` | Bilingual LLM conversation + text-to-speech |
| **Blaxel** | Shrine monitoring agent, `/company` dashboard | Autonomous quest generation from physical asset |
| **8th Wall** | AR camera overlay | On-site visual guidance for workers |

## API

### `GET /api/quests`

Returns the current quest list ordered from newest to oldest.

### `POST /api/quests`

Pushes a new quest into the in-memory quest store.
