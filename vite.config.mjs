import {defineConfig,loadEnv} from 'vite';
export default defineConfig(({mode})=>{
  const local=loadEnv(mode,process.cwd(),'');
  return {server:{host:'127.0.0.1',port:5173,strictPort:true,proxy:{'/api':`http://127.0.0.1:${local.PORT||8787}`}},build:{target:'es2022'}};
});
