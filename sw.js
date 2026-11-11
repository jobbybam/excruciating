self.addEventListener("install",event=>{
 event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate",event=>{
 event.waitUntil(self.clients.claim());
});

self.addEventListener("push",event=>{
 let payload={};
 try{payload=event.data?event.data.json():{};}catch{}
 const title=typeof payload.title==="string"&&payload.title?payload.title:"Excruciating";
 const body=typeof payload.body==="string"?payload.body:"You have a new message.";
 const target=typeof payload.url==="string"?payload.url:"/";
 const url=new URL(target,self.location.origin);
 const safeUrl=url.origin===self.location.origin?url.href:self.location.origin+"/";
 event.waitUntil(self.registration.showNotification(title,{
  body,
  icon:"/icons/app-icon-192.png",
  badge:"/icons/app-icon-192.png",
  tag:typeof payload.tag==="string"?payload.tag:"excruciating-message",
  data:{url:safeUrl}
 }));
});

self.addEventListener("notificationclick",event=>{
 event.notification.close();
 const target=event.notification.data?.url||"/";
 event.waitUntil((async()=>{
  const windows=await self.clients.matchAll({type:"window",includeUncontrolled:true});
  for(const client of windows){
   if(new URL(client.url).origin!==self.location.origin)continue;
   if("navigate" in client)await client.navigate(target);
   return client.focus();
  }
  return self.clients.openWindow(target);
 })());
});
