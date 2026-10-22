/** A loopback-only, single-route ingress for temporary Bolna development tests. */
import http from 'node:http';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {timingSafeEqual} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
try{process.loadEnvFile(resolve(root,'.env'))}catch(e){if(e.code!=='ENOENT')throw e}
const token=process.env.BOLNA_TOOL_TOKEN;
if(!token)throw new Error('Configure BOLNA_TOOL_TOKEN before starting callback ingress.');
const expected=Buffer.from(`Bearer ${token}`);
const upstream=`http://127.0.0.1:${Number(process.env.PORT||8787)}/api/bolna/report`;
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
const server=http.createServer(async(req,res)=>{
  if(req.method!=='POST'||req.url!=='/api/bolna/report')return send(res,404,{error:'Not found.'});
  const received=Buffer.from(req.headers.authorization||'');
  if(received.length!==expected.length||!timingSafeEqual(received,expected))return send(res,401,{error:'Unauthorized.'});
  if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return send(res,415,{error:'Send application/json.'});
  try{
    let size=0;const chunks=[];
    for await(const chunk of req){size+=chunk.length;if(size<=131072)chunks.push(chunk)}
    if(size>131072)return send(res,413,{error:'Request too large.'});
    const response=await fetch(upstream,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:Buffer.concat(chunks),signal:AbortSignal.timeout(15000)});
    const data=await response.json();send(res,response.status,data);
  }catch{send(res,502,{error:'Local evidence service unavailable.'})}
});
server.requestTimeout=15000;
server.listen(Number(process.env.BOLNA_CALLBACK_PORT||8792),'127.0.0.1',()=>console.log(`Callback-only ingress: http://127.0.0.1:${process.env.BOLNA_CALLBACK_PORT||8792}/api/bolna/report`));
