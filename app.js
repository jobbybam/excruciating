const state={games:[],category:"All",query:"",chatId:0,chatBusy:false};
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
  try{const data=await api("/api/games");state.games=Array.isArray(data.games)?data.games:[];}
  catch(error){console.error(error);state.games=[];}
  render();
}
function render(){
  const q=state.query.trim().toLowerCase();
  const visible=state.games.filter(game=>(state.category==="All"||game.category===state.category)&&(!q||game.title.toLowerCase().includes(q)));
  grid.replaceChildren();count.textContent=visible.length+" "+(visible.length===1?"game":"games");empty.hidden=visible.length!==0;
  for(const game of visible){
    const button=document.createElement("button");button.className="game-card";button.type="button";button.addEventListener("click",()=>openGame(game));
    const thumb=document.createElement("span");thumb.className="game-thumb";
    if(game.thumbnail){const img=document.createElement("img");img.src=game.thumbnail;img.alt="";img.loading="lazy";thumb.append(img);}
    else{const fallback=document.createElement("span");fallback.className="game-placeholder";fallback.textContent=(game.title||"?").slice(0,1).toUpperCase();thumb.append(fallback);}
    const title=document.createElement("span");title.className="game-name";title.textContent=game.title;
    const category=document.createElement("span");category.className="game-category";category.textContent=game.category||"";
    button.append(thumb,title,category);grid.append(button);
  }
}
function openGame(game){
  if(!game||!game.slug)return;
  home.hidden=true;player.hidden=false;$("#search-wrap").hidden=true;$("#chat-toggle").hidden=true;playerTitle.textContent=game.title;
  placeholder.hidden=true;frame.hidden=false;frame.src="/games/"+encodeURIComponent(game.slug)+"/index.html";
  history.pushState({game:game.slug},"","#play/"+encodeURIComponent(game.slug));
}
function closeGame(){
  frame.src="about:blank";frame.hidden=true;placeholder.hidden=false;player.hidden=true;
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
$("#fullscreen-button").addEventListener("click",()=>{if(frame.requestFullscreen)frame.requestFullscreen();});
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
    const box=$("#chat-messages");const nearBottom=box.scrollHeight-box.scrollTop-box.clientHeight<48;
    const data=await api("/api/chat?after="+(reset?0:state.chatId));
    if(reset){$("#chat-messages").replaceChildren();state.chatId=0;}
    for(const message of data.messages||[]){appendChatMessage(message);state.chatId=Math.max(state.chatId,message.id);}
    if(!$("#chat-messages").children.length){const p=document.createElement("p");p.className="chat-muted";p.textContent="No messages yet. Start the conversation.";$("#chat-messages").append(p);}
    if(reset||nearBottom)$("#chat-messages").scrollTop=$("#chat-messages").scrollHeight;
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
$("#game-files").addEventListener("change",()=>{$("#file-count").textContent=$("#game-files").files.length+" files selected";});
async function refreshAdmin(){
  const data=await api("/api/admin/games");const list=$("#admin-games");list.replaceChildren();$("#admin-game-count").textContent=data.games.length+" games";
  for(const game of data.games){
    const row=document.createElement("div");row.className="admin-list-row";
    const info=document.createElement("div");const name=document.createElement("strong");name.textContent=game.title;const sub=document.createElement("small");sub.textContent=game.category+" · "+game.slug+" · "+(game.license||"Licence missing");info.append(name,sub);
    const del=document.createElement("button");del.className="text-button danger";del.textContent="Remove";del.addEventListener("click",async()=>{if(!confirm("Remove "+game.title+" and its uploaded files?"))return;try{await api("/api/admin/games?slug="+encodeURIComponent(game.slug),{method:"DELETE"});await refreshAdmin();await loadGames();}catch(e){alert(e.message);}});
    row.append(info,del);list.append(row);
  }
  const chatData=await api("/api/admin/chat");const chatList=$("#admin-chat");chatList.replaceChildren();
  for(const message of chatData.messages){appendChatMessage(message,chatList,true);}
  if(!chatData.messages.length){const p=document.createElement("p");p.className="chat-muted";p.textContent="No chat messages.";chatList.append(p);}
}
async function loadSeedQueue(){
  try{const response=await fetch("/catalog/import-queue.json",{cache:"no-store"});if(!response.ok)return;const data=await response.json();const select=$("#seed-game");for(const game of data.games||[]){const option=document.createElement("option");option.value=game.slug;option.textContent=game.title+" · "+game.category;option.dataset.game=JSON.stringify(game);select.append(option);}}catch(error){console.warn("Seed list unavailable",error);}
}
$("#seed-game").addEventListener("change",()=>{const option=$("#seed-game").selectedOptions[0];if(!option||!option.dataset.game)return;const game=JSON.parse(option.dataset.game);$("#game-title").value=game.title;$("#game-slug").value=game.slug;$("#game-slug").dataset.edited="1";$("#game-category").value=game.category;$("#game-source").value=game.source_url;$("#game-license").value=game.license;$("#game-attribution").value=game.attribution;});
async function showAdmin(){
  home.hidden=true;$("#search-wrap").hidden=true;$("#chat-toggle").hidden=true;$("#admin-view").hidden=false;
  try{const me=await api("/api/admin/me");if(me.authenticated){$("#admin-content").hidden=false;$("#admin-login").hidden=true;$("#admin-logout").hidden=false;await loadSeedQueue();await refreshAdmin();}else{$("#admin-login").hidden=false;}}
  catch(error){$("#admin-login").hidden=false;$("#login-error").textContent=error.message;}
}
$("#login-form").addEventListener("submit",async e=>{
  e.preventDefault();$("#login-error").textContent="";
  try{await api("/api/admin/login",{method:"POST",body:JSON.stringify({password:$("#admin-password").value})});$("#admin-password").value="";$("#admin-login").hidden=true;$("#admin-content").hidden=false;$("#admin-logout").hidden=false;await loadSeedQueue();await refreshAdmin();}
  catch(error){$("#login-error").textContent=error.message;}
});
$("#admin-logout").addEventListener("click",async()=>{await api("/api/admin/logout",{method:"POST"});$("#admin-content").hidden=true;$("#admin-logout").hidden=true;$("#admin-login").hidden=false;});
$("#game-form").addEventListener("submit",async e=>{
  e.preventDefault();const status=$("#upload-status");status.textContent="Checking files…";
  const title=$("#game-title").value.trim(),slug=$("#game-slug").value.trim().toLowerCase(),category=$("#game-category").value;
  const files=Array.from($("#game-files").files);
  if(!files.length){status.textContent="Choose the game folder first.";return;}
  const relative=files.map(file=>file.webkitRelativePath.split("/").slice(1).join("/")).filter(Boolean);
  if(!relative.includes("index.html")){status.textContent="The selected folder must contain index.html at its root.";return;}
  if(files.some(file=>file.size>20*1024*1024)){status.textContent="One or more files exceed the 20 MB per-file limit.";return;}
  try{
    for(let i=0;i<files.length;i++){
      const path=relative[i];if(!path)continue;
      status.textContent="Uploading "+(i+1)+" of "+files.length+": "+path;
      const response=await fetch("/api/admin/upload?slug="+encodeURIComponent(slug)+"&path="+encodeURIComponent(path),{method:"POST",body:files[i]});
      const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"Upload failed for "+path);
    }
    let thumbnail=$("#game-thumbnail").value.trim();
    if(thumbnail&&!thumbnail.startsWith("http://")&&!thumbnail.startsWith("https://"))thumbnail="/games/"+slug+"/"+thumbnail.replace(/^\/+/, "");
    await api("/api/admin/games",{method:"POST",body:JSON.stringify({title,slug,category,thumbnail,description:$("#game-description").value.trim(),source_url:$("#game-source").value.trim(),license:$("#game-license").value.trim(),attribution:$("#game-attribution").value.trim()})});
    status.textContent="Game uploaded and published.";$("#game-form").reset();$("#game-slug").dataset.edited="";$("#file-count").textContent="No folder selected";await refreshAdmin();await loadGames();
  }catch(error){status.textContent=error.message;}
});
if(isAdminRoute)showAdmin();else loadGames();
