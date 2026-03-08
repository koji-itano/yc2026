# GOVDISPATCH AR
## Uber Eats / Timee for Government

2026-03-08

---

# 1. 結論

プロダクトの核は良い。

> **Government posts real-world micro-tasks as bounties. Nearby residents complete them with AR guidance.**

ただし、**電線近くの木の伐採**のような高危険・高責任作業を、非専門住民にARでやらせるのは不可。

このプロダクトは、次の条件を満たすタスクに絞るべき。

- 低リスク
- 短時間
- 標準化できる
- 画像で検証しやすい
- 免許・資格が不要
- 行政が細かく発注しやすい

---

# 2. 何が危険か

米国では、送電・配電線近くの樹木作業は OSHA の対象で、`qualified employees` や `line-clearance tree trimmers` が前提になっている。  
さらに、電力線が関わる緊急時の樹木作業は、通信作業者ではなく**電力会社側の認可主体だけが実施できる**とされている。

したがって、

> **Untrained nearby residents trimming around power lines**

は、デモの物語としては刺激的でも、実運用プロダクトとしては危険すぎる。

---

# 3. 正しい再定義

このアイデアの本質は伐採ではない。

本質はこれ。

> **A government task network that converts labor shortages into verified, guided civic micro-work.**

つまり:

- Governmentがbountyを出す
- 近隣住民が受諾する
- ARがその場でガイドする
- 写真と位置情報で証跡を返す
- 難しいものは専門業者へエスカレーションする

この形なら成立する。

---

# 4. どのタスクなら成立するか

## 適したタスク

- **Storm drain clearing**
  - 落ち葉や軽いゴミを取り除く
  - before / after で検証しやすい
- **Illegal dumping documentation**
  - 不法投棄の撮影、サイズ推定、危険判定
  - ARで撮影角度と必要枚数をガイド
- **Graffiti reporting and kit-based removal**
  - まず報告、許可済みキットがある場所だけ簡易除去
- **Street sign / hydrant visibility clearing**
  - 草木や雪をどこまで除けるかをARで指示
- **Park maintenance micro-tasks**
  - 破損ベンチの撮影、注意テープ設置、落枝回収
- **Disaster recovery volunteer tasks**
  - 軽微な瓦礫整理、配布所設営、サンドバッグ配置

## 適さないタスク

- 電線近接伐採
- chainsaw作業
- 高所作業
- ガス・電気・水道の直接操作
- 医療行為
- 交通制御
- 免許や保険が要る修繕

---

# 5. プロダクト名

**GovDispatch AR**

## 一言

**A civic bounty network where local residents complete simple public-service tasks with AR guidance and photo verification.**

---

# 6. 価値提案

## 誰向けか

- 市役所
- 郡・州の公共部門
- 公共事業受託業者
- 緊急対応部門

## なぜ刺さるか

- 小さすぎて業者発注しづらいタスクが大量にある
- 人手不足で backlog が積み上がる
- 住民の近接性は高い
- ただし、依頼方法と品質管理がない

GovDispatch AR は、その隙間を埋める。

---

# 7. プロダクトの流れ

## 1. タスク生成

行政が地図上でタスクを作成する。

例:

```text
Task: Clear storm drain inlet
Reward: $12
Time: 8 minutes
Location: 3rd Ave & Pine
Requirements: Gloves, photo proof
```

## 2. 近隣住民へ配信

一定半径内の登録ユーザーに通知。

## 3. 受諾

住民が `Accept`。

## 4. 現地ARガイダンス

スマホを対象に向けると:

- どこを見るか
- どこまで掃除するか
- 何に触れてはいけないか
- 何を見つけたら中止するか

をARで表示する。

## 5. 証跡提出

- before
- after
- GPS
- timestamp
- hazard flag

## 6. 検証と支払い

- ルールベース or vision AI
- 通れば payout
- ダメなら rework or escalate

---

# 8. moat

これは単なるタスク掲示板ではない。

moat は3つある。

## 1. Task decomposition

行政業務を、住民が安全にできる粒度へ分解する。

## 2. AR execution layer

静的なPDFではなく、現場で迷わないUIに変換する。

## 3. Verification and escalation

住民にできる範囲だけ任せ、危険検知時は即座に専門業者へ回す。

---

# 9. 重要な安全設計

このプロダクトは、**何をやらせないか** が最重要。

## ガードレール

- task risk scoring
- 資格不要タスクのみ開放
- geofence
- prohibited object detection
- escalation flow
- one-tap `unsafe, need pro`
- liability / insurance gating

## 実務上のルール

- 非専門住民向けは `green tasks` のみ
- `yellow tasks` は trained volunteers のみ
- `red tasks` は licensed contractors のみ

---

# 10. ハッカソン向けデモにどう落とすか

本物の政府案件をやる必要はない。

見せるべきは構造。

## デモテーマ

**Government bounty for securing a public safety canister**

今机上にある缶を使う。

### ストーリー

- 市の施設管理AIが `Cap not secured` を検知
- bounty を投稿
- 近くの住民が受諾
- スマホを設備タグに向ける
- ARで `Turn clockwise to secure the cap`
- before / after 提出
- system が `verified`
- payout 表示

これなら、政府タスクの構造を安全にデモできる。

---

# 11. 90秒ピッチ

## 問題

> "Cities and public agencies have thousands of small physical tasks that are too small for contractors, but too operationally heavy to coordinate internally."

## インサイト

> "The missing piece is not labor supply. It's safe execution."

## 解決策

> "GovDispatch AR turns nearby residents into guided civic operators for simple public tasks."

## 差別化

> "We do not send residents into dangerous work. We route low-risk tasks to residents, trained tasks to volunteers, and high-risk tasks to professionals."

---

# 12. 競合との差

| 項目 | 311/reporting apps | Gig apps | GovDispatch AR |
|---|---|---|---|
| 問題報告 | できる | 一部不可 | できる |
| タスク実行 | しない | する | する |
| 行政向け設計 | 弱い | ない | ある |
| ARガイダンス | ない | ない | ある |
| 安全エスカレーション | ない | 弱い | 強い |

---

# 13. 最終提案

このアイデアで行くなら、メッセージはこうする。

> **Uber Eats / Timee for Government**
>
> **but only for low-risk civic micro-tasks, guided by AR and verified by AI.**

そして、電線近接伐採はこう言い換える。

> "Not tree cutting near live power lines. The safer first wedge is inspection, documentation, debris clearing, and other low-risk public works micro-tasks."

これで、アイデアの強さを保ちつつ、危険な前提を外せる。
