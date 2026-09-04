import SiteHeader from '../site-header';
import LoginForm from './login-form';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: membership } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membership) redirect('/admin');
  }

  return (
    <>
      <SiteHeader revealImmediately />
      <main className="login-canvas" aria-label="Administrator login">
        <div className="auth-blueprint" aria-hidden="true">
          {/* One technical field fills the canvas; the login panel stays visually quiet above it. */}
          <svg className="auth-graph-field" viewBox="0 0 1600 900" preserveAspectRatio="none">
            <g className="auth-plot auth-plot-wave">
              <rect x="36" y="108" width="330" height="178" rx="2" />
              <path d="M58 197H344M201 126V267" />
              <path className="auth-plot-signal" d="M58 197C82 143 106 143 130 197S178 251 202 197S250 143 274 197S322 251 344 197" />
              <path className="auth-ticks" d="M89 191V203M130 191V203M166 191V203M237 191V203M274 191V203M315 191V203" />
              <text x="56" y="98">SIGNAL / y = sin(ωt)</text>
            </g>

            <g className="auth-plot auth-plot-vector">
              <rect x="1240" y="102" width="316" height="210" rx="2" />
              <path d="M1266 282H1534M1290 292V126" />
              <path className="auth-plot-signal" d="M1290 282L1458 151M1458 151L1439 158M1458 151L1451 171" />
              <path d="M1290 282L1374 222L1458 282" />
              <circle cx="1374" cy="222" r="5" />
              <text x="1263" y="92">VECTOR SPACE / R³</text>
            </g>

            <g className="auth-plot auth-plot-parabola">
              <rect x="44" y="596" width="356" height="220" rx="2" />
              <path d="M70 780H374M222 620V798" />
              <path className="auth-plot-signal" d="M92 760Q222 635 352 760" />
              <path className="auth-ticks" d="M118 774V786M170 774V786M274 774V786M326 774V786M216 680H228M216 720H228" />
              <text x="64" y="585">TRANSFER / f(x) = ax² + bx + c</text>
            </g>

            <g className="auth-plot auth-plot-phase">
              <rect x="1216" y="604" width="340" height="212" rx="2" />
              <path d="M1242 710H1532M1386 626V794" />
              <ellipse className="auth-plot-signal" cx="1386" cy="710" rx="104" ry="54" transform="rotate(-13 1386 710)" />
              <circle cx="1478" cy="681" r="5" />
              <text x="1236" y="593">PHASE / ẋ = Ax</text>
            </g>

            <g className="auth-vector-chain">
              <path d="M436 92L510 92L536 118L622 118" />
              <path d="M1000 792L1076 792L1100 768L1180 768" />
              <circle cx="436" cy="92" r="4" />
              <circle cx="622" cy="118" r="4" />
              <circle cx="1000" cy="792" r="4" />
              <circle cx="1180" cy="768" r="4" />
            </g>
          </svg>

          <span className="auth-formula auth-formula-a">∇ × E = −∂B / ∂t</span>
          <span className="auth-formula auth-formula-b">det(A − λI) = 0</span>
          <span className="auth-formula auth-formula-c">F = m · a</span>
          <span className="auth-formula auth-formula-d">∫Ω ∇ · F dV</span>
          <span className="auth-formula auth-formula-e">Ax = λx</span>
          <span className="auth-formula auth-formula-f">E = mc²</span>
          <span className="auth-formula auth-formula-g">A = QΛQ⁻¹</span>
          <span className="auth-formula auth-formula-h">‖v‖ = √(vᵀv)</span>
          <span className="auth-formula auth-formula-i">iℏ ∂ψ/∂t = Ĥψ</span>
          <span className="auth-formula auth-formula-j">V = I · R</span>
          <span className="auth-formula auth-formula-k">λ₁ + λ₂ = tr(A)</span>
          <span className="auth-formula auth-formula-l">x(t) = A cos(ωt + φ)</span>
          <span className="auth-coordinate auth-coordinate-x">x</span>
          <span className="auth-coordinate auth-coordinate-y">y</span>
          <span className="auth-orbit" />
        </div>

        <section className="login-panel">
          <div className="login-panel-copy">
            <div className="login-math-layer" aria-hidden="true">
              <span>[ A − λI ]v = 0</span>
              <span>Σ F = 0</span>
              <span>∂²u / ∂t² = c²∇²u</span>
            </div>

            <div className="login-kicker">
              <span>Private node</span>
              <span className="login-status"><i /> Encrypted</span>
            </div>

            <div className="login-title-lockup" aria-hidden="true">
              <span className="login-gate login-gate-left" />
              <strong>AUTH</strong>
              <span className="login-gate login-gate-right" />
            </div>

            <div className="login-copy-bottom">
              <p>Administrator access</p>
              <div className="login-protocols" aria-label="Security features">
                <span>HASH</span>
                <span>COOKIE</span>
                <span>RLS</span>
              </div>
            </div>
          </div>

          <div className="login-form-panel">
            <div className="login-form-heading">
              <span>Identity check</span>
              <span>001</span>
            </div>
            <h1>Welcome back.</h1>
            <LoginForm />
            <p className="login-footnote">No public registration. Authorized access only.</p>
          </div>
        </section>
      </main>
    </>
  );
}
