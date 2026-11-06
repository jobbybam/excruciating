const state={games:[],category:"All",query:""};
const grid=document.querySelector("#game-grid");
const empty=document.querySelector("#empty-state");
const count=document.querySelector("#game-count");
const home=document.querySelector(".shell");
const player=document.querySelector("#player");
const frame=document.querySelector("#game-frame");
const playerTitle=document.querySelector("#player-title");
const placeholder=document.querySelector("#player-placeholder");

async function loadGames(){
  try{
    const response=await fetch("/catalog/games.json",{cache:"no-store"});
    if(!response.ok)throw new Error("Catalogue unavailable");
    const data=await response.json();
    state.games=Array.isArray(data.games)?data.games:[];
  }catch(error){
    console.warn(error);
    state.games=[];
  }
  render();
}
function render(){
  const q=state.query.trim().toLowerCase();
  const visible=state.games.filter(game=>(state.category==="All"||game.category===state.category)&&(!q||game.title.toLowerCase().includes(q)));
  grid.replaceChildren();
  count.textContent=visible.length+" "+(visible.length===1?"game":"games");
  empty.hidden=visible.length!==0;
  for(const game of visible){
    const button=document.createElement("button");
    button.className="game-card";
    button.type="button";
    button.addEventListener("click",()=>openGame(game));
    const thumb=document.createElement("span");thumb.className="game-thumb";
    if(game.thumbnail){const img=document.createElement("img");img.src=game.thumbnail;img.alt="";img.loading="lazy";thumb.append(img)}
    else{const fallback=document.createElement("span");fallback.className="game-placeholder";fallback.textContent=(game.title||"?").slice(0,1).toUpperCase();thumb.append(fallback)}
    const title=document.createElement("span");title.className="game-name";title.textContent=game.title;
    const category=document.createElement("span");category.className="game-category";category.textContent=game.category||"";
    button.append(thumb,title,category);grid.append(button);
  }
}
function openGame(game){
  if(!game||!game.path)return;
  home.hidden=true;player.hidden=false;playerTitle.textContent=game.title;
  placeholder.hidden=true;frame.hidden=false;frame.src=game.path;
  history.pushState({game:game.slug},"","#play/"+encodeURIComponent(game.slug));
}
function closeGame(){
  frame.src="about:blank";frame.hidden=true;placeholder.hidden=false;
  player.hidden=true;home.hidden=false;
  if(location.hash.startsWith("#play/"))history.pushState({},"",location.pathname+location.search);
}
document.querySelector("#search").addEventListener("input",e=>{state.query=e.target.value;render()});
document.querySelector("#categories").addEventListener("click",e=>{
  const button=e.target.closest("[data-category]");if(!button)return;
  state.category=button.dataset.category;
  document.querySelectorAll(".category").forEach(item=>item.classList.toggle("active",item===button));
  render();
});
document.querySelector("#back-button").addEventListener("click",closeGame);
document.querySelector("#reload-button").addEventListener("click",()=>{if(frame.src)frame.src=frame.src});
document.querySelector("#fullscreen-button").addEventListener("click",()=>{const target=frame;if(target.requestFullscreen)target.requestFullscreen()});
window.addEventListener("keydown",e=>{if(e.key==="/"&&document.activeElement.tagName!=="INPUT"&&document.activeElement.tagName!=="TEXTAREA"){e.preventDefault();document.querySelector("#search").focus()}if(e.key==="Escape"&&!player.hidden)closeGame()});
window.addEventListener("popstate",()=>{if(!location.hash.startsWith("#play/")&&!player.hidden)closeGame()});
const chat=document.querySelector("#chat-panel");
document.querySelector("#chat-toggle").addEventListener("click",()=>chat.hidden=!chat.hidden);
document.querySelector("#chat-close").addEventListener("click",()=>chat.hidden=true);
loadGames();
