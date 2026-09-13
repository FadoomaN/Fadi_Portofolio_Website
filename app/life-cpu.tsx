'use client';

import { useLayoutEffect, useRef, useState } from 'react';

function DesktopCircuit() {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(600);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fitCircuit = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!height) return;
      const nextWidth = Math.max(600, (width / height) * 310);
      setCanvasWidth(previous => Math.abs(previous - nextWidth) > 0.1 ? nextWidth : previous);
    };

    fitCircuit();
    const observer = new ResizeObserver(fitCircuit);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // Use spare desktop space to separate the CPU and amplifier without scaling them.
  const circuitOffset = (canvasWidth - 600) / 2;
  const cpuShift = Math.min(140, circuitOffset);
  const amplifierShift = Math.min(80, circuitOffset / 2);
  const outputX = canvasWidth - circuitOffset - 4;
  const capacitorLeft = 325 - cpuShift;
  const capacitorRight = 337 - cpuShift;
  const inputBend = 354 + amplifierShift;
  const inputTerminal = 390 + amplifierShift;
  const inputWire = `M${244 - cpuShift} 185H${capacitorLeft}M${capacitorRight} 185H${inputBend}V140H${inputTerminal}`;

  return (
    <svg ref={canvasRef} className="life-cpu-desktop" viewBox={`0 0 ${canvasWidth} 310`} aria-hidden="true" focusable="false">
      <g transform={`translate(${circuitOffset} 0)`}>
      <g transform={`translate(${-cpuShift} 0)`}>
      <g className="life-cpu-ambient">
        <path d="M0 150H60V135H130" />
        <path d="M155 105V78H125V28" />
        <path d="M180 105V45" />
        <path d="M205 105V75H240V18" />
        <path d="M130 172H95V190H25" />
        <path d="M180 205V294" />
      </g>

      <g className="life-cpu-open-terminals">
        <circle cx="0" cy="150" r="4" />
        <circle cx="125" cy="28" r="4" />
        <circle cx="180" cy="45" r="4" />
        <circle cx="240" cy="18" r="4" />
        <circle cx="25" cy="190" r="4" />
        <circle cx="180" cy="294" r="4" />
      </g>

      <g className="life-cpu-traces">
        <path d="M116 125H102V55H72" />
        <path d="M244 125H252V52H258" />
        <path d="M244 145V150H271" />
        <path d="M210 219V255H268" />
        <path d="M150 219V255H77" />
      </g>

      <g className="life-cpu-signals">
        <path className="life-cpu-signal life-cpu-signal-a" pathLength="1" d="M116 125H102V55H72" />
        <path className="life-cpu-signal life-cpu-signal-b" pathLength="1" d="M244 125H252V52H258" />
        <path className="life-cpu-signal life-cpu-signal-c" pathLength="1" d="M244 145V150H271" />
        <path className="life-cpu-signal life-cpu-signal-d" pathLength="1" d="M210 219V255H268" />
        <path className="life-cpu-signal life-cpu-signal-e" pathLength="1" d="M150 219V255H77" />
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
      <g className="life-cpu-node life-cpu-node-code" transform="translate(293 150)">
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
      </g>

      <g className="life-cpu-amp-circuit">
        {/* A separate upper CPU trace owns this ground; programming ends at its circle. */}
        <path transform={`translate(${-cpuShift} 0)`} d="M244 125H260V88H360V62M341 62H379M347 52H373M353 42H367" />

        {/* The lower CPU pin runs through the capacitor and directly into +. */}
        <path d={inputWire} />
        <path d={`M${capacitorLeft} 169V201M${capacitorRight} 169V201`} />

        <g transform={`translate(${amplifierShift} 0)`}>
        <path d="M390 140H398M390 180H398" />
        <path className="life-cpu-amp-body" d="M398 90V210L500 150Z" />

        {/* The amplifier's upper edge is physically wired to its own ground. */}
        <path d="M445 118V62M426 62H464M432 52H458M438 42H452" />

        <path d={`M500 150H${outputX - amplifierShift}`} />
        <path d="M520 150V280H490L480 268 468 292 456 268 444 292 432 268 422 280H378V180H390" />

        <circle cx="390" cy="140" r="4" />
        <circle cx="390" cy="180" r="4" />
        <circle cx="520" cy="150" r="4" />
        <circle className="life-cpu-amp-output" cx={outputX - amplifierShift} cy="150" r="4" />
        <text x="416" y="142">+</text>
        <text x="416" y="182">−</text>
        </g>
      </g>

      <g className="life-cpu-amp-signals">
        <path className="life-cpu-amp-signal life-cpu-amp-signal-in" pathLength="1" d={inputWire} />
        <path className="life-cpu-amp-signal life-cpu-amp-signal-out" pathLength="1" d={`M${500 + amplifierShift} 150H${outputX}`} />
      </g>
      </g>
    </svg>
  );
}

function MobileCircuit() {
  return (
    // The portrait occupies x=238, y=212, width=122 in this same mobile canvas.
    <svg className="life-cpu-mobile" viewBox="0 0 360 380" aria-hidden="true" focusable="false">
      <g className="life-cpu-ambient">
        <path d="M118 118H84V136H22" />
        <path d="M134 54V27H110V12" />
        <path d="M166 54V22" />
        <path d="M182 54V22H218V10" />
      </g>

      <g className="life-cpu-open-terminals">
        <circle cx="22" cy="136" r="3" />
        <circle cx="110" cy="12" r="3" />
        <circle cx="166" cy="22" r="3" />
        <circle cx="218" cy="10" r="3" />
      </g>

      <g className="life-cpu-traces">
        <path d="M106 70H88V48H61" />
        <path d="M214 70H242V38H255" />
        <path d="M214 102H257V115H282" />
        <path d="M182 150V181H265" />
        <path d="M134 150V180H69" />
      </g>

      <g className="life-cpu-signals">
        <path className="life-cpu-signal life-cpu-signal-a" pathLength="1" d="M106 70H88V48H61" />
        <path className="life-cpu-signal life-cpu-signal-b" pathLength="1" d="M214 70H242V38H255" />
        <path className="life-cpu-signal life-cpu-signal-c" pathLength="1" d="M214 102H257V115H282" />
        <path className="life-cpu-signal life-cpu-signal-d" pathLength="1" d="M182 150V181H265" />
        <path className="life-cpu-signal life-cpu-signal-e" pathLength="1" d="M134 150V180H69" />
      </g>

      <g className="life-cpu-chip">
        <rect className="life-cpu-chip-shell" x="118" y="54" width="84" height="84" rx="12" />
        <rect className="life-cpu-chip-core" x="130" y="66" width="60" height="60" rx="8" />
        <path d="M134 42V54M150 42V54M166 42V54M182 42V54" />
        <path d="M134 138V150M150 138V150M166 138V150M182 138V150" />
        <path d="M106 70H118M106 86H118M106 102H118M106 118H118" />
        <path d="M202 70H214M202 86H214M202 102H214M202 118H214" />
        <text x="160" y="100">CPU</text>
      </g>

      <g className="life-cpu-node life-cpu-node-sport" transform="translate(40 48)">
        <circle r="21" />
        <path d="M-11-3V3M-7-7V7M7-7V7M11-3V3M-7 0H7" />
      </g>
      <g className="life-cpu-node life-cpu-node-work" transform="translate(276 38)">
        <circle r="21" />
        <path d="M-10-7H10V8H-10ZM-4-7V-10H4V-7M-10-1H10M-2-2V2H2V-2" />
      </g>
      <g className="life-cpu-node life-cpu-node-code" transform="translate(303 115)">
        <circle r="21" />
        <path d="M-2-8-10 0-2 8M2-8 10 0 2 8" />
      </g>
      <g className="life-cpu-node life-cpu-node-growth" transform="translate(286 181)">
        <circle r="21" />
        <path d="M-10 8-2 0 3 5 11-6M5-6H11V0" />
      </g>
      <g className="life-cpu-node life-cpu-node-life" transform="translate(48 180)">
        <circle r="21" />
        <path d="M0 10C-2 7-11 1-11-6-11-13-2-14 0-7 2-14 11-13 11-6 11 1 2 7 0 10Z" />
      </g>

      <g className="life-cpu-amp-circuit">
        {/* Route below work so the ground wire never crosses its input lead. */}
        <path d="M214 86H230V78H331V53M318 53H344M323 44H339M327 35H335" />

        {/* Keep the capacitor below the CPU and the feedback separate from +. */}
        <path d="M150 150V199M138 199H162M138 209H162M150 209V226H76V268H88" />

        <path d="M88 268H96M88 309H96" />
        <path className="life-cpu-amp-body" d="M96 240V336L178 288Z" />

        <path d="M125 257V232H210V211M198 211H222M202 201H218M206 191H214" />

        <path d="M178 288H234" />
        <path d="M190 288V356H174L168 349 162 363 156 349 150 363 144 349 138 356H64V309H88" />

        <circle cx="88" cy="268" r="3.5" />
        <circle cx="88" cy="309" r="3.5" />
        <circle cx="190" cy="288" r="3.5" />
        <circle className="life-cpu-amp-output" cx="234" cy="288" r="4" />
        <text x="110" y="269">+</text>
        <text x="110" y="310">−</text>
      </g>

      <g className="life-cpu-amp-signals">
        <path className="life-cpu-amp-signal life-cpu-amp-signal-in" pathLength="1" d="M150 150V199M150 209V226H76V268H88" />
        <path className="life-cpu-amp-signal life-cpu-amp-signal-out" pathLength="1" d="M178 288H234" />
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
