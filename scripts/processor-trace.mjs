// Turns the processor testbench's VCD dump into per-cycle JSON for the
// datapath explorer. The Verilog and the VCD stay private (course work); only
// the recorded signal values are published.
//
// Usage: node scripts/processor-trace.mjs <path/to/singlecycle.vcd> [out.json]
import { readFileSync, writeFileSync } from "node:fs";

const [vcdPath, outPath = "src/lib/demo/processor/trace.json"] = process.argv.slice(2);
if (!vcdPath) throw new Error("Pass the path to singlecycle.vcd");
const text = readFileSync(vcdPath, "utf8");

// Signals to keep, by their name inside the processor (the `uut` scope).
const SIGNALS = ["currentpc", "instruction", "rn", "rm", "rd", "Reg2Loc", "ALUSrc", "MemtoReg", "RegWrite", "MemRead", "MemWrite",
  "Branch", "Uncondbranch", "ALUop", "SignOp", "regoutA", "regoutB", "extimm", "aluBin", "aluout", "zero", "memdata", "MemtoRegOut", "nextpc"];
const TOP = ["CLK", "Reset"];

// ── Header: map each wanted signal to its VCD identifier code.
const code = {};
const scope = [];
// Parse line by line: identifier codes may themselves contain "$".
const header = text.slice(0, text.indexOf("$enddefinitions"));
for (const line of header.split(/\r?\n/)) {
  const parts = line.trim().split(/\s+/);
  if (parts[0] === "$scope") scope.push(parts[2]);
  else if (parts[0] === "$upscope") scope.pop();
  else if (parts[0] === "$var") {
    const [, , , id, name] = parts;
    const path = [...scope, name].join(".");
    for (const signal of SIGNALS) if (path === `SingleCycleProcTest_v.uut.${signal}`) code[signal] = id;
    for (const signal of TOP) if (path === `SingleCycleProcTest_v.${signal}`) code[signal] = id;
  }
}
for (const signal of [...SIGNALS, ...TOP]) if (!code[signal]) throw new Error(`Signal not found in VCD: ${signal}`);

// ── Body: replay value changes, keeping a snapshot after every timestamp.
const value = {};
const snapshots = [];
let time = null;
const body = text.slice(text.indexOf("$enddefinitions")).split(/\r?\n/);
const snap = () => { if (time !== null) snapshots.push({ time, ...Object.fromEntries(Object.entries(code).map(([s, id]) => [s, value[id]])) }); };
for (const raw of body) {
  const line = raw.trim();
  if (!line || line.startsWith("$")) continue;
  if (line[0] === "#") { snap(); time = Number(line.slice(1)); continue; }
  if (line[0] === "b" || line[0] === "B") {
    const [bits, id] = line.slice(1).split(/\s+/);
    value[id] = bits;
  } else value[line.slice(1)] = line[0];
}
snap();

// ── Cycles: from one rising clock edge to the next, sampled just before the
// next edge, when every combinational value for that instruction has settled.
const hex = bits => (bits === undefined || /[xz]/i.test(bits) ? null : BigInt(`0b${bits}`).toString(16));
const num = bits => (bits === undefined || /[xz]/i.test(bits) ? null : Number(BigInt(`0b${bits}`)));
const edges = [];
for (let i = 1; i < snapshots.length; i++) if (snapshots[i - 1].CLK === "0" && snapshots[i].CLK === "1") edges.push(i);
const cycles = [];
for (let e = 0; e < edges.length; e++) {
  const start = snapshots[edges[e]];
  // The simulation's last cycle has no closing edge; sample where it stops.
  const end = e + 1 < edges.length ? snapshots[edges[e + 1] - 1] : snapshots[snapshots.length - 1];
  // A program's first instruction runs during the last cycle that reset is
  // held, and its result commits as reset releases, so keep that cycle too.
  const releasing = start.Reset === "1" && e + 1 < edges.length && snapshots[edges[e + 1]].Reset === "0";
  if ((start.Reset !== "0" && !releasing) || hex(end.currentpc) === null) continue;
  cycles.push({
    t: end.time / 1000,
    pc: hex(end.currentpc), instruction: hex(end.instruction).padStart(8, "0"),
    rn: num(end.rn), rm: num(end.rm), rd: num(end.rd),
    control: {
      Reg2Loc: num(end.Reg2Loc), ALUSrc: num(end.ALUSrc), MemtoReg: num(end.MemtoReg), RegWrite: num(end.RegWrite), MemRead: num(end.MemRead),
      MemWrite: num(end.MemWrite), Branch: num(end.Branch), Uncondbranch: num(end.Uncondbranch), ALUop: num(end.ALUop), SignOp: num(end.SignOp),
    },
    busA: hex(end.regoutA), busB: hex(end.regoutB), extimm: hex(end.extimm), aluB: hex(end.aluBin), alu: hex(end.aluout), zero: num(end.zero),
    memdata: hex(end.memdata), writeback: hex(end.MemtoRegOut), nextpc: hex(end.nextpc),
    releasing,
  });
}

// ── Programs: each one starts at the cycle where reset releases.
const programs = [];
let current = [];
for (const cycle of cycles) {
  if (cycle.releasing && current.length) {
    programs.push(current);
    current = [];
  }
  current.push(cycle);
}
programs.push(current);
for (const program of programs) for (const cycle of program) delete cycle.releasing;

const out = {
  source: "Icarus Verilog run of the ECEN 350 single-cycle processor testbench",
  clockPeriodNs: 120,
  memory: { "0": "1", "8": "a", "10": "5", "18": "ffbea7deadbeeff", "20": "0" },
  programs: programs.map((cycles, i) => ({ name: `Program ${i + 1}`, cycles })),
};
writeFileSync(outPath, JSON.stringify(out) + "\n");
console.log(`${cycles.length} cycles in ${programs.length} programs -> ${outPath}`);
for (const program of out.programs) {
  const last = program.cycles[program.cycles.length - 1];
  console.log(`${program.name}: ${program.cycles.length} cycles, PC ${program.cycles[0].pc} -> ${last.pc}, final writeback ${last.writeback}`);
}
