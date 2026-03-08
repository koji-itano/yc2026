const pptxgen = require('pptxgenjs');
const pptx = new pptxgen();

pptx.layout = 'LAYOUT_16x9';
pptx.title = 'R.P.G. — Real Physical Gigs';

const C = {
  dark: '0A0A1A',
  mid: '141428',
  orange: 'F96D00',
  white: 'FFFFFF',
  light: 'F5F5F5',
  gray: '888888',
  lightGray: 'BBBBBB',
  text: '333333',
  cyan: '4EE6FF',
  purple: '8F72FF',
  pink: 'F25FFF',
  blue: '4E8CFF',
};

// ─── Slide 1: Title ───
const s1 = pptx.addSlide();
s1.background = { color: C.dark };
s1.addText('R.P.G.', { x: 0.5, y: 1.0, w: 9, h: 1.2, fontSize: 56, bold: true, color: C.orange, align: 'center', fontFace: 'Arial' });
s1.addShape(pptx.shapes.RECTANGLE, { x: 3.5, y: 2.3, w: 3, h: 0.04, fill: { color: C.orange } });
s1.addText('Real Physical Gigs', { x: 0.5, y: 2.5, w: 9, h: 0.7, fontSize: 24, color: C.white, align: 'center' });
s1.addText('AIが人間を雇い、ガイドし、検証する execution layer', { x: 0.5, y: 3.3, w: 9, h: 0.5, fontSize: 16, color: C.lightGray, align: 'center' });
s1.addText('c0mpiled-7/sanfransokyo | 2026.03.08', { x: 0.5, y: 4.3, w: 9, h: 0.3, fontSize: 11, color: C.gray, align: 'center' });

// ─── Slide 2: Problem ───
const s2 = pptx.addSlide();
s2.background = { color: C.dark };
s2.addText('Problem', { x: 0.6, y: 0.3, w: 3, h: 0.5, fontSize: 13, bold: true, color: C.orange });
s2.addText('AIは考えられる。見える。話せる。', { x: 0.6, y: 0.9, w: 9, h: 0.7, fontSize: 28, bold: true, color: C.white });
s2.addText('でも、物理的な作業はできない。', { x: 0.6, y: 1.5, w: 9, h: 0.7, fontSize: 28, bold: true, color: C.orange });

// 3 examples
const examples = [
  { icon: '⛩️', text: '神社の境内に倒木がある' },
  { icon: '🚉', text: '無人駅のトイレが壊れている' },
  { icon: '🥤', text: '自販機の在庫が切れている' },
];
examples.forEach((ex, i) => {
  const y = 2.6 + i * 0.6;
  s2.addShape(pptx.shapes.RECTANGLE, { x: 0.6, y, w: 8.5, h: 0.5, fill: { color: C.mid } });
  s2.addText(`${ex.icon}  ${ex.text}`, { x: 0.8, y, w: 8, h: 0.5, fontSize: 15, color: C.lightGray, valign: 'middle' });
});

s2.addText('AIはそれを検知できても、誰かが現場に行かないと何も解決しない。', { x: 0.6, y: 4.3, w: 9, h: 0.3, fontSize: 12, color: C.gray, italic: true });

// ─── Slide 3: Gap ───
const s3 = pptx.addSlide();
s3.background = { color: C.dark };
s3.addText('Gap', { x: 0.6, y: 0.3, w: 3, h: 0.5, fontSize: 13, bold: true, color: C.orange });
s3.addText('人を呼ぶことはできる。', { x: 0.6, y: 0.9, w: 9, h: 0.6, fontSize: 26, bold: true, color: C.white });
s3.addText('でも、複雑な仕事は任せられない。', { x: 0.6, y: 1.5, w: 9, h: 0.6, fontSize: 26, bold: true, color: C.orange });

// Comparison
s3.addShape(pptx.shapes.RECTANGLE, { x: 0.6, y: 2.4, w: 4, h: 2.0, fill: { color: C.mid } });
s3.addText('既存サービス', { x: 0.6, y: 2.4, w: 4, h: 0.45, fontSize: 14, bold: true, color: C.gray, align: 'center', valign: 'middle' });
s3.addShape(pptx.shapes.RECTANGLE, { x: 0.6, y: 2.85, w: 4, h: 0.04, fill: { color: '333355' } });
const existing = ['✓ 人を見つける', '✓ スケジュール調整', '✗ 現場でどう動くか', '✗ 正しく終えたか確認'];
existing.forEach((item, i) => {
  const isX = item.startsWith('✗');
  s3.addText(item, { x: 0.9, y: 2.95 + i * 0.35, w: 3.5, h: 0.35, fontSize: 12, color: isX ? '664444' : C.lightGray, valign: 'middle' });
});

s3.addShape(pptx.shapes.RECTANGLE, { x: 5.1, y: 2.4, w: 4.3, h: 2.0, fill: { color: '1A1A30' } });
s3.addShape(pptx.shapes.RECTANGLE, { x: 5.1, y: 2.4, w: 0.05, h: 2.0, fill: { color: C.orange } });
s3.addText('R.P.G.', { x: 5.1, y: 2.4, w: 4.3, h: 0.45, fontSize: 14, bold: true, color: C.orange, align: 'center', valign: 'middle' });
s3.addShape(pptx.shapes.RECTANGLE, { x: 5.1, y: 2.85, w: 4.3, h: 0.04, fill: { color: C.orange } });
const ours = ['✓ 人を見つける', '✓ 現場でARガイド', '✓ 音声でリアルタイムQ&A', '✓ AIが完了を検証'];
ours.forEach((item, i) => {
  s3.addText(item, { x: 5.4, y: 2.95 + i * 0.35, w: 3.8, h: 0.35, fontSize: 12, color: C.white, valign: 'middle' });
});

// ─── Slide 4: Solution ───
const s4 = pptx.addSlide();
s4.background = { color: C.dark };
s4.addText('Solution', { x: 0.6, y: 0.3, w: 3, h: 0.5, fontSize: 13, bold: true, color: C.orange });
s4.addText('物理的な資産に、AIの魂を与える。', { x: 0.6, y: 0.9, w: 9, h: 0.7, fontSize: 28, bold: true, color: C.white });

// 3-step solution
const solution = [
  { num: '01', title: 'AI Soul を定義', desc: 'カメラ + エッジデバイス + soul.md\n（資産の正常状態・ルール・性格を定義）', color: C.cyan },
  { num: '02', title: '異常を検知 → 自動発注', desc: 'AIが24時間監視し、問題を見つけたら\n近くのワーカーにタスクをディスパッチ', color: C.blue },
  { num: '03', title: 'ガイド → 検証 → 証明', desc: 'AR/音声で現場支援、Before/After写真で\nAIが完了を判定、監査証跡を生成', color: C.orange },
];
solution.forEach((s, i) => {
  const y = 1.9 + i * 0.95;
  s4.addShape(pptx.shapes.RECTANGLE, { x: 0.6, y, w: 8.8, h: 0.8, fill: { color: C.mid } });
  s4.addShape(pptx.shapes.RECTANGLE, { x: 0.6, y, w: 0.06, h: 0.8, fill: { color: s.color } });
  s4.addText(s.num, { x: 0.9, y, w: 0.6, h: 0.8, fontSize: 22, bold: true, color: s.color, valign: 'middle' });
  s4.addText(s.title, { x: 1.6, y, w: 2.4, h: 0.8, fontSize: 15, bold: true, color: C.white, valign: 'middle' });
  s4.addText(s.desc, { x: 4.2, y, w: 5, h: 0.8, fontSize: 11, color: C.lightGray, valign: 'middle', lineSpacingMultiple: 1.4 });
});

// ─── Slide 5: Demo — 大仏に魂を宿す ───
const s5 = pptx.addSlide();
s5.background = { color: C.dark };
s5.addText('Demo', { x: 0.6, y: 0.3, w: 3, h: 0.5, fontSize: 13, bold: true, color: C.orange });
s5.addText('大仏に AI の魂を宿す', { x: 0.6, y: 0.8, w: 9, h: 0.7, fontSize: 28, bold: true, color: C.white });

// Flow diagram using shapes
const flow = [
  { label: '大仏\n+ カメラ\n+ soul.md', color: C.cyan },
  { label: 'AI が\n状態監視', color: C.blue },
  { label: '異常検知\nタスク生成', color: C.purple },
  { label: 'ワーカー\nにディス\nパッチ', color: C.orange },
  { label: 'AR/音声\nガイド', color: C.pink },
  { label: 'AI検証\n完了証明', color: C.cyan },
];
flow.forEach((f, i) => {
  const x = 0.3 + i * 1.6;
  s5.addShape(pptx.shapes.RECTANGLE, { x, y: 1.9, w: 1.35, h: 1.4, fill: { color: C.mid } });
  s5.addShape(pptx.shapes.RECTANGLE, { x, y: 1.9, w: 1.35, h: 0.05, fill: { color: f.color } });
  s5.addText(f.label, { x, y: 2.05, w: 1.35, h: 1.15, fontSize: 11, bold: true, color: C.white, align: 'center', valign: 'middle', lineSpacingMultiple: 1.3 });
  if (i < 5) {
    s5.addText('→', { x: x + 1.35, y: 2.3, w: 0.25, h: 0.5, fontSize: 16, color: C.gray, align: 'center', valign: 'middle' });
  }
});

s5.addShape(pptx.shapes.RECTANGLE, { x: 0.6, y: 3.7, w: 8.8, h: 0.8, fill: { color: C.mid } });
s5.addShape(pptx.shapes.RECTANGLE, { x: 0.6, y: 3.7, w: 0.06, h: 0.8, fill: { color: C.orange } });
s5.addText([
  { text: 'Human in the loop の逆 — ', options: { color: C.lightGray, fontSize: 14 } },
  { text: 'AI in the loop', options: { color: C.orange, fontSize: 14, bold: true } },
  { text: '。AIが要所でチェックし、ガイドし、証明する。', options: { color: C.lightGray, fontSize: 14 } },
], { x: 0.9, y: 3.7, w: 8.3, h: 0.8, valign: 'middle' });

// ─── Slide 6: 6-Layer Architecture ───
const s6 = pptx.addSlide();
s6.background = { color: C.dark };
s6.addText('Architecture', { x: 0.6, y: 0.3, w: 3, h: 0.5, fontSize: 13, bold: true, color: C.orange });
s6.addText('6-Layer Execution Stack', { x: 0.6, y: 0.8, w: 9, h: 0.6, fontSize: 24, bold: true, color: C.white });

const layers = [
  { num: '1', label: '依頼主体', desc: '会社 / 人 / AIエージェント / 物理資産', color: '1E1E3A' },
  { num: '2', label: '状態認識', desc: 'カメラ / スマホ / GPS / センサー / VLM', color: '1E1E3A' },
  { num: '3', label: 'AI判断', desc: 'soul.md / 異常検知 / タスク生成 / 優先度判定', color: '1E1E3A' },
  { num: '4', label: 'ディスパッチ', desc: 'RentAHuman API / スキル・距離・時間マッチング', color: '1E1E3A' },
  { num: '5', label: '現場ガイダンス', desc: 'AR / 音声AI / 地図 / 手順表示 / リアルタイムQ&A', color: '1A1A30' },
  { num: '6', label: '検証・証明', desc: 'Before/After / AI完了判定 / 監査ログ / オーナー報告', color: '1A1A30' },
];
layers.forEach((l, i) => {
  const y = 1.5 + i * 0.55;
  const isOurs = i >= 2 && i <= 5;
  s6.addShape(pptx.shapes.RECTANGLE, { x: 0.6, y, w: 8.8, h: 0.48, fill: { color: isOurs ? '1A1530' : l.color } });
  if (isOurs) {
    s6.addShape(pptx.shapes.RECTANGLE, { x: 0.6, y, w: 0.06, h: 0.48, fill: { color: C.orange } });
  }
  s6.addText(l.num, { x: 0.8, y, w: 0.4, h: 0.48, fontSize: 14, bold: true, color: isOurs ? C.orange : C.gray, valign: 'middle' });
  s6.addText(l.label, { x: 1.3, y, w: 1.8, h: 0.48, fontSize: 13, bold: true, color: isOurs ? C.white : C.lightGray, valign: 'middle' });
  s6.addText(l.desc, { x: 3.3, y, w: 6, h: 0.48, fontSize: 11, color: C.lightGray, valign: 'middle' });
});

s6.addShape(pptx.shapes.RECTANGLE, { x: 8.4, y: 2.6, w: 1.0, h: 1.65, fill: { color: 'TRANSPARENT' } });
s6.addShape(pptx.shapes.RECTANGLE, { x: 9.2, y: 2.6, w: 0.04, h: 1.65, fill: { color: C.orange } });
s6.addText('← R.P.G.', { x: 8.0, y: 3.2, w: 1.2, h: 0.4, fontSize: 11, bold: true, color: C.orange, align: 'right' });

s6.addText('タイミー / TaskRabbit = Layer 4 のみ。R.P.G. = Layer 3–6 を制御。', { x: 0.6, y: 4.3, w: 9, h: 0.3, fontSize: 12, italic: true, color: C.gray });

// ─── Slide 7: Why Now + Validation ───
const s7 = pptx.addSlide();
s7.background = { color: C.dark };
s7.addText('Why Now', { x: 0.6, y: 0.3, w: 3, h: 0.5, fontSize: 13, bold: true, color: C.orange });

const whyNow = [
  { title: 'RentAHuman 稼働開始', desc: 'ワーカープールが既に存在。自前で集める必要なし。', color: C.cyan },
  { title: '8th Wall オープンソース化', desc: '2026年2月 MIT ライセンス。アプリ不要のブラウザAR。', color: C.blue },
  { title: 'Vision LLM がプロダクション品質に', desc: '作業検証の自動化が初めて商業レベルで可能に。', color: C.purple },
];
whyNow.forEach((w, i) => {
  const y = 1.0 + i * 0.85;
  s7.addShape(pptx.shapes.RECTANGLE, { x: 0.6, y, w: 5.0, h: 0.7, fill: { color: C.mid } });
  s7.addShape(pptx.shapes.RECTANGLE, { x: 0.6, y, w: 0.06, h: 0.7, fill: { color: w.color } });
  s7.addText(w.title, { x: 0.9, y, w: 4.5, h: 0.3, fontSize: 13, bold: true, color: C.white, valign: 'bottom' });
  s7.addText(w.desc, { x: 0.9, y: y + 0.3, w: 4.5, h: 0.35, fontSize: 10, color: C.lightGray, valign: 'top' });
});

// Validation
s7.addText('Validation', { x: 6.2, y: 0.3, w: 3, h: 0.5, fontSize: 13, bold: true, color: C.orange });
s7.addShape(pptx.shapes.RECTANGLE, { x: 6.2, y: 1.0, w: 3.4, h: 2.5, fill: { color: C.mid } });
s7.addShape(pptx.shapes.RECTANGLE, { x: 6.2, y: 1.0, w: 3.4, h: 0.06, fill: { color: C.orange } });
s7.addText('Tekkon', { x: 6.4, y: 1.2, w: 3, h: 0.4, fontSize: 18, bold: true, color: C.orange });
s7.addText('マンホール点検をポケモンGO化。\n栗田工業が約50億円で買収。', { x: 6.4, y: 1.7, w: 3, h: 0.7, fontSize: 11, color: C.lightGray, lineSpacingMultiple: 1.5 });
s7.addText('R.P.G. はその上位互換：\n単一用途の点検ではなく、\nあらゆる物理タスクをAI制御で\n実行する汎用レイヤー。', { x: 6.4, y: 2.5, w: 3, h: 0.9, fontSize: 11, bold: true, color: C.white, lineSpacingMultiple: 1.4 });

// ─── Slide 8: Team + Vision ───
const s8 = pptx.addSlide();
s8.background = { color: C.dark };

// Team
s8.addText('Team', { x: 0.6, y: 0.3, w: 3, h: 0.5, fontSize: 13, bold: true, color: C.orange });
const team = [
  { name: 'Member A', role: 'Physical AI・エッジ映像解析', detail: '' },
  { name: 'Member B', role: '産業カメラ・HW統合', detail: '' },
  { name: 'Member C', role: 'プラットフォーム設計', detail: '' },
  { name: 'Member D', role: 'VR/AR・空間コンピューティング', detail: '' },
  { name: 'Member E', role: 'UIデザイン・ブランディング', detail: '' },
];
team.forEach((t, i) => {
  const y = 0.9 + i * 0.5;
  s8.addShape(pptx.shapes.RECTANGLE, { x: 0.6, y, w: 4.5, h: 0.42, fill: { color: C.mid } });
  s8.addText(t.name, { x: 0.8, y, w: 1.2, h: 0.42, fontSize: 13, bold: true, color: C.orange, valign: 'middle' });
  s8.addText(t.role, { x: 2.0, y, w: 2.2, h: 0.42, fontSize: 10, color: C.white, valign: 'middle' });
  if (t.detail) {
    s8.addText(t.detail, { x: 4.2, y, w: 0.9, h: 0.42, fontSize: 8, color: C.gray, valign: 'middle' });
  }
});

// Vision / closing
s8.addShape(pptx.shapes.RECTANGLE, { x: 5.5, y: 0.9, w: 4.2, h: 3.5, fill: { color: C.mid } });
s8.addShape(pptx.shapes.RECTANGLE, { x: 5.5, y: 0.9, w: 0.06, h: 3.5, fill: { color: C.orange } });
s8.addText([
  { text: '世界で最も安く、\n最も汎用的な\nアクチュエータは、\n', options: { color: C.lightGray, fontSize: 16, italic: true } },
  { text: 'スマートフォンを\n持った人間。', options: { color: C.orange, fontSize: 18, bold: true } },
], { x: 5.8, y: 1.1, w: 3.7, h: 1.8, lineSpacingMultiple: 1.4 });

s8.addText('私たちはそのアクチュエータに、\nAIの目と声と判断力を与える。', { x: 5.8, y: 3.0, w: 3.7, h: 0.8, fontSize: 13, color: C.white, lineSpacingMultiple: 1.5 });

// Bottom bar
s8.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 4.6, w: 10, h: 0.95, fill: { color: '050510' } });
s8.addText([
  { text: 'ヒューマノイドが普及する前の時代に、', options: { color: C.lightGray, fontSize: 14 } },
  { text: 'AIが人間を使って現実世界を動かす execution layer。', options: { color: C.orange, fontSize: 14, bold: true } },
], { x: 0.5, y: 4.65, w: 9, h: 0.85, align: 'center', valign: 'middle' });

pptx.writeFile({ fileName: './slide_v3.pptx' })
  .then(() => console.log('Done: slide_v3.pptx'))
  .catch(e => console.error(e));
