# Blaxel — Perpetual Sandbox Platform for AI Agents

- **Website**: https://blaxel.ai/
- **Docs**: https://docs.blaxel.ai/Overview
- **Intro Video**: https://www.tella.tv/video/intro-video-hackathon-blaxel-3mpw
- **GitHub**: https://github.com/blaxel-ai
- **Hackathon Credits**: $500 for ALL participants
- **Background**: YC S25

---

## What It Is

Perpetual sandbox platform for AI agents. Secure computing environments where AI apps execute autonomous actions with near-instant latency through continuously available infrastructure.

## Core Components

| Component | Description |
|-----------|-------------|
| **Perpetual Sandboxes** | MicroVMs with full filesystem/process access. Resume from standby in <25ms even after weeks. |
| **Agents Hosting** | Framework-agnostic serverless endpoints for AI agents |
| **Batch Jobs** | Scalable background processing for parallel AI tasks |
| **MCP Servers Hosting** | Custom tool server deployment |
| **Model Gateway** | Intelligent LLM routing with telemetry and cost controls |

## Key Metrics

- **25ms** resume from standby
- **50K+** concurrent sandboxes
- **$0** cost when idle on standby
- Auto-suspend when idle with full memory + filesystem snapshots
- Auto scale-to-zero after 5s inactivity

## Traditional vs Blaxel

| Aspect | Traditional | Blaxel |
|--------|-------------|--------|
| Cold start | 2-5s | 25ms |
| Duration | ~1h max | Any duration |
| State | Lost | Preserved at $0 |
| Resume | Fresh start | Instant |

## Security & Compliance

- SOC 2 Certified
- HIPAA Compliant
- ISO 27001 Certified
- Multi-region (US, Europe)
- Zero data retention architecture
- Individual microVM isolation per sandbox

## Getting Started

```bash
npx skills add blaxel-ai/agent-skills
```

App: https://app.blaxel.ai

## Hackathon Relevance

PRDでは Agent Backend を Blaxel sandbox でホストする計画。Node.js state machine + WebSocket server を配置。ただし4時間MVPではローカル実行で十分な可能性もあり。デプロイトラブルのリスクを考慮。
