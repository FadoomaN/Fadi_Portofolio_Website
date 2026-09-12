function DesktopCircuit() {
  return (
    <svg className="life-cpu-desktop" viewBox="0 0 600 310" aria-hidden="true" focusable="false">
      <g className="life-cpu-ambient">
        <path d="M0 150H60V135H130" />
        <path d="M155 105V78H125V28" />
        <path d="M180 105V45" />
        <path d="M205 105V75H240V18" />
        <path d="M130 172H95V190H25" />
        <path d="M180 205V294" />
      </g>

      <g className="life-cpu-open-terminals">
        <circle cx="125" cy="28" r="4" />
        <circle cx="180" cy="45" r="4" />
        <circle cx="240" cy="18" r="4" />
        <circle cx="25" cy="190" r="4" />
        <circle cx="180" cy="294" r="4" />
      </g>

      <g className="life-cpu-traces">
        <path d="M130 120H102V55H72" />
        <path d="M230 120H252V52H258" />
        <path d="M230 150H293" />
        <path d="M210 205V255H268" />
        <path d="M150 205V255H77" />
      </g>

      <g className="life-cpu-signals">
        <path className="life-cpu-signal life-cpu-signal-a" pathLength="1" d="M130 120H102V55H72" />
        <path className="life-cpu-signal life-cpu-signal-b" pathLength="1" d="M230 120H252V52H258" />
        <path className="life-cpu-signal life-cpu-signal-c" pathLength="1" d="M230 150H293" />
        <path className="life-cpu-signal life-cpu-signal-d" pathLength="1" d="M210 205V255H268" />
        <path className="life-cpu-signal life-cpu-signal-e" pathLength="1" d="M150 205V255H77" />
      </g>

      <g className="life-cpu-chip">
        <rect className="life-cpu-chip-shell" x="130" y="105" width="100" height="100" rx="13" />
        <rect className="life-cpu-chip-core" x="144" y="119" width="72" height="72" rx="8" />
        <path d="M150 91V105M170 91V105M190 91V105M210 91V105" />
        <path d="M150 205V219M170 205V219M190 205V219M210 205V219" />
        <path d="M116 125H130M116 145H130M116 165H130M116 185H130" />
        <path d="M230 125H244M230 145H244M230 165H244M230 185H244" />
        <text x="180" y="160">CPU</text>
      </g>

      <g className="life-cpu-node life-cpu-node-sport" transform="translate(50 55)">
        <circle r="22" />
        <path d="M-11-3V3M-7-7V7M7-7V7M11-3V3M-7 0H7" />
      </g>
      <g className="life-cpu-node life-cpu-node-work" transform="translate(280 52)">
        <circle r="22" />
        <path d="M-10-7H10V8H-10ZM-4-7V-10H4V-7M-10-1H10M-2-2V2H2V-2" />
      </g>
      <g className="life-cpu-node life-cpu-node-code" transform="translate(315 150)">
        <circle r="22" />
        <path d="M-2-8-10 0-2 8M2-8 10 0 2 8" />
      </g>
      <g className="life-cpu-node life-cpu-node-growth" transform="translate(290 255)">
        <circle r="22" />
        <path d="M-10 8-2 0 3 5 11-6M5-6H11V0" />
      </g>
      <g className="life-cpu-node life-cpu-node-life" transform="translate(55 255)">
        <circle r="22" />
        <path d="M0 10C-2 7-11 1-11-6-11-13-2-14 0-7 2-14 11-13 11-6 11 1 2 7 0 10Z" />
      </g>

      <g className="life-cpu-amp-circuit">
        {/* A separate upper CPU trace owns this ground; programming ends at its circle. */}
        <path d="M244 125H260V88H360V62M341 62H379M347 52H373M353 42H367" />

        {/* The lower CPU pin runs through the capacitor and directly into +. */}
        <path d="M244 185H345M345 169V201M357 169V201M357 185H378V140H390" />

        <path d="M390 140H398M390 180H398" />
        <path className="life-cpu-amp-body" d="M398 90V210L500 150Z" />

        {/* The amplifier's upper edge is physically wired to its own ground. */}
        <path d="M445 118V62M426 62H464M432 52H458M438 42H452" />

        <path d="M500 150H596" />
        <path d="M520 150V280H490L480 268 468 292 456 268 444 292 432 268 422 280H378V180H390" />

        <circle cx="390" cy="140" r="4" />
        <circle cx="390" cy="180" r="4" />
        <circle cx="520" cy="150" r="4" />
        <circle className="life-cpu-amp-output" cx="596" cy="150" r="4" />
        <text x="416" y="142">+</text>
        <text x="416" y="182">−</text>
      </g>

      <g className="life-cpu-amp-signals">
        <path className="life-cpu-amp-signal life-cpu-amp-signal-in" pathLength="1" d="M244 185H345M357 185H378V140H390" />
        <path className="life-cpu-amp-signal life-cpu-amp-signal-out" pathLength="1" d="M500 150H596" />
      </g>
    </svg>
  );
}

function MobileCircuit() {
  return (
    <svg className="life-cpu-mobile" viewBox="0 0 360 520" aria-hidden="true" focusable="false">
      <g className="life-cpu-ambient">
        <path d="M130 145H96V170H25" />
        <path d="M160 65V38H130V16" />
        <path d="M190 65V26" />
        <path d="M210 65V42H240V14" />
      </g>

      <g className="life-cpu-open-terminals">
        <circle cx="25" cy="170" r="4" />
        <circle cx="130" cy="16" r="4" />
        <circle cx="190" cy="26" r="4" />
        <circle cx="240" cy="14" r="4" />
      </g>

      <g className="life-cpu-traces">
        <path d="M130 85H105V45H77" />
        <path d="M230 85H255V45H263" />
        <path d="M230 135H288" />
        <path d="M210 165V220H278" />
        <path d="M150 165V220H77" />
      </g>

      <g className="life-cpu-signals">
        <path className="life-cpu-signal life-cpu-signal-a" pathLength="1" d="M130 85H105V45H77" />
        <path className="life-cpu-signal life-cpu-signal-b" pathLength="1" d="M230 85H255V45H263" />
        <path className="life-cpu-signal life-cpu-signal-c" pathLength="1" d="M230 135H288" />
        <path className="life-cpu-signal life-cpu-signal-d" pathLength="1" d="M210 165V220H278" />
        <path className="life-cpu-signal life-cpu-signal-e" pathLength="1" d="M150 165V220H77" />
      </g>

      <g className="life-cpu-chip">
        <rect className="life-cpu-chip-shell" x="130" y="65" width="100" height="100" rx="13" />
        <rect className="life-cpu-chip-core" x="144" y="79" width="72" height="72" rx="8" />
        <path d="M150 51V65M170 51V65M190 51V65M210 51V65" />
        <path d="M150 165V179M170 165V179M190 165V179M210 165V179" />
        <path d="M116 85H130M116 105H130M116 125H130M116 145H130" />
        <path d="M230 85H244M230 105H244M230 125H244M230 145H244" />
        <text x="180" y="120">CPU</text>
      </g>

      <g className="life-cpu-node life-cpu-node-sport" transform="translate(55 45)">
        <circle r="22" />
        <path d="M-11-3V3M-7-7V7M7-7V7M11-3V3M-7 0H7" />
      </g>
      <g className="life-cpu-node life-cpu-node-work" transform="translate(285 45)">
        <circle r="22" />
        <path d="M-10-7H10V8H-10ZM-4-7V-10H4V-7M-10-1H10M-2-2V2H2V-2" />
      </g>
      <g className="life-cpu-node life-cpu-node-code" transform="translate(310 135)">
        <circle r="22" />
        <path d="M-2-8-10 0-2 8M2-8 10 0 2 8" />
      </g>
      <g className="life-cpu-node life-cpu-node-growth" transform="translate(300 220)">
        <circle r="22" />
        <path d="M-10 8-2 0 3 5 11-6M5-6H11V0" />
      </g>
      <g className="life-cpu-node life-cpu-node-life" transform="translate(55 220)">
        <circle r="22" />
        <path d="M0 10C-2 7-11 1-11-6-11-13-2-14 0-7 2-14 11-13 11-6 11 1 2 7 0 10Z" />
      </g>

      <g className="life-cpu-amp-circuit">
        <path d="M244 105H260V10H340V65M327 65H353M332 75H348M336 83H344" />

        {/* On narrow screens the capacitor is below the CPU, before the amplifier. */}
        <path d="M170 179V225M154 225H186M154 237H186M170 237V270H82V330H102" />

        <path d="M102 330H110M102 380H110" />
        <path className="life-cpu-amp-body" d="M110 285V425L240 355Z" />

        <path d="M150 307V280H225V250M208 250H242M214 240H236M220 230H230" />

        <path d="M240 355H330V500H180V516" />
        <path d="M260 355V470H232L221 459 209 479 197 459 185 479 173 459 162 470H82V380H102" />

        <circle cx="102" cy="330" r="4" />
        <circle cx="102" cy="380" r="4" />
        <circle cx="260" cy="355" r="4" />
        <circle className="life-cpu-amp-output" cx="180" cy="516" r="4" />
        <text x="130" y="332">+</text>
        <text x="130" y="382">−</text>
      </g>

      <g className="life-cpu-amp-signals">
        <path className="life-cpu-amp-signal life-cpu-amp-signal-in" pathLength="1" d="M170 179V225M170 237V270H82V330H102" />
        <path className="life-cpu-amp-signal life-cpu-amp-signal-out" pathLength="1" d="M240 355H330V500H180V516" />
      </g>
    </svg>
  );
}

export default function LifeCpu() {
  return (
    <div
      className="hero-life-cpu"
      role="img"
      aria-label="A CPU connected to symbols for sport, work, programming, growth and life, followed by a capacitor and amplifier"
    >
      <DesktopCircuit />
      <MobileCircuit />
    </div>
  );
}
