const state={games:[],query:"",chatBusy:false,chatUser:null,chatRegister:false,unread:0,lastSeen:Number(localStorage.getItem("excruciating-chat-seen")||0),chatInitialized:false,lastNotified:Number(localStorage.getItem("excruciating-chat-notified")||0),chatMode:"public",dmUser:null,dmSearch:"",dmUnread:0,dmBusy:false,chatActivityUntil:0,lastDmMessageId:null};
let editingSlug=null;
let editingChangelogId=null;
const $=selector=>document.querySelector(selector);
const grid=$("#game-grid"),empty=$("#empty-state"),count=$("#game-count"),home=$("#home-view"),player=$("#player"),frame=$("#game-frame"),playerTitle=$("#player-title"),placeholder=$("#player-placeholder"),chat=$("#chat-panel");
const isAdminRoute=location.pathname.replace(/\/$/,"")==="/admin";
const isChatEmbed=new URLSearchParams(location.search).get("chat")==="embedded";
const openChatMode=new URLSearchParams(location.search).get("open-chat");
if(isChatEmbed)document.body.classList.add("chat-embed");
const RECENT_KEY="excruciating-recent-games";
const retiredGameSlugs=new Set(["angry-birds","happywheels","yohoho"]);
function readRecent(){try{return JSON.parse(localStorage.getItem(RECENT_KEY)||"[]").filter(x=>typeof x==="string").slice(0,5);}catch{return [];}}
function writeRecent(slug){const recent=[slug,...readRecent().filter(x=>x!==slug)].slice(0,5);localStorage.setItem(RECENT_KEY,JSON.stringify(recent));renderRecent();}
async function api(url,options={}){const response=await fetch(url,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"Request failed ("+response.status+")");return data;}
async function loadGames(){let catalogue=[];try{const response=await fetch("/catalog/games.json",{cache:"no-store"});if(!response.ok)throw new Error("Static catalogue returned "+response.status);const data=await response.json();catalogue=Array.isArray(data.games)?data.games:[];}catch(error){console.error("Static repository game catalogue unavailable.",error);}try{const data=await api("/api/games");const records=Array.isArray(data.games)?data.games:[];const bySlug=new Map(records.map(game=>[game.slug,game]));const featuredPositions=new Map((data.featured_slugs||[]).map((slug,index)=>[slug,index]));const merged=catalogue.map(game=>{const override=bySlug.get(game.slug);if(override&&(Number(override.published)===0||override.published===false))return null;const mergedGame={...game,...(override||{})};if(game.url?.startsWith("/games/")){mergedGame.url=game.url;mergedGame.external=false;}if(!mergedGame.thumbnail)mergedGame.thumbnail=game.thumbnail||"";if(!mergedGame.icon)mergedGame.icon=game.icon||"";return {...mergedGame,published:true,featured:featuredPositions.has(game.slug),featured_position:featuredPositions.get(game.slug)??null};}).filter(Boolean);const known=new Set(catalogue.map(game=>game.slug));const custom=records.filter(game=>!known.has(game.slug)&&!retiredGameSlugs.has(game.slug)&&Number(game.published)!==0&&!/mashukui\/web-games/i.test(String(game.source_url||"")));state.games=[...merged,...custom];}catch(error){console.error("D1 game catalogue unavailable; using the static catalogue.",error);state.games=catalogue.filter(game=>game.published!==false);}render();}
async function loadSiteBanner(){try{const response=await fetch("/api/banner",{cache:"no-store"});if(!response.ok)return;const banner=await response.json();if(banner.enabled&&String(banner.message||"").trim()){$("#site-banner-message").textContent=banner.message;$("#site-banner").hidden=false;}else $("#site-banner").hidden=true;}catch{}}
loadSiteBanner();
function gameCard(game){const button=document.createElement("button");button.className="game-card";button.type="button";button.addEventListener("click",()=>openGame(game));const thumb=document.createElement("span");thumb.className="game-thumb";const sources=[game.thumbnail,game.icon].filter((source,index,array)=>source&&array.indexOf(source)===index);if(sources.length){const img=document.createElement("img");img.alt="";img.loading="lazy";let sourceIndex=0;if(game.icon)img.classList.add("game-icon");const loadSource=()=>{if(sourceIndex>0)img.classList.remove("game-icon");img.src=sources[sourceIndex];};img.onerror=()=>{sourceIndex++;if(sourceIndex<sources.length){loadSource();return;}const fallback=document.createElement("span");fallback.className="game-placeholder";fallback.textContent=(game.title||"?").slice(0,1).toUpperCase();thumb.replaceChildren(fallback);};loadSource();thumb.append(img);}else{const fallback=document.createElement("span");fallback.className="game-placeholder";fallback.textContent=(game.title||"?").slice(0,1).toUpperCase();thumb.append(fallback);}const title=document.createElement("span");title.className="game-name";title.textContent=game.title;const tag=document.createElement("span");tag.className="game-category";tag.textContent=game.category||"Game";button.append(thumb,title,tag);return button;}
function renderRecent(){const section=$("#continue-section"),recent=readRecent().map(slug=>state.games.find(game=>game.slug===slug)).filter(Boolean),target=$("#continue-grid");target.replaceChildren();for(const game of recent)target.append(gameCard(game));section.hidden=recent.length===0||Boolean(state.query.trim());}
function render(){const q=state.query.trim().toLowerCase();const visible=state.games.filter(game=>!q||game.title.toLowerCase().includes(q));grid.replaceChildren();count.textContent=visible.length+" "+(visible.length===1?"game":"games");empty.hidden=visible.length!==0;for(const game of visible)grid.append(gameCard(game));renderFeatured();renderRecent();}
function renderFeatured(){const section=$("#featured-section"),target=$("#featured-grid");if(!section||!target)return;const games=state.games.filter(g=>g.featured&&g.published!==false).sort((a,b)=>Number(a.featured_position??99)-Number(b.featured_position??99));target.replaceChildren();for(const game of games)target.append(gameCard(game));section.hidden=!games.length||Boolean(state.query.trim());}
function openGame(game){if(!game||!game.slug)return;writeRecent(game.slug);const gameUrl=game.url||game.launch_url||("/games/"+encodeURIComponent(game.slug)+"/index.html");if(game.external){window.open(gameUrl,"_blank","noopener,noreferrer");return;}window.location.assign(gameUrl);}
function closeGame(){document.title="excruciating";frame.src="about:blank";frame.dataset.gameUrl="";frame.hidden=true;placeholder.hidden=false;player.hidden=true;$("#search-wrap").hidden=false;$("#chat-toggle").hidden=false;if(location.hash.startsWith("#play/"))history.pushState({},"",location.pathname+location.search);}
$("#search").addEventListener("input",e=>{state.query=e.target.value;render();});
$("#back-button").addEventListener("click",closeGame);$("#reload-button").addEventListener("click",()=>{if(frame.src)frame.src=frame.src;});$("#open-game-button").addEventListener("click",()=>{const url=frame.dataset.gameUrl||frame.src;if(url&&url!=="about:blank")window.open(url,"_blank","noopener,noreferrer");});
window.addEventListener("keydown",e=>{if(e.key==="/"&&document.activeElement.tagName!=="INPUT"&&document.activeElement.tagName!=="TEXTAREA"){e.preventDefault();$("#search").focus();}if(e.key==="Escape"&&!player.hidden)closeGame();});window.addEventListener("popstate",()=>{if(!location.hash.startsWith("#play/")&&!player.hidden)closeGame();});

function openAccountPage(next="/?open-chat=public"){if(isChatEmbed){window.parent.postMessage({type:"excruciating:open-account"},location.origin);return;}location.assign("/account/"+(next?"?next="+encodeURIComponent(next):""));}
$("#account-toggle").addEventListener("click",()=>openAccountPage(""));
$("#account-manage").addEventListener("click",()=>openAccountPage(""));
$("#chat-login-button").addEventListener("click",()=>openAccountPage("/?open-chat=public"));
$("#chat-toggle").addEventListener("click",()=>{chat.hidden=!chat.hidden;if(!chat.hidden){state.unread=0;updateUnread();markChatSeen();if(state.chatMode==="dm"&&state.chatUser)pollDms(true);else pollChat(true);}});$("#chat-close").addEventListener("click",()=>{if(isChatEmbed)window.parent.postMessage({type:"excruciating:close-game-chat"},location.origin);else chat.hidden=true;});
$("#chat-public-tab").addEventListener("click",()=>setChatMode("public"));
$("#chat-dm-tab").addEventListener("click",()=>{if(!state.chatUser){$("#chat-status").textContent="You need to be logged in to chat.";return;}setChatMode("dm");pollDms(true);});
function setChatMode(mode){if(mode==="dm"&&!state.chatUser){$("#chat-status").textContent="You need to be logged in to chat.";return;}state.chatMode=mode;$("#chat-status").textContent="";$("#chat-public-tab").classList.toggle("active",mode==="public");$("#chat-dm-tab").classList.toggle("active",mode==="dm");$("#chat-public-view").hidden=mode!=="public";$("#chat-dm-view").hidden=mode!=="dm";$("#chat-panel-title").textContent="Chat";if(mode==="public")pollChat(true);else pollDms(true);}
function updateDmUnread(count){const previous=state.dmUnread;state.dmUnread=Math.max(0,Number(count)||0);const badge=$("#dm-tab-count");badge.hidden=state.dmUnread===0;badge.textContent=state.dmUnread>99?"99+":String(state.dmUnread);document.title=state.dmUnread?state.dmUnread+" "+(state.dmUnread===1?"Message":"Messages"):"excruciating";if(isChatEmbed)window.parent.postMessage({type:"excruciating:dm-unread",count:state.dmUnread},location.origin);if(state.dmUnread>previous){noteChatActivity();if(!isChatEmbed&&chat.hidden){window.excruciatingPlayNotificationSound?.();const n=state.dmUnread-previous;showChatToast({username:"New direct message"+(n===1?"":"s"),message:"You have "+n+" unread "+(n===1?"message":"messages")+". Open chat to read it."});}}}
function makeDmUserRow(user){const row=document.createElement("div");row.className="dm-user-row";const button=document.createElement("button");button.type="button";button.className="dm-user"+(Number(user.id)===Number(state.dmUser)?" active":"");const details=document.createElement("span");details.className="dm-user-details";const name=document.createElement("strong");name.textContent=user.username;const last=document.createElement("small");last.textContent=user.last_message||"Start a conversation";details.append(name,last);button.append(details);if(Number(user.unread_count)>0){const badge=document.createElement("span");badge.className="dm-user-unread";badge.textContent=Number(user.unread_count)>99?"99+":String(user.unread_count);button.append(badge);}button.addEventListener("click",()=>{state.dmUser=Number(user.id);pollDms(true);});const pin=document.createElement("button");pin.type="button";pin.className="dm-pin"+(user.pinned?" active":"");pin.textContent=user.pinned?"★":"☆";pin.setAttribute("aria-label",user.pinned?"Unpin "+user.username:"Pin "+user.username);pin.setAttribute("aria-pressed",user.pinned?"true":"false");pin.addEventListener("click",async()=>{try{await api("/api/chat/dm",{method:"POST",body:JSON.stringify({action:user.pinned?"unpin":"pin",peer_id:Number(user.id)})});await pollDms(true);}catch(error){$("#chat-status").textContent=error.message;}});const remove=document.createElement("button");remove.type="button";remove.className="dm-delete";remove.textContent="×";remove.title="Delete chat";remove.setAttribute("aria-label","Delete chat with "+user.username);remove.addEventListener("click",async()=>{if(!window.confirm("Delete your chat with "+user.username+"? They will keep their copy."))return;try{await api("/api/chat/dm",{method:"POST",body:JSON.stringify({action:"delete",peer_id:Number(user.id)})});if(Number(state.dmUser)===Number(user.id)){state.dmUser=null;state.lastDmMessageId=null;}await pollDms(true);}catch(error){$("#chat-status").textContent=error.message;}});if(Object.prototype.hasOwnProperty.call(user,"last_message"))row.append(button,pin,remove);else row.append(button,pin);return row;}
function renderDmUsers(users,searchResults,searchQuery){const list=$("#dm-user-list"),results=$("#dm-search-results"),heading=$("#dm-search-heading");list.replaceChildren();results.replaceChildren();if(!users.length){const p=document.createElement("p");p.className="chat-muted";p.textContent="No recent chats. Search for someone to start a conversation.";list.append(p);}else for(const user of users)list.append(makeDmUserRow(user));const query=String(searchQuery||"").trim();results.hidden=query.length<2;heading.hidden=query.length<2;if(query.length<2)return;const recent=new Set(users.map(user=>String(user.id)));const matches=searchResults.filter(user=>!recent.has(String(user.id)));if(!matches.length){const p=document.createElement("p");p.className="chat-muted";p.textContent="No users found.";results.append(p);return;}for(const user of matches)results.append(makeDmUserRow(user));}
function renderDmMessages(messages){const box=$("#dm-messages");box.replaceChildren();if(!state.dmUser||!messages.length){const p=document.createElement("p");p.className="chat-muted";p.textContent=state.dmUser?"No messages yet. Say hello!":"Select a user to start a private conversation.";box.append(p);return;}for(const message of messages){const row=document.createElement("div");row.className="chat-message"+(Number(message.sender_id)===Number(state.chatUser?.id)?" dm-message-own":"");const meta=document.createElement("div");meta.className="chat-message-meta";const name=document.createElement("strong");name.textContent=message.sender_username;const time=document.createElement("time");time.textContent=new Date(message.created_at+"Z").toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});meta.append(name,time);const body=document.createElement("p");appendMessageContent(body,message.message);row.append(meta,body);box.append(row);}box.scrollTop=box.scrollHeight;}
async function pollDms(force=false){if(document.hidden||state.dmBusy||!state.chatUser)return;state.dmBusy=true;try{const params=new URLSearchParams(),activePeer=(!chat.hidden&&state.chatMode==="dm")?state.dmUser:null,search=state.dmSearch.trim();if(activePeer)params.set("with",String(activePeer));if(search.length>=2)params.set("search",search);const data=await api("/api/chat/dm"+(params.size?"?"+params.toString():""));const newestDm=(data.messages||[]).reduce((max,m)=>Math.max(max,Number(m.id)||0),0);if(state.lastDmMessageId!==null&&newestDm>state.lastDmMessageId){noteChatActivity();if(!isChatEmbed)window.excruciatingPlayNotificationSound?.();}state.lastDmMessageId=Math.max(state.lastDmMessageId||0,newestDm);renderDmUsers(data.users||[],data.search_results||[],search);updateDmUnread(data.unread_count);const selected=data.current_user||(data.users||[]).find(user=>Number(user.id)===Number(state.dmUser));if(state.dmUser&&!selected){state.dmUser=null;$("#dm-conversation-heading").textContent="Choose someone to message";$("#dm-form").hidden=true;}else if(selected){$("#dm-conversation-heading").textContent=selected.username;$("#dm-form").hidden=false;}else{$("#dm-conversation-heading").textContent="Choose someone to message";$("#dm-form").hidden=true;}renderDmMessages(data.messages||[]);}catch(error){$("#chat-status").textContent=error.message;}finally{state.dmBusy=false;}}
$("#dm-form").addEventListener("submit",async e=>{e.preventDefault();if(!state.dmUser)return;const input=$("#dm-message"),message=input.value.trim();if(!message)return;try{await api("/api/chat/dm",{method:"POST",body:JSON.stringify({recipient_id:state.dmUser,message})});noteChatActivity();input.value="";$("#chat-status").textContent="";await pollDms(true);}catch(error){$("#chat-status").textContent=error.message;}});
let dmSearchTimer=null;$("#dm-user-search").addEventListener("input",event=>{state.dmSearch=event.target.value.trim();const results=$("#dm-search-results"),heading=$("#dm-search-heading");results.replaceChildren();results.hidden=state.dmSearch.length<2;heading.hidden=state.dmSearch.length<2;if(state.dmSearch.length>=2){const status=document.createElement("p");status.className="chat-muted";status.textContent="Searching…";results.append(status);}if(dmSearchTimer!==null)clearTimeout(dmSearchTimer);dmSearchTimer=setTimeout(()=>{dmSearchTimer=null;pollDms(true);},220);});
function updateUnread(){const badge=$("#chat-unread");badge.hidden=state.unread===0;badge.textContent=state.unread>99?"99+":String(state.unread);$("#chat-toggle").setAttribute("aria-label",state.unread?"Open chat, "+state.unread+" unread messages":"Open chat");}
function markChatSeen(){const newest=Number(chat.dataset.latest||0);if(newest){state.lastSeen=newest;localStorage.setItem("excruciating-chat-seen",String(newest));}state.unread=0;updateUnread();}
function setChatUser(user){state.chatUser=user||null;window.excruciatingChatUser=state.chatUser;window.dispatchEvent(new CustomEvent("excruciating:chat-user",{detail:state.chatUser}));$("#chat-account").hidden=!user;$("#chat-login-prompt").hidden=Boolean(user);$("#chat-form").hidden=!user;$("#chat-account-name").textContent=user?"Signed in as "+user.username:"";$("#admin-toggle").hidden=!(user&&user.isAdmin);if(!user){state.dmUser=null;updateDmUnread(0);if(state.chatMode==="dm")setChatMode("public");$("#admin-view").hidden=true;}}
async function refreshAdminAccess(){try{const data=await api("/api/admin/bootstrap");$("#admin-setup-open").hidden=!(state.chatUser&&data.setupAvailable);}catch{$("#admin-setup-open").hidden=true;}}
async function refreshChatAuth(){try{const data=await api("/api/chat/auth");setChatUser(data.user);await refreshAdminAccess();if(isAdminRoute){history.replaceState({},"","/");if(data.user&&data.user.isAdmin)showAdmin();}}catch(error){setChatUser(null);}}
$("#admin-setup-open").addEventListener("click",()=>{$("#admin-setup-status").textContent="";$("#admin-setup-password").value="";$("#admin-setup-dialog").showModal();});$("#admin-setup-close").addEventListener("click",()=>$("#admin-setup-dialog").close());$("#admin-setup-form").addEventListener("submit",async e=>{e.preventDefault();const status=$("#admin-setup-status");try{await api("/api/admin/bootstrap",{method:"POST",body:JSON.stringify({password:$("#admin-setup-password").value})});$("#admin-setup-dialog").close();await refreshChatAuth();$("#chat-status").textContent="Admin access enabled. The Admin panel button is now in the top bar.";}catch(error){status.textContent=error.message;}});
function appendMessageContent(container,value){const text=String(value||"");const pattern=/https?:\/\/[^\s<>]+/gi;let offset=0;for(const match of text.matchAll(pattern)){const raw=match[0];let href=raw;while(/[.,!?;:)\]]$/.test(href))href=href.slice(0,-1);const start=match.index;container.append(document.createTextNode(text.slice(offset,start)));let parsed=null;try{parsed=new URL(href)}catch{}if(href&&parsed&&(parsed.protocol==="http:"||parsed.protocol==="https:")){const link=document.createElement("a");link.href=parsed.href;link.target="_blank";link.rel="noopener noreferrer nofollow";link.textContent=href;container.append(link)}else container.append(document.createTextNode(href));container.append(document.createTextNode(raw.slice(href.length)));offset=start+raw.length;}container.append(document.createTextNode(text.slice(offset)));}function appendChatMessage(message,target=$("#chat-messages"),moderate=false){const row=document.createElement("div");row.className="chat-message";const meta=document.createElement("div");meta.className="chat-message-meta";const user=document.createElement("strong");user.textContent=message.username;const time=document.createElement("time");time.textContent=new Date(message.created_at+"Z").toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});meta.append(user,time);row.append(meta);const body=document.createElement("p");appendMessageContent(body,message.message);row.append(body);if(moderate){const del=document.createElement("button");del.className="text-button danger";del.textContent="Delete";del.addEventListener("click",async()=>{try{await api("/api/admin/chat?id="+message.id,{method:"DELETE"});row.remove();}catch(e){alert(e.message);}});row.append(del);}target.append(row);}
function showChatToast(message){const host=$("#chat-toasts");if(!host)return;const toast=document.createElement("div");toast.className="chat-toast";const username=document.createElement("strong");username.textContent=message.username;const body=document.createElement("span");appendMessageContent(body,message.message);toast.append(username,body);host.append(toast);requestAnimationFrame(()=>toast.classList.add("is-visible"));setTimeout(()=>{toast.classList.remove("is-visible");setTimeout(()=>toast.remove(),240);},4600);}
async function pollChat(reset=false){if(document.hidden||state.chatBusy)return;state.chatBusy=true;try{const box=$("#chat-messages"),nearBottom=box.scrollHeight-box.scrollTop-box.clientHeight<48,previousTop=box.scrollTop;const data=await api("/api/chat");const messages=data.messages||[];const newest=messages.reduce((max,m)=>Math.max(max,Number(m.id)||0),0);if(newest>Number(chat.dataset.latest||0))noteChatActivity();chat.dataset.latest=String(newest);if(!state.chatInitialized){state.lastSeen=newest;state.lastNotified=newest;localStorage.setItem("excruciating-chat-seen",String(newest));localStorage.setItem("excruciating-chat-notified",String(newest));state.chatInitialized=true;}else if(chat.hidden&&newest>state.lastSeen){const unseen=messages.filter(m=>Number(m.id)>state.lastSeen);state.unread=unseen.length;updateUnread();const incoming=unseen.filter(m=>Number(m.id)>state.lastNotified&&(!state.chatUser||m.username!==state.chatUser.username));if(incoming.length&&!isChatEmbed)window.excruciatingPlayNotificationSound?.();if(!isChatEmbed)incoming.slice(-3).forEach(showChatToast);if(newest>state.lastNotified){state.lastNotified=newest;localStorage.setItem("excruciating-chat-notified",String(newest));}}else if(!chat.hidden){markChatSeen();}box.replaceChildren();for(const message of messages)appendChatMessage(message);if(!box.children.length){const p=document.createElement("p");p.className="chat-muted";p.textContent="No messages yet. Start the conversation.";box.append(p);}box.scrollTop=reset||nearBottom?box.scrollHeight:previousTop;}catch(error){$("#chat-status").textContent=error.message;}finally{state.chatBusy=false;}}
$("#chat-form").addEventListener("submit",async e=>{e.preventDefault();const message=$("#chat-message").value.trim();try{await api("/api/chat",{method:"POST",body:JSON.stringify({message})});noteChatActivity();$("#chat-message").value="";$("#chat-status").textContent="";await pollChat(true);}catch(error){$("#chat-status").textContent=error.message;}});
const CHAT_IDLE_POLL_MS=10000,CHAT_ACTIVE_POLL_MS=2000,CHAT_ACTIVE_WINDOW_MS=30000;
let chatPollTimer=null;
function noteChatActivity(){state.chatActivityUntil=Date.now()+CHAT_ACTIVE_WINDOW_MS;if(!document.hidden)scheduleChatPolling(CHAT_ACTIVE_POLL_MS);}
function scheduleChatPolling(delay){if(chatPollTimer!==null)clearTimeout(chatPollTimer);chatPollTimer=null;if(document.hidden)return;chatPollTimer=setTimeout(runChatPolling,delay);}
async function runChatPolling(){chatPollTimer=null;if(document.hidden)return;await Promise.all([pollChat(false),state.chatUser?pollDms(false):Promise.resolve()]);scheduleChatPolling(Date.now()<state.chatActivityUntil?CHAT_ACTIVE_POLL_MS:CHAT_IDLE_POLL_MS);}
document.addEventListener("visibilitychange",()=>{if(document.hidden){if(chatPollTimer!==null)clearTimeout(chatPollTimer);chatPollTimer=null;}else{scheduleChatPolling(0);}});
refreshChatAuth().then(()=>{if(isChatEmbed||openChatMode){chat.hidden=false;state.unread=0;markChatSeen();if(state.chatUser&&openChatMode==="dm")setChatMode("dm");else{setChatMode("public");if(!state.chatUser&&openChatMode==="dm")$("#chat-status").textContent="You need to be logged in to chat.";}}});pollChat(true);scheduleChatPolling(CHAT_IDLE_POLL_MS);

const suggestDialog=$("#suggest-dialog");$("#suggest-open").addEventListener("click",()=>{suggestDialog.showModal();$("#suggest-status").textContent="";});$("#suggest-close").addEventListener("click",()=>suggestDialog.close());
$("#suggest-form").addEventListener("submit",async e=>{e.preventDefault();const status=$("#suggest-status");try{await api("/api/suggestions",{method:"POST",body:JSON.stringify({title:$("#suggest-title").value.trim(),notes:$("#suggest-notes").value.trim()})});status.textContent="Suggestion sent to the admin panel. Thanks!";$("#suggest-form").reset();setTimeout(()=>suggestDialog.close(),900);}catch(error){status.textContent=error.message;}});
function slugify(value){return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}
$("#game-title").addEventListener("input",()=>{if(!$("#game-slug").dataset.edited)$("#game-slug").value=slugify($("#game-title").value);});$("#game-slug").addEventListener("input",()=>$("#game-slug").dataset.edited="1");
async function refreshSuggestions(){const data=await api("/api/admin/suggestions"),list=$("#admin-suggestions");list.replaceChildren();const pending=data.suggestions.filter(x=>x.status==="pending").length;$("#admin-suggestion-count").textContent=pending+" pending · "+data.suggestions.length+" total";for(const suggestion of data.suggestions){const row=document.createElement("div");row.className="admin-list-row suggestion-row";const info=document.createElement("div");const name=document.createElement("strong");name.textContent=suggestion.title;const sub=document.createElement("small");sub.textContent=(suggestion.status||"pending")+" · "+suggestion.created_at;info.append(name,sub);if(suggestion.notes){const note=document.createElement("small");note.textContent=suggestion.notes;info.append(note);}const remove=document.createElement("button");remove.className="text-button danger";remove.textContent="Delete";remove.addEventListener("click",async()=>{if(!confirm("Delete this suggestion?"))return;try{await api("/api/admin/suggestions?id="+suggestion.id,{method:"DELETE"});await refreshSuggestions();}catch(error){alert(error.message);}});row.append(info,remove);list.append(row);}if(!data.suggestions.length){const p=document.createElement("p");p.className="chat-muted";p.textContent="No game suggestions yet.";list.append(p);}}
async function refreshWordBlocklist(){const data=await api("/api/admin/word-blocklist"),list=$("#admin-blocklist");list.replaceChildren();$("#admin-blocklist-count").textContent=data.words.length+" blocked";for(const item of data.words){const row=document.createElement("div");row.className="blocklist-row";const word=document.createElement("strong");word.textContent=item.word;const remove=document.createElement("button");remove.className="text-button danger";remove.textContent="Remove";remove.addEventListener("click",async()=>{try{await api("/api/admin/word-blocklist?word="+encodeURIComponent(item.word),{method:"DELETE"});await refreshWordBlocklist();}catch(error){alert(error.message);}});row.append(word,remove);list.append(row);}if(!data.words.length){const empty=document.createElement("p");empty.className="chat-muted";empty.textContent="No blocked words yet.";list.append(empty);}}
$("#blocklist-form").addEventListener("submit",async event=>{event.preventDefault();const status=$("#blocklist-status"),word=$("#blocklist-word").value.trim();try{await api("/api/admin/word-blocklist",{method:"POST",body:JSON.stringify({word})});$("#blocklist-word").value="";status.textContent="Added to the chat blocklist.";await refreshWordBlocklist();}catch(error){status.textContent=error.message;}});

$("#site-banner-form").addEventListener("submit",async event=>{event.preventDefault();const status=$("#site-banner-status");try{const data=await api("/api/admin/banner",{method:"PUT",body:JSON.stringify({enabled:$("#site-banner-enabled").checked,message:$("#site-banner-input").value.trim()})});status.textContent="Banner settings saved.";$("#site-banner").hidden=!data.enabled;$("#site-banner-message").textContent=data.message||"";}catch(error){status.textContent=error.message;}});
function formatChangelogDate(value){const date=new Date(String(value||"").replace(" ","T")+"Z");return Number.isNaN(date.getTime())?String(value||""):date.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"});}
function buildChangelogEntry(entry,admin=false){
 const row=document.createElement("article");row.className="changelog-entry"+(admin?" admin-list-row changelog-admin-entry":"");
 const info=document.createElement("div");const heading=document.createElement("div");heading.className="changelog-entry-heading";
 const title=document.createElement("strong");title.textContent=entry.title||"Update";
 const kind=document.createElement("span");kind.className="changelog-kind";kind.textContent=entry.kind||"update";
 const time=document.createElement("time");time.textContent=formatChangelogDate(entry.created_at);
 heading.append(title,kind,time);info.append(heading);
 if(entry.details){const details=document.createElement("p");details.textContent=entry.details;info.append(details);}
 row.append(info);
 if(admin){
  const actions=document.createElement("div");actions.className="admin-row-actions";
  const edit=document.createElement("button");edit.className="text-button";edit.textContent="Edit";
  edit.addEventListener("click",()=>{editingChangelogId=Number(entry.id);$("#changelog-title").value=entry.title||"";$("#changelog-kind").value=entry.kind||"update";$("#changelog-details").value=entry.details||"";$("#changelog-submit").textContent="Save changes";$("#changelog-cancel").hidden=false;$("#changelog-status").textContent="Editing this entry.";$("#changelog-form").scrollIntoView({behavior:"smooth",block:"center"});});
  const remove=document.createElement("button");remove.className="text-button danger";remove.textContent="Delete";
  remove.addEventListener("click",async()=>{if(!confirm("Delete this changelog entry?"))return;try{await api("/api/admin/changelog?id="+entry.id,{method:"DELETE"});await refreshChangelog();await loadPublicChangelog();}catch(error){alert(error.message);}});
  actions.append(edit,remove);row.append(actions);
 }
 return row;
}
async function loadPublicChangelog(){
 const section=$("#public-changelog"),list=$("#public-changelog-list");if(!section||!list)return;
 try{const data=await api("/api/changelog");const entries=data.entries||[];list.replaceChildren();for(const entry of entries.slice(0,12))list.append(buildChangelogEntry(entry));if(!entries.length){const empty=document.createElement("p");empty.className="chat-muted";empty.textContent="No updates yet.";list.append(empty);}section.hidden=false;}
 catch(error){console.warn("Public changelog unavailable.",error);section.hidden=true;}
}
async function refreshChangelog(){
 const data=await api("/api/admin/changelog"),list=$("#admin-changelog-list");list.replaceChildren();
 for(const entry of data.entries||[])list.append(buildChangelogEntry(entry,true));
 if(!(data.entries||[]).length){const empty=document.createElement("p");empty.className="chat-muted";empty.textContent="No changelog entries yet.";list.append(empty);}
}
function resetChangelogForm(){editingChangelogId=null;$("#changelog-form").reset();$("#changelog-submit").textContent="Publish update";$("#changelog-cancel").hidden=true;$("#changelog-status").textContent="";}
$("#changelog-form").addEventListener("submit",async event=>{
 event.preventDefault();const status=$("#changelog-status");
 const payload={title:$("#changelog-title").value.trim(),kind:$("#changelog-kind").value,details:$("#changelog-details").value.trim()};
 try{
  if(editingChangelogId)await api("/api/admin/changelog?id="+editingChangelogId,{method:"PATCH",body:JSON.stringify(payload)});
  else await api("/api/admin/changelog",{method:"POST",body:JSON.stringify(payload)});
  const message=editingChangelogId?"Changelog entry updated.":"Changelog entry published.";
  resetChangelogForm();status.textContent=message;await refreshChangelog();await loadPublicChangelog();
 }catch(error){status.textContent=error.message;}
});
$("#changelog-cancel").addEventListener("click",resetChangelogForm);

function makeAdminDropdown(items){
 const details=document.createElement("details");
 details.className="admin-dropdown";
 const summary=document.createElement("summary");
 summary.textContent="Actions";
 const menu=document.createElement("div");
 menu.className="admin-dropdown-menu";
 for(const item of items){
  const button=document.createElement("button");
  button.type="button";
  button.textContent=item.label;
  if(item.danger)button.className="danger";
  button.addEventListener("click",async()=>{details.open=false;await item.action();});
  menu.append(button);
 }
 details.append(summary,menu);
 return details;
}
function editAdminGame(game){
 editingSlug=game.slug;
 $("#game-title").value=game.title||"";
 $("#game-category").value=game.category||"Arcade";
 $("#game-slug").value=game.slug||"";
 $("#game-slug").dataset.edited="1";
 $("#game-slug").disabled=true;
 $("#game-thumbnail").value=game.thumbnail||"";
 updateThumbnailPreview();
 $("#game-description").value=game.description||"";
 $("#game-source").value=game.source_url||"";
 $("#game-license").value=game.license||"";
 $("#game-attribution").value=game.attribution||"";
 $("#game-submit-button").textContent="Save changes";
 $("#game-form").scrollIntoView({behavior:"smooth",block:"center"});
}
async function setAdminGameFeatured(game,featured){
 try{
  await api("/api/admin/games",{method:"PATCH",body:JSON.stringify({slug:game.slug,featured})});
  await refreshAdmin();
  await loadGames();
  return true;
 }catch(error){alert(error.message);return false;}
}
async function refreshFeaturedAdmin(games){
 const list=$("#admin-featured-games");
 list.replaceChildren();
 const selected=games.filter(g=>g.featured&&Number(g.published)!==0);
 const label=document.createElement("p");
 label.className="chat-muted";
 label.textContent=selected.length+" / 5 featured";
 list.append(label);
 for(const game of games.filter(g=>Number(g.published)!==0)){
  const row=document.createElement("div");
  row.className="admin-list-row";
  const info=document.createElement("div");
  const title=document.createElement("strong");
  title.textContent=game.title;
  const sub=document.createElement("small");
  sub.textContent=game.category+" · "+game.slug;
  info.append(title,sub);
  const select=document.createElement("select");
  select.className="admin-feature-select";
  select.setAttribute("aria-label","Feature "+game.title);
  const off=document.createElement("option");
  off.value="off";
  off.textContent="Not featured";
  const on=document.createElement("option");
  on.value="on";
  on.textContent="Featured";
  on.disabled=!game.featured&&selected.length>=5;
  select.append(off,on);
  select.value=game.featured?"on":"off";
  select.addEventListener("change",async()=>{
   const featured=select.value==="on";
   select.disabled=true;
   const changed=await setAdminGameFeatured(game,featured);
   if(!changed)select.value=game.featured?"on":"off";
   select.disabled=false;
  });
  row.append(info,select);
  list.append(row);
 }
}
let cachedAdminAccounts=[];
function renderAdminAccounts(){
 const list=$("#admin-accounts");
 if(!list)return;
 const query=$("#admin-account-search").value.trim().toLowerCase();
 const accounts=cachedAdminAccounts.filter(account=>!query||account.username.toLowerCase().includes(query)||String(account.id).includes(query));
 list.replaceChildren();
 if(!accounts.length){
  const empty=document.createElement("p");
  empty.className="chat-muted";
  empty.textContent=query?"No accounts match that search.":"No accounts yet.";
  list.append(empty);
  return;
 }
 for(const account of accounts){
  const row=document.createElement("div");
  row.className="admin-list-row";
  const info=document.createElement("div");
  const name=document.createElement("strong");
  name.textContent=account.username;
  const details=document.createElement("small");
  const created=account.created_at?new Date(account.created_at+"Z").toLocaleDateString():"";
  details.textContent="#"+account.id+" · "+(Number(account.is_admin)===1?"Admin":account.terminated_at?"Terminated":"Active")+(created?" · Joined "+created:"");
  info.append(name,details);
  const action=document.createElement("button");
  action.type="button";
  action.className=account.terminated_at?"text-button":"text-button danger";
  if(Number(account.is_admin)===1){
   action.textContent="Protected admin";
   action.disabled=true;
  }else{
   const nextAction=account.terminated_at?"restore":"terminate";
   action.textContent=account.terminated_at?"Restore":"Terminate";
   action.addEventListener("click",async()=>{
    if(nextAction==="terminate"&&!confirm("Terminate "+account.username+"? They will lose access to sign-in, chat posting, and direct messages. Their existing chat history will remain."))return;
    try{
     await api("/api/admin/accounts",{method:"PATCH",body:JSON.stringify({account_id:Number(account.id),action:nextAction})});
     await refreshAdminAccounts();
    }catch(error){alert(error.message);}
   });
  }
  row.append(info,action);
  list.append(row);
 }
}
$("#admin-account-search").addEventListener("input",renderAdminAccounts);
async function refreshAdminAccounts(){
 const list=$("#admin-accounts");
 try{
  const data=await api("/api/admin/accounts");
  cachedAdminAccounts=data.accounts||[];
  $("#admin-account-count").textContent=cachedAdminAccounts.length+" accounts shown (latest 200)";
  renderAdminAccounts();
 }catch(error){
  cachedAdminAccounts=[];
  $("#admin-account-count").textContent="Unavailable";
  list.replaceChildren();
  const message=document.createElement("p");
  message.className="chat-muted";
  message.textContent=error.message;
  list.append(message);
 }
}
async function loadAdminBanner(){try{const data=await api("/api/admin/banner");$("#site-banner-enabled").checked=Boolean(data.enabled);$("#site-banner-input").value=data.message||"";$("#site-banner-status").textContent="";}catch(error){$("#site-banner-status").textContent=error.message;}}
async function refreshAdmin(){
 await Promise.all([refreshSuggestions(),loadAdminBanner()]);
 try{await refreshWordBlocklist();}catch(error){$("#blocklist-status").textContent="Apply migration 0005 to enable the word blocklist.";}
 await loadGames();
 try{await refreshChangelog();}catch(error){$("#changelog-status").textContent=error.message;}
 const data=await api("/api/admin/games");
 await refreshFeaturedAdmin(data.games);
 const list=$("#admin-games");
 list.replaceChildren();
 $("#admin-game-count").textContent=data.games.length+" games";
 for(const game of data.games){
  const row=document.createElement("div");
  row.className="admin-list-row";
  const info=document.createElement("div");
  const name=document.createElement("strong");
  name.textContent=game.title;
  const sub=document.createElement("small");
  sub.textContent=game.category+" · "+game.slug+" · "+(game.license||"Licence missing")+(Number(game.published)===0?" · Hidden":"");
  info.append(name,sub);
  if(game.thumbnail){
   const preview=document.createElement("img");
   preview.src=game.thumbnail;
   preview.alt="";
   preview.loading="lazy";
   preview.style.cssText="display:block;width:104px;height:58px;object-fit:cover;border-radius:8px;margin-top:8px";
   preview.onerror=()=>preview.remove();
   info.append(preview);
  }
  const actions=makeAdminDropdown([
   {label:"Edit game",action:()=>editAdminGame(game)},
   {label:game.featured?"Unfeature game":"Feature game",action:()=>setAdminGameFeatured(game,!game.featured)},
   Number(game.published)===0
    ?{label:"Restore game",action:async()=>{try{await api("/api/admin/games",{method:"POST",body:JSON.stringify(game)});await refreshAdmin();await loadGames();}catch(error){alert(error.message);}}}
    :{label:"Remove game",danger:true,action:async()=>{if(!confirm("Remove "+game.title+" from the game library? Its GitHub files will remain stored."))return;try{await api("/api/admin/games?slug="+encodeURIComponent(game.slug),{method:"DELETE",body:JSON.stringify(game)});await refreshAdmin();await loadGames();}catch(error){alert(error.message);}}}
  ]);
  const actionWrap=document.createElement("div");
  actionWrap.className="admin-row-actions";
  actionWrap.append(actions);
  row.append(info,actionWrap);
  list.append(row);
 }
 await refreshAdminAccounts();
 const chatData=await api("/api/admin/chat");
 const chatList=$("#admin-chat");
 chatList.replaceChildren();
 for(const message of chatData.messages)appendChatMessage(message,chatList,true);
 if(!chatData.messages.length){
  const p=document.createElement("p");
  p.className="chat-muted";
  p.textContent="No chat messages.";
  chatList.append(p);
 }
}
async function showAdmin(){if(!state.chatUser||!state.chatUser.isAdmin){$("#admin-view").hidden=true;return;}chat.hidden=true;home.hidden=true;player.hidden=true;$("#admin-view").hidden=false;$("#admin-content").hidden=false;await refreshAdmin();}
function closeAdmin(){$("#admin-view").hidden=true;home.hidden=false;$("#search-wrap").hidden=false;$("#chat-toggle").hidden=false;}
$("#admin-toggle").addEventListener("click",()=>{$("#admin-view").hidden?showAdmin():closeAdmin();});$("#admin-close").addEventListener("click",closeAdmin);
function updateThumbnailPreview(){const value=$("#game-thumbnail").value.trim(),slug=$("#game-slug").value.trim().toLowerCase(),preview=$("#game-thumbnail-preview");if(!value){preview.hidden=true;preview.removeAttribute("src");return;}preview.src=/^https?:\/\//i.test(value)||value.startsWith("/")?value:"/games/"+slug+"/"+value.replace(/^\/+/,"");preview.hidden=false;preview.onerror=()=>{preview.hidden=true;};}
$("#game-thumbnail").addEventListener("input",updateThumbnailPreview);
$("#game-form").addEventListener("submit",async e=>{e.preventDefault();const status=$("#upload-status"),title=$("#game-title").value.trim(),slug=$("#game-slug").value.trim().toLowerCase(),category=$("#game-category").value,sourceUrl=$("#game-source").value.trim(),license=$("#game-license").value.trim(),gamePath="/games/"+slug+"/index.html";status.textContent="Checking the game files…";try{const check=await fetch(gamePath,{method:"HEAD",cache:"no-store"});if(!check.ok)throw new Error("The game files are not deployed yet. Add the game folder to GitHub at games/"+slug+"/ and wait for the Pages deployment before publishing it here.");let thumbnail=$("#game-thumbnail").value.trim();if(thumbnail&&!/^https?:\/\//i.test(thumbnail)&&!thumbnail.startsWith("/"))thumbnail="/games/"+slug+"/"+thumbnail.replace(/^\/+/,"");await api("/api/admin/games",{method:"POST",body:JSON.stringify({title,slug,category,thumbnail,description:$("#game-description").value.trim(),source_url:sourceUrl,license,attribution:$("#game-attribution").value.trim()})});status.textContent=editingSlug?"Game details updated.":"Game added to the catalogue.";editingSlug=null;$("#game-form").reset();updateThumbnailPreview();$("#game-slug").disabled=false;$("#game-slug").dataset.edited="";$("#game-submit-button").textContent="Publish in catalogue";await refreshAdmin();await loadGames();}catch(error){status.textContent=error.message;}});
loadGames();
loadPublicChangelog();
