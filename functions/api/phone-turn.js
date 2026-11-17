const json=(data,status=200)=>Response.json(data,{status,headers:{"cache-control":"no-store","content-type":"application/json; charset=utf-8"}});
const encoder=new TextEncoder();
function base64(bytes){let binary="";for(const byte of new Uint8Array(bytes))binary+=String.fromCharCode(byte);return btoa(binary);}
export async function onRequestGet({env}){
 const urls=String(env.TURN_URLS||"").split(",").map(value=>value.trim()).filter(Boolean).slice(0,8);
 const secret=String(env.TURN_SHARED_SECRET||"");
 if(!urls.length||!secret)return json({iceServers:[]});
 const expiry=Math.floor(Date.now()/1000)+600;
 const username=expiry+":"+crypto.randomUUID();
 const key=await crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-1"},false,["sign"]);
 const signature=await crypto.subtle.sign("HMAC",key,encoder.encode(username));
 const credential=base64(signature);
 return json({iceServers:[{urls,username,credential,credentialType:"password"}]});
}
