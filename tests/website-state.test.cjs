const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const base=__dirname+'/../dist/';let handlers={};class Worker{terminate(){}postMessage(){}}
const ctx=vm.createContext({crypto:require('crypto').webcrypto,Worker,console,setTimeout,clearTimeout,document:{addEventListener:(n,fn)=>{(handlers[n]||=[]).push(fn)},getElementById:()=>null},window:{scrollTo(){}},URL,Blob});ctx.self=ctx;
for(let file of ['data.js','workflow-core.js','workflows.js'])vm.runInContext(fs.readFileSync(base+file,'utf8'),ctx);
let app=fs.readFileSync(base+'app.js','utf8').replace(/\nrender\(\);\nWF.init\(\);\s*$/,'');vm.runInContext(app,ctx);
const run=code=>vm.runInContext(code,ctx);
assert(run("FlowWorkflow.matchesFlow({id:102,values:{protocol:'TCP'}},'FL-0102')"));
assert(run("FlowWorkflow.matchesFlow({id:102,values:{protocol:'TCP'}},'flow-0102')"));
assert(run("FlowWorkflow.matchesFlow({id:5,values:{}},'b-0005','B')"));
assert(!run("FlowWorkflow.matchesFlow({id:102,values:{}},'FL-9999')"));
assert(run("FlowWorkflow.matchesFlow({id:2,predicted:'Suspicious',values:{}},'suspicious')"));
run("state.run={schema:[{name:'x'}],tests:[{id:102,actual:'Normal',predicted:'Normal',probability:.1,values:{x:3}}]};state.search='FL-0102';state.filter='all'");assert(run("flowTable().includes('FL-0102')"));assert(run("flowTable().includes('Showing 1–1 of 1 flows')"));
run("WF.cases=[{id:'closed-case',flowId:102,status:'Closed',source:'test.csv',notes:'QA',verdict:'Inconclusive',updatedAt:'2026-11-01T00:00:00Z',values:{}}];WF.selectedCase='closed-case';WF.reviewFilter='Open'");assert(!run("reviewsView().includes('id=\"case-detail\"')"));assert.equal(run('WF.selectedCase'),null);
run("state.prediction=null;attachWorker();state.view='notes';state.predictRevision=8;state.worker.onmessage({data:{type:'predict',id:'custom-7',result:{probability:.8}}})");assert.equal(run('state.prediction'),null);run("state.worker.onmessage({data:{type:'predict',id:'custom-8',result:{probability:.2}}})");assert.equal(run('state.prediction.probability'),.2);
run("WF.batchBusy=true;WF.current={demo:true};WF.batchRows=[{marker:'preserve'}]");assert.throws(()=>run('WF.sampleBatch()'),/active workflow/);assert.equal(run("WF.batchRows[0].marker"),'preserve');
run("WF.batchBusy=false;state.rows=FlowData.demo();state.label='label';state.normalLabels=['Normal'];state.excluded=new Set();WF.batchFile='old.csv';WF.batchQuality={rows:10};WF.batchRows=[{old:true}];WF.begin()");assert.equal(run('WF.batchRows.length'),0);assert.equal(run('WF.batchQuality'),null);assert.equal(run('WF.batchFile'),'');
assert.throws(()=>run("FlowData.parse('a,b\\n\"bad\"x,2')"),/closing quote/);assert.throws(()=>run("FlowData.parse('a,b\\n1')"),/expected 2/);assert.throws(()=>run("FlowData.parse('a,a\\n1,2')"),/unique/);assert.throws(()=>run("FlowData.parse('a\\n'+Array(10001).fill('1').join('\\n'))"),/10,000/);
assert.equal(run("FlowData.parse('a,b\\r\\n\"quoted, text\",\"line\\nbreak\"\\r\\n')[0].b"),'line\nbreak');
console.log('PASS: displayed flow-ID search, review filtering, stale prediction rejection, batch-input immutability while scoring, new-model reset, and strict CSV parsing including 10,000-record boundary.');
