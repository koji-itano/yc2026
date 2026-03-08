# Onsite Demo Case v1.0
## 会場でそのまま実行できる卓上デモ

2026-03-08

---

# 1. 結論

会場写真と机上の実物を見る限り、今回のデモは**工場設備の実機**ではなく、**卓上の擬似設備**で作るのが正解。

最も安全で、最も再現性が高く、最も4時間向きのデモケースはこれ。

> **Tabletop Safety Cap Reset**
>
> AIが近くの人間に設備異常対応タスクを出し、作業者はスマホのARガイダンスで卓上の「安全キャップ」を締め、完了証跡を返す。

---

# 2. 現地制約から見た前提

写真から読み取れる制約:

- 会議室形式で、机が並んでいる
- 大きな機材を持ち込んでいない
- 周囲に他チームが多い
- 音や動線を大きく使うデモは不向き
- 机上の小物で完結する必要がある
- 会場設備には触れない方が安全

したがって、デモは以下を満たす必要がある。

- **着席状態で完結**
- **30cm四方の机上スペースで成立**
- **スマホ1台 + PC1台で見せられる**
- **周囲に迷惑をかけない**
- **撮影しやすい**

---

# 3. 採用するデモケース

## ケース名

**AI Dispatch for Emergency Safety Cap Reset**

## ストーリー

遠隔監視AIが簡易設備の圧力異常を検知し、近くにいる人間へ緊急タスクを発行する。  
人間は `RentAHuman-style` にタスクを受諾し、スマホを設備タグにかざす。  
ARが「どこをどう回すか」を案内し、作業後の before / after を送信する。  
システムは完了を検証し、ダッシュボードに `VERIFIED / PAID` を表示する。

---

# 4. 使う物

会場で今すぐ揃えやすいものだけを使う。

## 必須

- ノートPC 1台
- スマホ 1台
- 机上のキャップ付き缶 1本
- キャップに貼る赤シール or 小さな矢印シール
- A4紙 1枚
- 黒マーカー
- セロテープ

## あると良い

- 小さな注意ラベル
- クリップ
- イヤホン

---

# 5. 物理セットアップ

## 擬似設備の作り方

机上のキャップ付き缶を**卓上設備モジュール**として使う。

### 具体例

- 金属缶本体 = pressurized canister
- 上部キャップ = safety cap / valve lock
- A4紙ラベル = asset tag / AR target

### ラベルに書く内容

```text
ASSET: CANISTER-3
ZONE: LINE-A
ALERT: CAP NOT SECURED
ACTION: TIGHTEN SAFETY CAP
```

このA4紙をボトルの横に立てるか、机に貼る。

これを `8th Wall Image Target` にする。

---

# 6. デモ画面

## A. PC画面

### 表示する内容

- Alert detected
- Bounty created
- Worker accepted
- In progress
- Proof submitted
- Verified
- Payment released

### 一番大事な文言

```text
Valve #3 anomaly detected.
Dispatching nearby human operator...
```

## B. スマホ画面

### 表示する内容

- Task title
- Step text
- AR arrow toward valve
- Capture Before
- Capture After
- Submit Proof

---

# 7. デモ手順

## 30秒で見せるならこの順番

1. PCでアラートを表示する
2. `Create Bounty` を押す
3. スマホ側で `Accept Task`
4. スマホを設備タグに向ける
5. AR矢印と `Turn clockwise to tighten the cap` を表示
6. `Capture Before`
7. キャップを締める
8. `Capture After`
9. `Submit Proof`
10. PCで `VERIFIED` と `PAID` を表示

---

# 8. なぜこのケースが強いか

## 実装しやすい

- 物体認識を設備そのものに掛けなくてよい
- 印刷タグをARターゲットにできる
- 今机上にある物をそのまま使える
- 失敗しても再セットが簡単

## 伝わりやすい

- 「キャップを締める」は誰でも理解できる
- 物理作業らしさがある
- before / after が視覚的に分かる
- AR矢印の意味が一瞬で伝わる

## YCテーマに合う

- AIがタスク発行
- 人間が現場で実行
- AIがガイド
- AIが証跡を受け取る

---

# 9. 現地向けにさらに安全にする工夫

## やるべきこと

- デモは机上だけで完結させる
- 会場設備や壁には触れない
- 水は空にする
- ボトルは倒れにくい位置に置く
- ARターゲットは平置きより立てかけの方が認識しやすい

## やらない方がよいこと

- プロジェクターや会場機材を使う
- 大きく立ち歩く
- 音声を大きく出す
- 危険物風の小道具を使う

---

# 10. 8th Wall実装方針

## 一番簡単なやり方

- A4設備タグを `Image Target` 化
- 認識したら3D矢印を表示
- HTML overlayでステップ文言を表示
- `Capture Before / After` は通常HTMLボタン

## ARで見せる要素

- 緑の矢印
- キャップ方向へのガイド
- `Turn clockwise`
- `Step 1 of 1`

## ARで無理しない要素

- キャップ状態の自動判定
- 空間アンカーの高精度化
- 複数ターゲット

---

# 11. 完了判定

4時間では、自動判定を軽くする。

## 第一案

- before / after の手動比較
- operator が `Submit Proof`
- dashboard 上で `verified`

## 第二案

- Vision APIに before / after を送る
- `Is the safety cap tightened in the second image?`

## 結論

まずは**手動でもよい**。  
重要なのは、`dispatch -> guide -> proof -> verify` が通ること。

---

# 12. ピッチ文言

この卓上デモなら、説明はこれで十分。

> "An AI agent found a physical issue, dispatched a nearby human, and guided them in AR to complete the task correctly."

続けて:

> "RentAHuman can find the person. We make sure the person can actually do the work."

---

# 13. 役割分担

3人いる前提なら、こう分ける。

## Person A

ダッシュボード

## Person B

スマホAR

## Person C

物理セットアップ + 録画 + 作業者役

2人でも成立する。

---

# 14. 最終形

今回その場で実行するなら、テーマはこれで固定すべき。

> **Guidance Dispatch: Tabletop Safety Cap Reset**

## 一言で言うと

**A RentAHuman-style physical task demo where a worker uses AR on a phone to secure a safety cap on a tabletop asset.**

これが、今の会場環境で最も確実に動くデモケース。
