import {json} from "../../_lib/auth.js";
export async function onRequestPost(){return json({error:"Admin access now uses your chat account. Use the one-time setup flow instead."},410);}
