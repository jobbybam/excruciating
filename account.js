"use strict";
const $=selector=>document.querySelector(selector);
const params=new URLSearchParams(location.search);
function safeNext(value){
 if(!value||!value.startsWith("/")||value.startsWith("//"))return "";
 try{const url=new URL(value,location.origin);if(url.origin!==location.origin||/^\/account(?:\/|$)/.test(url.pathname))return "";return url.pathname+url.search+url.hash;}catch{return "";}
}
function parseUtcDate(value){
 if(typeof value!=="string")return new Date(value);
 const normalized=value.includes("T")?value:value.replace(" ","T")+"Z";
 return new Date(normalized);
}
const nextPath=safeNext(params.get("next"));
let registerMode=false;
if(nextPath){
 const back=$("#account-back-link");
 back.href=nextPath;
 back.textContent=nextPath.startsWith("/games/")?"Back to game":"Back to chat";
}
async function api(url,options={}){
 const response=await fetch(url,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});
 const data=await response.json().catch(()=>({}));
 if(!response.ok){const error=new Error(data.error||"Request failed ("+response.status+")");error.status=response.status;error.data=data;throw error;}
 return data;
}
function setAuthMode(){
 $("#account-auth-heading").textContent=registerMode?"Create an account":"Welcome back";
 $("#account-auth-submit").textContent=registerMode?"Create account":"Log in";
 $("#account-auth-switch").textContent=registerMode?"Already have an account? Log in":"Need an account? Register";
 $("#account-auth-password").autocomplete=registerMode?"new-password":"current-password";
 $("#account-auth-status").textContent="";
}
function showLogin(message=""){
 $("#account-auth-section").hidden=false;
 $("#account-manager").hidden=true;
 $("#account-auth-status").textContent=message;
}
function renderAccount(data){
 const auth=$("#account-auth-section"),manager=$("#account-manager"),username=data.username;
 auth.hidden=true;
 manager.hidden=false;
 $("#account-welcome").textContent="Signed in as "+username+".";
 const input=$("#account-new-username"),button=$("#username-change-submit"),help=$("#username-change-help");
 input.value=username;
 const next=data.next_username_change_at?parseUtcDate(data.next_username_change_at):null;
 const waiting=Boolean(next&&Number.isFinite(next.getTime())&&next.getTime()>Date.now());
 input.disabled=waiting;
 button.disabled=waiting;
 help.textContent=waiting?"You can change it again "+next.toLocaleString([], {dateStyle:"medium",timeStyle:"short"})+".":"Usernames can use 3–20 letters, numbers, or underscores. Your first change is available now.";
}
async function loadAccount(){
 let auth;
 try{
  auth=await api("/api/chat/auth");
 }catch(error){showLogin(error.message);return;}
 if(!auth.user){showLogin();return;}
 try{
  const data=await api("/api/chat/account");
  renderAccount(data);
 }catch(error){
  $("#account-manager").hidden=false;
  $("#account-auth-section").hidden=true;
  $("#username-change-status").textContent=error.message;
 }
}
$("#account-auth-form").addEventListener("submit",async event=>{
 event.preventDefault();
 const username=$("#account-auth-username").value.trim(),password=$("#account-auth-password").value;
 const status=$("#account-auth-status");
 status.textContent="";
 try{
  await api("/api/chat/auth",{method:"POST",body:JSON.stringify({action:registerMode?"register":"login",username,password})});
  $("#account-auth-password").value="";
  if(nextPath){location.assign(nextPath);return;}
  await loadAccount();
 }catch(error){
  status.textContent=error.message;
  if(error.status===429){
   const current=await api("/api/chat/account").catch(()=>null);
   if(current){renderAccount(current);status.textContent=error.message;}
  }
 }
});
$("#account-auth-switch").addEventListener("click",()=>{registerMode=!registerMode;setAuthMode();});
$("#username-change-form").addEventListener("submit",async event=>{
 event.preventDefault();
 const input=$("#account-new-username"),status=$("#username-change-status");
 status.textContent="";
 try{
  const data=await api("/api/chat/account",{method:"PATCH",body:JSON.stringify({username:input.value.trim()})});
  status.textContent=data.changed?"Username updated.":"That is already your username.";
  const refreshed=await api("/api/chat/account");
  renderAccount(refreshed);
  $("#username-change-status").textContent=data.changed?"Username updated.":"That is already your username.";
 }catch(error){status.textContent=error.message;}
});
$("#account-logout").addEventListener("click",async()=>{
 const status=$("#account-logout-status");
 try{await api("/api/chat/auth",{method:"DELETE"});showLogin("You have been logged out.");}
 catch(error){status.textContent=error.message;}
});
setAuthMode();
loadAccount();

