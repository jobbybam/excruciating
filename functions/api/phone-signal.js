const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"content-type"};
let schemaReady;
function ensure(env){
 if(!schemaReady){
  schemaReady=(async()=>{
   await env.DB.prepare("CREATE TABLE IF NOT EXISTS phone_signals (id INTEGER PRIMARY KEY AUTOINCREMENT, room TEXT NOT NULL, sender TEXT NOT NULL, recipient TEXT NOT NULL, payload TEXT NOT NULL, created_at INTEGER NOT NULL DEFAULT (unixepoch()))").run();
   await env.DB.prepare("CREATE INDEX IF NOT EXISTS phone_signals_room_recipient ON phone_signals(room,recipient,id)").run();
  })().catch(error=>{schemaReady=null;throw error;});
 }
 return schemaReady;
}
export async function onRequestOptions(){return new Response(null,{status:204,headers});}
export async function onRequestGet({request,env}){await ensure(env);const u=new URL(request.url),room=(u.searchParams.get("room")||"").toUpperCase(),player=u.searchParams.get("player")||"";if(!/^[A-Z0-9]{6}$/.test(room)||!player)return Response.json({error:"Invalid room or player"},{status:400,headers});const rows=await env.DB.prepare("SELECT id,sender AS \"from\",payload FROM phone_signals WHERE room=? AND recipient=? AND created_at>unixepoch()-3600 ORDER BY id LIMIT 100").bind(room,player).all();if(rows.results?.length){const max=rows.results[rows.results.length-1].id;await env.DB.prepare("DELETE FROM phone_signals WHERE room=? AND recipient=? AND id<=?").bind(room,player,max).run()}return Response.json({messages:(rows.results||[]).map(x=>({from:x.from,payload:JSON.parse(x.payload)}))},{headers});}
export async function onRequestPost({request,env}){await ensure(env);let body;try{body=await request.json()}catch{return Response.json({error:"Invalid JSON"},{status:400,headers})}const room=String(body.room||"").toUpperCase(),from=String(body.from||""),to=String(body.to||""),payload=body.payload;if(!/^[A-Z0-9]{6}$/.test(room)||!from||from.length>80||!to||to.length>80||!payload||JSON.stringify(payload).length>50000)return Response.json({error:"Invalid signal"},{status:400,headers});await env.DB.prepare("INSERT INTO phone_signals(room,sender,recipient,payload) VALUES(?,?,?,?)").bind(room,from,to,JSON.stringify(payload)).run();return Response.json({ok:true},{headers});}