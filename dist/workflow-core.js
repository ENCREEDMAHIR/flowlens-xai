/* Pure workflow validation and transactional, device-local persistence. */
(function(root){
const blank=v=>v===null||v===undefined||String(v).trim()===''||/^(nan|[+-]?inf(?:inity)?)$/i.test(String(v).trim());
const token=v=>String(v??'').trim().toLowerCase();
const finite=v=>!blank(v)&&Number.isFinite(Number(v));
const statuses=['Open','Investigating','Closed'];
const verdicts=['Unreviewed','Suspicious confirmed','Benign / false positive','Inconclusive'];
function fingerprint(row,features,label){return JSON.stringify([...features.map(f=>row[f]??''),token(row[label])])}
function inspect(rows,label,features,normalLabels){
 if(!Array.isArray(rows)||rows.length<20||rows.length>10000)throw Error('Training requires 20–10,000 labelled records.');
 if(!Array.isArray(features)||features.length<1||features.length>40||features.includes(label))throw Error('Select 1–40 feature columns, excluding the target.');
 if(!Object.hasOwn(rows[0],label))throw Error('The target column is missing.');
 const normal=new Set(normalLabels.map(token));if(!normal.size)throw Error('Select the label values that represent Normal traffic.');
 let counts=[0,0],missing=0,duplicates=0,seen=new Set;
 for(let [i,row] of rows.entries()){if(blank(row[label]))throw Error('Record '+(i+1)+' has no valid target label.');counts[normal.has(token(row[label]))?0:1]++;for(let f of features){if(!Object.hasOwn(row,f))throw Error('Missing feature column: '+f);if(blank(row[f]))missing++}let key=fingerprint(row,features,label);if(seen.has(key))duplicates++;seen.add(key)}
 if(counts.some(n=>n<4))throw Error('Both Normal and Suspicious need at least 4 records. Check the label mapping.');
 return{rows:rows.length,features:features.length,counts,missing,duplicates};
}
function deduplicate(rows,features,label){let seen=new Set;return rows.filter(row=>{let k=fingerprint(row,features,label);if(seen.has(k))return false;seen.add(k);return true})}
function batchCheck(rows,schema){if(!Array.isArray(rows)||!rows.length||rows.length>10000)throw Error('Batch scoring requires 1–10,000 flow records.');let missingColumns=schema.filter(s=>!Object.hasOwn(rows[0],s.name)).map(s=>s.name);if(missingColumns.length)throw Error('Missing required columns: '+missingColumns.join(', ')+'. Download the input template to check the schema.');let missing=0,unknown=0,outOfRange=0,invalid=[];
 for(let [i,row] of rows.entries())for(let s of schema){let v=row[s.name];if(blank(v)){missing++;continue}if(s.type==='numeric'){if(!finite(v)){if(invalid.length<5)invalid.push('row '+(i+1)+', '+s.name)}else if(Number(v)<s.min||Number(v)>s.max)outOfRange++}else if(!s.categories.includes(String(v)))unknown++}
 if(invalid.length)throw Error('Expected numeric values at '+invalid.join('; ')+'. Blanks and NaN/Infinity can be imputed.');return{rows:rows.length,missing,unknown,outOfRange,features:schema.length};
}
function validateModel(value){if(!value||!Array.isArray(value.schema)||value.schema.length<1||value.schema.length>40||!Array.isArray(value.trees)||value.trees.length!==150)throw Error('Invalid model bundle: expected a FlowLens model with 150 trees.');let dimensions=0,names=new Set;
 const schema=value.schema.map(s=>{if(typeof s.name!=='string'||!s.name||s.name.length>300||names.has(s.name))throw Error('Invalid model feature names.');names.add(s.name);if(s.type==='numeric'){if(![s.typical,s.min,s.max].every(x=>typeof x==='number'&&Number.isFinite(x))||s.min>s.max)throw Error('Invalid numeric preprocessing.');dimensions++;return{name:s.name,type:s.type,typical:s.typical,min:s.min,max:s.max}}if(s.type!=='categorical'||!Array.isArray(s.categories)||!s.categories.length||s.categories.length>30||s.categories.some(x=>typeof x!=='string'||x.length>1000)||new Set(s.categories).size!==s.categories.length||!s.categories.includes(s.typical))throw Error('Invalid categorical preprocessing.');dimensions+=s.categories.length;return{name:s.name,type:s.type,typical:s.typical,categories:s.categories}});if(dimensions>160||value.dimensions!==dimensions)throw Error('Encoded feature dimensions do not match.');let nodes=0;
 function tree(t,depth){if(++nodes>600000||depth>14||!t||typeof t!=='object')throw Error('Model tree limit exceeded.');if(t.f===undefined){if(typeof t.p!=='number'||!Number.isFinite(t.p)||t.p<0||t.p>1)throw Error('Invalid leaf probability.');return{p:t.p}}if(!Number.isInteger(t.f)||t.f<0||t.f>=dimensions||typeof t.threshold!=='number'||!Number.isFinite(t.threshold))throw Error('Invalid tree split.');return{f:t.f,threshold:t.threshold,left:tree(t.left,depth+1),right:tree(t.right,depth+1)}}
 return{schema,dimensions,dropped:Array.isArray(value.dropped)?value.dropped.filter(x=>typeof x==='string'):[],trees:value.trees.map(t=>tree(t,0))};
}
function reviewPatch(old,patch){let status=patch.status,verdict=patch.verdict,notes=String(patch.notes??'').trim(),evidence=String(patch.evidence??'').trim(),analyst=String(patch.analyst??'').trim();if(!statuses.includes(status)||!verdicts.includes(verdict))throw Error('Choose a valid review status and verdict.');if(notes.length>4000||evidence.length>2000||analyst.length>100)throw Error('Keep notes under 4,000 characters, evidence under 2,000 and analyst under 100.');if(status==='Closed'&&(verdict==='Unreviewed'||!notes))throw Error('Closing a case requires a verdict and investigation notes.');if(verdict==='Suspicious confirmed'&&(!notes||!evidence))throw Error('Add notes and an evidence reference before confirming suspicious activity.');return{...old,status,verdict,notes,evidence,analyst};}
function matchesFlow(record,query,prefix='FL'){let q=String(query??'').trim().toLowerCase().replace(/^flow-/, 'fl-');if(!q)return true;let text=[prefix+'-'+String(record.id??record.flowId).padStart(4,'0'),record.id,record.flowId,record.actual,record.predicted,record.source,record.notes,record.verdict,record.status,...Object.values(record.values||{})].join(' ').toLowerCase();return text.includes(q)}
function safeCSV(rows){if(!rows.length)throw Error('No records to export.');let keys=[...new Set(rows.flatMap(row=>Object.keys(row)))];return FlowData.csv(rows.map(row=>Object.fromEntries(keys.map(k=>{let v=row[k]??'';return[k,typeof v==='string'&&/^[=+@-]/.test(v)&&!finite(v)?"'"+v:v]}))))}
class Store{
 constructor(){this.db=null}
 async open(){if(this.db)return this;this.db=await new Promise((resolve,reject)=>{let req=indexedDB.open('flowlens-workflows-v1',1);req.onupgradeneeded=()=>{for(let name of ['experiments','batches','cases','events'])if(!req.result.objectStoreNames.contains(name))req.result.createObjectStore(name,{keyPath:'id'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Local storage unavailable'));req.onblocked=()=>reject(Error('Close other FlowLens tabs to initialize local storage.'))});return this}
 all(name){return new Promise((resolve,reject)=>{let tx=this.db.transaction(name,'readonly'),req=tx.objectStore(name).getAll();req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
 commit(items){return new Promise((resolve,reject)=>{let stores=[...new Set(items.map(x=>x.store))],tx=this.db.transaction(stores,'readwrite');try{for(let item of items)tx.objectStore(item.store).put(item.record)}catch(e){tx.abort();reject(e);return}tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||Error('Could not save to this device'));tx.onabort=()=>reject(tx.error||Error('Local transaction aborted'))})}
}
root.FlowWorkflow={blank,token,inspect,deduplicate,batchCheck,validateModel,reviewPatch,statuses,verdicts,matchesFlow,safeCSV,Store};
})(typeof self!=='undefined'?self:globalThis);
