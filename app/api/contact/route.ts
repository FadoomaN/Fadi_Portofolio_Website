import { NextRequest,NextResponse } from "next/server";
import { sameOrigin } from "@/lib/admin-auth";
import { CommentCheckError,looksLikeSpam,verifyHuman } from "@/lib/comment-moderation";
import { readJsonObject } from "@/lib/http";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

const COOKIE="portfolio-contact-visitor";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean=(value:unknown,max:number)=>typeof value==="string"?value.trim().slice(0,max+1):"";
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"private, no-store"}});

export async function POST(request:NextRequest){
  if(!sameOrigin(request))return json({error:"Please submit the form from this website."},403);
  if(Number(request.headers.get("content-length"))>12000)return json({error:"Request is too large."},413);
  let body:Record<string,unknown>; try{body=await readJsonObject(request)}catch{return json({error:"Invalid contact form."},400)}
  const name=clean(body.name,100),email=clean(body.email,254).toLowerCase(),subject=clean(body.subject,180),message=clean(body.message,5000);
  if(body.website)return json({error:"Your message could not be submitted."},400);
  if(name.length<2||email.length>254||!EMAIL.test(email)||subject.length<2||subject.length>180||message.length<10||message.length>5000)return json({error:"Check your name, email, subject, and message."},400);
  if(looksLikeSpam(`${name}\n${subject}\n${message}`))return json({error:"Please remove repeated text or excessive links."},422);
  if(!process.env.TURNSTILE_SECRET_KEY||!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY||!process.env.SUPABASE_SERVICE_ROLE_KEY||!process.env.RESEND_API_KEY)return json({error:"The contact service is not configured yet."},503);
  const existing=request.cookies.get(COOKIE)?.value;
  const visitor=existing&&UUID.test(existing)?existing:crypto.randomUUID();
  try{
    await verifyHuman(body.turnstileToken,request.nextUrl.hostname,"contact");
    const db=createServiceSupabaseClient();
    const {error:limitError}=await db.rpc("reserve_contact_submission",{p_visitor:visitor});
    if(limitError)return json({error:limitError.code==="P0001"?"Too many messages. Please try again later.":"The contact service is temporarily unavailable."},limitError.code==="P0001"?429:503);
    const {data:record,error:insertError}=await db.from("contact_messages").insert({name,email,subject,message}).select("id").single();
    if(insertError||!record)return json({error:"Your message could not be stored. Please try again."},503);
    const recipient=process.env.CONTACT_RECIPIENT_EMAIL||"fadi.alhazeembest2017@gmail.com";
    const from=process.env.CONTACT_FROM_EMAIL||"Portfolio Contact <contact@fadialhazim.com>";
    const mail=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json","Idempotency-Key":`contact/${record.id}`},body:JSON.stringify({from,to:[recipient],reply_to:email,subject:`Portfolio contact: ${subject}`,text:`Name: ${name}\nEmail: ${email}\n\n${message}`})});
    if(!mail.ok)return json({error:"Your message was saved, but the email notification failed. It is still available in the admin inbox."},502);
    const response=json({ok:true}); response.cookies.set(COOKIE,visitor,{httpOnly:true,sameSite:"lax",secure:request.nextUrl.protocol==="https:",path:"/",maxAge:60*60*24*365}); return response;
  }catch(error){if(error instanceof CommentCheckError)return json({error:error.message},error.status);return json({error:"The contact service is temporarily unavailable. Please try again."},503)}
}
