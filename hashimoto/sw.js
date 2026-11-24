/* Mi salud v3.0: primero red, y copia en caché para uso sin conexión.
   Solo borra SUS cachés antiguas (prefijo «misalud-»): la v2.4 borraba las cachés de TODAS las apps del mismo dominio.
   Solo atiende archivos de SU carpeta: el puente de Google y las demás apps no se tocan. */
const P='misalud-',C=P+'v3.0';
const BASE=new URL('./',self.location).href;
const F=['./','index.html','manifest.json','icon-192.png','icon-512.png','datos.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(F.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n.startsWith(P)&&n!==C).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin||!r.url.startsWith(BASE))return;
  e.respondWith(fetch(r).then(res=>{if(res&&res.ok&&res.type==='basic'){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res}).catch(()=>caches.match(r,{ignoreSearch:true,cacheName:C}).then(m=>m||caches.match('index.html',{cacheName:C}))));
});
