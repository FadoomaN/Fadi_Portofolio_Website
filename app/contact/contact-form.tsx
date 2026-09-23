"use client";

import { FormEvent, useCallback, useState } from "react";
import TurnstileCheck from "../journey/turnstile-check";

export default function ContactForm({ siteKey }: { siteKey?: string }) {
  const [token,setToken] = useState("");
  const [revision,setRevision] = useState(0);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const onToken = useCallback((value:string)=>setToken(value),[]);
  const submit = async (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const form=event.currentTarget;
    const payload=Object.fromEntries(new FormData(form));
    try {
      const response=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload,turnstileToken:token})});
      const result=await response.json() as {error?:string};
      if(!response.ok) throw new Error(result.error??"Your message could not be sent.");
      form.reset(); setNotice("Your message was sent. Thank you — I will reply as soon as possible.");
    } catch(reason) { setError(reason instanceof Error?reason.message:"Your message could not be sent."); }
    finally { setToken(""); setRevision(value=>value+1); setBusy(false); }
  };
  return <form className="contact-form" onSubmit={submit} noValidate>
    <div className="contact-form-grid"><label>Name<input name="name" required minLength={2} maxLength={100} autoComplete="name" /></label><label>Email<input name="email" type="email" required maxLength={254} autoComplete="email" /></label></div>
    <label>Subject<input name="subject" required minLength={2} maxLength={180} /></label>
    <label>Message<textarea name="message" required minLength={10} maxLength={5000} rows={9} /></label>
    <input className="contact-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    {siteKey ? <TurnstileCheck siteKey={siteKey} onToken={onToken} revision={revision} action="contact" /> : <p className="contact-form-error" role="alert">The contact form is not configured yet.</p>}
    <div className="contact-form-actions"><div><p className="contact-form-error" role="alert" aria-live="polite">{error}</p><p className="contact-form-success" role="status" aria-live="polite">{notice}</p></div><button type="submit" disabled={busy||!siteKey||!token}>{busy?"SENDING…":"SEND MESSAGE ↗"}</button></div>
  </form>;
}
