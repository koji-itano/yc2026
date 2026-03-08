# INDUSTRIATE GUIDANCE OS
## The Execution Layer for AI-Managed Physical Work

**Product Requirements Document — v1.0 (DRAFT)**
c0mpiled-7/sanfransokyo Hackathon | YC RFS Spring 2026

> **Note:** This is a draft / starting point for discussion. Feedback, corrections, and alternative approaches are welcome. Nothing here is final.
Industriate Corporation (インダストリエイト株式会社)
March 8, 2026 — Toranomon Hills Mori Tower, Tokyo

> All links and facts verified as of 2026-03-08 01:48 JST

---

# 0. Fact-Check & Source Verification

全ソースドキュメント内のリンク・主張を、ライブWebソースに対して検証した結果。

| Claim / Source | Status | Verification Notes |
|---|---|---|
| YC RFS Spring 2026: AI Guidance for Physical Work | Confirmed | ycombinator.com/rfs にてライブ確認。著者: Jared Friedman。AIは physical work を直接できないが "see, reason, and guide the human who does" と明言。対象: manufacturing, field services, healthcare。デバイス: phones, AirPods, smart glasses。 |
| RentAHuman.ai — AI agent が人間を雇う marketplace | Confirmed | 2026年2月ローンチ。MCP統合あり。Nature, WIRED, Futurism, HackerNoon が報道。500K+ signups。ToS: "marketplace and intermediary only"、operator が fully responsible。 |
| RentAHuman に industrial safety/execution layer がない | Confirmed | WIRED報道: dispute は手動処理。ToS に安全保証なし。公開ドキュメントにエンタープライズ向け execution verification なし。 |
| Payman AI — AI-to-human payment API | Confirmed | AI agent 向け payment authorization API。guardrails, policies, spend limits, auditability を強調。 |
| Blaxel — AI agent sandbox platform（ハッカソンスポンサー） | Confirmed | YC S25。<25ms resume の persistent sandbox。MicroVM isolation。docs.blaxel.ai で確認。Node.js ホスティング対応。 |
| Superset — parallel coding agent orchestrator（スポンサー） | Confirmed | OSS (Apache 2.0)、github.com/superset-sh/superset。Claude Code, Codex 対応。Git worktree isolation で並列開発。 |
| Cactus Compute — on-device AI（スポンサー＋審査員） | Confirmed | YC S25。**Henry Ndubuaku が co-founder/CTO かつハッカソン審査員**。VLM, STT, text inference をモバイルで実行。SDK: React Native, Flutter, Kotlin。Cloud fallback routing あり。 |
| c0mpiled ハッカソン詳細 | Confirmed | 3月8日、虎ノ門ヒルズ。9AM-7PM。4時間開発。90秒動画。英語のみ。賞金: $5K/$2K/$1K + YC Partner Office Hours。Luma + Connpass で確認。 |
| TaskRabbit — human-to-human marketplace | Confirmed | Two-sided marketplace。ToS: Taskers は独立事業者。TaskRabbit は品質/安全/資格を保証しない。 |
| 4層マーケットモデル (Reasoning/Labor/Payment/Execution) | 分析フレームワーク | 事実主張ではなく戦略分析。上記の検証済み事実により論理的に支持される。ピッチのフレーミングとして強い。 |
| 「ヒューマノイドロボットは10年以上先」 | 妥当だが要緩和 | 権威ある出典なし。業界コンセンサスは概ね一致。推奨: "not cost-effective for factory deployment in the near term" に緩和。 |

### Critical Correction: Cactus Vision Capabilities

原文では Cactus を「リアルタイム物体認識（バウンディングボックス付き）」に使うと記載。Cactus v1 は VLM 推論（"describe what you see"）と STT をオンデバイスでサポートするが、**バウンディングボックスレベルの物体検出は公式ドキュメントで未確認**。

**推奨アプローチ:**
- Cactus → オンデバイス VLM 推論（シーン記述、状態判定）
- ブラウザ Canvas + HSV 色閾値処理 → 視覚オーバーレイ
- Claude API (cloud) → 複雑な検証判断

### Cactus 審査員への配慮

**Henry Ndubuaku（Cactus co-founder/CTO）がハッカソン審査員。** Cactus をデモに使う（アーキテクチャ上の技術として名前を出すだけでも）ことは確実に注目される。4時間 MVP では簡易実装でも、オンデバイス AI の可能性への理解をデモで示すこと。

---

# 1. Executive Summary

## One-Line Pitch

> "We're building the execution layer for AI-managed physical work — the OS that guides, verifies, and logs industrial tasks so that any worker becomes a skilled operator."

## The Problem (3 Layers)

**Layer 1 — 現場の課題:** 日本の製造業の65.9%が指導人材不足を報告（ものづくり白書2025）。熟練工不足はグローバルで加速中。

**Layer 2 — AI の物理的限界:** AI は推論・計画・支払いができるが、バルブを回すことも、溶接を検査することも、ボルトを締めることもできない。ヒューマノイドロボットは工場展開にはまだコスト的に現実的でない。

**Layer 3 — 企業導入の要件:** 企業が欲しいのは人材マッチングだけではない。安全な実行、ステップバイステップのガイダンス、完了検証、MES/CMMS に統合可能な構造化された監査ログが必要。

## The Insight

世界で最も安く、最も入手しやすく、最も汎用的な「アクチュエータ」は、**スマートフォンを持った人間**。ただし、ガイドなしの人間はミスを犯し、監査証跡を残せず、産業基準を満たせない。不足しているのは labor access ではなく **execution control**。

## The Solution

**Industriate Guidance OS:** AI がタスクを発行し、スマートフォンのカメラを通じて作業者をステップバイステップでガイドし、Vision AI で完了を検証し、エンタープライズシステム向けの構造化された監査ログを生成するシステム。

## Why Now (4 Converging Forces)

- YC RFS Spring 2026 が明確に "AI Guidance for Physical Work" を求めている — これがテーマそのもの
- RentAHuman が証明: AI agent は人間を雇う — あとはその人間を reliable にする人が必要
- オンデバイス VLM（Cactus, Gemma 3）がクラウド遅延なしのリアルタイムカメラガイダンスを実現
- インダストリエイトは既にトヨタサプライチェーン、KDDI、アルプスアルパインにサービス提供中 — 工場の現場を知っている

---

# 2. Strategic Positioning: The 4-Layer Model

AI が管理する物理作業の市場は、防御性の異なる4つのレイヤーに分離しつつある。

| Layer | Function | Key Players | Defensibility |
|---|---|---|---|
| 1. Reasoning | AI が何をすべきか決める | OpenAI, Anthropic, custom agents | Low（コモディティ化中） |
| 2. Labor Access | 人を見つけて割り当てる | RentAHuman, staffing APIs | Medium（ネットワーク効果あり） |
| 3. Payment / Auth | 支出を承認し、支払いを実行 | Payman, Stripe, crypto | Low-Medium |
| 4. Execution / Verify / Audit | 作業をガイドし、完了を検証し、証拠を生成 | **INDUSTRIATE（我々のレイヤー）** | **HIGH — vertical knowledge** |

**我々の moat は Layer 4。** Labor access はコモディティ化する。Execution には SOP 構造化、ハザード検出、例外処理、MES/CMMS 統合が必要。これらは marketplace 企業が構築しない深い vertical knowledge を要求する。

### Elevator Analogy（初見の人への説明）

> 「Uber が車を呼ぶサービスだとすると、RentAHuman は "人を呼ぶ API" です。でも工場では、人を呼ぶだけではダメです。その人に何をさせるか、危険を避けるか、正しく終わったか、記録を残すかまで必要です。私たちはそこを作っています。」

---

# 3. Competitive Differentiation

| | TaskRabbit | RentAHuman | Industriate Guidance OS |
|---|---|---|---|
| What it does | Human→human task marketplace | AI→human labor API (Who + Pay) | AI→human execution OS (How + Verify + Audit) |
| Requester | Human | AI agent | AI agent or enterprise system |
| Who decides 'how' | Worker decides | Worker decides | **AI guides step-by-step** |
| Verification | Self-reported | Photo + manual review | **Real-time vision AI verification** |
| Audit trail | None | Basic task log | **Structured: before/after images, timestamps, JSON, MES-ready** |
| Industrial safety | N/A | Not addressed (ToS: operator liable) | **PPE checks, hazard warnings, escalation** |
| Enterprise integration | None | None confirmed | **MES, CMMS, daily reports, handoff logs** |
| Workforce model | Gig workers | Gig workers (crypto-paid) | **Existing employees, authorized partners first** |

### Key Defensive Answers for Judges

**"Why not just use RentAHuman?"**
→ "RentAHuman helps agents find people. We help those people execute industrial work safely and correctly. In factories, labor access is not the bottleneck. Safe execution, verification, and auditable logs are the bottleneck."

**"What if RentAHuman adds guidance?"**
→ "Labor APIs stay labor APIs, just as Stripe stayed payments and didn't become Shopify. Execution requires deep vertical knowledge — SOPs, safety protocols, MES integration — that marketplace companies won't build."

**"Isn't this just a digital SOP?"**
→ "SOPs are static PDFs. We provide real-time, context-aware, vision-verified guidance that adapts to what the camera sees. The difference between a recipe book and a chef standing next to you."

---

# 4. Demo Specification: What to Build in 4 Hours

## 4.1 The Golden Path（One Story, One Flow）

複数シナリオは不要。**1本の完璧なデモパスが、壊れた3本より価値がある。**

**Scenario: Industrial Valve Inspection**
Physical prop: 赤いキャップ付きペットボトル（「バルブ」）。キャップは開いた状態で開始。作業者が閉める。AI が状態変化を検証する。

| Step | Screen | What Happens | Sec |
|---|---|---|---|
| 1 | PC — Dashboard | AI が anomaly 検知。Alert: "Valve #3 pressure anomaly. Physical inspection required." Task 作成: $15 bounty. Status: DISPATCHING. | 15 |
| 2 | Phone — Worker | Worker がタスク通知受信。カメラ起動。AI overlay: "Approach the red valve." 矢印/ハイライトで誘導。 | 15 |
| 3 | Phone — Worker | カメラが赤い物体を検出。緑のハイライトボックス表示。指示: "Close the valve by turning the cap clockwise." | 20 |
| 4 | Phone — Worker | Worker がキャップを閉める。Vision AI が状態変化を検知。画面が緑にフラッシュ: "VERIFIED"。Before/after 画像を自動キャプチャ。 | 15 |
| 5 | PC — Dashboard | 構造化された完了ログ表示: タイムスタンプ付き before/after 画像、operator ID、task result、JSON 監査レコード。 | 15 |
| 6 | PC — Dashboard | Summary: "Task complete. Payment released. Maintenance record filed." Industriate OS ブランディング。 | 10 |

## 4.2 Three Screens to Build

### Screen A: AI Management Dashboard（Laptop）
- Alert パネル: anomaly type, severity, recommended action
- Task カード: bounty amount, assigned worker, status (WAITING → IN PROGRESS → VERIFIED → LOGGED)
- Live feed thumbnail from worker's camera (stretch goal)
- Completion log: before/after images side-by-side, structured JSON viewer

### Screen B: Worker Mobile UI（Smartphone）
- Full-screen camera (`getUserMedia`)
- Top status bar: task name, step count
- Center: AR-style highlight overlay on target object
- Bottom: AI instruction text（大きく、明確なフォント）
- Action button: "Mark Complete" / "Take Photo"

### Screen C: Audit Log（Dashboard の一部）
- Before image + After image (side by side)
- Task metadata: ID, asset, action, operator, timestamp
- Verification result: PASS/FAIL with confidence
- Structured JSON block — **これが moat の可視化**

---

# 5. Technical Architecture

## 5.1 System Components

| Component | Technology | Purpose | Why This Choice |
|---|---|---|---|
| Dashboard (PC) | React + Vite + Tailwind | AI agent view: alerts, tasks, logs | 高速ビルド。審査員はラップトップ画面を見る |
| Worker App (Phone) | React PWA (responsive) | Camera + AR overlay + instructions | アプリインストール不要。どのスマホブラウザでも動作 |
| Agent Backend | Node.js on Blaxel sandbox | Task state machine, orchestration | スポンサーツール。persistent sandbox = cold start なし |
| Vision: overlay | Canvas API + HSV thresholding | カメラフィード上で赤い物体をハイライト | モデルダウンロード不要。即座。ブラウザ内で動作 |
| Vision: verification | Claude API (sonnet) with vision | Before/after 比較: "Is cap closed?" | 優秀な visual reasoning。シンプルな API call |
| Vision: on-device (stretch) | Cactus SDK (VLM mode) | ローカルシーン記述 | スポンサー/審査員ツール。edge AI ストーリーを実証 |
| Real-time comms | WebSocket (ws library) | Dashboard <-> Backend <-> Mobile | シンプル。ブラウザネイティブサポート |
| Parallel dev | Superset | 複数 Claude Code agents を同時実行 | スポンサーツール。並列コンポーネント開発 |

## 5.2 Data Flow

1. Dashboard がタスクをトリガー → Backend がタスクレコード作成、status = DISPATCHED
2. Mobile が WebSocket で接続 → タスク詳細 + 指示を受信
3. Mobile が "before" 画像をキャプチャ → base64 で Backend に送信
4. Worker が作業実行、Mobile が "after" 画像をキャプチャ → Backend に送信
5. Backend が両画像を Claude API に送信（prompt: "Was the red cap open before and closed after?"）
6. Claude が検証結果を返す → Backend が status を VERIFIED or FAILED に更新
7. Backend が構造化 JSON ログを生成 → WebSocket で Dashboard にプッシュ

## 5.3 Object Detection Strategy（3段階）

| Tier | Method | Build Time | Quality | When to Use |
|---|---|---|---|---|
| A (Must) | Fixed overlay + manual button | 30 min | Demo-grade | 時間がない場合。中央に緑ボックス固定表示。Worker がキャップを合わせてボタン押下。 |
| B (Should) | HSV color thresholding in Canvas | 60 min | Impressive | カメラフィード内の赤い領域を検出。バウンディングボックスが追従。リアルタイム。 |
| C (Stretch) | Cactus VLM or TF.js COCO model | 120 min | Production-grade | 真の物体検出。Tier B が動いて時間が残った場合のみ試行。 |

## 5.4 MVP vs Full Product

| Feature | Hackathon MVP (4 hrs) | Full Product |
|---|---|---|
| Object detection | Color thresholding or fixed overlay | Fine-tuned industrial detection models |
| State verification | Claude API (before/after comparison) | On-device VLM + temporal analysis |
| Task dispatch | Hardcoded single scenario | Dynamic queue from MES/CMMS |
| Worker assignment | Manual (team member acts as worker) | RentAHuman API / workforce management |
| AR guidance | 2D canvas overlay + text | 3D model overlay, smart glasses support |
| Audit log | JSON on dashboard | Auto-filed to MES, PDF generation, blockchain hash |
| Payment | Simulated ("$15 paid" on screen) | Payman API or Stripe integration |
| Safety | Text warning | PPE detection, hazard geofencing, escalation |
| Auth | None | RBAC, SSO, role-based task assignment |

---

# 6. 4-Hour Build Plan

Superset で parallel Claude Code agents を実行。各人が isolated git worktree で別コンポーネントをビルド。

| Time | Person A (Backend) | Person B (Dashboard) | Person C (Mobile) | Milestone |
|---|---|---|---|---|
| 0:00-0:30 | Vite + Express + WS server scaffold | React + Tailwind project setup | PWA scaffold + getUserMedia | 3プロジェクトすべてローカル起動 |
| 0:30-1:00 | Task state machine + REST endpoints | Alert panel + task card UI (mock data) | Camera fullscreen + canvas overlay layer | 各コンポーネントが独立レンダリング |
| 1:00-1:30 | Claude API 統合 (vision verification) | WebSocket client + live status updates | Before/after image capture (base64) | Backend が Claude 経由で画像検証可能 |
| 1:30-2:00 | WebSocket broadcast to dashboard + mobile | Before/after image viewer + JSON log | Instruction overlay + action button | 3コンポーネントが相互通信 |
| 2:00-2:30 | End-to-end integration testing | End-to-end integration testing | End-to-end integration testing | **Golden Path が end-to-end で動作** |
| 2:30-3:00 | HSV detection logic (stretch) | Polish: colors, fonts, animations | Polish: camera overlay styling | デモがプロフェッショナルに見える |
| 3:00-3:30 | Deploy to Blaxel (stretch) | Final bug fixes | Final bug fixes | 録画に向けて全安定 |
| 3:30-4:00 | Video recording + English narration | Video recording support | Video recording (worker role) | **90秒動画を提出** |

## 6.1 Critical Path（最低2人でも動く最小構成）

- **MUST:** Dashboard showing AI agent creating a task（ボタントリガーでOK）
- **MUST:** Mobile camera view with text instruction overlay
- **MUST:** Before/after image capture on mobile, displayed on dashboard
- **MUST:** Claude API call with both images returning "verified" or "not verified"
- **MUST:** Structured JSON log displayed on dashboard after verification
- **NICE:** Real-time WebSocket（polling/refresh で代替可）
- **NICE:** HSV color-based bounding box on camera feed
- **STRETCH:** Cactus on-device VLM for local scene reasoning
- **STRETCH:** Simulated payment release animation

---

# 7. 90-Second Pitch Video Script

| Time | Visual | Narration (English) |
|---|---|---|
| 0-10s | Text on screen: "AI can reason. AI can pay. AI still can't turn a valve." | "AI has become incredibly powerful at reasoning, planning, and even hiring humans. But it still can't physically execute work in the real world." |
| 10-20s | Split screen: RentAHuman site / empty factory floor | "Platforms like RentAHuman let AI agents find workers. But in industrial settings, finding someone isn't enough. You need to make sure they do the job safely, correctly, and with proof." |
| 20-30s | Industriate Guidance OS logo + 4-layer diagram | "We're building the execution layer for AI-managed physical work. The OS that guides, verifies, and logs industrial tasks." |
| 30-40s | DEMO: Dashboard alert → task dispatch | "[Live demo] Here, our AI detects a pressure anomaly on valve 3 and dispatches an inspection task." |
| 40-55s | DEMO: Worker phone → camera → AI instructions → cap close → VERIFIED | "[Live demo] The worker opens the app. AI guides them through the camera: 'close the red valve.' Vision AI verifies the action in real-time." |
| 55-70s | DEMO: Dashboard → before/after → JSON log | "[Live demo] The dashboard now shows a complete audit trail: before and after images, timestamped verification, and a structured maintenance record ready for MES integration." |
| 70-80s | Architecture slide: Cactus + Blaxel + Claude | "We use Cactus for on-device vision, Blaxel for agent infrastructure, and Claude for complex verification. Starting with existing authorized workers, scaling to any labor API." |
| 80-90s | Text: "Industriate Guidance OS — Execution Layer for AI-Managed Physical Work" | "Labor APIs tell you who's available. We make sure industrial work gets done safely, correctly, and with auditable logs. This is Industriate Guidance OS." |

---

# 8. Anticipated Judge Q&A (12 Questions)

| # | Question | Answer |
|---|---|---|
| 1 | Why not just RentAHuman? | RentAHuman = Who + Pay. We = How + Verify + Audit. In factories, the bottleneck is safe execution, not labor access. |
| 2 | What if RentAHuman adds guidance? | Stripe didn't become Shopify. Labor APIs stay labor APIs. Execution requires vertical knowledge they won't build. |
| 3 | Isn't this just a digital SOP? | SOPs are static PDFs. We adapt in real-time to what the camera sees. Recipe book vs. chef standing next to you. |
| 4 | Safety/liability? | Three layers: pre-task PPE check, real-time hazard detection, complete audit trail. We start with authorized workforce, not anonymous gig workers. |
| 5 | Business model? | B2B SaaS: platform license + per-session fee. Priced against rework costs, faster onboarding, compliance savings. |
| 6 | Why manufacturing? | $26B annual quality cost in US alone. Highest switching cost once embedded in daily workflows. Our company already serves this market. |
| 7 | Unfair advantage? | Domain expertise. Industriate already consults for Toyota supply chain, KDDI, Alps Alpine. We know factory floor politics and MES integration. |
| 8 | Global scale? | SOPs are universal in structure. Different factories = different content, same engine. Like a game engine: different games, same runtime. |
| 9 | Why not wait for robots? | (1) Robots are years from factory-ready cost. (2) Even robots will need this OS — task sequencing, verification, logging. We build the OS now with human actuators, plug in robots later. |
| 10 | Why now? | 3 converging forces: YC identified this gap, on-device VLMs now enable real-time guidance, RentAHuman proved demand. |
| 11 | How is this related to your existing company? | Industriate's 3-product model (Diagnostic -> PoC -> Production) generates the SOP knowledge that feeds this OS. This is Product 3 at global scale. |
| 12 | What's the long-term vision? | We're not an AI consulting company. We're a physical work operating system company. RentAHuman becomes one of many upstream labor adapters. |

---

# 9. Alignment with Industriate Business Strategy

ハッカソンの横道ではない。**会社の長期プロダクトビジョンのプロトタイプ。**

| Current Business | Guidance OS Connection | Strategic Value |
|---|---|---|
| Product 1: 診断サービス (50M yen) | 診断案件ごとに SOP 知識をキャプチャ → OS にフィード | コンサルがプラットフォームのデータ獲得になる |
| Product 2: PoC サービス (~300M yen) | PoC 実行者が OS を使い、学習データを生成 | PoC が AI とガイダンスシステム両方を証明 |
| Product 3: 本導入 + 月額運用 | **OS そのものが月額 SaaS レイヤー** | Product 3 のグローバル版 |
| 営業戦略: "日常業務に埋め込む" | OS は検査・保全・引き継ぎワークフローに literally 埋め込まれる | "抜けなくなる構造" 戦略の完璧な実行 |
| 営業戦略: "大手が面倒で取りにこない案件" | Pure-play AI 企業が再現できない execution knowledge | 同じ moat をソフトウェアとして製品化 |
| クライアント: トヨタチェーン, KDDI, Alps Alpine | OS の最初のエンタープライズ橋頭堡 | 既存関係 = 即座のパイロット顧客 |
| Go-to-market: 商社経由 | 商社がハードウェア販売、我々が guidance OS レイヤーを提供 | 二本立て: 商社にハードマージン + 我々に SaaS |

---

# 10. What to Bring

| Item | Purpose | Priority |
|---|---|---|
| Laptop #1 | 開発 + AI Dashboard 表示（審査員向け） | MUST |
| Smartphone #1 | Worker mobile UI (camera + instructions) | MUST |
| Charger + mobile battery | 4時間以上の連続使用 | MUST |
| 赤いキャップ / 赤い物体 | "バルブ" デモ用 physical prop | MUST |
| Laptop #2 (or tablet) | #1 が Dashboard 表示中の開発用 | NICE |
| Smartphone #2 | 動画撮影用 | NICE |
| AirPods / earbuds | AI voice guidance 感を演出（YC が AirPods に言及） | NICE |
| Phone tripod/stand | 安定した動画撮影 | NICE |
| 印刷した警告ラベル | prop に industrial リアリズムを追加 | NICE |

---

# 11. Hackathon Sponsor Tool Integration

| Tool | How to Use | Integration Depth | Judge Impact |
|---|---|---|---|
| Blaxel | Agent backend (Node.js state machine + API) を Blaxel sandbox でホスト | Deep — core infrastructure | Production-grade agent hosting を示す |
| Superset | 開発中に 2-3 parallel Claude Code agents を実行 (dashboard / mobile / backend) | Development tool — ピッチで言及 | 効率的なチームプロセスを示す |
| Cactus | Worker phone でオンデバイス VLM によるシーン記述 (stretch goal) | Medium — アーキテクチャで名前を出す | **Henry Ndubuaku が審査員; 高い visibility** |
| CrustData | Dispatch された worker や asset の企業データを表示 (stretch) | Light — 時間があれば | 追加スポンサークレジット |
| Unbound | 検証時の Claude API コールに対する policy compliance monitoring | Light — アーキテクチャで言及 | Governance awareness を示す |
| VoiceOS | 90秒ピッチ動画の voice narration | Peripheral | 直接インパクトは低い |

---

# 12. Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| スマホブラウザでカメラアクセス失敗 | デモ崩壊 | コーディング前に対象スマホで getUserMedia テスト。バックアップ: 事前録画のカメラフィードの画面録画。 |
| Claude API latency がライブデモに高すぎる | 遅い検証 | 1つの検証レスポンスを事前キャッシュ。"Verifying..." アニメーション表示。バックグラウンドで実際のコール。 |
| WebSocket 接続が会場で不安定 | Dashboard 更新されない | Fallback: 手動ページリフレッシュ。または WS の代わりに polling。 |
| Blaxel sandbox が デモ中に cold start | Backend 無応答 | 10分前に sandbox をウォームアップ。Blaxel は standby から <25ms で resume。 |
| 4時間で完成しない | 不完全なデモ | Critical path (Section 6.1) に従う。HSV 検出と Cactus をカット。Fixed overlay + Claude API のみ使用。 |
| 英語ピッチが弱い | 低スコア | 事前にスクリプト作成 (Section 7)。録画前に3回練習。シンプルで宣言的な文を使用。 |
| 審査員がヒューマノイドロボットについて質問 | コアピッチからの脱線 | 準備済み回答: "Even robots need this OS. We build it now with humans, plug in robots later." |

---

# 13. Success Criteria

優先順位順:

- **Must achieve:** 完全な90秒動画を期限内に提出（Golden Path のワーキングデモ付き）
- **Must achieve:** Dashboard + Mobile + Verification flow が全て動画内で見える
- **Must achieve:** Structured JSON audit log が表示される（moat の可視化）
- **Should achieve:** 最低1つのスポンサーツールが visible に統合 (Blaxel or Cactus)
- **Should achieve:** 4-layer positioning を説明する明確な英語ナレーション
- **Nice to achieve:** カメラフィード上のリアルタイム HSV color detection
- **Nice to achieve:** Cactus on-device VLM demo
- **Stretch:** YC Partner Office Hours invitation（上位チーム向け賞）
