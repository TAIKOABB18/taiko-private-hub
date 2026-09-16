import { createRequestHandler } from "react-router";
import type { CamelAiBinding } from "./camelai-binding";
import { randomToken, type ItemStore } from "./item-store";

export { ItemStore } from "./item-store";
interface Env { ASSETS?: { fetch(request: Request): Promise<Response> | Response }; CAMELAI: CamelAiBinding; ITEMS: DurableObjectNamespace<ItemStore>; }
declare module "react-router" { export interface AppLoadContext { cloudflare: { env: Env; ctx: ExecutionContext }; } }
const requestHandler = createRequestHandler(() => import("virtual:react-router/server-build"), import.meta.env.MODE);
function shouldServeAsset(request: Request): boolean { const method=request.method.toUpperCase(); if(method!=="GET"&&method!=="HEAD") return false; const pathname=new URL(request.url).pathname; return pathname.startsWith("/assets/")||pathname.includes(".")||pathname==="/robots.txt"; }
function json(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json;charset=utf-8"}});}
async function api(request:Request,env:Env):Promise<Response>{
  const url=new URL(request.url), parts=url.pathname.replace(/^\/api\/?/,"").split("/").filter(Boolean), hub=env.ITEMS.get(env.ITEMS.idFromName("hub"));
  if(parts[0]!=="files"&&parts[0]!=="shares"&&parts[0]!=="agent-jobs"&&parts[0]!=="policy") return json({error:"unknown endpoint"},404);
  const body=async()=>await request.json().catch(()=>({})) as Record<string,unknown>; const id=Number(parts[1]);
  if(parts[0]==="files"&&request.method==="GET") return json({files:await hub.listFiles(Number(url.searchParams.get("projectId")||0),url.searchParams.get("q")||"",url.searchParams.get("trash")==="1"?1:0)});
  if(parts[0]==="files"&&parts[1]&&parts[2]==="rename"&&request.method==="POST"){const b=await body();await hub.renameFile(id,String(b.name||""));return json({ok:true});}
  if(parts[0]==="files"&&parts[1]&&parts[2]==="trash"&&request.method==="POST"){await hub.trashFile(id);return json({ok:true});}
  if(parts[0]==="files"&&parts[1]&&parts[2]==="restore"&&request.method==="POST"){await hub.restoreFile(id);return json({ok:true});}
  if(parts[0]==="files"&&parts[1]&&parts[2]==="favorite"&&request.method==="POST"){const b=await body();await hub.favoriteFile(id,Boolean(b.favorite));return json({ok:true});}
  if(parts[0]==="files"&&parts[1]&&parts[2]==="tags"&&request.method==="GET") return json({tags:await hub.listTags(id)});
  if(parts[0]==="files"&&parts[1]&&parts[2]==="tags"&&request.method==="POST"){const b=await body();await hub.addTag(id,String(b.name||""));return json({ok:true});}
  if(parts[0]==="shares"&&request.method==="GET") return json({shares:await hub.listShares(Number(url.searchParams.get("fileId"))||undefined)});
  if(parts[0]==="shares"&&request.method==="POST"){const b=await body();return json({share:await hub.createShare(Number(b.fileId),randomToken(),b.expiresAt?String(b.expiresAt):null)},201);}
  if(parts[0]==="shares"&&parts[1]&&parts[2]==="revoke"&&request.method==="POST"){await hub.revokeShare(id);return json({ok:true});}
  if(parts[0]==="agent-jobs"&&request.method==="GET") return json({jobs:await hub.listAgentJobs(),execution:"disabled"});
  if(parts[0]==="agent-jobs"&&request.method==="POST"){const b=await body();return json({job:await hub.enqueueAgentJob(b.projectId==null?null:Number(b.projectId),String(b.kind||"review"),String(b.policy||"manual-approval-required")),execution:"disabled"},201);}
  if(parts[0]==="policy"&&request.method==="GET") return json({execution:"disabled",codeExecution:false,production:false,defaultPolicy:"manual-approval-required"});
  return json({error:"method not allowed"},405);
}
export default { async fetch(request:Request,env:Env,ctx:ExecutionContext){
  if(new URL(request.url).pathname.startsWith("/api/")) return api(request,env);
  if(env.ASSETS&&shouldServeAsset(request)){const response=await env.ASSETS.fetch(request);if(response.status!==404)return response;}
  return requestHandler(request,{cloudflare:{env,ctx}});
} } satisfies ExportedHandler<Env>;
