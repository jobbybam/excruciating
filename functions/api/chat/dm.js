import {json} from "../../_lib/auth.js";
import {getChatUser} from "../../_lib/chat-session.js";
import {sendChatPush} from "../../_lib/push.js";
async function ensureTables(env){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS direct_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL REFERENCES chat_users(id),
  recipient_id INTEGER NOT NULL REFERENCES chat_users(id),
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  read_at TEXT
 )`).run();
 await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_dm_recipient_unread ON direct_messages(recipient_id,read_at,id)").run();
 await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_dm_conversation ON direct_messages(sender_id,recipient_id,id)").run();
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS direct_message_pins (
  user_id INTEGER NOT NULL REFERENCES chat_users(id),
  peer_id INTEGER NOT NULL REFERENCES chat_users(id),
  pinned_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(user_id,peer_id)
 )`).run();
 await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_dm_pins_user ON direct_message_pins(user_id,pinned_at)").run();
}
export async function onRequestGet({request,env}){
 const user=await getChatUser(request,env);if(!user)return json({error:"Log in to use direct messages."},401);
 await ensureTables(env);
 const url=new URL(request.url),peerId=Number(url.searchParams.get("with")||0),rawSearch=(url.searchParams.get("search")||"").trim().slice(0,40),search=rawSearch.replace(/[%_]/g,"");
 const users=await env.DB.prepare(`SELECT u.id,u.username,
  (SELECT COUNT(*) FROM direct_messages d WHERE d.sender_id=u.id AND d.recipient_id=? AND d.read_at IS NULL) AS unread_count,
  (SELECT message FROM direct_messages d WHERE (d.sender_id=u.id AND d.recipient_id=?) OR (d.sender_id=? AND d.recipient_id=u.id) ORDER BY d.id DESC LIMIT 1) AS last_message,
  (SELECT created_at FROM direct_messages d WHERE (d.sender_id=u.id AND d.recipient_id=?) OR (d.sender_id=? AND d.recipient_id=u.id) ORDER BY d.id DESC LIMIT 1) AS last_message_at,
  EXISTS(SELECT 1 FROM direct_message_pins p WHERE p.user_id=? AND p.peer_id=u.id) AS pinned
  FROM chat_users u WHERE u.id<>? AND u.terminated_at IS NULL AND (
   EXISTS(SELECT 1 FROM direct_messages d WHERE (d.sender_id=u.id AND d.recipient_id=?) OR (d.sender_id=? AND d.recipient_id=u.id))
   OR EXISTS(SELECT 1 FROM direct_message_pins p WHERE p.user_id=? AND p.peer_id=u.id)
  )
  ORDER BY pinned DESC,CASE WHEN last_message_at IS NULL THEN 1 ELSE 0 END,last_message_at DESC,u.username COLLATE NOCASE`).bind(user.id,user.id,user.id,user.id,user.id,user.id,user.id,user.id,user.id,user.id).all();
 let searchResults=[];
 if(search.length>=2){
  const result=await env.DB.prepare(`SELECT u.id,u.username,
   EXISTS(SELECT 1 FROM direct_message_pins p WHERE p.user_id=? AND p.peer_id=u.id) AS pinned
   FROM chat_users u WHERE u.id<>? AND u.terminated_at IS NULL AND u.username LIKE ? COLLATE NOCASE
   ORDER BY u.username COLLATE NOCASE LIMIT 25`).bind(user.id,user.id,"%"+search+"%").all();
  searchResults=result.results||[];
 }
 let messages=[],currentUser=null;
 if(Number.isSafeInteger(peerId)&&peerId>0){
  const peer=await env.DB.prepare(`SELECT u.id,u.username,
   EXISTS(SELECT 1 FROM direct_message_pins p WHERE p.user_id=? AND p.peer_id=u.id) AS pinned
   FROM chat_users u WHERE u.id=? AND u.id<>? AND u.terminated_at IS NULL`).bind(user.id,peerId,user.id).first();
  if(!peer)return json({error:"That user no longer exists."},404);
  currentUser=peer;
  await env.DB.prepare("UPDATE direct_messages SET read_at=datetime('now') WHERE sender_id=? AND recipient_id=? AND read_at IS NULL").bind(peerId,user.id).run();
  const rows=await env.DB.prepare(`SELECT d.id,d.sender_id,d.recipient_id,d.message,d.created_at,d.read_at,s.username AS sender_username
   FROM direct_messages d JOIN chat_users s ON s.id=d.sender_id
   WHERE (d.sender_id=? AND d.recipient_id=?) OR (d.sender_id=? AND d.recipient_id=?)
   ORDER BY d.id DESC LIMIT 100`).bind(user.id,peerId,peerId,user.id).all();
  messages=(rows.results||[]).reverse();
 }
 const unread=await env.DB.prepare("SELECT COUNT(*) AS total FROM direct_messages WHERE recipient_id=? AND read_at IS NULL").bind(user.id).first();
 return json({users:users.results||[],search_results:searchResults,messages,unread_count:Number(unread?.total||0),current_user_id:user.id,current_user:currentUser});
}
export async function onRequestPost(context){
 const {request,env}=context;
 const user=await getChatUser(request,env);if(!user)return json({error:"Log in to send direct messages."},401);
 await ensureTables(env);
 const body=await request.json().catch(()=>({})),action=String(body.action||""),peerId=Number(body.peer_id);
 if(action==="pin"||action==="unpin"){
  if(!Number.isSafeInteger(peerId)||peerId<1||peerId===user.id)return json({error:"Choose a valid user to pin."},400);
  const peer=await env.DB.prepare("SELECT id FROM chat_users WHERE id=? AND terminated_at IS NULL").bind(peerId).first();if(!peer)return json({error:"That user no longer exists."},404);
  if(action==="pin")await env.DB.prepare("INSERT OR IGNORE INTO direct_message_pins(user_id,peer_id) VALUES(?,?)").bind(user.id,peerId).run();
  else await env.DB.prepare("DELETE FROM direct_message_pins WHERE user_id=? AND peer_id=?").bind(user.id,peerId).run();
  return json({ok:true,action,peer_id:peerId});
 }
 const recipientId=Number(body.recipient_id),message=typeof body.message==="string"?body.message.trim():"";
 if(!Number.isSafeInteger(recipientId)||recipientId<1||recipientId===user.id)return json({error:"Choose a valid recipient."},400);
 if(!message||message.length>500)return json({error:"Message must be between 1 and 500 characters."},400);
 const recipient=await env.DB.prepare("SELECT id FROM chat_users WHERE id=? AND terminated_at IS NULL").bind(recipientId).first();if(!recipient)return json({error:"That user no longer exists."},404);
 const recent=await env.DB.prepare("SELECT COUNT(*) AS total FROM direct_messages WHERE sender_id=? AND created_at>=datetime('now','-10 seconds')").bind(user.id).first();
 if((recent?.total||0)>=5)return json({error:"Slow down a moment before sending another message."},429);
 const result=await env.DB.prepare("INSERT INTO direct_messages(sender_id,recipient_id,message) VALUES(?,?,?)").bind(user.id,recipientId,message).run();
 const push=sendChatPush(env,[recipientId],{title:"New message from "+user.username,body:message.slice(0,140),url:"/?open-chat=dm",tag:"direct-message-"+user.id});
 if(typeof context.waitUntil==="function")context.waitUntil(push);else await push;
 return json({ok:true,id:result.meta.last_row_id},201);
}
