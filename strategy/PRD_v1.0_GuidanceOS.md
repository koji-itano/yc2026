# GUIDANCE OS
## AI管理型フィジカルワークの実行レイヤー

**プロダクト要件定義書 — v1.0（たたき台）**
c0mpiled-7/sanfransokyo ハッカソン | YC RFS Spring 2026

> **注意:** これはディスカッション用のたたき台です。フィードバック、修正、代替アプローチを歓迎します。何も確定していません。

2026年3月8日 — 虎ノ門ヒルズ森タワー、東京

> 全リンク・事実は 2026-03-08 01:48 JST 時点で検証済み

---

# 0. ファクトチェック・ソース検証

全ソースドキュメント内のリンク・主張を、ライブWebソースに対して検証した結果。

| 主張 / ソース | 状態 | 検証メモ |
|---|---|---|
| YC RFS Spring 2026: AI Guidance for Physical Work | 確認済 | ycombinator.com/rfs にてライブ確認。著者: Jared Friedman。AIは物理作業を直接できないが "see, reason, and guide the human who does" と明言。対象: 製造業、フィールドサービス、ヘルスケア。デバイス: スマホ、AirPods、スマートグラス。 |
| RentAHuman.ai — AIエージェントが人間を雇うマーケットプレイス | 確認済 | 2026年2月ローンチ。MCP統合あり。Nature, WIRED, Futurism, HackerNoon が報道。50万+登録。利用規約: "marketplace and intermediary only"、オペレーターが全責任。 |
| RentAHuman に産業安全/実行レイヤーがない | 確認済 | WIRED報道: 紛争は手動処理。利用規約に安全保証なし。公開ドキュメントにエンタープライズ向け実行検証なし。 |
| Payman AI — AI-to-human 決済API | 確認済 | AIエージェント向け決済認可API。ガードレール、ポリシー、支出制限、監査可能性を強調。 |
| Blaxel — AIエージェント サンドボックスプラットフォーム（スポンサー） | 確認済 | YC S25。<25msレジュームの永続サンドボックス。MicroVM分離。docs.blaxel.ai で確認。Node.jsホスティング対応。 |
| Superset — 並列コーディングエージェントオーケストレーター（スポンサー） | 確認済 | OSS (Apache 2.0)、github.com/superset-sh/superset。Claude Code, Codex対応。Git worktree分離で並列開発。 |
| Cactus Compute — オンデバイスAI（スポンサー＋審査員） | 確認済 | YC S25。**Henry Ndubuakuがco-founder/CTOかつハッカソン審査員**。VLM, STT, テキスト推論をモバイルで実行。SDK: React Native, Flutter, Kotlin。クラウドフォールバックルーティングあり。 |
| c0mpiled ハッカソン詳細 | 確認済 | 3月8日、虎ノ門ヒルズ。9AM-7PM。4時間開発。90秒動画。英語のみ。賞金: $5K/$2K/$1K + YC Partner Office Hours。Luma + Connpass で確認。 |
| TaskRabbit — 人対人タスクマーケットプレイス | 確認済 | 双方向マーケットプレイス。利用規約: Taskersは独立事業者。TaskRabbitは品質/安全/資格を保証しない。 |
| 4層マーケットモデル (推論/労働/決済/実行) | 分析フレームワーク | 事実主張ではなく戦略分析。上記の検証済み事実により論理的に支持される。ピッチのフレーミングとして強い。 |
| 「ヒューマノイドロボットは10年以上先」 | 妥当だが要緩和 | 権威ある出典なし。業界コンセンサスは概ね一致。推奨: 「工場展開にはまだコスト的に現実的でない」に緩和。 |

### 重要な補正: Cactus ビジョン機能

原文ではCactusを「リアルタイム物体認識（バウンディングボックス付き）」に使うと記載。Cactus v1はVLM推論（「見えているものを記述」）とSTTをオンデバイスでサポートするが、**バウンディングボックスレベルの物体検出は公式ドキュメントで未確認**。

**推奨アプローチ:**
- Cactus → オンデバイスVLM推論（シーン記述、状態判定）
- ブラウザCanvas + HSV色閾値処理 → 視覚オーバーレイ
- Claude API (クラウド) → 複雑な検証判断

### Cactus審査員への配慮

**Henry Ndubuaku（Cactus co-founder/CTO）がハッカソン審査員。** Cactusをデモに使う（アーキテクチャ上の技術として名前を出すだけでも）ことは確実に注目される。4時間MVPでは簡易実装でも、オンデバイスAIの可能性への理解をデモで示すこと。

---

# 1. エグゼクティブサマリー

## ワンライナーピッチ

> "We're building the execution layer for AI-managed physical work — the OS that guides, verifies, and logs industrial tasks so that any worker becomes a skilled operator."
>
> （AI管理型フィジカルワークの実行レイヤーを構築している。産業タスクをガイドし、検証し、ログを残すOSにより、誰もが熟練オペレーターになれる。）

## 課題（3層構造）

**レイヤー1 — 現場の課題:** 日本の製造業の65.9%が指導人材不足を報告（ものづくり白書2025）。熟練工不足はグローバルで加速中。

**レイヤー2 — AIの物理的限界:** AIは推論・計画・支払いができるが、バルブを回すことも、溶接を検査することも、ボルトを締めることもできない。ヒューマノイドロボットは工場展開にはまだコスト的に現実的でない。

**レイヤー3 — 企業導入の要件:** 企業が欲しいのは人材マッチングだけではない。安全な実行、ステップバイステップのガイダンス、完了検証、MES/CMMSに統合可能な構造化された監査ログが必要。

## インサイト

世界で最も安く、最も入手しやすく、最も汎用的な「アクチュエータ」は、**スマートフォンを持った人間**。ただし、ガイドなしの人間はミスを犯し、監査証跡を残せず、産業基準を満たせない。不足しているのは労働力へのアクセスではなく**実行の制御**。

## ソリューション

**Guidance OS:** AIがタスクを発行し、スマートフォンのカメラを通じて作業者をステップバイステップでガイドし、Vision AIで完了を検証し、エンタープライズシステム向けの構造化された監査ログを生成するシステム。

## なぜ今か（4つの収束力）

- YC RFS Spring 2026が明確に「AI Guidance for Physical Work」を求めている — これがテーマそのもの
- RentAHumanが証明: AIエージェントは人間を雇う — あとはその人間をreliableにする人が必要
- オンデバイスVLM（Cactus, Gemma 3）がクラウド遅延なしのリアルタイムカメラガイダンスを実現
- チームは製造業の現場（自動車サプライチェーン、通信、電子部品）でのAI導入実務経験あり

---

# 2. 戦略的ポジショニング: 4層モデル

AI が管理する物理作業の市場は、防御性の異なる4つのレイヤーに分離しつつある。

| レイヤー | 機能 | 主要プレイヤー | 防御性 |
|---|---|---|---|
| 1. 推論 | AIが何をすべきか決める | OpenAI, Anthropic, カスタムエージェント | 低（コモディティ化中） |
| 2. 労働力アクセス | 人を見つけて割り当てる | RentAHuman, 人材API群 | 中（ネットワーク効果あり） |
| 3. 決済/認可 | 支出を承認し、支払いを実行 | Payman, Stripe, 暗号通貨 | 低〜中 |
| 4. 実行/検証/監査 | 作業をガイドし、完了を検証し、証拠を生成 | **我々のレイヤー** | **高 — 垂直領域の専門知識** |

**我々のmoatはレイヤー4。** 労働力アクセスはコモディティ化する。実行にはSOP構造化、ハザード検出、例外処理、MES/CMMS統合が必要。これらはマーケットプレイス企業が構築しない深い垂直領域の専門知識を要求する。

### エレベーターピッチ用アナロジー

> 「Uberが車を呼ぶサービスだとすると、RentAHumanは"人を呼ぶAPI"です。でも工場では、人を呼ぶだけではダメです。その人に何をさせるか、危険を避けるか、正しく終わったか、記録を残すかまで必要です。私たちはそこを作っています。」

---

# 3. 競合差別化

| | TaskRabbit | RentAHuman | Guidance OS |
|---|---|---|---|
| 概要 | 人対人タスクマーケットプレイス | AI→人の労働力API（誰を＋支払い） | AI→人の実行OS（どうやって＋検証＋監査） |
| 依頼者 | 人間 | AIエージェント | AIエージェントまたはエンタープライズシステム |
| 「どうやる」を決めるのは | 作業者が判断 | 作業者が判断 | **AIがステップバイステップでガイド** |
| 検証 | 自己申告 | 写真＋手動レビュー | **リアルタイムVision AI検証** |
| 監査証跡 | なし | 基本的なタスクログ | **構造化: before/after画像、タイムスタンプ、JSON、MES対応** |
| 産業安全 | N/A | 未対応（利用規約: オペレーター責任） | **PPEチェック、危険警告、エスカレーション** |
| エンタープライズ統合 | なし | 未確認 | **MES, CMMS, 日報, 引き継ぎログ** |
| 労働力モデル | ギグワーカー | ギグワーカー（暗号通貨払い） | **既存従業員・認定パートナー優先** |

### 審査員への防衛回答（英語 — ピッチ用にそのまま）

**"Why not just use RentAHuman?"**
→ "RentAHuman helps agents find people. We help those people execute industrial work safely and correctly. In factories, labor access is not the bottleneck. Safe execution, verification, and auditable logs are the bottleneck."

**"What if RentAHuman adds guidance?"**
→ "Labor APIs stay labor APIs, just as Stripe stayed payments and didn't become Shopify. Execution requires deep vertical knowledge — SOPs, safety protocols, MES integration — that marketplace companies won't build."

**"Isn't this just a digital SOP?"**
→ "SOPs are static PDFs. We provide real-time, context-aware, vision-verified guidance that adapts to what the camera sees. The difference between a recipe book and a chef standing next to you."

---

# 4. デモ仕様: 4時間で何を作るか

## 4.1 ゴールデンパス（1つのストーリー、1つのフロー）

複数シナリオは不要。**1本の完璧なデモパスが、壊れた3本より価値がある。**

**シナリオ: 産業バルブ点検**
物理プロップ: 赤いキャップ付きペットボトル（「バルブ」）。キャップは開いた状態で開始。作業者が閉める。AIが状態変化を検証する。

| ステップ | 画面 | 内容 | 秒 |
|---|---|---|---|
| 1 | PC — ダッシュボード | AIが異常検知。アラート: "Valve #3 pressure anomaly. Physical inspection required." タスク作成: $15報酬。ステータス: DISPATCHING。 | 15 |
| 2 | スマホ — 作業者 | 作業者がタスク通知受信。カメラ起動。AIオーバーレイ: "Approach the red valve." 矢印/ハイライトで誘導。 | 15 |
| 3 | スマホ — 作業者 | カメラが赤い物体を検出。緑のハイライトボックス表示。指示: "Close the valve by turning the cap clockwise." | 20 |
| 4 | スマホ — 作業者 | 作業者がキャップを閉める。Vision AIが状態変化を検知。画面が緑にフラッシュ: "VERIFIED"。Before/after画像を自動キャプチャ。 | 15 |
| 5 | PC — ダッシュボード | 構造化された完了ログ表示: タイムスタンプ付きbefore/after画像、オペレーターID、タスク結果、JSON監査レコード。 | 15 |
| 6 | PC — ダッシュボード | サマリー: "Task complete. Payment released. Maintenance record filed." Guidance OSブランディング。 | 10 |

## 4.2 構築する3つの画面

### 画面A: AI管理ダッシュボード（ラップトップ）
- アラートパネル: 異常タイプ、重要度、推奨アクション
- タスクカード: 報酬額、割り当て作業者、ステータス（WAITING → IN PROGRESS → VERIFIED → LOGGED）
- 作業者カメラのライブフィードサムネイル（ストレッチゴール）
- 完了ログ: before/after画像の並列表示、構造化JSONビューア

### 画面B: 作業者モバイルUI（スマートフォン）
- フルスクリーンカメラ（`getUserMedia`）
- 上部ステータスバー: タスク名、ステップ数
- 中央: 対象物へのAR風ハイライトオーバーレイ
- 下部: AI指示テキスト（大きく、明確なフォント）
- アクションボタン: "完了マーク" / "写真撮影"

### 画面C: 監査ログ（ダッシュボードの一部）
- Before画像 + After画像（並列表示）
- タスクメタデータ: ID、アセット、アクション、オペレーター、タイムスタンプ
- 検証結果: PASS/FAILと確信度
- 構造化JSONブロック — **これがmoatの可視化**

---

# 5. 技術アーキテクチャ

## 5.1 システム構成

| コンポーネント | 技術 | 目的 | 選定理由 |
|---|---|---|---|
| ダッシュボード (PC) | React + Vite + Tailwind | AIエージェントビュー: アラート、タスク、ログ | 高速ビルド。審査員はラップトップ画面を見る |
| 作業者アプリ (スマホ) | React PWA (レスポンシブ) | カメラ + ARオーバーレイ + 指示 | アプリインストール不要。どのスマホブラウザでも動作 |
| エージェントバックエンド | Node.js on Blaxel sandbox | タスクステートマシン、オーケストレーション | スポンサーツール。永続サンドボックス = コールドスタートなし |
| ビジョン: オーバーレイ | Canvas API + HSV閾値処理 | カメラフィード上で赤い物体をハイライト | モデルダウンロード不要。即座。ブラウザ内で動作 |
| ビジョン: 検証 | Claude API (sonnet) + ビジョン | Before/after比較: "キャップは閉まったか？" | 優秀なビジュアル推論。シンプルなAPI呼び出し |
| ビジョン: オンデバイス (ストレッチ) | Cactus SDK (VLMモード) | ローカルシーン記述 | スポンサー/審査員ツール。エッジAIストーリーを実証 |
| リアルタイム通信 | WebSocket (wsライブラリ) | ダッシュボード ↔ バックエンド ↔ モバイル | シンプル。ブラウザネイティブサポート |
| 並列開発 | Superset | 複数Claude Codeエージェントを同時実行 | スポンサーツール。並列コンポーネント開発 |

## 5.2 データフロー

1. ダッシュボードがタスクをトリガー → バックエンドがタスクレコード作成、status = DISPATCHED
2. モバイルがWebSocketで接続 → タスク詳細 + 指示を受信
3. モバイルが"before"画像をキャプチャ → base64でバックエンドに送信
4. 作業者が作業実行、モバイルが"after"画像をキャプチャ → バックエンドに送信
5. バックエンドが両画像をClaude APIに送信（プロンプト: "赤いキャップは開いていた→閉まったか？"）
6. Claudeが検証結果を返す → バックエンドがstatusをVERIFIEDまたはFAILEDに更新
7. バックエンドが構造化JSONログを生成 → WebSocketでダッシュボードにプッシュ

## 5.3 物体検出戦略（3段階）

| 段階 | 方法 | 構築時間 | 品質 | 使用条件 |
|---|---|---|---|---|
| A（必須） | 固定オーバーレイ + 手動ボタン | 30分 | デモ品質 | 時間がない場合。中央に緑ボックス固定表示。作業者がキャップを合わせてボタン押下。 |
| B（推奨） | Canvas上でHSV色閾値処理 | 60分 | 印象的 | カメラフィード内の赤い領域を検出。バウンディングボックスが追従。リアルタイム。 |
| C（ストレッチ） | Cactus VLMまたはTF.js COCOモデル | 120分 | プロダクション品質 | 真の物体検出。段階Bが動いて時間が残った場合のみ試行。 |

## 5.4 MVP vs 製品版

| 機能 | ハッカソンMVP（4時間） | 製品版 |
|---|---|---|
| 物体検出 | 色閾値処理または固定オーバーレイ | ファインチューンド産業検出モデル |
| 状態検証 | Claude API（before/after比較） | オンデバイスVLM + 時系列分析 |
| タスクディスパッチ | ハードコードの単一シナリオ | MES/CMMSからの動的キュー |
| 作業者割り当て | 手動（チームメンバーが作業者役） | RentAHuman API / 労働力管理 |
| ARガイダンス | 2Dキャンバスオーバーレイ + テキスト | 3Dモデルオーバーレイ、スマートグラス対応 |
| 監査ログ | ダッシュボード上のJSON | MES自動登録、PDF生成、ブロックチェーンハッシュ |
| 決済 | シミュレーション（画面上に"$15 paid"） | Payman APIまたはStripe統合 |
| 安全 | テキスト警告 | PPE検出、危険ジオフェンシング、エスカレーション |
| 認証 | なし | RBAC、SSO、ロールベースタスク割り当て |

---

# 6. 4時間ビルドプラン

Supersetで並列Claude Codeエージェントを実行。各人がisolated git worktreeで別コンポーネントをビルド。

| 時間 | 担当A（バックエンド） | 担当B（ダッシュボード） | 担当C（モバイル） | マイルストーン |
|---|---|---|---|---|
| 0:00-0:30 | Vite + Express + WSサーバー雛形 | React + Tailwindプロジェクトセットアップ | PWA雛形 + getUserMedia | 3プロジェクトすべてローカル起動 |
| 0:30-1:00 | タスクステートマシン + RESTエンドポイント | アラートパネル + タスクカードUI（モックデータ） | カメラフルスクリーン + キャンバスオーバーレイレイヤー | 各コンポーネントが独立レンダリング |
| 1:00-1:30 | Claude API統合（ビジョン検証） | WebSocketクライアント + ライブステータス更新 | Before/after画像キャプチャ（base64） | バックエンドがClaude経由で画像検証可能 |
| 1:30-2:00 | WebSocketブロードキャスト（ダッシュボード + モバイル宛） | Before/after画像ビューア + JSONログ | 指示オーバーレイ + アクションボタン | 3コンポーネントが相互通信 |
| 2:00-2:30 | エンドツーエンド統合テスト | エンドツーエンド統合テスト | エンドツーエンド統合テスト | **ゴールデンパスがE2Eで動作** |
| 2:30-3:00 | HSV検出ロジック（ストレッチ） | ポリッシュ: 色、フォント、アニメーション | ポリッシュ: カメラオーバーレイのスタイリング | デモがプロフェッショナルに見える |
| 3:00-3:30 | Blaxelへデプロイ（ストレッチ） | 最終バグ修正 | 最終バグ修正 | 録画に向けて全安定 |
| 3:30-4:00 | 動画録画 + 英語ナレーション | 動画録画サポート | 動画録画（作業者役） | **90秒動画を提出** |

## 6.1 クリティカルパス（最低2人でも動く最小構成）

- **必須:** ダッシュボードにAIエージェントがタスク作成する画面（ボタントリガーでOK）
- **必須:** モバイルカメラビューとテキスト指示オーバーレイ
- **必須:** モバイルでのbefore/after画像キャプチャ → ダッシュボードに表示
- **必須:** Claude API呼び出しで両画像から"verified"/"not verified"を返す
- **必須:** 検証後、ダッシュボードに構造化JSONログを表示
- **推奨:** リアルタイムWebSocket（polling/refreshで代替可）
- **推奨:** カメラフィード上のHSV色ベースバウンディングボックス
- **ストレッチ:** CactusオンデバイスVLMによるローカルシーン推論
- **ストレッチ:** 決済リリースアニメーションのシミュレーション

---

# 7. 90秒ピッチ動画スクリプト

> ピッチは英語で行うため、ナレーション部分は英語のまま。

| 時間 | 画面 | ナレーション（英語） |
|---|---|---|
| 0-10秒 | テキスト: "AI can reason. AI can pay. AI still can't turn a valve." | "AI has become incredibly powerful at reasoning, planning, and even hiring humans. But it still can't physically execute work in the real world." |
| 10-20秒 | 分割画面: RentAHumanサイト / 空の工場フロア | "Platforms like RentAHuman let AI agents find workers. But in industrial settings, finding someone isn't enough. You need to make sure they do the job safely, correctly, and with proof." |
| 20-30秒 | Guidance OSロゴ + 4層図 | "We're building the execution layer for AI-managed physical work. The OS that guides, verifies, and logs industrial tasks." |
| 30-40秒 | デモ: ダッシュボードアラート → タスクディスパッチ | "[Live demo] Here, our AI detects a pressure anomaly on valve 3 and dispatches an inspection task." |
| 40-55秒 | デモ: 作業者スマホ → カメラ → AI指示 → キャップ閉め → VERIFIED | "[Live demo] The worker opens the app. AI guides them through the camera: 'close the red valve.' Vision AI verifies the action in real-time." |
| 55-70秒 | デモ: ダッシュボード → before/after → JSONログ | "[Live demo] The dashboard now shows a complete audit trail: before and after images, timestamped verification, and a structured maintenance record ready for MES integration." |
| 70-80秒 | アーキテクチャスライド: Cactus + Blaxel + Claude | "We use Cactus for on-device vision, Blaxel for agent infrastructure, and Claude for complex verification. Starting with existing authorized workers, scaling to any labor API." |
| 80-90秒 | テキスト: "Guidance OS — Execution Layer for AI-Managed Physical Work" | "Labor APIs tell you who's available. We make sure industrial work gets done safely, correctly, and with auditable logs. This is Guidance OS." |

---

# 8. 想定される審査員Q&A（12問）

> 審査は英語で行われるため、回答は英語のまま。

| # | 質問 | 回答 |
|---|---|---|
| 1 | Why not just RentAHuman? | RentAHuman = Who + Pay. We = How + Verify + Audit. In factories, the bottleneck is safe execution, not labor access. |
| 2 | What if RentAHuman adds guidance? | Stripe didn't become Shopify. Labor APIs stay labor APIs. Execution requires vertical knowledge they won't build. |
| 3 | Isn't this just a digital SOP? | SOPs are static PDFs. We adapt in real-time to what the camera sees. Recipe book vs. chef standing next to you. |
| 4 | Safety/liability? | Three layers: pre-task PPE check, real-time hazard detection, complete audit trail. We start with authorized workforce, not anonymous gig workers. |
| 5 | Business model? | B2B SaaS: platform license + per-session fee. Priced against rework costs, faster onboarding, compliance savings. |
| 6 | Why manufacturing? | $26B annual quality cost in US alone. Highest switching cost once embedded in daily workflows. Our team has direct experience in this market. |
| 7 | Unfair advantage? | Domain expertise. Our team has hands-on experience with factory floor operations, MES integration, and industrial AI deployment. |
| 8 | Global scale? | SOPs are universal in structure. Different factories = different content, same engine. Like a game engine: different games, same runtime. |
| 9 | Why not wait for robots? | (1) Robots are years from factory-ready cost. (2) Even robots will need this OS — task sequencing, verification, logging. We build it now with human actuators, plug in robots later. |
| 10 | Why now? | 3 converging forces: YC identified this gap, on-device VLMs now enable real-time guidance, RentAHuman proved demand. |
| 11 | How is this related to your background? | Our consulting experience in industrial AI (diagnostics, PoC, production) generates the SOP knowledge that feeds this OS. |
| 12 | What's the long-term vision? | A physical work operating system company. RentAHuman becomes one of many upstream labor adapters. |

---

# 9. 持ち物リスト

| アイテム | 目的 | 優先度 |
|---|---|---|
| ラップトップ #1 | 開発 + AIダッシュボード表示（審査員向け） | 必須 |
| スマートフォン #1 | 作業者モバイルUI（カメラ + 指示） | 必須 |
| 充電器 + モバイルバッテリー | 4時間以上の連続使用 | 必須 |
| 赤いキャップ / 赤い物体 | "バルブ" デモ用物理プロップ | 必須 |
| ラップトップ #2（またはタブレット） | #1がダッシュボード表示中の開発用 | 推奨 |
| スマートフォン #2 | 動画撮影用 | 推奨 |
| AirPods / イヤホン | AI音声ガイダンス感を演出（YCがAirPodsに言及） | 推奨 |
| スマホ三脚/スタンド | 安定した動画撮影 | 推奨 |
| 印刷した警告ラベル | プロップに産業的リアリズムを追加 | 推奨 |

---

# 10. スポンサーツール統合

受賞はツール使用にも与えられる。デモを壊さない範囲で、できるだけ多くのスポンサーツールを統合。

| ツール | 使い方 | 統合の深さ | 審査員インパクト |
|---|---|---|---|
| Blaxel | エージェントバックエンド（Node.jsステートマシン + API）をBlaxelサンドボックスでホスト | 深い — コアインフラ | プロダクション品質のエージェントホスティングを示す |
| Superset | 開発中に2-3並列Claude Codeエージェントを実行（ダッシュボード/モバイル/バックエンド） | 開発ツール — ピッチで言及 | 効率的なチームプロセスを示す |
| Cactus | 作業者スマホでオンデバイスVLMによるシーン記述（ストレッチゴール） | 中 — アーキテクチャで名前を出す | **Henry Ndubuakuが審査員; 高い可視性** |
| CrustData | ディスパッチされた作業者やアセットの企業データを表示（ストレッチ） | 軽い — 時間があれば | 追加スポンサークレジット |
| Unbound | 検証時のClaude API呼び出しに対するポリシーコンプライアンス監視 | 軽い — アーキテクチャで言及 | ガバナンス意識を示す |
| VoiceOS | 90秒ピッチ動画の音声ナレーション | 周辺的 | 直接インパクトは低い |

---

# 11. リスク管理

| リスク | 影響 | 軽減策 |
|---|---|---|
| スマホブラウザでカメラアクセス失敗 | デモ崩壊 | コーディング前に対象スマホでgetUserMediaテスト。バックアップ: 事前録画のカメラフィードの画面録画。 |
| Claude APIレイテンシがライブデモに高すぎる | 遅い検証 | 1つの検証レスポンスを事前キャッシュ。"Verifying..."アニメーション表示。バックグラウンドで実際のコール。 |
| WebSocket接続が会場で不安定 | ダッシュボード更新されない | フォールバック: 手動ページリフレッシュ。またはWSの代わりにpolling。 |
| BlaxelサンドボックスがデモでCold Start | バックエンド無応答 | 10分前にサンドボックスをウォームアップ。Blaxelはstandbyから<25msでresume。 |
| 4時間で完成しない | 不完全なデモ | クリティカルパス（セクション6.1）に従う。HSV検出とCactusをカット。固定オーバーレイ + Claude APIのみ使用。 |
| 英語ピッチが弱い | 低スコア | 事前にスクリプト作成（セクション7）。録画前に3回練習。シンプルで宣言的な文を使用。 |
| 審査員がヒューマノイドロボットについて質問 | コアピッチからの脱線 | 準備済み回答: "Even robots need this OS. We build it now with humans, plug in robots later." |

---

# 12. 成功基準

優先順位順:

- **必須:** 完全な90秒動画を期限内に提出（ゴールデンパスのワーキングデモ付き）
- **必須:** ダッシュボード + モバイル + 検証フローが全て動画内で見える
- **必須:** 構造化JSON監査ログが表示される（moatの可視化）
- **推奨:** 最低1つのスポンサーツールが可視的に統合（BlaxelまたはCactus）
- **推奨:** 4層ポジショニングを説明する明確な英語ナレーション
- **あれば良い:** カメラフィード上のリアルタイムHSV色検出
- **あれば良い:** CactusオンデバイスVLMデモ
- **ストレッチ:** YC Partner Office Hours招待（上位チーム向け賞）
