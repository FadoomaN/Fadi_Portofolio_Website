import SiteHeader from './site-header';
import CircuitDivider from './circuit-divider';
import LifeCpu from './life-cpu';
import { siteContent } from './site-content';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const { data: storedProfile } = await supabase
    .from('site_profile')
    .select('first_name, last_name, role, kicker')
    .eq('id', 1)
    .maybeSingle();
  const profile = {
    firstName: storedProfile?.first_name ?? siteContent.profile.firstName,
    lastName: storedProfile?.last_name ?? siteContent.profile.lastName,
    role: storedProfile?.role ?? siteContent.profile.role,
    kicker: storedProfile?.kicker ?? siteContent.profile.kicker,
  };

  return (
    <>
      <SiteHeader homeIsCurrent />
      <CircuitDivider />

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
                src={siteContent.profile.portrait.src}
                alt={`${profile.firstName} ${profile.lastName} wearing a gray suit`}
              />
            </div>
            <span className="portrait-frame portrait-frame-bottom" aria-hidden="true" />
          </figure>
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
