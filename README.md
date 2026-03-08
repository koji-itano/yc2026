# Real Physical Gigs (R.P.G.) — ハッカソンリポジトリ / Hackathon Repository

**c0mpiled-7/sanfransokyo ハッカソン | 2026年3月8日**
虎ノ門ヒルズ森タワー、東京

> "We're building Real Physical Gigs: a quest-like platform for AI-guided work in the real world."
>
> AIが現実世界の仕事をクエストのように依頼し、人間がガイダンスを受けて実行するプラットフォームを構築する。

**チーム / Team:** Koji Itano, Sota Kobayashi, Sam Lo
**テーマ / Theme:** #7 — AI Guidance for Physical Work (YC RFS Spring 2026)
**App Name:** Real Physical Gigs (`R.P.G.`)

---

## ディレクトリ構成 / Directory Structure

```
yc2026/
├── README.md
│
├── event/                                 # 主催者からの情報 / Organizer-provided info
│   ├── c0mpiled_hackathon_emails.md       #   全15メール + 全リンク / All emails + links
│   ├── YC_RFS_Spring2026.md               #   YC RFS 10テーマ全文 / Full text
│   ├── 20260308_team_building_slides.md   #   チームビルディング資料 / Session slides
│   ├── team_building_responses.xlsx       #   参加者フォーム (92人) / Participant data
│   ├── team_building_analysis.md          #   参加者・競合分析 / Competitor analysis
│   ├── tools_blaxel.md                    #   Blaxel — 永続サンドボックス
│   ├── tools_superset.md                  #   Superset — 並列AIエージェント
│   ├── tools_crustdata.md                 #   CrustData — B2B企業データAPI
│   ├── tools_cactus.md                    #   Cactus Compute — オンデバイスAI SDK
│   └── tools_others.md                    #   Unbound, VoiceOS, Shisa AI
│
├── strategy/                              # 戦略・企画 / Our planning docs
│   ├── PRD_v1.0_GuidanceOS.md             #   初期PRD / Initial PRD
│   ├── PRD_v1.3_GovDispatch_AR.md         #   Gov / civic task wedge
│   ├── SYMPHONY_IMPORT_PLAN_v1.0.md       #   Symphony成果物の取り込み計画
│   ├── tabletop_canister_demo_runbook_v1.0.md
│   └── AR_Guidance_v1.1_Canister.md
│
├── frontend/                              # 実行可能な Next.js フロントエンド / Runnable Next.js app
│   ├── app/                               #   App Router のエントリ / App Router entrypoint
│   ├── package.json                       #   依存関係と scripts / Dependencies and scripts
│   └── README.md                          #   セットアップ手順 / Setup instructions
│
├── prototype/                             # WIL-8 再生成プロトタイプ / Reconstructed WIL-8 prototype
│   ├── public/                            #   Dashboard / worker static UI
│   ├── server.js                          #   Local Node server
│   └── validate*.js                       #   Validation scripts
│
└── src/                                   # ソースコード / Prototype code
    └── ar-canister-demo/                  #   AR worker + dashboard demo
```

---

## クイックリンク / Quick Links

| リンク | URL |
|--------|-----|
| イベントページ | https://luma.com/rhi9rha9?pk=g-zgxvN6uXrmCjOO5 |
| YC RFS | https://www.ycombinator.com/rfs |
| Blaxel ドキュメント | https://docs.blaxel.ai/Overview |
| Cactus ドキュメント | https://cactuscompute.com/docs/v1.7 |
| Superset ドキュメント | https://docs.superset.sh/installation |

## スポンサークレジット / Sponsor Credits

| スポンサー | クレジット |
|-----------|-----------|
| CrustData | $2,000 |
| Blaxel | $500 |
| Morph | $50 |
