export default function LifeCpu() {
  return (
    <div
      className="hero-life-cpu"
      role="img"
      aria-label="A CPU connected to symbols for sport, work, development, learning and life outside engineering"
    >
      <svg viewBox="0 0 440 310" aria-hidden="true" focusable="false">
        {/* Long unfinished traces make the circuit feel embedded in the hero, not pasted onto it. */}
        <g className="life-cpu-ambient">
          <path d="M0 156H78V135H171" />
          <path d="M269 151H324V104H440" />
          <path d="M196 110V82H164V30" />
          <path d="M220 110V47" />
          <path d="M244 110V84H276V18" />
          <path d="M171 172H132V191H34" />
          <path d="M212 208V286" />

        </g>

        <g className="life-cpu-open-terminals">
          <circle cx="164" cy="30" r="4" />
          <circle cx="220" cy="47" r="4" />
          <circle cx="276" cy="18" r="4" />
          <circle cx="34" cy="191" r="4" />
          <circle cx="212" cy="286" r="4" />
        </g>

        {/* Five connected branches represent the main parts of Fadi's life. */}
        <g className="life-cpu-traces">
          <path d="M171 124H139V62H109" />
          <path d="M269 125H300V60H318" />
          <path d="M269 151H354" />
          <path d="M252 208V250H306" />
          <path d="M188 208V254H116" />
        </g>

        {/* Each signal runs once on arrival; the graphic stays calm afterwards. */}
        <g className="life-cpu-signals">
          <path className="life-cpu-signal life-cpu-signal-a" pathLength="1" d="M171 124H139V62H109" />
          <path className="life-cpu-signal life-cpu-signal-b" pathLength="1" d="M269 125H300V60H318" />
          <path className="life-cpu-signal life-cpu-signal-c" pathLength="1" d="M269 151H354" />
          <path className="life-cpu-signal life-cpu-signal-d" pathLength="1" d="M252 208V250H306" />
          <path className="life-cpu-signal life-cpu-signal-e" pathLength="1" d="M188 208V254H116" />
        </g>

        <g className="life-cpu-chip">
          <rect className="life-cpu-chip-shell" x="171" y="110" width="98" height="98" rx="13" />
          <rect className="life-cpu-chip-core" x="184" y="123" width="72" height="72" rx="8" />
          <path d="M191 96V110M210 96V110M230 96V110M249 96V110" />
          <path d="M191 208V222M210 208V222M230 208V222M249 208V222" />
          <path d="M157 130H171M157 149H171M157 169H171M157 188H171" />
          <path d="M269 130H283M269 149H283M269 169H283M269 188H283" />
          <text x="220" y="164">CPU</text>
        </g>

        <g className="life-cpu-node life-cpu-node-sport" transform="translate(85 62)">
          <circle r="24" />
          <path d="M-11-3V3M-7-7V7M7-7V7M11-3V3M-7 0H7" />
        </g>
        <g className="life-cpu-node life-cpu-node-work" transform="translate(342 60)">
          <circle r="24" />
          <path d="M-10-7H10V8H-10ZM-4-7V-10H4V-7M-10-1H10M-2-2V2H2V-2" />
        </g>
        <g className="life-cpu-node life-cpu-node-code" transform="translate(378 151)">
          <circle r="24" />
          <path d="M-2-8-10 0-2 8M2-8 10 0 2 8" />
        </g>
        <g className="life-cpu-node life-cpu-node-growth" transform="translate(330 250)">
          <circle r="24" />
          <path d="M-10 8-2 0 3 5 11-6M5-6H11V0" />
        </g>
        <g className="life-cpu-node life-cpu-node-life" transform="translate(92 254)">
          <circle r="24" />
          <path d="M0 10C-2 7-11 1-11-6-11-13-2-14 0-7 2-14 11-13 11-6 11 1 2 7 0 10Z" />
        </g>
      </svg>

      {/* Existing CPU branches are routed into a compact, correctly connected amplifier. */}
      <svg className="life-cpu-amplifier" viewBox="0 0 520 200" aria-hidden="true" focusable="false">
        <g className="life-cpu-amp-circuit">
          {/* Only the unused trace above programming continues into the left GND. */}
          <path d="M163 33V24M146 24H180M152 16H174M158 8H168" />

          {/* The restored capacitor branch from the CPU bends upward into +. */}
          <path d="M0 113H130M130 98V128M140 98V128M140 113H195V80H220" />

          {/* The amplifier body has its own top connection to the second GND. */}
          <path d="M278 75V36M261 36H295M267 28H289M273 20H283" />

          <path d="M220 80H228M220 113H228" />
          <path className="life-cpu-amp-body" d="M228 50V150L328 100Z" />
          <path d="M328 100H520" />

          {/* One clean feedback path: output, resistor, then back to the negative input. */}
          <path d="M348 100V180H308L298 168 285 192 272 168 259 192 246 168 236 180H190V113H220" />

          <circle cx="220" cy="80" r="4" />
          <circle cx="220" cy="113" r="4" />
          <circle cx="348" cy="100" r="4" />
          <circle className="life-cpu-amp-output" cx="510" cy="100" r="4" />
          <text x="244" y="82">+</text>
          <text x="244" y="117">−</text>
        </g>

        <g className="life-cpu-amp-signals">
          <path className="life-cpu-amp-signal life-cpu-amp-signal-in" pathLength="1" d="M0 113H130M140 113H195V80H220" />
          <path className="life-cpu-amp-signal life-cpu-amp-signal-out" pathLength="1" d="M328 100H520" />
        </g>
      </svg>
    </div>
  );
}
