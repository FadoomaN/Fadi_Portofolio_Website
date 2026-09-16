export class CommentCheckError extends Error {
  constructor(message:string,public status:number){super(message);}
}
export function commentChecksReady(){
  return Boolean(process.env.OPENAI_API_KEY&&process.env.TURNSTILE_SECRET_KEY&&process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY&&process.env.SUPABASE_SERVICE_ROLE_KEY);
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
export async function checkComment(name:string,body:string){
  if(looksLikeSpam(`${name}\n${body}`))throw new CommentCheckError('Please remove repeated text or excessive links.',422);
  const response=await fetch('https://api.openai.com/v1/moderations',{
    method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},
    signal:AbortSignal.timeout(15000),body:JSON.stringify({model:'omni-moderation-latest',input:`Display name: ${name}\nComment: ${body}`}),
  });
  if(!response.ok)throw new CommentCheckError('Automatic comment checks are temporarily unavailable. Please try again.',503);
  const result=await response.json() as {results?:{flagged?:boolean;categories?:Record<string,boolean>}[]};
  const moderation=result.results?.[0];
  const categories=moderation?.categories;
  const blocked=['hate','hate/threatening','harassment/threatening','sexual/minors'];
  if(typeof moderation?.flagged!=='boolean'||!categories||blocked.some(key=>typeof categories[key]!=='boolean'))throw new CommentCheckError('The comment check could not be completed. Please try again.',503);
  if(moderation.flagged||blocked.some(key=>categories[key]))throw new CommentCheckError('Please revise the comment to remove prohibited content. Criticism and disagreement are welcome.',422);
}
