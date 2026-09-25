"use client";

import { useEffect, useState } from "react";
import { DESCRIBE, hex, reg } from "@/lib/demo/processor/decode";
import { PROGRAMS, type Step } from "@/lib/demo/processor/replay";

const SIGNALS = ["Reg2Loc", "ALUSrc", "MemtoReg", "RegWrite", "MemRead", "MemWrite", "Branch", "Uncondbranch", "ALUop", "SignOp"] as const;
const show = (value: bigint | null | undefined) => (value === null || value === undefined ? "x" : hex(value));

/** Which parts of the datapath this instruction actually uses. */
function usage(step: Step) {
  const { format, mnemonic } = step.decoded;
  const c = step.control;
  return {
    a: format === "R" || format === "I" || format === "D",
    b: format === "R" || mnemonic === "CBZ" || mnemonic === "STUR",
    imm: format !== "R",
    alu: mnemonic !== "B",
    mem: c.MemRead === 1 || c.MemWrite === 1,
  };
}

interface Wire { id: string; label: string; points: string; active: (s: Step) => boolean; value: (s: Step) => string }

const WIRES: Wire[] = [
  { id: "pc", label: "PC to instruction memory", points: "80,260 120,260", active: () => true, value: s => show(s.pc) },
  { id: "pc-next", label: "PC to next-PC logic", points: "55,230 55,65 560,65", active: () => true, value: s => show(s.pc) },
  { id: "opcode", label: "Opcode to control", points: "185,180 185,110 268,110", active: () => true, value: s => s.decoded.mnemonic },
  { id: "rn", label: "Read register 1 (Rn)", points: "250,210 400,210", active: s => usage(s).a, value: s => reg(s.decoded.rn) },
  { id: "rm", label: "Rm field to the Reg2Loc mux", points: "250,258 345,258", active: s => usage(s).b && s.control.Reg2Loc === 0, value: s => reg(s.decoded.rm) },
  { id: "rt", label: "Rt field to the Reg2Loc mux", points: "250,286 345,286", active: s => usage(s).b && s.control.Reg2Loc === 1, value: s => reg(s.decoded.rd) },
  { id: "read2", label: "Read register 2", points: "361,272 400,272", active: s => usage(s).b, value: s => reg(s.readB) },
  { id: "rd", label: "Write register (Rd)", points: "250,320 400,320", active: s => s.control.RegWrite === 1, value: s => reg(s.decoded.rd) },
  { id: "imm-in", label: "Instruction to the sign extender", points: "185,340 185,415 410,415", active: s => usage(s).imm, value: s => s.word },
  { id: "data1", label: "Read data 1 to ALU input A", points: "545,220 640,220", active: s => usage(s).a, value: s => show(s.value.busA) },
  { id: "data2", label: "Read data 2 to the ALUSrc mux", points: "545,300 592,300", active: s => usage(s).b && s.control.ALUSrc === 0, value: s => show(s.value.busB) },
  { id: "store", label: "Read data 2 to data memory (store data)", points: "565,300 565,382 752,382 752,332 770,332", active: s => s.control.MemWrite === 1, value: s => show(s.value.busB) },
  { id: "imm-alu", label: "Extended immediate to the ALUSrc mux", points: "520,415 578,415 578,322 592,322", active: s => s.control.ALUSrc === 1, value: s => show(s.value.extimm) },
  { id: "imm-next", label: "Extended immediate to next-PC logic", points: "550,415 550,120 612,120 612,100", active: s => s.control.Branch === 1 || s.control.Uncondbranch === 1, value: s => show(s.value.extimm) },
  { id: "alu-b", label: "ALU input B", points: "608,303 640,303", active: s => usage(s).alu, value: s => show(s.value.aluB) },
  { id: "address", label: "ALU result as the memory address", points: "715,265 745,265 745,287 770,287", active: s => usage(s).mem, value: s => show(s.value.alu) },
  { id: "bypass", label: "ALU result to the MemtoReg mux", points: "745,265 745,195 905,195 905,268 920,268", active: s => s.control.RegWrite === 1 && s.control.MemtoReg === 0, value: s => show(s.value.alu) },
  { id: "zero", label: "ALU zero flag", points: "700,223 700,100", active: s => s.control.Branch === 1, value: s => String(s.zero ?? "x") },
  { id: "load", label: "Read data to the MemtoReg mux", points: "890,295 920,295", active: s => s.control.MemRead === 1, value: s => show(s.value.memdata) },
  { id: "writeback", label: "Writeback to the register file", points: "936,281 966,281 966,478 380,478 380,345 400,345", active: s => s.control.RegWrite === 1, value: s => show(s.value.writeback) },
  { id: "next", label: "Next PC", points: "730,65 762,65 762,14 12,14 12,260 30,260", active: () => true, value: s => show(s.value.nextpc) },
];

function Datapath({ step, onHover }: { step: Step; onHover: (wire: Wire | null) => void }) {
  const use = usage(step);
  const c = step.control;
  const on = (active: boolean) => (active ? "dp-block dp-on" : "dp-block");
  return <svg viewBox="0 0 1000 500" className="dp" role="img" aria-label={`Datapath executing ${step.decoded.text}`}>
    <defs>
      <marker id="dp-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" className="dp-arrowhead" /></marker>
    </defs>
    {WIRES.map(wire => {
      const active = wire.active(step);
      return <g key={wire.id} onMouseEnter={() => onHover(wire)} onMouseLeave={() => onHover(null)}>
        <polyline points={wire.points} className={active ? "dp-wire dp-live" : "dp-wire"} markerEnd={active ? "url(#dp-arrow)" : undefined} />
        <polyline points={wire.points} className="dp-hit" />
      </g>;
    })}
    <rect x="30" y="230" width="50" height="60" rx="6" className="dp-block dp-on" />
    <text x="55" y="253" className="dp-title">PC</text>
    <text x="55" y="275" className="dp-value">{show(step.pc)}</text>
    <rect x="120" y="180" width="130" height="160" rx="8" className="dp-block dp-on" />
    <text x="185" y="206" className="dp-title">Instruction</text>
    <text x="185" y="222" className="dp-title">memory</text>
    <text x="185" y="262" className="dp-value">{step.word}</text>
    <ellipse cx="330" cy="110" rx="62" ry="24" className="dp-block dp-on" />
    <text x="330" y="115" className="dp-title">Control</text>
    <rect x="345" y="248" width="16" height="48" rx="8" className={on(use.b)} />
    <text x="353" y="242" className="dp-small">Reg2Loc</text>
    <rect x="400" y="180" width="145" height="180" rx="8" className="dp-block dp-on" />
    <text x="472" y="198" className="dp-title">Registers</text>
    <text x="408" y="214" className="dp-port">read 1</text>
    <text x="408" y="276" className="dp-port">read 2</text>
    <text x="408" y="324" className="dp-port">write reg</text>
    <text x="408" y="349" className="dp-port">write data</text>
    <text x="537" y="224" className="dp-port dp-end">data 1</text>
    <text x="537" y="304" className="dp-port dp-end">data 2</text>
    <rect x="410" y="395" width="110" height="40" rx="20" className={on(use.imm)} />
    <text x="465" y="419" className="dp-title">Sign extend</text>
    <text x="465" y="452" className="dp-value">{use.imm ? show(step.value.extimm) : ""}</text>
    <rect x="592" y="272" width="16" height="62" rx="8" className={on(use.alu)} />
    <text x="600" y="265" className="dp-small">ALUSrc</text>
    <polygon points="640,195 715,230 715,300 640,335 640,285 655,265 640,245" className={on(use.alu)} />
    <text x="684" y="270" className="dp-title">ALU</text>
    <text x="678" y="357" className="dp-value">{use.alu ? `= ${show(step.value.alu)}` : ""}</text>
    <rect x="770" y="215" width="120" height="150" rx="8" className={on(use.mem)} />
    <text x="830" y="238" className="dp-title">Data</text>
    <text x="830" y="254" className="dp-title">memory</text>
    <text x="778" y="282" className="dp-port">address</text>
    <text x="778" y="328" className="dp-port">write data</text>
    <text x="882" y="309" className="dp-port dp-end">read data</text>
    <rect x="920" y="250" width="16" height="62" rx="8" className={on(c.RegWrite === 1)} />
    <text x="928" y="243" className="dp-small">MemtoReg</text>
    <rect x="560" y="30" width="170" height="70" rx="8" className="dp-block dp-on" />
    <text x="645" y="56" className="dp-title">Next-PC logic</text>
    <text x="645" y="80" className="dp-value">{step.taken ? `branch to ${show(step.value.nextpc)}` : `PC + 4 = ${show(step.value.nextpc)}`}</text>
    <text x="645" y="472" className="dp-value">{c.RegWrite === 1 ? `${reg(step.decoded.rd)} ← ${show(step.value.writeback)}` : ""}</text>
  </svg>;
}

export default function DatapathExplorer() {
  const [p, setP] = useState(0);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hover, setHover] = useState<Wire | null>(null);
  const program = PROGRAMS[p];
  const steps = program.steps;
  const step = steps[i];
  const last = steps.length - 1;

  // While playing, advance one cycle every 650 ms and stop on the last one.
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      setI(n => Math.min(n + 1, last));
      if (i + 1 >= last) setPlaying(false);
    }, 650);
    return () => clearTimeout(timer);
  }, [playing, i, last]);

  const choose = (index: number) => { setP(index); setI(0); setPlaying(false); };
  const jumpTo = (pc: bigint) => {
    const after = steps.findIndex((s, n) => n > i && s.pc === pc);
    setI(after >= 0 ? after : steps.findIndex(s => s.pc === pc));
    setPlaying(false);
  };
  const kind = (s: Step) => (s.decoded.mnemonic === "LDUR" || s.decoded.mnemonic === "STUR" ? "mem" : s.decoded.format === "B" || s.decoded.format === "CB" ? "branch" : "alu");

  return <div className="dpx">
    <div className="gs-tabs" role="tablist" aria-label="Test programs">
      {PROGRAMS.map((entry, index) => <button key={entry.name} type="button" role="tab" aria-selected={index === p} onClick={() => choose(index)}>{entry.name}</button>)}
    </div>
    <p className="dpx-title">{program.title}. {steps.length} clock cycles.</p>
    <div className="diagram-scroll dpx-diagram" tabIndex={0} role="region" aria-label="Datapath diagram. Scroll sideways on small screens.">
      <Datapath step={step} onHover={setHover} />
    </div>
    <p className="dpx-readout" aria-live="polite">{hover ? <><strong>{hover.label}:</strong> {hover.value(step)}{hover.active(step) ? "" : " (not used by this instruction)"}</> : "Point at or tap a wire to read its value this cycle. Lit wires are the ones this instruction uses."}</p>
    <div className="gs-controls dpx-controls">
      <button type="button" className="gs-button" onClick={() => { setI(0); setPlaying(false); }} disabled={i === 0} aria-label="First cycle">⏮</button>
      <button type="button" className="gs-button" onClick={() => { setI(n => Math.max(0, n - 1)); setPlaying(false); }} disabled={i === 0} aria-label="Previous cycle">◀</button>
      <button type="button" className="gs-button gs-primary" onClick={() => (i >= last ? (setI(0), setPlaying(true)) : setPlaying(v => !v))}>{playing ? "Pause" : "Play"}</button>
      <button type="button" className="gs-button" onClick={() => { setI(n => Math.min(last, n + 1)); setPlaying(false); }} disabled={i === last} aria-label="Next cycle">▶</button>
      <button type="button" className="gs-button" onClick={() => { setI(last); setPlaying(false); }} disabled={i === last} aria-label="Last cycle">⏭</button>
      <input type="range" min={0} max={last} value={i} onChange={e => { setI(Number(e.target.value)); setPlaying(false); }} aria-label="Clock cycle" className="dpx-slider" />
      <span className="dpx-count">Cycle {i + 1} of {steps.length} · {(step.t / 1000).toFixed(3)} µs</span>
    </div>
    <div className="dpx-timeline" aria-hidden="true">
      {steps.map((s, n) => <button key={n} type="button" tabIndex={-1} data-kind={kind(s)} data-now={n === i || undefined} onClick={() => { setI(n); setPlaying(false); }} title={`Cycle ${n + 1}: ${s.decoded.text}`} />)}
    </div>
    <p className="dpx-legend"><span data-kind="alu" />ALU instruction <span data-kind="mem" />load or store <span data-kind="branch" />branch</p>
    <div className="dpx-panels">
      <section>
        <h3>Instruction</h3>
        <p className="dpx-asm">{step.decoded.text}</p>
        <p className="dpx-meta">PC {show(step.pc)} · {step.word} · {step.decoded.format}-type</p>
        <p>{DESCRIBE[step.decoded.mnemonic]}</p>
        <p className="dpx-meta">{step.decoded.format === "CB" || step.decoded.format === "B" ? (step.taken ? `Branch taken to ${show(step.value.nextpc)}.` : `Branch not taken; next is ${show(step.value.nextpc)}.`) : `Next instruction at ${show(step.value.nextpc)}.`}</p>
      </section>
      <section>
        <h3>Control signals</h3>
        <ul className="dpx-signals">{SIGNALS.map(signal => <li key={signal} data-on={step.control[signal] ? true : undefined}><span>{signal}</span><strong>{step.control[signal] ?? "x"}</strong></li>)}</ul>
      </section>
      <section>
        <h3>Program</h3>
        <ol className="dpx-listing">{program.listing.map(line => <li key={String(line.pc)}><button type="button" data-now={line.pc === step.pc || undefined} onClick={() => jumpTo(line.pc)}><span>{show(line.pc)}</span>{line.text}</button></li>)}</ol>
      </section>
      <section>
        <h3>After this cycle</h3>
        <ul className="dpx-state">
          {[...step.registers.entries()].sort((a, b) => a[0] - b[0]).map(([n, v]) => <li key={`r${n}`} data-now={step.wrote === n || undefined}><span>{reg(n)}</span>{show(v)}</li>)}
          {[...step.memory.entries()].sort((a, b) => Number(a[0] - b[0])).map(([address, v]) => <li key={`m${address}`} data-now={step.access?.address === address || undefined}><span>mem[{show(address)}]</span>{show(v)}</li>)}
        </ul>
      </section>
    </div>
  </div>;
}
