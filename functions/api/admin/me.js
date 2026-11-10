import {isAdmin,json} from "../../_lib/auth.js";
import {getChatUser} from "../../_lib/chat-session.js";
export async function onRequestGet({request,env}){const user=await getChatUser(request,env);return json({authenticated:Boolean(user&&Number(user.is_admin)===1),user:user?{username:user.username,isAdmin:Number(user.is_admin)===1}:null});}
