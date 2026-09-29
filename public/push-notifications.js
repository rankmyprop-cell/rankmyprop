import { CLOUDFLARE_API_URL } from "./cloudflare-config.js";

const STORAGE_COLLAPSED = "rmpPushCollapsed";
const STORAGE_ENDPOINT = "rmpPushEndpoint";
const PUSH_EXCLUDED = /^\/(?:admin(?:-|\/|$)|dashboard(?:-|\.|\/|$)|login(?:\.|\/|$)|signup(?:\.|\/|$)|onboarding(?:\.|\/|$)|support(?:-|\/|$)|announcements-panel(?:\.|\/|$)|reviews-panel(?:\.|\/|$)|offers-panel(?:\.|\/|$)|rules-panel(?:\.|\/|$)|challenges-panel(?:\.|\/|$))/i;
function browserName(){const ua=navigator.userAgent;if(/Edg/i.test(ua))return"Edge";if(/CriOS|Chrome/i.test(ua))return"Chrome";if(/Safari/i.test(ua)&&!/Chrome|CriOS/i.test(ua))return"Safari";if(/Firefox/i.test(ua))return"Firefox";return"Other"}
function platformName(){const ua=navigator.userAgent;if(/iPhone|iPad|iPod/i.test(ua))return"iOS";if(/Android/i.test(ua))return"Android";if(/Macintosh|Mac OS X/i.test(ua))return"macOS";if(/Windows/i.test(ua))return"Windows";return navigator.platform||"Other"}
function isIos(){return/iPhone|iPad|iPod/i.test(navigator.userAgent)}
function isStandalone(){return matchMedia("(display-mode: standalone)").matches||navigator.standalone===true}
function keyBytes(value){const padding="=".repeat((4-value.length%4)%4);const binary=atob((value+padding).replace(/-/g,"+").replace(/_/g,"/"));return Uint8Array.from(binary,(char)=>char.charCodeAt(0))}
function permissionHelp(){const browser=browserName();if(browser==="Safari")return"Notifications are blocked. Open Safari Settings → Websites → Notifications, set rankmyprop.in to Allow, then reload this page.";return"Notifications are blocked. Click the site settings icon beside the address bar → Notifications → Allow, then reload this page."}
async function register(subscription,selected){const response=await fetch(`${CLOUDFLARE_API_URL}/v1/push/subscriptions`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({subscription:subscription.toJSON(),categories:selected,platform:platformName(),browser:browserName()})});if(!response.ok)throw new Error((await response.json().catch(()=>({}))).error||"Could not save notification subscription.")}
async function hasEnabledAlerts(){
  if(!("Notification"in window)||Notification.permission!=="granted")return false;
  if(localStorage.getItem(STORAGE_ENDPOINT))return true;
  if(!("serviceWorker"in navigator)||!("PushManager"in window))return false;
  try{
    const registration=await navigator.serviceWorker.getRegistration("/");
    const subscription=await registration?.pushManager.getSubscription();
    if(!subscription)return false;
    localStorage.setItem(STORAGE_ENDPOINT,subscription.endpoint);
    return true;
  }catch{return false}
}

async function mount(){
  if(document.getElementById("rmpPushRoot"))return;
  if(await hasEnabledAlerts())return;
  const css=document.createElement("link");css.rel="stylesheet";css.href="/push-notifications.css";document.head.appendChild(css);
  const root=document.createElement("div");root.id="rmpPushRoot";root.className="rmp-push-root";
  root.innerHTML=`<section class="rmp-push-panel" aria-labelledby="rmpPushTitle" aria-hidden="false"><div class="rmp-push-kicker">RankMyProp live alerts</div><h2 id="rmpPushTitle">Get Live Alerts</h2><p>Choose the updates you want. You can change browser notification permission at any time.</p><div class="rmp-push-options"><label class="rmp-push-option"><input type="checkbox" value="announcements" checked> Announcements</label><label class="rmp-push-option"><input type="checkbox" value="offers" checked> New Offers</label><label class="rmp-push-option"><input type="checkbox" value="firms" checked> New Firms</label></div><div class="rmp-push-actions"><button class="rmp-push-allow" type="button">Allow Notifications</button><button class="rmp-push-later" type="button">Not Now</button></div><p class="rmp-push-status" role="status" hidden></p></section><button class="rmp-push-badge" type="button" aria-label="Close RankMyProp live alerts" aria-expanded="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a2.4 2.4 0 0 0 2.35-2h-4.7A2.4 2.4 0 0 0 12 22Zm7-5-1.7-2.2V9a5.32 5.32 0 0 0-4.3-5.2V3a1 1 0 1 0-2 0v.8A5.32 5.32 0 0 0 6.7 9v5.8L5 17v1h14v-1Z"/></svg></button>`;
  document.body.appendChild(root);
  const panel=root.querySelector(".rmp-push-panel"),badge=root.querySelector(".rmp-push-badge"),allow=root.querySelector(".rmp-push-allow"),later=root.querySelector(".rmp-push-later"),status=root.querySelector(".rmp-push-status"),checks=[...root.querySelectorAll('input[type="checkbox"]')];
  const selected=()=>checks.filter((item)=>item.checked).map((item)=>item.value);
  let closeTimer;
  const setOpen=(open)=>{
    clearTimeout(closeTimer);
    root.classList.toggle("is-open",open);
    panel.setAttribute("aria-hidden",String(!open));
    badge.setAttribute("aria-expanded",String(open));
    badge.setAttribute("aria-label",`${open?"Close":"Open"} RankMyProp live alerts`);
    localStorage.setItem(STORAGE_COLLAPSED,open?"0":"1");
  };
  const message=(value,state="")=>{status.hidden=!value;status.textContent=value;status.dataset.state=state};
  const dismissWidget=()=>{root.classList.remove("is-open");root.classList.add("is-dismissed");closeTimer=setTimeout(()=>root.remove(),360)};
  setOpen(localStorage.getItem(STORAGE_COLLAPSED)!=="1");
  badge.addEventListener("click",()=>setOpen(!root.classList.contains("is-open")));later.addEventListener("click",()=>setOpen(false));
  allow.addEventListener("click",async()=>{
    if(!selected().length)return message("Select at least one alert type.","error");
    if(isIos()&&!isStandalone())return message("On iPhone: tap Share → Add to Home Screen, open RankMyProp from the new icon, then allow alerts.","error");
    if(!("Notification"in window)||!("serviceWorker"in navigator)||!("PushManager"in window))return message("Update Chrome/Safari or use an iPhone Home Screen app to receive web push.","error");
    if(Notification.permission==="denied")return message(permissionHelp(),"error");
    allow.disabled=true;message("Waiting for browser permission…");
    try{
      if(await Notification.requestPermission()!=="granted")throw new Error(permissionHelp());
      const config=await(await fetch(`${CLOUDFLARE_API_URL}/v1/config`)).json();if(!config.pushPublicKey)throw new Error("Push configuration is temporarily unavailable.");
      const sw=await navigator.serviceWorker.register("/push-service-worker.js",{scope:"/"});await navigator.serviceWorker.ready;
      const existing=await sw.pushManager.getSubscription();const subscription=existing||await sw.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:keyBytes(config.pushPublicKey)});
      await register(subscription,selected());localStorage.setItem(STORAGE_ENDPOINT,subscription.endpoint);allow.textContent="Alerts Enabled";message("Live alerts are enabled for your selected categories.","ok");closeTimer=setTimeout(dismissWidget,1400);
    }catch(error){message(error?.message||"Could not enable alerts.","error")}finally{allow.disabled=false}
  });
  checks.forEach((check)=>check.addEventListener("change",async()=>{if(!localStorage.getItem(STORAGE_ENDPOINT)||!selected().length||!("serviceWorker"in navigator))return;try{const sw=await navigator.serviceWorker.ready;const subscription=await sw.pushManager.getSubscription();if(subscription)await register(subscription,selected());message("Alert preferences updated.","ok")}catch{}}));
  if(localStorage.getItem(STORAGE_ENDPOINT)&&Notification.permission==="granted")allow.textContent="Alerts Enabled";
}
if(window.self===window.top&&!PUSH_EXCLUDED.test(window.location.pathname)){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount()}
