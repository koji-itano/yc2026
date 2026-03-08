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

## API

### `GET /api/quests`

Returns the current quest list ordered from newest to oldest.

### `POST /api/quests`

Pushes a new quest into the in-memory quest store.
