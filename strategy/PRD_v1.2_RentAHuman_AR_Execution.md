# GUIDANCE OS v1.2
## RentAHuman発想のAR実行レイヤー

2026-03-08

---

# 1. 提案テーマ

> **Rent a Human. Guide the Human. Verify the Work.**

AIが人間にタスクを依頼する流れを `RentAHuman` 的に見せ、その後の実行をARでガイドする。

4時間で作るテーマとしては、これが最も勝ちやすい。

## テーマ名

**Guidance Dispatch**

## 一言

**A RentAHuman-style dispatch flow for physical work, with AR guidance that makes task completion reliable.**

---

# 2. このテーマが強い理由

`RentAHuman` の公開情報では、

- AI agent が bounty を投稿できる
- 人間が応募できる
- AI agent が候補者を選べる
- 人間が proof of completion を提出する
- 完了後に payment が release される

という流れが示されている。

今回の勝ち筋は、その先を作ること。

つまり:

- `RentAHuman` = **誰に頼むか**
- `Guidance Dispatch` = **どうやって正しく終わらせるか**

YCの `AI Guidance for Physical Work` とも完全に一致する。

---

# 3. 正しいプロダクト定義

このハッカソンで見せるべきものは、単なるARではない。

> **AI task marketplaces can dispatch labor, but they do not ensure correct execution. We add the execution layer.**

ここが差別化ポイント。

## 価値

1. AIが人に物理作業を依頼できる
2. 人はARガイダンスで迷わず作業できる
3. 完了証跡が構造化される
4. AIは結果を信頼できる

---

# 4. 4時間で作るデモ

## ユースケース

**Remote valve inspection / reset**

### 物理プロップ

- ペットボトル + 赤キャップ = バルブ
- 印刷した設備カード = ARターゲット
- スマホ = 作業者
- PC = AI dispatcher dashboard

## デモストーリー

1. AIが異常を検知
2. AIが `RentAHuman-style bounty` を作成
3. 人間がタスクを受諾
4. 現場でスマホを設備カードに向ける
5. ARで「どこをどう動かすか」が表示される
6. 作業者がキャップを閉める
7. before / after を提出
8. システムが `VERIFIED`
9. `Payment released` を表示

これで、dispatch から execution まで一本でつながる。

---

# 5. 作るべき画面

## A. Dispatcher Dashboard

`RentAHuman` を意識したカードUIにする。

表示要素:

- Task title
- Budget
- Location
- Deadline
- Status
- Worker assigned
- Proof submitted
- Payment released

### 初期表示

```text
Valve #3 pressure anomaly
Task: Inspect and close valve
Budget: $15
Location: Factory A / Line 2
Deadline: 15 minutes
Status: OPEN BOUNTY
```

### ステータス遷移

- `OPEN BOUNTY`
- `WORKER ACCEPTED`
- `IN PROGRESS`
- `PROOF SUBMITTED`
- `VERIFIED`
- `PAID`

## B. Worker Mobile AR Screen

表示要素:

- Task title
- Step text
- AR arrow / highlight
- `Capture Before`
- `Capture After`
- `Submit Proof`

## C. Verification / Audit Panel

表示要素:

- before image
- after image
- verification result
- timestamp
- task JSON

---

# 6. ARの役割

ARは演出ではなく、プロダクトのコアに置く。

## ARで見せるもの

- 設備カードを認識した瞬間に作業開始
- バルブに向かう矢印
- 「Turn clockwise」などの短い命令
- 正しい対象を触っている感覚

## ARでやらないもの

- 完全自動の物体認識
- 複雑な空間マッピング
- 高精度SLAM

4時間では、**Image Targetベースで十分**。

---

# 7. 8th Wallの位置づけ

第一候補は `8th Wall Image Targets`。

理由:

- スマホWebARですぐ見せられる
- 設備カードを認識トリガーにできる
- AR矢印を出すだけでデモとして強い
- インストール不要

## 実装方針

- 設備カードを1枚作る
- そのカードをImage Target化する
- 認識時に矢印とステップ文言を表示する
- ボタンUIはHTML overlayで置く

## フォールバック

- `MindAR`
- 最悪は通常カメラ + CSSオーバーレイ

---

# 8. 重要な設計判断

本当に重要なのは、`RentAHuman` を直接作り込むことではない。

## やる

- bounty風の dispatch UI
- accept された後の AR guidance
- proof submission
- verify / pay の完了体験

## やらない

- 本物のマーケットプレイス
- 応募者一覧の複雑なロジック
- 実際の決済
- 複数タスク

つまり、**RentAHumanの概念を借りて、execution layer を見せる**。

---

# 9. 技術構成

## 最小構成

- **Dashboard:** Vite + React
- **Mobile AR:** 8th Wall
- **Backend:** Node.js + Express
- **State sync:** WebSocket or polling
- **Proof storage:** in-memory or local file
- **Verification:** ルールベース or Vision API

## データモデル

```json
{
  "taskId": "task_001",
  "source": "rentahuman-style-bounty",
  "title": "Inspect and close valve #3",
  "budget": 15,
  "worker": "worker_demo_1",
  "status": "VERIFIED",
  "beforeImage": "...",
  "afterImage": "...",
  "verification": {
    "result": "pass",
    "method": "manual-or-vision"
  },
  "payment": {
    "status": "released"
  }
}
```

---

# 10. 4時間の実装順

## 0:00-0:30

- bounty風ダッシュボード雛形
- 8th Wall project作成
- 設備カード画像を作成

## 0:30-1:15

- ARターゲット認識
- AR矢印と手順テキスト
- `Accept Task` ボタン

## 1:15-2:00

- before / after キャプチャ
- ダッシュボードに状態反映

## 2:00-2:45

- verification表示
- `Payment released` アニメーション
- JSONログ表示

## 2:45-3:30

- 通し込み
- ピッチ文言合わせ
- スクリーン録画

## 3:30-4:00

- 90秒動画完成

---

# 11. 90秒動画の勝ち筋

## 冒頭10秒

> "AI can post a task to a human marketplace. But once the worker arrives on site, there is still no execution layer."

## 次の20秒

ダッシュボードで bounty を作る。

> "We built that layer."

## 次の30秒

スマホで設備カードを見る。AR矢印が出る。作業する。

> "The worker doesn't need prior training. The task appears directly on the machine."

## 次の20秒

before / after と verification を見せる。

> "Now the AI agent gets proof, not just a claim."

## ラスト10秒

> "RentAHuman finds the human. We make the human effective."

---

# 12. 審査員への説明

## なぜこの形が良いか

`RentAHuman` は非常に良い比較対象になる。  
ただし、同じことを作るのは弱い。

強いのはこの言い方:

> "We are not another labor marketplace. We are the execution layer on top of labor marketplaces."

## 競合比較

| 項目 | RentAHuman | Guidance Dispatch |
|---|---|---|
| 役割 | 人を見つける | 人を正しく動かす |
| UI | タスク投稿 / 受諾 | 現場ARガイド |
| 完了確認 | proof提出中心 | proof + guided execution |
| 強み | labor access | execution reliability |

---

# 13. 最終結論

今回の4時間ハッカソンで採るべきテーマはこれ。

> **Guidance Dispatch**
>
> **A RentAHuman-style dispatch system with AR guidance for physical task completion**

これなら:

- YCテーマに合う
- 4時間で作れる
- ARが見せ場になる
- RentAHumanを踏まえたポジショニングが明確
- 「何の会社になるか」が伝わる

---

# 14. 実装上の一文

ピッチではこの一文を軸にするのがよい。

> **RentAHuman solves labor access. We solve reliable execution.**

これで十分に伝わる。
