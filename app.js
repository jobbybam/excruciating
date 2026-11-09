const state={games:[],category:"All",query:"",chatBusy:false};
const $=selector=>document.querySelector(selector);
const grid=$("#game-grid"),empty=$("#empty-state"),count=$("#game-count"),home=$("#home-view"),player=$("#player"),frame=$("#game-frame"),playerTitle=$("#player-title"),placeholder=$("#player-placeholder");
const chat=$("#chat-panel");
const isAdminRoute=location.pathname.replace(/\/$/,"")==="/admin";

async function api(url,options={}){
  const response=await fetch(url,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||"Request failed ("+response.status+")");
  return data;
}
async function loadGames(){
  let catalogue=[];
  try{
    const response=await fetch("/catalog/games.json",{cache:"no-store"});
    if(!response.ok)throw new Error("Static catalogue returned "+response.status);
    const data=await response.json();
    catalogue=Array.isArray(data.games)?data.games.filter(game=>game.published!==false):[];
  }catch(error){
    console.error("Static repository game catalogue unavailable.",error);
  }
  try{
    const data=await api("/api/games");
    const known=new Set(catalogue.map(game=>game.slug));
    const custom=(Array.isArray(data.games)?data.games:[]).filter(game=>!known.has(game.slug)&&!/(3kh0|mashukui\/web-games)/i.test(String(game.source_url||"")));
    state.games=[...catalogue,...custom];
  }catch(error){
    console.error("D1 game catalogue unavailable; using the static catalogue.",error);
    state.games=catalogue;
  }
  render();
}
function render(){
  const q=state.query.trim().toLowerCase();
  const visible=state.games.filter(game=>(state.category==="All"||game.category===state.category)&&(!q||game.title.toLowerCase().includes(q)));
  grid.replaceChildren();count.textContent=visible.length+" "+(visible.length===1?"game":"games");empty.hidden=visible.length!==0;
  for(const game of visible){
    const button=document.createElement("button");button.className="game-card";button.type="button";button.addEventListener("click",()=>openGame(game));
    const thumb=document.createElement("span");thumb.className="game-thumb";
    if(game.thumbnail){const img=document.createElement("img");img.src=game.thumbnail;img.alt="";img.loading="lazy";img.onerror=()=>{const fallback=document.createElement("span");fallback.className="game-placeholder";fallback.textContent=(game.title||"?").slice(0,1).toUpperCase();thumb.replaceChildren(fallback);};thumb.append(img);}
    else{const fallback=document.createElement("span");fallback.className="game-placeholder";fallback.textContent=(game.title||"?").slice(0,1).toUpperCase();thumb.append(fallback);}
    const title=document.createElement("span");title.className="game-name";title.textContent=game.title;
    const category=document.createElement("span");category.className="game-category";category.textContent=(game.category||"")+(game.external?" · "+(game.external_label||"External"):"");
    button.append(thumb,title,category);grid.append(button);
  }
}
function openGame(game){
  if(!game||!game.slug)return;
  if(game.external&&game.url){window.open(game.url,"_blank","noopener,noreferrer");return;}
  home.hidden=true;player.hidden=false;$("#search-wrap").hidden=true;$("#chat-toggle").hidden=true;playerTitle.textContent=game.title;
  placeholder.hidden=true;frame.hidden=false;frame.dataset.gameUrl=game.url||game.launch_url||("/games/"+encodeURIComponent(game.slug)+"/index.html");frame.src=frame.dataset.gameUrl;
  history.pushState({game:game.slug},"","#play/"+encodeURIComponent(game.slug));
}
function closeGame(){
  frame.src="about:blank";frame.dataset.gameUrl="";frame.hidden=true;placeholder.hidden=false;player.hidden=true;
  $("#search-wrap").hidden=isAdminRoute;$("#chat-toggle").hidden=isAdminRoute;home.hidden=isAdminRoute;
  if(location.hash.startsWith("#play/"))history.pushState({},"",location.pathname+location.search);
}
$("#search").addEventListener("input",e=>{state.query=e.target.value;render();});
$("#categories").addEventListener("click",e=>{
  const button=e.target.closest("[data-category]");if(!button)return;
  state.category=button.dataset.category;document.querySelectorAll(".category").forEach(item=>item.classList.toggle("active",item===button));render();
});
$("#back-button").addEventListener("click",closeGame);
$("#reload-button").addEventListener("click",()=>{if(frame.src)frame.src=frame.src;});
$("#open-game-button").addEventListener("click",()=>{const url=frame.dataset.gameUrl||frame.src;if(url&&url!=="about:blank")window.open(url,"_blank","noopener,noreferrer");});
window.addEventListener("keydown",e=>{if(e.key==="/"&&document.activeElement.tagName!=="INPUT"&&document.activeElement.tagName!=="TEXTAREA"){e.preventDefault();$("#search").focus();}if(e.key==="Escape"&&!player.hidden)closeGame();});
window.addEventListener("popstate",()=>{if(!location.hash.startsWith("#play/")&&!player.hidden)closeGame();});

function chatUsername(){return localStorage.getItem("excruciating-chat-name")||"";}
$("#chat-username").value=chatUsername();
$("#chat-username").addEventListener("change",()=>localStorage.setItem("excruciating-chat-name",$("#chat-username").value.trim()));
$("#chat-toggle").addEventListener("click",()=>{chat.hidden=!chat.hidden;if(!chat.hidden)pollChat(true);});
$("#chat-close").addEventListener("click",()=>chat.hidden=true);
function appendChatMessage(message,target=$("#chat-messages"),moderate=false){
  const row=document.createElement("div");row.className="chat-message";
  const meta=document.createElement("div");meta.className="chat-message-meta";
  const user=document.createElement("strong");user.textContent=message.username;
  const time=document.createElement("time");time.textContent=new Date(message.created_at+"Z").toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
  meta.append(user,time);row.append(meta);
  const body=document.createElement("p");body.textContent=message.message;row.append(body);
  if(moderate){const del=document.createElement("button");del.className="text-button danger";del.textContent="Delete";del.addEventListener("click",async()=>{try{await api("/api/admin/chat?id="+message.id,{method:"DELETE"});row.remove();}catch(e){alert(e.message);}});row.append(del);}
  target.append(row);
}
async function pollChat(reset=false){
  if(state.chatBusy||chat.hidden)return;state.chatBusy=true;
  try{
    const box=$("#chat-messages"),nearBottom=box.scrollHeight-box.scrollTop-box.clientHeight<48,previousTop=box.scrollTop;
    const data=await api("/api/chat");box.replaceChildren();
    for(const message of data.messages||[])appendChatMessage(message);
    if(!box.children.length){const p=document.createElement("p");p.className="chat-muted";p.textContent="No messages yet. Start the conversation.";box.append(p);}
    box.scrollTop=reset||nearBottom?box.scrollHeight:previousTop;
  }catch(error){$("#chat-status").textContent=error.message;}
  finally{state.chatBusy=false;}
}
$("#chat-form").addEventListener("submit",async e=>{
  e.preventDefault();const username=$("#chat-username").value.trim(),message=$("#chat-message").value.trim();
  try{await api("/api/chat",{method:"POST",body:JSON.stringify({username,message})});localStorage.setItem("excruciating-chat-name",username);$("#chat-message").value="";$("#chat-status").textContent="";await pollChat(true);}
  catch(error){$("#chat-status").textContent=error.message;}
});
setInterval(()=>pollChat(false),4000);

function slugify(value){return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}
$("#game-title").addEventListener("input",()=>{if(!$("#game-slug").dataset.edited)$("#game-slug").value=slugify($("#game-title").value);});
$("#game-slug").addEventListener("input",()=>$("#game-slug").dataset.edited="1");
async function refreshAdmin(){
  const data=await api("/api/admin/games");const list=$("#admin-games");list.replaceChildren();$("#admin-game-count").textContent=data.games.length+" games";
  for(const game of data.games){
    const row=document.createElement("div");row.className="admin-list-row";
    const info=document.createElement("div");const name=document.createElement("strong");name.textContent=game.title;const sub=document.createElement("small");sub.textContent=game.category+" · "+game.slug+" · "+(game.license||"Licence missing");info.append(name,sub);
    const del=document.createElement("button");del.className="text-button danger";del.textContent="Remove";del.addEventListener("click",async()=>{if(!confirm("Remove "+game.title+" from the catalogue? The files remain in GitHub until deleted there."))return;try{await api("/api/admin/games?slug="+encodeURIComponent(game.slug),{method:"DELETE"});await refreshAdmin();await loadGames();}catch(e){alert(e.message);}});
    row.append(info,del);list.append(row);
  }
  const chatData=await api("/api/admin/chat");const chatList=$("#admin-chat");chatList.replaceChildren();
  for(const message of chatData.messages)appendChatMessage(message,chatList,true);
  if(!chatData.messages.length){const p=document.createElement("p");p.className="chat-muted";p.textContent="No chat messages.";chatList.append(p);}
}
async function showAdmin(){
  home.hidden=true;$("#search-wrap").hidden=true;$("#chat-toggle").hidden=true;$("#admin-view").hidden=false;
  try{const me=await api("/api/admin/me");if(me.authenticated){$("#admin-content").hidden=false;$("#admin-login").hidden=true;$("#admin-logout").hidden=false;await refreshAdmin();}else{$("#admin-login").hidden=false;}}
  catch(error){$("#admin-login").hidden=false;$("#login-error").textContent=error.message;}
}
$("#login-form").addEventListener("submit",async e=>{
  e.preventDefault();$("#login-error").textContent="";
  try{await api("/api/admin/login",{method:"POST",body:JSON.stringify({password:$("#admin-password").value})});$("#admin-password").value="";$("#admin-login").hidden=true;$("#admin-content").hidden=false;$("#admin-logout").hidden=false;await refreshAdmin();}
  catch(error){$("#login-error").textContent=error.message;}
});
$("#admin-logout").addEventListener("click",async()=>{await api("/api/admin/logout",{method:"POST"});$("#admin-content").hidden=true;$("#admin-logout").hidden=true;$("#admin-login").hidden=false;});
$("#game-form").addEventListener("submit",async e=>{
  e.preventDefault();const status=$("#upload-status");
  const title=$("#game-title").value.trim(),slug=$("#game-slug").value.trim().toLowerCase(),category=$("#game-category").value;
  const sourceUrl=$("#game-source").value.trim(),license=$("#game-license").value.trim();
  const gamePath="/games/"+slug+"/index.html";
  status.textContent="Checking the game files…";
  try{
    const check=await fetch(gamePath,{method:"HEAD",cache:"no-store"});
    if(!check.ok)throw new Error("The game files are not deployed yet. Add the game folder to GitHub at games/"+slug+"/ and wait for the Pages deployment before publishing it here.");
    let thumbnail=$("#game-thumbnail").value.trim();
    if(thumbnail&&!/^https?:\/\//i.test(thumbnail))thumbnail="/games/"+slug+"/"+thumbnail.replace(/^\/+/, "");
    await api("/api/admin/games",{method:"POST",body:JSON.stringify({title,slug,category,thumbnail,description:$("#game-description").value.trim(),source_url:sourceUrl,license,attribution:$("#game-attribution").value.trim()})});
    status.textContent="Game added to the catalogue.";
    $("#game-form").reset();$("#game-slug").dataset.edited="";await refreshAdmin();await loadGames();
  }catch(error){status.textContent=error.message;}
});
if(isAdminRoute)showAdmin();else loadGames();
