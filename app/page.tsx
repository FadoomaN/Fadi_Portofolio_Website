import SiteHeader from './site-header';
import LifeCpu from './life-cpu';
import { siteContent } from './site-content';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type Activity = { id:string; event_type:'thread_updated'|'subthread_updated'|'subthread_published'; thread_title:string; thread_slug:string; subthread_title:string|null; subthread_slug:string|null; media_reference:string|null; media_position_x:number; media_position_y:number; created_at:string };
type News = { id:string; slug:string; title:string; body:string; media_reference:string|null; media_alt:string|null; published_at:string };

function newsExcerpt(body: string, limit = 140) {
  const compact = body.replace(/\s+/g, ' ').trim();
  return compact.length > limit ? `${compact.slice(0, limit).trimEnd()}…` : compact;
}

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const [{ data: storedProfile }, { data: activityRows }, { data: newsRows }] = await Promise.all([
    supabase.from('site_profile').select('first_name, last_name, role, kicker, portrait_media_reference, portrait_alt, portrait_object_position').eq('id', 1).maybeSingle(),
    supabase.from('journey_activity').select('id,event_type,thread_title,thread_slug,subthread_title,subthread_slug,media_reference,media_position_x,media_position_y,created_at').order('created_at',{ascending:false}).limit(12),
    supabase.from('manual_news').select('id,slug,title,body,media_reference,media_alt,published_at').order('published_at',{ascending:false}).limit(12),
  ]);
  const profile = {
    firstName: storedProfile?.first_name ?? siteContent.profile.firstName,
    lastName: storedProfile?.last_name ?? siteContent.profile.lastName,
    role: storedProfile?.role ?? siteContent.profile.role,
    kicker: storedProfile?.kicker ?? siteContent.profile.kicker,
    portrait: storedProfile?.portrait_media_reference || '/fadi-gray-suit.jpg',
    portraitAlt: storedProfile?.portrait_alt || `${storedProfile?.first_name ?? siteContent.profile.firstName} ${storedProfile?.last_name ?? siteContent.profile.lastName} portrait`,
    portraitObjectPosition: storedProfile?.portrait_object_position ?? 'center',
  };
  const updates = [
    ...((activityRows ?? []) as Activity[]).map((item) => ({
      ...item, kind:'activity' as const, date:item.created_at,
      label:item.event_type==='thread_updated'?'THREAD UPDATED':item.event_type==='subthread_updated'?'SUBTHREAD UPDATED':'NEW SUBTHREAD',
      title:item.event_type==='thread_updated'?`THREAD “${item.thread_title}” UPDATED`:item.event_type==='subthread_updated'?`SUBTHREAD “${item.subthread_title}” UPDATED`:`THREAD “${item.thread_title}” ADDED “${item.subthread_title}”`,
      href:item.subthread_slug?`/journey/${item.thread_slug}/${item.subthread_slug}`:`/journey/${item.thread_slug}`,
      action:item.subthread_slug?'VIEW SUBTHREAD':'VIEW THREAD', body:null, mediaAlt:null,
    })),
    ...((newsRows ?? []) as News[]).map((item) => ({ ...item, kind:'news' as const, date:item.published_at, label:'NEWS', href:`/news/${item.slug}`, action:'READ NOTE', excerpt:newsExcerpt(item.body), mediaAlt:item.media_alt })),
  ].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).slice(0,8);

  return (
    <>
      <SiteHeader homeIsCurrent />

      <main className="blank-canvas">
       <section className="home-hero" aria-labelledby="hero-title">
        <div className="hero-zone" aria-hidden="true" />

        <div className="hero-copy">
          <p className="hero-kicker">
            <span>{profile.kicker}</span>
            <span className="hero-kicker-line" aria-hidden="true" />
          </p>

          <h1 id="hero-title">
            <span>{profile.firstName}</span>
            <span>{profile.lastName}</span>
          </h1>

          <div className="hero-role">
            <span className="role-line" aria-hidden="true" />
            <p>{profile.role}</p>
          </div>
        </div>

        <div className="hero-visual">
          <LifeCpu />

          <figure className="hero-portrait">
            <span className="portrait-frame portrait-frame-top" aria-hidden="true" />
            <div className="portrait-window">
              {/* Vinext's current Next Image shim crashes during local hydration, so keep this native. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.portrait}
                alt={profile.portraitAlt}
                style={{ objectPosition: profile.portraitObjectPosition }}
              />
            </div>
            <span className="portrait-frame portrait-frame-bottom" aria-hidden="true" />
          </figure>
        </div>

        <div className="circuit-divider" aria-hidden="true">
          <span className="circuit-rail" />
          <span className="circuit-chip" />
          <span className="circuit-trace circuit-trace-a" />
          <span className="circuit-trace circuit-trace-b" />
          <span className="circuit-trace circuit-trace-c" />
          <span className="circuit-trace circuit-trace-d" />
          <span className="circuit-trace circuit-trace-e" />
          <span className="circuit-trace circuit-trace-f" />
          <span className="circuit-node circuit-node-a" />
          <span className="circuit-node circuit-node-b" />
          <span className="circuit-node circuit-node-c" />
          <span className="circuit-node circuit-node-d" />
          <span className="circuit-node circuit-node-e" />
          <span className="circuit-node circuit-node-f" />
        </div>

       </section>

       <section className="home-signal home-section" aria-labelledby="signal-title">
        <div className="home-section-label"><span>01 / CURRENT SIGNAL</span><i aria-hidden="true" /></div>
        <div className="signal-readout">
          <div><small>BUILDING</small><strong>Turning ideas into real systems.</strong></div>
          <div><small>LEARNING</small><strong>Knowledge compounds. Every system unlocks the next.</strong></div>
          <div><small>EXPLORING</small><strong>From hardware to software to worlds in motion.</strong></div>
        </div>
        <div className="signal-status" aria-hidden="true"><span>LIVE / 03</span><i /><span>UPTIME / ACTIVE</span></div>
        <h2 id="signal-title" className="sr-only">Current signal</h2>
       </section>

       <section className="home-updates home-section" aria-labelledby="updates-title">
        <div className="home-section-label"><span>02 / NEWS &amp; UPDATES</span><i aria-hidden="true" /></div>
        <div className="updates-heading"><h2 id="updates-title">NEWS &amp; UPDATES</h2><p>Notes from the platform, the workshop and the work in progress.</p></div>
        <div className="updates-feed">
          {updates.map((item) => <article className={`update-item${item.media_reference ? ' update-item-media' : ''}`} key={`${item.kind}-${item.id}`}>
            <time>{new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Europe/Stockholm'}).format(new Date(item.date)).replace(',',' ·')}<b>CET</b></time>
            <div className="update-copy"><small>{item.label}</small><h3>{item.title}</h3>{item.kind==='news'&&item.excerpt&&<p>{item.excerpt}</p>}</div>
            {item.media_reference&&<img className="update-image" src={item.media_reference} alt={item.mediaAlt ?? ''} style={item.kind === 'activity' ? { objectPosition: `${item.media_position_x}% ${item.media_position_y}%` } : undefined} />}
            <a className="update-action" href={item.href}>{item.action} <span aria-hidden="true">↗</span></a>
          </article>)}
          {!updates.length&&<p className="updates-empty">No published updates yet.</p>}
        </div>
       </section>

      <section className="intro" aria-label={`${profile.firstName} ${profile.lastName}`}>
        <div className="intro-scene">
          <div className="falling-cube">
            <span className="cube-shine" />
          </div>

          <div className="corner corner-top-left">
            <span className="corner-horizontal" />
            <span className="corner-vertical" />
          </div>

          <div className="corner corner-bottom-right">
            <span className="corner-horizontal" />
            <span className="corner-vertical" />
          </div>

          <h1 className="intro-name">
            <span>{profile.firstName}</span>
            <span>{profile.lastName}</span>
          </h1>
        </div>
      </section>
      </main>
    </>
  );
}
