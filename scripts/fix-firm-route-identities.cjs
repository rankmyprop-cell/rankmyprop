// Repairs public slugs without changing stable CMS document IDs.
const fs = require('node:fs');
const path = require('node:path');
const root = 'https://firestore.googleapis.com/v1/projects/rank-my-prop/databases/(default)/documents';
function encode(v) {
 if(v === null) return {nullValue:null};
 if(Array.isArray(v)) return {arrayValue:{values:v.map(encode)}};
 if(typeof v === 'object')return {mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,encode(x)]))}};
 if(typeof v === 'boolean')return {booleanValue:v};
 if(typeof v === 'number')return {doubleValue:v};
 return {stringValue:String(v)};
}
async function main(){
 const config=JSON.parse(fs.readFileSync(path.join(process.env.HOME,'.config/configstore/firebase-tools.json'),'utf8'));
 let token=config.tokens.access_token;
 if(Number(config.tokens.expires_at)<Date.now()+60000){
  const entry=fs.realpathSync('/opt/homebrew/bin/firebase');
  token=(await require(path.resolve(path.dirname(entry),'../auth.js')).getAccessToken(config.tokens.refresh_token,config.tokens.scopes||[])).access_token;
 }
 const writes=[
  ['firms','fundednext',{slug:'alpha-trader-firm',detailsLink:'/prop-firms/alpha-trader-firm',rulesLink:'/firm-rules?firm=alpha-trader-firm',discountPage:'/offers/alpha-trader-firm'}],
  ['firms','fundednext-firm',{slug:'fundednext',name:'FundedNext',detailsLink:'/prop-firms/fundednext',rulesLink:'/firm-rules?firm=fundednext',discountPage:'/offers/fundednext',score:0,reviewCount:0,reviewSummary:{count:0,avg:0,traders:0}}],
 ];
 const backups=[];const statements=[];
 const quote=v=>"'"+String(v).replaceAll("'","''")+"'";
 for(const [collection,id,patch] of writes){
  const before=await fetch(`${root}/${collection}/${id}`,{headers:{Authorization:`Bearer ${token}`}});
  if(!before.ok)throw new Error(`Read ${collection}/${id}: ${before.status}`);
  backups.push(await before.json());
  fs.writeFileSync('tmp/firm-identity-firestore-before.json',JSON.stringify(backups,null,2));
  if(process.argv.includes('--apply')){
   const query=Object.keys(patch).map(k=>'updateMask.fieldPaths='+encodeURIComponent(k)).join('&');
   const result=await fetch(`${root}/${collection}/${id}?${query}`,{method:'PATCH',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({fields:Object.fromEntries(Object.entries(patch).map(([k,v])=>[k,encode(v)]))})});
   if(!result.ok)throw new Error(`Save ${collection}/${id}: ${result.status}`);
  }
  statements.push(`UPDATE documents SET data=json_patch(data,${quote(JSON.stringify(patch))}),slug=${quote(patch.slug)},updated_at=CURRENT_TIMESTAMP WHERE collection=${quote(collection)} AND id=${quote(id)};`);
  console.log(`${process.argv.includes('--apply')?'Updated':'Prepared'} ${collection}/${id} -> ${patch.slug}`);
 }
 fs.writeFileSync('tmp/firm-identity-fix.sql',statements.join('\n'));
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
