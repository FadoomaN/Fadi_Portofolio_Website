export class CommentCheckError extends Error {
  constructor(message:string,public status:number){super(message);}
}
export function commentChecksReady(){
  return Boolean(process.env.TURNSTILE_SECRET_KEY&&process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY&&process.env.SUPABASE_SERVICE_ROLE_KEY);
}
export async function verifyHuman(token:unknown,hostname:string){
  if(typeof token!=='string'||!token||token.length>2048)throw new CommentCheckError('Please complete the anti-bot check.',400);
  const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
    method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(10000),
    body:JSON.stringify({secret:process.env.TURNSTILE_SECRET_KEY,response:token}),
  });
  if(!response.ok)throw new CommentCheckError('The anti-bot check is temporarily unavailable. Please try again.',503);
  const result=await response.json() as {success?:boolean;hostname?:string;action?:string};
  if(!result.success||result.hostname!==hostname||result.action!=='comment')throw new CommentCheckError('The anti-bot check expired or failed. Please try again.',400);
}
export function looksLikeSpam(text:string){
  return (text.match(/https?:\/\/|www\./gi)?.length??0)>2 || /(.)\1{19,}/u.test(text) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text);
}
export function checkComment(name:string,body:string){
  if(looksLikeSpam(`${name}\n${body}`))throw new CommentCheckError('Please remove repeated text or excessive links.',422);
}
