const pptxgen = require('pptxgenjs');
const pptx = new pptxgen();

pptx.layout = 'LAYOUT_16x9';
pptx.author = 'Guidance OS Team';
pptx.title = 'Guidance OS — AI-Managed Physical Work の実行レイヤー';

// Color palette
const C = {
  dark: '1A1A2E',
  orange: 'F96D00',
  white: 'FFFFFF',
  light: 'F5F5F5',
  gray: '888888',
  lightGray: 'CCCCCC',
  text: '333333',
  darkText: '222831',
};

// ─── Slide 1: Title ───
const s1 = pptx.addSlide();
s1.background = { color: C.dark };
s1.addShape(pptx.shapes.RECTANGLE, { x: 4.2, y: 2.3, w: 1.6, h: 0.06, fill: { color: C.orange } });
s1.addText('Guidance OS', { x: 0.5, y: 1.2, w: 9, h: 1, fontSize: 42, bold: true, color: C.white, align: 'center' });
s1.addText('AI-Managed Physical Work の実行レイヤー', { x: 0.5, y: 2.6, w: 9, h: 0.6, fontSize: 22, color: C.orange, align: 'center' });
s1.addText('c0mpiled-7/sanfransokyo Hackathon | 2026.03.08', { x: 0.5, y: 4.2, w: 9, h: 0.4, fontSize: 13, color: C.gray, align: 'center' });

// ─── Slide 2: 課題 — 3つのギャップ ───
const s2 = pptx.addSlide();
s2.background = { color: C.white };
s2.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 0.4, w: 0.6, h: 0.05, fill: { color: C.orange } });
s2.addText('課題: 3つのギャップ', { x: 0.5, y: 0.5, w: 5, h: 0.6, fontSize: 28, bold: true, color: C.dark });

const problems = [
  { title: '1. 熟練工が足りない', body: '日本の製造業の65.9%が指導人材不足を報告（ものづくり白書2025）。グローバルで加速中。' },
  { title: '2. AIは物理作業ができない', body: 'AIは推論・計画・支払いができる。でもバルブを回せない、溶接を検査できない。ヒューマノイドはまだ高すぎる。' },
  { title: '3.「人を見つける」だけでは不十分', body: '企業が欲しいのはマッチングだけじゃない。安全な実行、ガイダンス、完了検証、監査ログが必要。' },
];
problems.forEach((p, i) => {
  const y = 1.3 + i * 1.2;
  s2.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y, w: 9, h: 1.05, fill: { color: C.light } });
  s2.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y, w: 0.06, h: 1.05, fill: { color: C.orange } });
  s2.addText(p.title, { x: 0.8, y, w: 8.5, h: 0.4, fontSize: 14, bold: true, color: C.orange });
  s2.addText(p.body, { x: 0.8, y: y + 0.4, w: 8.5, h: 0.6, fontSize: 12, color: C.text, lineSpacingMultiple: 1.3 });
});

// ─── Slide 3: インサイト ───
const s3 = pptx.addSlide();
s3.background = { color: C.dark };
s3.addText('インサイト', { x: 0.5, y: 0.8, w: 9, h: 0.6, fontSize: 24, bold: true, color: C.white, align: 'center' });
s3.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y: 1.6, w: 0.06, h: 2.0, fill: { color: C.orange } });
s3.addText([
  { text: '世界で最も安く、最も汎用的な「アクチュエータ」は\n', options: { color: C.lightGray, fontSize: 17, italic: true } },
  { text: 'スマートフォンを持った人間', options: { color: C.orange, fontSize: 17, bold: true } },
  { text: '。\n足りないのは労働力へのアクセスではなく、', options: { color: C.lightGray, fontSize: 17, italic: true } },
  { text: '実行の制御', options: { color: C.orange, fontSize: 17, bold: true } },
  { text: '。', options: { color: C.lightGray, fontSize: 17, italic: true } },
], { x: 1.1, y: 1.7, w: 8, h: 1.8, lineSpacingMultiple: 1.5 });
s3.addText('YC RFS #7: "AI can see, reason, and guide the human who does." — David Lieb', { x: 0.5, y: 4.0, w: 9, h: 0.4, fontSize: 11, color: C.gray, align: 'center' });

// ─── Slide 4: ソリューション — 4-Layer Model ───
const s4 = pptx.addSlide();
s4.background = { color: C.white };
s4.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 0.4, w: 0.6, h: 0.05, fill: { color: C.orange } });
s4.addText('ソリューション: Guidance OS', { x: 0.5, y: 0.5, w: 6, h: 0.6, fontSize: 28, bold: true, color: C.dark });
s4.addText('AIが計画し、人間が実行する。その間を埋める実行制御レイヤー。', { x: 0.5, y: 1.1, w: 9, h: 0.4, fontSize: 14, color: C.text });

// 4-Layer Model
const layers = [
  { label: 'L1  推論 (Reasoning)', desc: 'Claude / GPT', color: '3A3A5C', highlight: false },
  { label: 'L2  労働アクセス (Labor)', desc: 'RentAHuman / Uber', color: '4A4A6C', highlight: false },
  { label: 'L3  決済 (Payment)', desc: 'Stripe / PayPay', color: '5A5A7C', highlight: false },
  { label: 'L4  実行制御 (Execution)', desc: 'Guidance OS ← ここ', color: C.orange, highlight: true },
];
layers.forEach((l, i) => {
  const y = 1.8 + i * 0.75;
  s4.addShape(pptx.shapes.RECTANGLE, { x: 1.0, y, w: 8, h: 0.6, fill: { color: l.color } });
  s4.addText(l.label, { x: 1.2, y, w: 4, h: 0.6, fontSize: 14, bold: true, color: C.white, valign: 'middle' });
  s4.addText(l.desc, { x: 5.5, y, w: 3.3, h: 0.6, fontSize: 12, color: l.highlight ? C.white : C.lightGray, valign: 'middle', align: 'right' });
});

// ─── Slide 5: ユースケース — Today's Mission ───
const s5 = pptx.addSlide();
s5.background = { color: C.dark };
s5.addText("Today's Mission — ギグワークの実行制御", { x: 0.5, y: 0.4, w: 9, h: 0.6, fontSize: 24, bold: true, color: C.white });
s5.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.0, w: 1.2, h: 0.05, fill: { color: C.orange } });

const usecases = [
  { icon: '🌲', title: '送電線近くの伐木', desc: '衛星画像で検知 → ワーカー派遣 → AR安全ガイダンス → 写真検証 → 完了報告' },
  { icon: '🔧', title: 'マンホール点検', desc: '定期巡回 → チェックリスト表示 → 各項目をカメラ確認 → 異常検知 → 監査ログ' },
  { icon: '🍽️', title: '飲食店オペレーション', desc: '新人アルバイト → レシピ/手順をAR表示 → 完了写真 → 品質スコア' },
];
usecases.forEach((uc, i) => {
  const y = 1.3 + i * 1.15;
  s5.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y, w: 9, h: 1.0, fill: { color: '222244' } });
  s5.addText(uc.icon, { x: 0.7, y, w: 0.6, h: 1.0, fontSize: 28, valign: 'middle' });
  s5.addText(uc.title, { x: 1.4, y, w: 3, h: 1.0, fontSize: 15, bold: true, color: C.orange, valign: 'middle' });
  s5.addText(uc.desc, { x: 4.5, y, w: 4.8, h: 1.0, fontSize: 11, color: C.lightGray, valign: 'middle', lineSpacingMultiple: 1.3 });
});
s5.addText('RPGクエストのように — ステップバイステップで未経験者を導く', { x: 0.5, y: 4.3, w: 9, h: 0.3, fontSize: 12, italic: true, color: C.gray, align: 'center' });

// ─── Slide 6: デモフロー — Golden Path ───
const s6 = pptx.addSlide();
s6.background = { color: C.white };
s6.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 0.4, w: 0.6, h: 0.05, fill: { color: C.orange } });
s6.addText('デモ: Golden Path', { x: 0.5, y: 0.5, w: 5, h: 0.6, fontSize: 28, bold: true, color: C.dark });
s6.addText('バルブ点検ワークフロー（赤キャップボトルでシミュレーション）', { x: 0.5, y: 1.0, w: 9, h: 0.35, fontSize: 12, color: C.gray });

const steps = [
  { num: '1', title: '異常検知', desc: 'ダッシュボードにアラート表示' },
  { num: '2', title: 'ワーカー派遣', desc: 'スマホに「Today\'s Mission」通知' },
  { num: '3', title: 'ARガイダンス', desc: 'カメラON → オーバーレイで手順表示' },
  { num: '4', title: 'AI検証', desc: 'Claude Vision APIが写真を判定' },
  { num: '5', title: '監査ログ', desc: 'JSON構造化データで完了証明' },
];
steps.forEach((st, i) => {
  const x = 0.3 + i * 1.9;
  s6.addShape(pptx.shapes.OVAL, { x: x + 0.5, y: 1.6, w: 0.6, h: 0.6, fill: { color: C.orange } });
  s6.addText(st.num, { x: x + 0.5, y: 1.6, w: 0.6, h: 0.6, fontSize: 20, bold: true, color: C.white, align: 'center', valign: 'middle' });
  s6.addText(st.title, { x, y: 2.4, w: 1.6, h: 0.5, fontSize: 13, bold: true, color: C.dark, align: 'center' });
  s6.addText(st.desc, { x, y: 2.9, w: 1.6, h: 0.7, fontSize: 10, color: C.text, align: 'center', lineSpacingMultiple: 1.3 });
  if (i < 4) {
    s6.addShape(pptx.shapes.RECTANGLE, { x: x + 1.7, y: 1.82, w: 0.5, h: 0.04, fill: { color: C.orange } });
  }
});

s6.addText('物理作業の TDD — テストケースを先に定義し、写真で検証する', { x: 0.5, y: 4.2, w: 9, h: 0.3, fontSize: 12, italic: true, color: C.orange, align: 'center' });

// ─── Slide 7: 技術アーキテクチャ ───
const s7 = pptx.addSlide();
s7.background = { color: C.dark };
s7.addText('技術アーキテクチャ', { x: 0.5, y: 0.3, w: 5, h: 0.6, fontSize: 24, bold: true, color: C.white });
s7.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 0.85, w: 1.2, h: 0.05, fill: { color: C.orange } });

// Left column: Stack
const stack = [
  { label: 'Dashboard (PC)', tech: 'React + Vite + Tailwind', color: '2A2A4E' },
  { label: 'Mobile (Worker)', tech: 'React PWA + 8th Wall AR', color: '2A2A4E' },
  { label: 'Backend', tech: 'Node.js + WebSocket', color: '2A2A4E' },
  { label: 'AI Verification', tech: 'Claude Vision API', color: '3A2A2E' },
  { label: 'Hosting', tech: 'Blaxel Sandbox', color: '2A2A4E' },
];
stack.forEach((s, i) => {
  const y = 1.2 + i * 0.7;
  s7.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y, w: 4.2, h: 0.55, fill: { color: s.color } });
  s7.addText(s.label, { x: 0.7, y, w: 2, h: 0.55, fontSize: 12, bold: true, color: C.orange, valign: 'middle' });
  s7.addText(s.tech, { x: 2.7, y, w: 1.8, h: 0.55, fontSize: 11, color: C.lightGray, valign: 'middle', align: 'right' });
});

// Right column: Key features
s7.addText('Key Capabilities', { x: 5.2, y: 1.2, w: 4, h: 0.4, fontSize: 14, bold: true, color: C.orange });
const features = [
  '8th Wall Image Target → AR手順オーバーレイ',
  'Claude Vision → 写真判定 (pass/fail)',
  'WebSocket → リアルタイム進捗同期',
  'JSON構造化 → 監査証跡ログ',
  'Cactus VLM → オンデバイスAI (stretch)',
];
features.forEach((f, i) => {
  s7.addText('▸ ' + f, { x: 5.2, y: 1.7 + i * 0.55, w: 4.3, h: 0.5, fontSize: 11, color: C.lightGray, lineSpacingMultiple: 1.2 });
});

// ─── Slide 8: 実装計画 & Ask ───
const s8 = pptx.addSlide();
s8.background = { color: C.white };
s8.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 0.4, w: 0.6, h: 0.05, fill: { color: C.orange } });
s8.addText('4時間で何を作るか', { x: 0.5, y: 0.5, w: 5, h: 0.6, fontSize: 28, bold: true, color: C.dark });

// Timeline
const timeline = [
  { time: '0-1h', task: 'ダッシュボード + モバイルPWA scaffold' },
  { time: '1-2h', task: 'WebSocket接続 + 8th Wall ARオーバーレイ' },
  { time: '2-3h', task: 'Claude Vision API統合 + 判定ロジック' },
  { time: '3-4h', task: 'E2Eデモ統合 + 監査ログUI + 仕上げ' },
];
timeline.forEach((t, i) => {
  const y = 1.3 + i * 0.65;
  s8.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y, w: 1.2, h: 0.5, fill: { color: C.orange } });
  s8.addText(t.time, { x: 0.5, y, w: 1.2, h: 0.5, fontSize: 13, bold: true, color: C.white, align: 'center', valign: 'middle' });
  s8.addText(t.task, { x: 1.9, y, w: 4, h: 0.5, fontSize: 12, color: C.text, valign: 'middle' });
});

// Right side: What we're NOT building
s8.addText('ビジネスモデル', { x: 5.5, y: 1.3, w: 4, h: 0.4, fontSize: 14, bold: true, color: C.dark });
const biz = [
  'RentAHuman等の労働プラットフォームへのアドオン',
  'SaaS — 月額 per worker / per task',
  '初期ターゲット: 製造業の点検・保全',
];
biz.forEach((b, i) => {
  s8.addText('▸ ' + b, { x: 5.5, y: 1.8 + i * 0.45, w: 4, h: 0.4, fontSize: 11, color: C.text });
});

s8.addText('チーム', { x: 5.5, y: 3.3, w: 4, h: 0.4, fontSize: 14, bold: true, color: C.dark });
s8.addText('Member A — 製造AI / フルスタック\nMember B — プロダクト / デザイン\nMember C — エンジニアリング', { x: 5.5, y: 3.7, w: 4, h: 1.0, fontSize: 11, color: C.text, lineSpacingMultiple: 1.5 });

// Bottom bar
s8.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 4.8, w: 10, h: 0.75, fill: { color: C.dark } });
s8.addText('Guidance OS — Physical Work の TDD', { x: 0.5, y: 4.85, w: 9, h: 0.6, fontSize: 18, bold: true, color: C.orange, align: 'center', valign: 'middle' });

// Save
pptx.writeFile({ fileName: './slide_v2.pptx' })
  .then(() => console.log('Done: slide_v2.pptx'))
  .catch(e => console.error(e));
