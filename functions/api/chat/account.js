import {json} from "../../_lib/auth.js";
import {getChatUser} from "../../_lib/chat-session.js";

const usernamePattern=/^[a-zA-Z0-9_]{3,20}$/;
async function readAccount(env,userId){
 return await env.DB.prepare(`SELECT id,username,username_changed_at,
  CASE WHEN username_changed_at IS NULL THEN NULL
   ELSE strftime('%Y-%m-%dT%H:%M:%SZ',datetime(username_changed_at,'+3 days')) END AS next_username_change_at
  FROM chat_users WHERE id=?`).bind(userId).first();
}
export async function onRequestGet({request,env}){
 const user=await getChatUser(request,env);
 if(!user)return json({error:"Log in to manage your account."},401);
 const account=await readAccount(env,user.id);
 if(!account)return json({error:"This account could not be found."},404);
 return json(account);
}
export async function onRequestPatch({request,env}){
 const user=await getChatUser(request,env);
 if(!user)return json({error:"Log in to change your username."},401);
 const body=await request.json().catch(()=>({}));
 const username=String(body.username||"").trim();
 if(!usernamePattern.test(username))return json({error:"Username must be 3–20 letters, numbers or underscores."},400);
 const current=await readAccount(env,user.id);
 if(!current)return json({error:"This account could not be found."},404);
 if(current.username.toLowerCase()===username.toLowerCase())return json({ok:true,changed:false,username:current.username,next_username_change_at:current.next_username_change_at});
 try{
  const result=await env.DB.prepare(`UPDATE chat_users SET username=?,username_changed_at=datetime('now')
   WHERE id=? AND (username_changed_at IS NULL OR datetime(username_changed_at,'+3 days')<=datetime('now'))`).bind(username,user.id).run();
  if(!Number(result.meta?.changes||0)){
   const latest=await readAccount(env,user.id);
   if(!latest)return json({error:"This account could not be found."},404);
   if(latest.username.toLowerCase()===username.toLowerCase())return json({ok:true,changed:false,username:latest.username,next_username_change_at:latest.next_username_change_at});
   return json({error:"You can change your username once every 3 days.",next_username_change_at:latest.next_username_change_at},429);
  }
 }catch(error){
  if(String(error).includes("UNIQUE"))return json({error:"That username is already taken."},409);
  throw error;
 }
 const updated=await readAccount(env,user.id);
 return json({ok:true,changed:true,username:updated.username,username_changed_at:updated.username_changed_at,next_username_change_at:updated.next_username_change_at});
}

