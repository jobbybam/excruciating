import {json} from "../../_lib/auth.js";
import {clearChatCookie} from "../../_lib/chat-session.js";
export async function onRequestPost(){return json({ok:true},200,{"Set-Cookie":clearChatCookie()});}
