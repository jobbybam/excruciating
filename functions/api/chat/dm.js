import {json} from "../../_lib/auth.js";
import {getChatUser} from "../../_lib/chat-session.js";
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
}
export async function onRequestGet({request,env}){
 const user=await getChatUser(request,env);if(!user)return json({error:"Log in to use direct messages."},401);
 await ensureTables(env);
 const url=new URL(request.url),peerId=Number(url.searchParams.get("with")||0);
 const users=await env.DB.prepare(`SELECT u.id,u.username,
  (SELECT COUNT(*) FROM direct_messages d WHERE d.sender_id=u.id AND d.recipient_id=? AND d.read_at IS NULL) AS unread_count,
  (SELECT message FROM direct_messages d WHERE (d.sender_id=u.id AND d.recipient_id=?) OR (d.sender_id=? AND d.recipient_id=u.id) ORDER BY d.id DESC LIMIT 1) AS last_message,
  (SELECT created_at FROM direct_messages d WHERE (d.sender_id=u.id AND d.recipient_id=?) OR (d.sender_id=? AND d.recipient_id=u.id) ORDER BY d.id DESC LIMIT 1) AS last_message_at
  FROM chat_users u WHERE u.id<>? ORDER BY COALESCE(last_message_at,'') DESC,u.username COLLATE NOCASE`).bind(user.id,user.id,user.id,user.id,user.id,user.id).all();
 let messages=[];
 if(Number.isSafeInteger(peerId)&&peerId>0){
  const peer=await env.DB.prepare("SELECT id FROM chat_users WHERE id=?").bind(peerId).first();
  if(!peer)return json({error:"That user no longer exists."},404);
  await env.DB.prepare("UPDATE direct_messages SET read_at=datetime('now') WHERE sender_id=? AND recipient_id=? AND read_at IS NULL").bind(peerId,user.id).run();
  const rows=await env.DB.prepare(`SELECT d.id,d.sender_id,d.recipient_id,d.message,d.created_at,d.read_at,s.username AS sender_username
   FROM direct_messages d JOIN chat_users s ON s.id=d.sender_id
   WHERE (d.sender_id=? AND d.recipient_id=?) OR (d.sender_id=? AND d.recipient_id=?)
   ORDER BY d.id DESC LIMIT 100`).bind(user.id,peerId,peerId,user.id).all();
  messages=(rows.results||[]).reverse();
 }
 const unread=await env.DB.prepare("SELECT COUNT(*) AS total FROM direct_messages WHERE recipient_id=? AND read_at IS NULL").bind(user.id).first();
 return json({users:users.results||[],messages,unread_count:Number(unread?.total||0),current_user_id:user.id});
}
export async function onRequestPost({request,env}){
 const user=await getChatUser(request,env);if(!user)return json({error:"Log in to send direct messages."},401);
 await ensureTables(env);
 const body=await request.json().catch(()=>({})),recipientId=Number(body.recipient_id),message=typeof body.message==="string"?body.message.trim():"";
 if(!Number.isSafeInteger(recipientId)||recipientId<1||recipientId===user.id)return json({error:"Choose a valid recipient."},400);
 if(!message||message.length>500)return json({error:"Message must be between 1 and 500 characters."},400);
 const recipient=await env.DB.prepare("SELECT id FROM chat_users WHERE id=?").bind(recipientId).first();if(!recipient)return json({error:"That user no longer exists."},404);
 const recent=await env.DB.prepare("SELECT COUNT(*) AS total FROM direct_messages WHERE sender_id=? AND created_at>=datetime('now','-10 seconds')").bind(user.id).first();
 if((recent?.total||0)>=5)return json({error:"Slow down a moment before sending another message."},429);
 const result=await env.DB.prepare("INSERT INTO direct_messages(sender_id,recipient_id,message) VALUES(?,?,?)").bind(user.id,recipientId,message).run();
 return json({ok:true,id:result.meta.last_row_id},201);
}
