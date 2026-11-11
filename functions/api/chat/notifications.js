import {json} from "../../_lib/auth.js";
import {getChatUser} from "../../_lib/chat-session.js";
import {isPushServiceEndpoint} from "@mmmike/web-push/send";

const configured=env=>Boolean(env.VAPID_PUBLIC_KEY&&env.VAPID_PRIVATE_KEY&&env.VAPID_SUBJECT);

export async function onRequestGet({env}){
 return json({enabled:configured(env),public_key:env.VAPID_PUBLIC_KEY||""});
}

export async function onRequestPost({request,env}){
 const user=await getChatUser(request,env);
 if(!user)return json({error:"Log in to manage notifications."},401);
 if(!configured(env))return json({error:"Push notifications are not configured yet."},503);
 const body=await request.json().catch(()=>({}));
 const action=String(body.action||"");
 if(action==="unsubscribe"){
  const endpoint=typeof body.endpoint==="string"?body.endpoint:"";
  if(!endpoint)return json({error:"A push subscription is required."},400);
  await env.DB.prepare("DELETE FROM chat_push_subscriptions WHERE user_id=? AND endpoint=?").bind(user.id,endpoint).run();
  return json({ok:true});
 }
 if(action!=="subscribe")return json({error:"Choose subscribe or unsubscribe."},400);
 const subscription=body.subscription;
 if(!subscription||typeof subscription.endpoint!=="string"||!isPushServiceEndpoint(subscription.endpoint)||typeof subscription.keys?.p256dh!=="string"||typeof subscription.keys?.auth!=="string"){
  return json({error:"That push subscription is not valid."},400);
 }
 const safeSubscription={endpoint:subscription.endpoint,keys:{p256dh:subscription.keys.p256dh,auth:subscription.keys.auth}};
 await env.DB.prepare(`INSERT INTO chat_push_subscriptions(user_id,endpoint,subscription_json)
  VALUES(?,?,?) ON CONFLICT(endpoint) DO UPDATE SET user_id=excluded.user_id,subscription_json=excluded.subscription_json,updated_at=datetime('now')`)
  .bind(user.id,safeSubscription.endpoint,JSON.stringify(safeSubscription)).run();
 return json({ok:true});
}
