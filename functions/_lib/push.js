import {isPushServiceEndpoint,sendPushNotification} from "@mmmike/web-push/send";

export async function sendChatPush(env,userIds,payload){
 const publicKey=env.VAPID_PUBLIC_KEY,privateKey=env.VAPID_PRIVATE_KEY,subject=env.VAPID_SUBJECT;
 if(!publicKey||!privateKey||!subject)return;
 const ids=[...new Set((userIds||[]).map(Number).filter(id=>Number.isSafeInteger(id)&&id>0))];
 if(!ids.length)return;
 const marks=ids.map(()=>"?").join(",");
 const rows=await env.DB.prepare(`SELECT id,subscription_json FROM chat_push_subscriptions WHERE user_id IN (${marks})`).bind(...ids).all();
 const vapid={publicKey,privateKey,subject};
 await Promise.all((rows.results||[]).map(async row=>{
  let subscription;
  try{subscription=JSON.parse(row.subscription_json);}catch{subscription=null;}
  if(!subscription||!isPushServiceEndpoint(String(subscription.endpoint||""))){
   await env.DB.prepare("DELETE FROM chat_push_subscriptions WHERE id=?").bind(row.id).run();
   return;
  }
  try{
   const delivered=await sendPushNotification(subscription,payload,vapid,{ttl:300,urgency:"normal",timeoutMs:8000});
   if(!delivered)await env.DB.prepare("DELETE FROM chat_push_subscriptions WHERE id=?").bind(row.id).run();
  }catch(error){
   if(error?.statusCode===404||error?.statusCode===410)await env.DB.prepare("DELETE FROM chat_push_subscriptions WHERE id=?").bind(row.id).run();
   else console.warn("Direct-message push send failed.",Number(error?.statusCode)||0);
  }
 }));
}
