import {spawn} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
try{process.loadEnvFile(resolve(root,'.env'))}catch(e){if(e.code!=='ENOENT')throw e}
const children=[
  spawn(process.execPath,['server/index.mjs'],{cwd:root,stdio:'inherit',env:process.env}),
  spawn(process.execPath,['node_modules/vite/bin/vite.js'],{cwd:root,stdio:'inherit',env:process.env})
];
let closing=false;
function stop(code=0){if(closing)return;closing=true;for(const c of children)c.kill();process.exitCode=code}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>stop());
for(const c of children)c.on('exit',code=>{if(!closing)stop(code||0)});
