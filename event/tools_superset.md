# Superset — Parallel AI Agent Orchestrator

- **Website**: https://superset.sh/
- **Docs**: https://docs.superset.sh/installation
- **Video**: https://www.youtube.com/watch?v=mk02bSQmEKY
- **GitHub**: https://github.com/superset-sh/superset (Apache 2.0)
- **Hackathon**: Tool award category

---

## What It Is

"The Code Editor for AI Agents." Desktop app (macOS) that orchestrates swarms of Claude Code, Codex, etc. in parallel. Each agent runs in its own isolated Git worktree.

## Key Features

- **Parallel Execution**: Run dozens of agents at once across different tasks
- **Universal Compatibility**: Claude Code, OpenCode, Cursor, Codex
- **Git Worktree Isolation**: No merge conflicts between agents
- **IDE Integration**: Open worktrees in VS Code, Cursor, Xcode, JetBrains
- **Port Forwarding**: Forward ports between worktrees
- **MCP Server Management**: Manage MCP servers across workspaces

## Pricing

Free and open source. Uses your own API keys directly.

## Requirements

- macOS (Apple Silicon or Intel)
- Git installed
- GitHub CLI authenticated (`gh auth status`)

## Quick Start

1. Download DMG from superset.sh
2. Sign in
3. Add a repo (local folder or Git URL)
4. Create workspace → pick branch → start working

## Build from Source

```bash
git clone https://github.com/superset-sh/superset.git
cd superset
bun install
bun run build
```

## Trusted By

Amazon, Google, DoorDash, Intercom, Vercel, Cloudflare, Webflow, Oracle, Atlassian

## Hackathon Relevance

開発中に2-3 parallel Claude Code agentsを実行してDashboard/Mobile/Backendを同時開発。ピッチで「効率的な開発プロセス」として言及。
