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
    for (const key of ['found', 'spent', 'items']) equal(now[key], was[key], 'legacy QR ' + key);
    // Family correction: children only after marriage, grandchildren only with children.
    const familyFixed = o => ({ ...o, kids: o.partner && o.kids, grandkids: o.partner && o.kids && o.grandkids });
    equal(now.o, familyFixed(was.o), 'legacy QR o');
    // Old QR codes retain their outcomes and event structure. Only the explicitly
    // corrected mobility and family narratives are allowed to differ on replay.
    const correctedAges = new Set([11, 11.5, 20.5, 21.5, 68, 71, 84]);
    const familyText = /함께 살기로|결혼했어요|혼자만의 삶|첫 아이가|손주|가족들이 곁에서|친구들이 곁에서|친구들 생일|태어날 때 뭘 골랐어요|창가에 앉아/;
    const stableScenes = scenes => JSON.parse(JSON.stringify(scenes)).map(scene => {
      if (was.o.has.smn1) scene.items.forEach(item => { if (correctedAges.has(item.age)) item.text = '[mobility narrative]'; });
      scene.items.forEach(item => { if (familyText.test(item.text)) item.text = '[family narrative]'; });
      return scene;
    });
    // Unmarried lives that used to gain a child lose those two scenes by design, and lives
    // with an unedited visual or hearing impairment drop scenes that contradicted it.
    const sensoryCorrected = was.o.has.rpe65 || (was.o.has.gjb2 && (was.o.pitch || was.o.bought.music));
    if (!(was.o.kids && !was.o.partner) && !sensoryCorrected) equal(stableScenes(now.scenes), stableScenes(was.scenes), 'legacy QR event structure');
    assert.equal(BF.sim.encodeResult(decoded), token, 'legacy re-encoding');
    const fresh = BF.sim.decodeResult(BF.sim.encodeResult(rec));
    assert.equal(fresh.version, 2);
    const built = BF.sim.build(rec), replay = BF.sim.build(fresh);
    for (const key of ['o', 'found', 'spent', 'items', 'scenes']) equal(built[key], replay[key], 'current QR ' + key);
    assert(built.o.disorders.length <= 2);
  }
}
// Family stories stay coherent: no children without marriage, no grandchildren without children,
// and no family mentioned in the old-age lines of an unmarried, childless life.
let familyLives = 0, singles = 0, parents = 0;
for (let seed = 0; seed < 4000; seed++) {
  const built = BF.sim.build({ ...record(seed), version: 2 }), o = built.o;
  assert(!o.kids || o.partner, 'children only after marriage');
  assert(!o.grandkids || o.kids, 'grandchildren only with children');
  const story = built.scenes.flatMap(s => s.items).map(e => e.text).join(' ');
  if (o.partner) assert(story.includes('결혼했어요'), 'marriage is stated');
  else { singles++; assert(story.includes('결혼하지 않고') && !/첫 아이가|손주|가족들이 곁에서/.test(story), 'single life has no children'); }
  if (o.kids) { parents++; assert(story.includes('첫 아이가')); }
  if (!o.grandkids) assert(!story.includes('손주'), 'no grandchildren mentioned');
  familyLives++;
}
assert(singles > 0 && parents > 0);
// Sensory impairments that were not edited away are never contradicted by the story or drawing.
let blindLives = 0, deafMusicLives = 0;
for (let seed = 0; seed < 20000; seed++) {
  const rec = { ...record(seed), version: 2, guarantee: true };
  const found = BF.sim.screen(seed, true, 2);
  if (found.indexOf('rpe65') < 0 && found.indexOf('gjb2') < 0) continue;
  rec.edits = BF.DISORDERS.map(() => false);
  const built = BF.sim.build(rec), o = built.o;
  const story = built.scenes.flatMap(s => s.items).map(e => e.text).join(' ');
  if (o.has.rpe65) {
    blindLives++;
    assert(!/첫 안경|시력검사 결과|노안|돋보기|다초점|휴대폰을 멀리/.test(story), 'blind life has no eyesight scenes');
    for (const age of [10, 30, 60, 85]) assert.equal(BF.Person.look(o, age, {}).glasses, 'none', 'no corrective glasses when blind');
  }
  if (o.has.gjb2 && (o.pitch || o.bought.music)) {
    deafMusicLives++;
    assert(!/소리를 듣고|공연장 무대|음악 학원/.test(story), 'deaf life has no hearing-based music scenes');
  }
}
assert(blindLives > 0 && deafMusicLives > 0);
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
  ['친구 결혼식 사회만 열한 번 봤어요.', 'mic', 'happy', 'speak', 'smile'],
  ['첫돌. 돌잡이에서 마이크를 잡았어요.', 'mic', 'happy', 'idle', 'delighted'],
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
const actions = ['idle', 'read', 'perform', 'speak', 'celebrate', 'run', 'cradle', 'think', 'wave', 'welcome', 'cheer', 'roll'];
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
// Regression for the reported wheelchair story contradictions, across aging and sport choices.
let mobilityStories = 0;
for (const sport of ['sprint', 'endurance', 'none']) for (const slowAging of [false, true]) for (const grandkids of [false, true]) {
  const seatedModel = { ...model, has: { smn1: true, rpe65: true }, sport, slowAging, grandkids, longevity: true, endAge: 100 };
  const events = BF.sim.lifeEvents(seatedModel, '하루').flatMap(s => s.items);
  const story = events.map(e => e.text).join(' ');
  assert(!/계단보다|등산 동호회|뒷산을 올랐|주자로 뛰었|오래달리기에서|풀코스 마라톤|전국체전 100m|흰 지팡이를 짚고/.test(story));
  assert(events.find(e => e.age === 68).text.includes(slowAging ? '무장애 숲길' : '방석과 등받이'));
  const park = events.find(e => e.age === 71 && e.text.includes('공원을'));
  assert(park.text.includes(grandkids ? '손주' : '친구'));
  assert.equal(BF.Stage.performanceFor({ items: [park], prop: null, mood: 'happy' }).action, 'roll');
  mobilityStories++;
}
for (const sex of ['M', 'F', 'N']) for (const age of [4, 7, 15, 23, 50, 70, 95]) {
  const seatedModel = { ...model, sex, has: { smn1: true, rpe65: true } }, L = BF.Person.look(seatedModel, age, {}), c = BF.Person.chairGeometry(L);
  assert(c.kneeY > -c.seat && c.kneeY < c.ankleY && c.ankleY < c.footY && c.footY < 0, 'hip, knee, ankle and footrest must be vertically ordered');
  assert.equal(L.cane, null, 'do not draw a standing cane through a wheelchair');
  assert(c.radius * 2 > c.seat && c.radius * 2 < c.seat + L.hh * .3, 'wheel size fits the seat');
  const svg = BF.Person.render(seatedModel, age, { action: 'idle' });
  for (const part of ['chair-back', 'seated-legs', 'chair-wheels']) assert(svg.includes(part));
}
// Reduced motion retains the scene pose, while freezing figure geometry at a given age.
const motionOriginal = BF.motion.reduced;
BF.motion.reduced = () => true;
const staticPlayer = new BF.Stage.Player({}, { W: 1000, H: 900, groundY: 800, figureX: 500, rulerX: 100 });
Object.assign(staticPlayer, { o: model, figEl: {}, rulerEl: {}, bdEls: [], t: 2 });
const segment = { type: 'hold', t0: 0, t1: 4, scene: { items: [{ text: '독서' }], prop: 'book', mood: 'happy' } };
staticPlayer.draw(23, 1000, segment); const stillFigure = staticPlayer.figEl.innerHTML;
staticPlayer.draw(23, 3000, segment); assert.equal(staticPlayer.figEl.innerHTML, stillFigure);
staticPlayer.o = { ...model, has: { smn1: true } };
const rollingSegment = { ...segment, scene: { items: [{ text: '휠체어를 타고 친구들과 공원을 누볐어요.' }], prop: null, mood: 'happy' } };
staticPlayer.draw(71, 1000, rollingSegment); const stillChair = staticPlayer.figEl.innerHTML;
staticPlayer.draw(71, 3000, rollingSegment); assert.equal(staticPlayer.figEl.innerHTML, stillChair);
assert(staticPlayer.rulerEl.innerHTML.includes('현재 앉은 모습'));
assert(!staticPlayer.rulerEl.innerHTML.includes('stroke-dasharray'), 'do not mark standing height at the seated head');
BF.motion.reduced = motionOriginal;
// A ball remains held during merged basketball/race events; wheel propulsion
// must not take over both hands. Wedding hosting uses a formal speaking pose.
const mergedSports = { items: [{ text: '휠체어 농구팀에 들어갔어요.', prop: 'ball' }, { text: '도전 코스를 완주했어요.', prop: 'medal' }], prop: 'ball', mood: 'happy' };
assert.equal(BF.Stage.performanceFor(mergedSports).action, 'cheer');
assert.equal(BF.Stage.performanceFor({ items: [{text: '친구 결혼식 사회를 봤어요.', prop:'mic'}], prop:'mic', mood:'happy' }).outfit, 'suit');
// No event bounce may lift either assistive device from the ground.
BF.motion.reduced = () => false;
for (const has of [{smn1:true},{rpe65:true}]) {
  const p = new BF.Stage.Player({}, {W:1000,H:900,groundY:800,figureX:500,rulerX:100});
  Object.assign(p,{o:{...model,has},figEl:{},rulerEl:{},bdEls:[],t:.4});
  p.draw(36,400,{type:'hold',t0:0,t1:4,scene:{items:[{text:'수상했어요'}],prop:'trophy',mood:'happy'}});
  assert(p.figEl.innerHTML.startsWith('<g transform="translate(500 800)'), 'mobility support stays grounded');
}
BF.motion.reduced = motionOriginal;
// Scrubbing between exact story ages must retain the caption's own pose.
const scrubPlayer = new BF.Stage.Player({}, {W:1000,H:900,groundY:800,figureX:500,rulerX:100});
const weddingScene={age:36,items:[{text:'결혼식 사회',prop:'mic'}],prop:'mic',mood:'happy'};
Object.assign(scrubPlayer,{scenes:[{age:34},weddingScene,{age:45}],fxEl:{},draw(age,now,seg){this.shown=seg.scene;}});
assert.equal(scrubPlayer.show(36.5),weddingScene);assert.equal(scrubPlayer.shown,weddingScene);
// Every age, including paused transition boundaries, has one fully opaque background.
const backgroundPlayer = new BF.Stage.Player({}, { W: 1000, H: 900, groundY: 800, figureX: 500, rulerX: 100 });
const backgrounds = Array.from({length: 5}, () => ({ attrs: {}, setAttribute(k,v) { this.attrs[k] = v; } }));
Object.assign(backgroundPlayer, { o: model, figEl: {}, rulerEl: {}, bdEls: backgrounds, t: 2 });
const boundaryAges = [0, 5.49, 5.5, 5.51, 18, 18.49, 18.5, 18.51, 19, 29.49, 29.5, 29.51, 61.49, 61.5, 61.51, 100];
for (const age of boundaryAges) for (const reduced of [false, true]) {
  BF.motion.reduced = () => reduced;
  backgroundPlayer.draw(age, 700, segment);
  assert.equal(backgrounds.filter(b => b.attrs.display !== 'none').length, 1);
  assert.equal(backgrounds.filter(b => b.attrs.opacity === 1).length, 1);
  assert(backgrounds.every(b => b.attrs.opacity === 0 || b.attrs.opacity === 1));
}
BF.motion.reduced = motionOriginal;
const heldKinds = ['ball','book','pencil','mic','stetho','mouse','gavel','thread','money','briefcase','trophy','bouquet','baby'];
for (const age of [4,21,71,95]) for (const phase of [0,.7,2.3]) {
  const o={...model,has:{smn1:true}},L=BF.Person.look(o,age,{}),c=BF.Person.chairGeometry(L);
  const svg=BF.Person.render(o,age,{action:'roll',phase,poseMix:1});
  for (const match of svg.matchAll(/class="person-arm" data-side="(-?1)" data-wrist-x="([^"]+)" data-wrist-y="([^"]+)"/g)) {
    const x=Math.abs(+match[2]),y=+match[3];
    const ellipse=Math.pow((x-c.halfWidth-c.radius*.16)/(c.radius*.48*.89),2)+Math.pow((y+c.radius)/(c.radius*.92),2);
    assert(Math.abs(ellipse-1)<.006,'pushing wrist stays on the wheelchair handrim');
  }
}
for (const prop of heldKinds) {
  const svg = BF.Person.render(model, 23, { prop, action: prop === 'mic' ? 'perform' : 'celebrate', phase: .7 });
  assert(svg.indexOf('class="held-prop"') > svg.indexOf('class="person-head"'), prop + ' must be above the head layer');
  assert.equal((svg.match(/class="held-prop"/g) || []).length, 1, 'one prop, no doubled image');
}
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
console.log(JSON.stringify({ samples: 100000, counts, perType, qrRecords: 4000, familyLives, singles, parents, blindLives, deafMusicLives, renderCount, poseRenderCount, mobilityStories, sceneMappings: performances.length, checks: 'PASS' }, null, 2));
