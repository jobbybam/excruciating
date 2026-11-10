import {getChatUser} from "./chat-session.js";
export function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...headers}});}
export async function isAdmin(request,env){const user=await getChatUser(request,env);return Boolean(user&&Number(user.is_admin)===1);}
export async function requireAdmin(request,env){if(!(await isAdmin(request,env)))return json({error:"Unauthorised"},401);return null;}
