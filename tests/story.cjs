/* node tests/story.cjs — QR compatibility, causal choices and deterministic arcs. */
const fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
function load(prior){const c=vm.createContext({window:{},console,btoa,atob,performance});for(const file of prior?['util.js','data.js','sim.js']:['util.js','data.js','story.js','sim.js'])vm.runInContext(prior?cp.execFileSync('git',['show','f5c3c02:'+file],{cwd:root,encoding:'utf8'}):fs.readFileSync(path.join(root,file),'utf8'),c);return c.BF;}
const B=load(),prior=load(true),equal=(a,b,m)=>assert.equal(JSON.stringify(a),JSON.stringify(b),m);
const rec=(seed,version=3)=>({seed,version,name:'별이',budget:25000,order:17,day:288,guarantee:false,sel:B.TRAITS.map((t,i)=>(seed+i)%t.opts.length),edits:B.DISORDERS.map((d,i)=>(seed+i)%2===0),choices:[0,0,0]});
let legacy=0,roundtrips=0,causal=0;const titles=new Set();
for(let seed=0;seed<1000;seed++){
  const r=rec(seed,2);delete r.choices;
  const token=prior.sim.encodeResult(r),now=B.sim.build(B.sim.decodeResult(token)),was=prior.sim.build(r);
  for(const key of ['o','scenes','spent','items','found'])equal(now[key],was[key],'version 2 '+key);
  assert.equal(B.sim.encodeResult(B.sim.decodeResult(token)),token);legacy++;
  const v3=rec(seed),b=B.sim.build(v3),replayed=B.sim.build(B.sim.decodeResult(B.sim.encodeResult(v3)));
  equal(b.scenes,replayed.scenes,'version 3 replay');equal(b.o,was.o,'story must not change genetic outcome');
  const all=b.scenes.flatMap(s=>s.items),decisions=all.filter(e=>e.choice);
  assert.equal(decisions.length,3);equal(decisions.map(e=>e.choice.id),[0,1,2]);
  titles.add(B.Story.arcFor(b.o).title);
  assert.equal(all.filter(e=>e.final).length,1);assert(b.scenes.at(-1).final);
  assert(all.every(e=>Number.isFinite(e.age)&&e.age>=0&&e.age<=b.o.endAge));
  assert(!/undefined|NaN/.test(all.map(e=>e.text).join(' ')));
  roundtrips++;
}
assert.equal(titles.size,4);
for(let seed=1;seed<=32;seed++)for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++){
  const r={...rec(seed),choices:[a,b,c]},built=B.sim.build(r),token=B.sim.encodeResult(r),decoded=B.sim.decodeResult(token);
  equal(decoded.choices,r.choices,'all choice bits roundtrip');equal(B.sim.build(decoded).scenes,built.scenes,'branch replay');
  for(const slot of [0,1,2]){
    const one={...r,choices:[...r.choices]},two={...r,choices:[...r.choices]};one.choices[slot]=1;two.choices[slot]=2;
    const x=B.sim.build(one),y=B.sim.build(two),age=[15.8,38.5,60.2][slot];
    equal(x.o,y.o,'choices cannot rewrite birth');equal(x.scenes.filter(s=>s.age<age),y.scenes.filter(s=>s.age<age),'choices cannot rewrite the past');
    assert.notEqual(JSON.stringify(x.scenes.filter(s=>s.age>age)),JSON.stringify(y.scenes.filter(s=>s.age>age)),'each choice has a later consequence');
    causal++;
  }
  roundtrips++;
}
console.log(JSON.stringify({checks:'PASS',v2Unchanged:legacy,v3Roundtrips:roundtrips,causalChecks:causal,arcs:[...titles]},null,2));
