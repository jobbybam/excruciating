import {json,requireAdmin} from "../../_lib/auth.js";
import {getChatUser} from "../../_lib/chat-session.js";

export async function onRequestGet({request,env}){
 const denied=await requireAdmin(request,env);
 if(denied)return denied;
 const rows=await env.DB.prepare(`SELECT id,username,is_admin,created_at,terminated_at
  FROM chat_users ORDER BY id DESC LIMIT 200`).all();
 return json({accounts:rows.results||[]});
}
export async function onRequestPatch({request,env}){
 const denied=await requireAdmin(request,env);
 if(denied)return denied;
 const admin=await getChatUser(request,env);
 const body=await request.json().catch(()=>({}));
 const accountId=Number(body.account_id),action=String(body.action||"");
 if(!Number.isSafeInteger(accountId)||accountId<1||!["terminate","restore"].includes(action))
  return json({error:"Choose a valid account action."},400);
 if(accountId===admin.id)return json({error:"You cannot terminate your own admin account."},403);
 const target=await env.DB.prepare("SELECT id,is_admin,terminated_at FROM chat_users WHERE id=?").bind(accountId).first();
 if(!target)return json({error:"That account no longer exists."},404);
 if(Number(target.is_admin)===1)return json({error:"Admin accounts are protected."},403);
 if(action==="terminate"){
  await env.DB.prepare("UPDATE chat_users SET terminated_at=COALESCE(terminated_at,datetime('now')),terminated_by=COALESCE(terminated_by,?) WHERE id=?").bind(admin.id,accountId).run();
  await env.DB.prepare("DELETE FROM chat_push_subscriptions WHERE user_id=?").bind(accountId).run();
  await env.DB.prepare("DELETE FROM direct_message_pins WHERE user_id=? OR peer_id=?").bind(accountId,accountId).run();
 }else{
  await env.DB.prepare("UPDATE chat_users SET terminated_at=NULL,terminated_by=NULL WHERE id=?").bind(accountId).run();
 }
 return json({ok:true,account_id:accountId,action});
}

