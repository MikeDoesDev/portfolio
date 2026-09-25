// Cross-checks the published simulation trace against a TypeScript model of
// the single-cycle datapath: every recorded ALU input, result, immediate,
// writeback, memory read and next PC must follow from the decoded instruction
// and the machine state so far. Run with: npm run test:processor
import assert from "node:assert/strict";
import trace from "./trace.json";
import { aluResult, CONTROL, decode, MASK, ZERO } from "./decode";

const big = (value: string | null) => (value === null ? null : BigInt(`0x${value}`));
let checks = 0;
const equal = (actual: unknown, expected: unknown, where: string) => { assert.equal(actual, expected, where); checks++; };

const memory = new Map<bigint, bigint>(Object.entries(trace.memory).map(([addr, value]) => [BigInt(`0x${addr}`), BigInt(`0x${value}`)]));
const registers = new Map<number, bigint>();
const read = (n: number) => (n === 31 ? ZERO : registers.get(n));

for (const program of trace.programs) {
  program.cycles.forEach((cycle, i) => {
    const pc = big(cycle.pc)!;
    const where = `${program.name} PC ${cycle.pc}`;
    const d = decode(Number(`0x${cycle.instruction}`), pc);
    const c = cycle.control as Record<string, number | null>;
    for (const [signal, expected] of Object.entries(CONTROL[d.mnemonic])) equal(c[signal], expected, `${where} ${d.mnemonic} ${signal}`);

    // Register reads, when the register already holds a known value.
    const usesA = d.format === "R" || d.format === "I" || d.format === "D";
    const usesB = d.format === "R" || d.mnemonic === "CBZ" || d.mnemonic === "STUR";
    const a = read(d.rn), b = read(c.Reg2Loc === 1 ? d.rd : d.rm);
    if (usesA && a !== undefined) equal(big(cycle.busA), a, `${where} bus A`);
    if (usesB && b !== undefined) equal(big(cycle.busB), b, `${where} bus B`);

    // Sign extender (a don't-care for register-to-register instructions),
    // ALU input mux, ALU and zero flag.
    if (d.format !== "R") equal(big(cycle.extimm), d.imm & MASK, `${where} immediate`);
    const aluB = c.ALUSrc ? d.imm & MASK : big(cycle.busB)!;
    equal(big(cycle.aluB), aluB, `${where} ALU B input`);
    const alu = aluResult(d.mnemonic, big(cycle.busA) ?? ZERO, aluB);
    if (d.mnemonic !== "B") {
      equal(big(cycle.alu), alu, `${where} ALU result`);
      equal(cycle.zero, alu === ZERO ? 1 : 0, `${where} zero flag`);
    }

    // Data memory and writeback.
    if (d.mnemonic === "LDUR") {
      const stored = memory.get(alu);
      if (stored !== undefined) equal(big(cycle.memdata), stored, `${where} memory read`);
    }
    if (d.mnemonic === "STUR") memory.set(alu, big(cycle.busB)!);
    if (c.RegWrite) {
      equal(big(cycle.writeback), c.MemtoReg ? big(cycle.memdata) : alu, `${where} writeback`);
      if (d.rd !== 31) registers.set(d.rd, big(cycle.writeback)!);
    }

    // Next PC: branch target when taken, otherwise PC + 4.
    const taken = c.Uncondbranch === 1 || (c.Branch === 1 && cycle.zero === 1);
    equal(big(cycle.nextpc), (taken ? pc + d.imm : pc + BigInt(4)) & MASK, `${where} next PC`);
    const next = program.cycles[i + 1];
    if (next) equal(next.pc, cycle.nextpc, `${where} fetches the next PC`);
  });
}

const [first, second] = trace.programs;
equal(first.cycles.at(-1)!.pc, "30", "Program 1 ends at 0x30");
equal(first.cycles.at(-1)!.writeback, "f", "Program 1 result is 0xF");
equal(second.cycles.at(-1)!.pc, "54", "Program 2 ends at 0x54");
equal(second.cycles.at(-1)!.writeback, "123456789abcdef0", "Program 2 loads back 0x123456789abcdef0");
console.log(`${checks} checks passed across ${first.cycles.length + second.cycles.length} cycles`);
