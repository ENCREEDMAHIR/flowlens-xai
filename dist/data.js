/* Seeded synthetic flows for software demonstration; never captured traffic. */
(function(root){
 function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
 function demo(){let r=rng(42),out=[];for(let i=0;i<900;i++){let a=r()<.27,p=['TCP','UDP','ICMP'][Math.floor(r()*3)],burst=r()<.18;let row={duration_ms:Math.round(30+r()*4200+(a?-10:500)),protocol:p,src_bytes:Math.round(120+r()*(a?55000:15000)),dst_bytes:Math.round(80+r()*(a?3000:21000)),packet_count:Math.round(4+r()*(a?850:310)),packets_per_second:Math.round(2+r()*(a||burst?2000:260)),syn_ratio:+(p==='TCP'?Math.min(1,r()*(a?.95:.45)):0).toFixed(3),failed_logins:Math.floor(r()*(a?9:3))};let label=a;if(r()<.1)label=!label;row.label=label?'Suspicious':'Normal';out.push(row)}return out}
 function csv(rows){const headers=Object.keys(rows[0]);const quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';return[headers.map(quote).join(','),...rows.map(r=>headers.map(h=>quote(r[h])).join(','))].join('\n')}
 function parse(text){
  text=text.replace(/^\uFEFF/,'');let rows=[],row=[],s='',quoted=false,closed=false;
  const pushRow=()=>{row.push(s);if(row.some(x=>x.trim()))rows.push(row);row=[];s='';closed=false;if(rows.length>10001)throw Error('Use a CSV with at most 10,000 records.')};
  for(let i=0;i<text.length;i++){let c=text[i];
   if(c==='"'){if(quoted&&text[i+1]==='"'){s+='"';i++}else if(quoted){quoted=false;closed=true}else if(!s.length&&!closed)quoted=true;else throw Error('Unexpected quote in CSV. Quote the complete cell.')}
   else if(c===','&&!quoted){row.push(s);s='';closed=false}
   else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;pushRow()}
   else if(closed&&!quoted){if(c!==' '&&c!=='\t')throw Error('Unexpected characters after a closing quote in CSV.')}
   else s+=c;
  }
  if(quoted)throw Error('CSV contains an unclosed quoted field.');pushRow();
  if(rows.length<2)throw Error('Add a header row and at least one data record.');let headers=rows.shift().map(x=>x.trim());
  if(headers.some(x=>!x)||new Set(headers).size!==headers.length)throw Error('Column names must be unique and nonempty.');if(headers.length>80)throw Error('Use at most 80 columns; select up to 40 features.');
  return rows.map((r,i)=>{if(r.length!==headers.length)throw Error('Row '+(i+2)+' has '+r.length+' cells; expected '+headers.length+'.');return Object.fromEntries(headers.map((h,j)=>[h,r[j].trim()]))})
 }

 root.FlowData={demo,csv,parse,rng};
})(typeof self!=='undefined'?self:globalThis);
