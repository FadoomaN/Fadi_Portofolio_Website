'use client';
import { useEffect,useRef,useState } from 'react';
type Turnstile={render:(element:HTMLElement,options:Record<string,unknown>)=>string;remove:(id:string)=>void;reset:(id:string)=>void};
declare global { interface Window { turnstile?:Turnstile } }
let scriptReady:Promise<void>|null=null;
function loadScript(){
  if(window.turnstile)return Promise.resolve();
  if(!scriptReady)scriptReady=new Promise<void>((resolve,reject)=>{
    const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
    script.onload=()=>resolve();script.onerror=()=>{scriptReady=null;script.remove();reject(new Error('Anti-bot check could not load.'));};document.head.appendChild(script);
  });
  return scriptReady;
}
export default function TurnstileCheck({siteKey,onToken,revision,action='comment'}:{siteKey:string;onToken:(token:string)=>void;revision:number;action?:string}){
  const container=useRef<HTMLDivElement>(null);const [error,setError]=useState('');
  useEffect(()=>{
    let cancelled=false;let widget:string|undefined;onToken('');
    loadScript().then(()=>{
      if(cancelled||!container.current||!window.turnstile)return;
      setError('');
      widget=window.turnstile.render(container.current,{sitekey:siteKey,action,theme:'auto',size:'flexible',callback:(token:string)=>onToken(token),'expired-callback':()=>onToken(''),'error-callback':()=>{onToken('');setError('The anti-bot check could not complete. Reload to retry.');}});
    }).catch(()=>{if(!cancelled)setError('The anti-bot check could not load. Please reload to retry.');});
    return()=>{cancelled=true;if(widget)window.turnstile?.remove(widget);};
  },[siteKey,onToken,revision,action]);
  return <div className="journey-human-check"><div ref={container} />{error&&<p role="alert">{error}</p>}</div>;
}
