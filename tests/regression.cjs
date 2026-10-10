/* Run: node tests/regression.cjs — no dependencies required. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
function load(legacy = false) {
  const ctx = vm.createContext({ window: {}, console, btoa, atob, performance, requestAnimationFrame: () => 1, cancelAnimationFrame() {} });
  for (const file of ['util.js', 'data.js', 'sim.js', 'person.js', 'stage.js']) {
    const code = legacy ? cp.execFileSync('git', ['show', '9ed8542:' + file], { cwd: root, encoding: 'utf8' }) : fs.readFileSync(path.join(root, file), 'utf8');
    vm.runInContext(code, ctx, { filename: file });
  }
  return ctx.BF;
}
const BF = load(), old = load(true);
function record(seed, version) {
  return { seed, version, guarantee: false, name: '하루', sel: BF.TRAITS.map((t, i) => (seed + i) % t.opts.length), edits: BF.DISORDERS.map((d, i) => (seed + i) % 2 === 0), budget: 50000, order: 42, day: 282 };
}
const counts = { old: [0, 0, 0, 0], current: [0, 0, 0], forced: [0, 0, 0] };
const perType = { old: {}, current: {} };
for (let seed = 0; seed < 100000; seed++) {
  const previous = old.sim.screen(seed, false), current = BF.sim.screen(seed, false), forced = BF.sim.screen(seed, true);
  assert(current.length <= 2 && forced.length >= 1 && forced.length <= 2);
  counts.old[previous.length]++; counts.current[current.length]++; counts.forced[forced.length]++;
  for (const id of previous) perType.old[id] = (perType.old[id] || 0) + 1;
  for (const id of current) perType.current[id] = (perType.current[id] || 0) + 1;
}
for (const d of BF.DISORDERS) assert(perType.current[d.id] < perType.old[d.id] * 0.6, d.id + ' rate must decrease');
const equal = (a, b, message) => assert.equal(JSON.stringify(a), JSON.stringify(b), message);
for (let seed = 0; seed < 1000; seed++) {
  for (const guarantee of [false, true]) {
    const rec = { ...record(seed), guarantee };
    const token = old.sim.encodeResult(rec), decoded = BF.sim.decodeResult(token);
    assert.equal(decoded.version, 1);
    const was = old.sim.build(rec), now = BF.sim.build(decoded);
    for (const key of ['o', 'found', 'spent', 'items', 'scenes']) equal(now[key], was[key], 'legacy QR ' + key);
    assert.equal(BF.sim.encodeResult(decoded), token, 'legacy re-encoding');
    const fresh = BF.sim.decodeResult(BF.sim.encodeResult(rec));
    assert.equal(fresh.version, 2);
    const built = BF.sim.build(rec), replay = BF.sim.build(fresh);
    for (const key of ['o', 'found', 'spent', 'items', 'scenes']) equal(built[key], replay[key], 'current QR ' + key);
    assert(built.o.disorders.length <= 2);
  }
}
// SVG finite geometry across age, hair, sex, props and assistive devices.
const ages = [0, .74, .75, 1, 3, 7, 12, 18, 25, 40, 64, 80, 100];
const props = [null, 'backpack', 'trophy', 'mic', 'bouquet', 'baby', 'gradcap', 'medal', 'note', 'book'];
let renderCount = 0;
for (let seed = 0; seed < 12; seed++) {
  const base = BF.sim.build(record(seed)).o;
  for (const sex of ['M', 'F', 'N']) for (const hair of ['straight', 'wavy', 'curly']) for (const age of ages) for (const prop of props) {
    const o = { ...base, sex, hair, has: seed % 2 ? { smn1: true, gjb2: true, rpe65: true } : {} };
    const svg = BF.Person.standalone(o, age, { prop, mood: 'happy' });
    assert(!/NaN|Infinity|undefined/.test(svg));
    const L = BF.Person.look(o, age, {});
    assert(L.H - L.hh - L.neck - L.torso > 0, 'positive leg length');
    assert(BF.Person.topOf(o, age) > 0);
    renderCount++;
  }
}
// Story meaning selects a pose without rewriting the encoded life story.
const performances = [
  ['책 읽는 시간', 'book', 'happy', 'read', 'focused'],
  ['첫 무대에서 노래했어요', 'mic', 'happy', 'perform', 'singing'],
  ['금상을 수상했어요', 'trophy', 'happy', 'celebrate', 'delighted'],
  ['매일 달리기를 했어요', 'medal', 'happy', 'run', 'focused'],
  ['아기를 품에 안았어요', 'baby', 'happy', 'cradle', 'gentle'],
  ['자기 얼굴의 일부를 골랐다는 걸 알게 됐어요', 'trophy', 'soft', 'think', 'thoughtful'],
  ['치료가 힘들었어요', 'mic', 'soft', 'idle', 'concerned'],
  ['친구와 입학했어요', 'backpack', 'happy', 'wave', 'smile'],
  ['은퇴 축하 꽃다발', 'bouquet', 'happy', 'welcome', 'shy']
];
for (const [text, prop, mood, action, expression] of performances) {
  const scene = { items: [{ text }], prop, mood }, before = JSON.stringify(scene);
  const acting = BF.Stage.performanceFor(scene);
  assert.equal(acting.action, action); assert.equal(acting.expression, expression);
  assert.equal(JSON.stringify(scene), before, 'presentation must not mutate the story');
  if (mood === 'soft') assert.equal(acting.prop, null, 'no celebratory prop during difficult scenes');
}
const model = { ...BF.sim.build(record(42)).o, has: {} };
const actions = ['idle', 'read', 'perform', 'celebrate', 'run', 'cradle', 'think', 'wave', 'welcome', 'cheer'];
let poseRenderCount = 0;
for (const sex of ['M', 'F', 'N']) for (const age of ages) for (const action of actions) for (const phase of [0, .3, 1.2]) {
  for (const has of [{}, { smn1: true }, { rpe65: true }]) {
    const svg = BF.Person.render({ ...model, sex, has }, age, { action, phase, poseMix: .7, expression: 'focused' });
    assert(!/NaN|Infinity|undefined/.test(svg)); poseRenderCount++;
  }
}
for (const action of ['run', 'wave', 'perform']) {
  assert.notEqual(BF.Person.render(model, 23, { action, phase: 0 }), BF.Person.render(model, 23, { action, phase: .6 }), action + ' must move');
}
for (const has of [{ smn1: true }, { rpe65: true }]) {
  const supported = { ...model, has };
  assert.equal(BF.Person.render(supported, 23, { action: 'run', phase: .6 }), BF.Person.render(supported, 23, { action: 'cheer', phase: .6 }), 'keep mobility support during sports');
}
const identityKeys = ['faceType', 'hairPart', 'faceWidth', 'eyeWidth', 'eyeSpace', 'eyeLift', 'browArch'];
const identity = o => identityKeys.map(k => BF.Person.look(o, 23, {})[k]);
equal(identity(model), identity({ ...model, has: { smn1: true }, bought: {} }), 'face identity independent of purchases and conditions');
assert(new Set(Array.from({ length: 32 }, (_, seed) => JSON.stringify(identity({ ...model, seed })))).size === 32);
// Reduced motion retains the scene pose, while freezing figure geometry at a given age.
const motionOriginal = BF.motion.reduced;
BF.motion.reduced = () => true;
const staticPlayer = new BF.Stage.Player({}, { W: 1000, H: 900, groundY: 800, figureX: 500, rulerX: 100 });
Object.assign(staticPlayer, { o: model, figEl: {}, rulerEl: {}, bdEls: [], t: 2 });
const segment = { type: 'hold', t0: 0, t1: 4, scene: { items: [{ text: '독서' }], prop: 'book', mood: 'happy' } };
staticPlayer.draw(23, 1000, segment); const stillFigure = staticPlayer.figEl.innerHTML;
staticPlayer.draw(23, 3000, segment); assert.equal(staticPlayer.figEl.innerHTML, stillFigure);
BF.motion.reduced = motionOriginal;
// Pausing must freeze all figure motion; reduced motion must suppress SVG particles.
let frames = 0, pausedSvg = 0;
const svg = { pauseAnimations() { pausedSvg++; }, unpauseAnimations() {} };
const player = new BF.Stage.Player(svg, { W: 1000, H: 900, groundY: 800, figureX: 500, rulerX: 100 });
Object.assign(player, { paused: true, t: 2, motionTime: 100, total: 10, last: 1000, draw() { frames++; } });
player.loop(1050);
assert.equal(player.t, 2); assert.equal(player.motionTime, 100); assert.equal(frames, 0); assert.equal(pausedSvg, 1);
BF.motion.reduced = () => true;
player.fxEl = { innerHTML: 'old particles' }; player.burst('happy');
assert.equal(player.fxEl.innerHTML, '');
console.log(JSON.stringify({ samples: 100000, counts, perType, qrRecords: 4000, renderCount, poseRenderCount, sceneMappings: performances.length, checks: 'PASS' }, null, 2));
