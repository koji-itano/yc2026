# GUIDANCE OS v1.1
## 4時間で勝ちに行くAR特化MVP

2026-03-08

---

# 1. 結論

4時間で作るべきテーマはこれです。

> **AI-guided AR maintenance copilot for frontline workers**
>
> スマホを設備にかざすと、AIがARで次の動作を重ねて指示し、作業後に証跡を残す。

既存の `Guidance OS` は方向性として正しいが、ハッカソンでは少し広い。  
勝ち筋は、**「AI Guidance for Physical Work」そのものを、1つの物理作業に絞って、ARで一発で伝わる形にすること**。

---

# 2. 何を作るか

## テーマ名

**Guidance Lens**

## デモユースケース

**工場のバルブ再設定 / 点検**

物理プロップは以下で十分:

- ペットボトル + 赤いキャップ = バルブ
- 印刷した設備ラベル or 保守カード = ARターゲット
- スマホ = 作業者UI
- ノートPC = 管理ダッシュボード

## デモの見え方

1. PCで「Valve #3 needs inspection」というアラートが出る
2. 作業者がスマホで設備ラベルを見る
3. ラベルを認識すると、8th Wall上でAR矢印と指示が表示される
4. 音声またはテキストで「Turn clockwise until the cap is fully closed」
5. 作業者がキャップを閉める
6. before / after を保存し、PC側に「VERIFIED」ログを出す

これで YC のRFSにある

- AIが見る
- AIが考える
- 人をガイドする

を、90秒動画で明快に示せる。

---

# 3. なぜこの形が4時間向きか

## やらないこと

4時間では、以下は捨てる。

- 汎用OS化
- 複数業界対応
- 複雑なワーカー配車
- 高度な物体検出モデル学習
- ネイティブアプリ化
- Cactusの本番統合

## やること

4時間では、以下だけに集中する。

- 1ユースケース
- 1つのARターゲット
- 1つの作業指示
- 1つの完了判定
- 1つの監査ログ

審査で評価されるのは網羅性ではなく、**「将来の会社が見える完成度の高い1本の体験」**。

---

# 4. 8th Wallを使う理由

8th Wallの公式ドキュメント上、今回のMVPに必要な要素は揃っている。

- Studioで新規プロジェクトをすぐ作れる
- freeで開始できる
- `Image Targets` でフラットな印刷物をARトリガーにできる
- `World` camera と `Image Target entity` でARアンカーを置ける
- QR経由でスマホ実機プレビューできる

今回の4時間MVPでは、**設備本体を直接認識する必要はない**。  
ARターゲットは、設備横のラベルや保守カードでよい。

これが重要な簡略化ポイント:

- 物体認識より安定
- デモ会場で再現しやすい
- ARの見栄えが良い
- 実装時間が短い

## 8th Wallでやる範囲

- 設備ラベル認識
- ラベル上に3D矢印 or ハイライト表示
- ステップ表示
- `Next` / `Capture` ボタン

## 8th Wallで無理にやらない範囲

- 高精度な状態認識
- 厳密な3D空間理解
- 自動監査ロジック全部

完了判定は、別レイヤーでよい。

---

# 5. もし8th Wallが詰まった場合

代替は **MindAR** に即切替する。

理由:

- 公式ドキュメント上、plain static HTMLで動く
- Image trackingの最小例が短い
- ターゲット画像を `.mind` に事前コンパイルすればよい
- A-Frame連携が簡単

つまり、ARスタックはこうする。

1. **第一候補:** 8th Wall Image Targets
2. **即時フォールバック:** MindAR + A-Frame
3. **最悪のケース:** 通常カメラUI + CSSオーバーレイ

重要なのは、**ARが失敗してもデモ全体が死なない構成**にすること。

---

# 6. MVPの正しいプロダクト定義

## 一言で言うと

**“A visual copilot that turns a printed maintenance tag into step-by-step AR guidance and proof of execution.”**

## プロダクト価値

このMVPで証明する価値は3つだけ:

1. **新人でも作業できる**
2. **AIが作業手順を現場UIに変換できる**
3. **作業完了の証跡を残せる**

この3つが見えれば、審査員はその先に

- 製造
- フィールドサービス
- 点検
- 医療手技支援

への展開を自然に想像できる。

---

# 7. 画面構成

## A. ダッシュボード

必要最低限:

- 異常アラートカード
- タスクステータス
- before / after 画像
- JSON監査ログ

## B. モバイルAR画面

必要最低限:

- カメラ
- AR矢印
- ステップ文言
- `Capture Before`
- `Capture After`
- `Mark Complete`

## C. 完了ログ

必要最低限:

- task id
- asset id
- operator
- timestamp
- before image
- after image
- verification result

---

# 8. 技術構成

## 最小構成

- **AR UI:** 8th Wall Studio
- **Dashboard:** React or plain Vite frontend
- **Backend:** Node.js + Express
- **Realtime:** WebSocket か polling
- **Verification:** Claude / OpenAI のVision API、またはルールベース確認

## 4時間向けの実装優先順位

### Tier 1: 絶対に必要

- ARターゲットを認識したら矢印を出す
- ステップ文言を出す
- before / after画像を保存する
- ダッシュボードにログを出す

### Tier 2: あれば強い

- 音声ガイダンス
- LLMによる画像比較で `verified`
- ステータス更新のアニメーション

### Tier 3: 捨ててもよい

- Cactus統合
- Blaxelデプロイ
- 自動PPE検出
- マルチステップ作業

---

# 9. 実装プラン

## 0:00-0:30

- 8th Wall project作成
- Image Target用の保守カード画像を作る
- Vite/Node雛形作成

## 0:30-1:15

- ARターゲット検出時に矢印と指示文を表示
- モバイルUIに `before/after` ボタン追加

## 1:15-2:00

- ダッシュボード作成
- タスク状態 `DISPATCHED -> IN_PROGRESS -> VERIFIED` を表示

## 2:00-2:45

- before / after画像を送信
- JSONログ表示
- 音声ガイダンスを追加

## 2:45-3:30

- E2Eの通し込み
- UIポリッシュ
- デモ録画のリハーサル

## 3:30-4:00

- 90秒動画を撮る

---

# 10. 勝つためのピッチの切り口

## 審査員に一発で伝わる言い方

> "Everyone is building AI that can decide what physical work should happen. We are building the layer that makes sure the human on site can actually do it correctly."

その上で、ARを見せる。

> "Point your phone at the machine, and the job appears in context."

この2文でかなり伝わる。

## 競合との差

RentAHuman系は「誰がやるか」。  
あなたたちは「どうやって正しく終わらせるか」。

## YCとの一致

RFSの本質は、AIが人間を置き換える話ではなく、**人間にAIのスキルを載せる話**。  
ARはそのメッセージを最も短時間で視覚化できる。

---

# 11. 最終提案

このハッカソンで採るべきテーマは、

> **Guidance Lens: AR-powered AI guidance for frontline maintenance**

です。

`Guidance OS` の巨大な構想を捨てる必要はない。  
ただし今回は、**その中の最も伝わる1機能だけを切り出して勝つ**べき。

## スローガン

> **See the machine. Get guided. Prove the work was done.**

---

# 12. 開発判断

実装の意思決定はこれで固定するのがよい。

- **ユースケース:** バルブ点検に固定
- **AR:** 8th Wall Image Targets
- **フォールバック:** MindAR
- **入力デバイス:** スマホのみ
- **証跡:** before / after + JSON
- **検証:** まずは軽量実装、必要ならLLM

これなら4時間でも十分に勝負できる。

---

# 13. 参考

- 8th Wall Studio docs: https://www.8thwall.com/docs/studio/getting-started/create-project/
- 8th Wall Image Targets docs: https://www.8thwall.com/docs/studio/guides/xr/image-targets/
- 8th Wall quick start: https://www.8thwall.com/docs/legacy/getting-started/quick-start-guide/
- MindAR docs: https://hiukim.github.io/mind-ar-js-doc/
- MindAR image compile docs: https://hiukim.github.io/mind-ar-js-doc/quick-start/compile
