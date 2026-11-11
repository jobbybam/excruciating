(()=>{
 const dialog=document.querySelector("#notification-dialog");
 if(!dialog||new URLSearchParams(location.search).get("chat")==="embedded")return;
 const $=selector=>document.querySelector(selector);
 const status=$("#notification-status"),installHelp=$("#install-help"),installButton=$("#pwa-install-button"),enableButton=$("#notification-enable"),disableButton=$("#notification-disable");
 let installPrompt=null,registrationPromise=null,readyRegistration=null,configPromise=null,pushConfig=null,audioContext=null,autoPromptAttempted=false;
 const soundToggle=$("#notification-sound"),soundKey="excruciating-chat-sound";
 if(soundToggle){soundToggle.checked=localStorage.getItem(soundKey)!=="off";soundToggle.addEventListener("change",()=>localStorage.setItem(soundKey,soundToggle.checked?"on":"off"));}
 window.excruciatingPlayNotificationSound=()=>{if(!soundToggle?.checked||document.hidden)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;audioContext=audioContext||new Audio();if(audioContext.state==="suspended")audioContext.resume();const start=audioContext.currentTime;for(const [offset,frequency] of [[0,740],[0.12,990]]){const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();oscillator.type="sine";oscillator.frequency.setValueAtTime(frequency,start+offset);gain.gain.setValueAtTime(0.0001,start+offset);gain.gain.exponentialRampToValueAtTime(0.07,start+offset+0.018);gain.gain.exponentialRampToValueAtTime(0.0001,start+offset+0.15);oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(start+offset);oscillator.stop(start+offset+0.16);}}catch{}};
 const isStandalone=()=>Boolean(navigator.standalone||window.matchMedia?.("(display-mode: standalone)").matches);
 const isIos=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
 const say=message=>{status.textContent=message;};
 const loadConfig=()=>configPromise||(configPromise=fetch("/api/chat/notifications",{cache:"no-store"}).then(response=>response.json()).then(config=>(pushConfig=config)).catch(()=>(pushConfig={enabled:false,public_key:""})));
 if("serviceWorker" in navigator)registrationPromise=navigator.serviceWorker.register("/sw.js",{scope:"/"}).then(()=>navigator.serviceWorker.ready).then(registration=>(readyRegistration=registration)).catch(()=>(readyRegistration=null));
 enableButton.disabled=true;
 loadConfig();
 window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();installPrompt=event;});
 $("#notifications-toggle").addEventListener("click",async()=>{
  say("");
  if(dialog.showModal)dialog.showModal();else dialog.setAttribute("open","");
  if(isIos()&&!isStandalone())installHelp.textContent="On iPhone or iPad, open this page in Safari, tap Share, choose Add to Home Screen, then tap Add. Open Excruciating from the new Home Screen icon to turn on direct-message notifications.";
  else if(isStandalone())installHelp.textContent="Excruciating is installed on this device. You can enable direct-message notifications below.";
  else installHelp.textContent="Install Excruciating for quick access. On iPhone or iPad, use Share → Add to Home Screen, then open the new icon.";
  await updateSubscriptionState();
 });
 $("#notification-dialog-close").addEventListener("click",()=>dialog.close());
 installButton.addEventListener("click",async()=>{
  if(installPrompt){const prompt=installPrompt;installPrompt=null;await prompt.prompt();const choice=await prompt.userChoice;say(choice.outcome==="accepted"?"Excruciating is being installed.":"Installation was cancelled.");}
  else if(isIos()&&!isStandalone())say("In Safari, tap Share, then Add to Home Screen. Open the new Home Screen icon before enabling notifications.");
  else if(isStandalone())say("Excruciating is already installed on this device.");
  else say("Use your browser’s Install app or Add to Home Screen option to install Excruciating.");
 });
 async function updateSubscriptionState(){
  const supported="serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window;
  if(!supported){disableButton.hidden=true;enableButton.disabled=true;say("Push notifications are not supported by this browser.");return;}
  const config=await loadConfig();
  if(!config.enabled||!config.public_key){disableButton.hidden=true;enableButton.disabled=true;say("Push notifications are not configured on the site yet.");return;}
  const registration=await (registrationPromise||Promise.resolve(null));
  if(!registration){disableButton.hidden=true;enableButton.disabled=true;say("The notification service worker could not be started. Reload and try again.");return;}
  enableButton.disabled=false;
  const subscription=registration?await registration.pushManager.getSubscription().catch(()=>null):null;
  disableButton.hidden=!subscription;
  if(subscription)say("Direct-message notifications are enabled on this device.");
  else if(Notification.permission==="denied")say("Notifications are blocked in this device’s settings.");
  else if(!isStandalone())say("On iPhone or iPad, add this site to the Home Screen first. Then sign in and enable notifications.");
  else if(!window.excruciatingChatUser)say("Sign in to your chat account before enabling direct-message notifications.");
  else say("You’ll be notified when someone sends you a direct message.");
 }
 async function maybePromptOnAppOpen(){
  if(autoPromptAttempted||!isStandalone()||!("serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window))return;
  autoPromptAttempted=true;
  const config=await loadConfig();
  if(!config.enabled||!config.public_key||Notification.permission==="denied")return;
  const registration=await (registrationPromise||Promise.resolve(null));
  if(!registration)return;
  const subscription=await registration.pushManager.getSubscription().catch(()=>null);
  if(subscription)return;
  say("Enable direct-message notifications for this device.");
  if(dialog.showModal)dialog.showModal();else dialog.setAttribute("open","");
  await updateSubscriptionState();
 }
 window.addEventListener("load",()=>setTimeout(()=>void maybePromptOnAppOpen(),350),{once:true});
 window.addEventListener("excruciating:chat-user",()=>void maybePromptOnAppOpen());
 enableButton.addEventListener("click",async()=>{
  say("");
  if(!isStandalone()){say(isIos()?"On iPhone or iPad, add this site to your Home Screen and open it from the new icon first.":"Install Excruciating before enabling notifications.");return;}
  if(!window.excruciatingChatUser){dialog.close();$("#chat-toggle").click();return;}
  if(!( "serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window)){say("Push notifications are not supported by this browser.");return;}
  if(Notification.permission==="denied"){say("Notifications are blocked. Allow them in this app’s notification settings, then try again.");return;}
  const config=pushConfig;
  if(!config?.enabled||!config.public_key){say("Push notifications are not configured on the site yet. Close and reopen this screen after setup.");return;}
  if(!readyRegistration){say("The notification service worker is still starting. Try again in a moment.");return;}
  const permission=Notification.permission==="default"?await Notification.requestPermission():Notification.permission;
  if(permission!=="granted"){say("Allow notifications to receive direct-message alerts.");return;}
  const registration=readyRegistration;
  if(!registration){say("The notification service worker could not be started. Reload and try again.");return;}
  try{
   let subscription=await registration.pushManager.getSubscription();
   if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodeKey(config.public_key)});
   const response=await fetch("/api/chat/notifications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"subscribe",subscription:subscription.toJSON()})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.error||"Could not save this device’s subscription.");
   say("Direct-message notifications are enabled on this device.");
   disableButton.hidden=false;
  }catch(error){say(error.message||"Could not enable notifications.");}
 });
 disableButton.addEventListener("click",async()=>{
  const registration=await (registrationPromise||Promise.resolve(null));
  const subscription=registration?await registration.pushManager.getSubscription().catch(()=>null):null;
  if(!subscription){disableButton.hidden=true;say("Notifications are already off on this device.");return;}
  try{
   const response=await fetch("/api/chat/notifications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"unsubscribe",endpoint:subscription.endpoint})});
   if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||"Could not remove the server subscription.");}
   await subscription.unsubscribe();
   disableButton.hidden=true;
   say("Direct-message notifications are off on this device.");
  }catch(error){say(error.message||"Could not turn notifications off.");}
 });
 function decodeKey(value){const padding="=".repeat((4-value.length%4)%4),base64=(value+padding).replace(/-/g,"+").replace(/_/g,"/"),raw=atob(base64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return bytes;}
})();
