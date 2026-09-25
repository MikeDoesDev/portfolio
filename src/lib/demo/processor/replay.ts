import trace from "./trace.json";
import { decode, type Decoded } from "./decode";

/** Everything the datapath explorer shows for one clock cycle. */
export interface Step {
  t: number;
  pc: bigint;
  word: string;
  decoded: Decoded;
  control: Record<string, number | null>;
  value: Record<"busA" | "busB" | "extimm" | "aluB" | "alu" | "memdata" | "writeback" | "nextpc", bigint | null>;
  zero: number | null;
  readB: number;
  taken: boolean;
  /** Register written at the end of this cycle, if any. */
  wrote?: number;
  /** Data memory access this cycle. */
  access?: { kind: "read" | "write"; address: bigint };
  /** Register and memory contents after this instruction. */
  registers: Map<number, bigint>;
  memory: Map<bigint, bigint>;
}

export interface Program { name: string; title: string; steps: Step[]; listing: { pc: bigint; text: string }[] }

const TITLES = ["Mask a constant, then count it down in a loop", "Build 0x123456789abcdef0 with MOVZ, store it, load it back"];
const big = (value: string | null) => (value === null ? null : BigInt(`0x${value}`));

const initialMemory = () => new Map(Object.entries(trace.memory).map(([addr, value]) => [BigInt(`0x${addr}`), BigInt(`0x${value}`)]));

// The testbench runs Program 2 right after Program 1 without clearing
// registers or data memory, so state carries over from one to the next.
const registers = new Map<number, bigint>();
const memory = initialMemory();

export const PROGRAMS: Program[] = trace.programs.map((program, p) => {
  const steps = program.cycles.map(cycle => {
    const pc = big(cycle.pc)!;
    const decoded = decode(Number(`0x${cycle.instruction}`), pc);
    const control = cycle.control as Record<string, number | null>;
    const value = {
      busA: big(cycle.busA), busB: big(cycle.busB), extimm: big(cycle.extimm), aluB: big(cycle.aluB), alu: big(cycle.alu),
      memdata: big(cycle.memdata), writeback: big(cycle.writeback), nextpc: big(cycle.nextpc),
    };
    const step: Step = {
      t: cycle.t, pc, word: cycle.instruction, decoded, control, value, zero: cycle.zero,
      readB: control.Reg2Loc === 1 ? decoded.rd : decoded.rm,
      taken: control.Uncondbranch === 1 || (control.Branch === 1 && cycle.zero === 1),
      registers, memory,
    };
    if (control.MemRead === 1) step.access = { kind: "read", address: value.alu! };
    if (control.MemWrite === 1) {
      step.access = { kind: "write", address: value.alu! };
      memory.set(value.alu!, value.busB!);
    }
    if (control.RegWrite === 1 && decoded.rd !== 31) {
      step.wrote = decoded.rd;
      registers.set(decoded.rd, value.writeback!);
    }
    step.registers = new Map(registers);
    step.memory = new Map(memory);
    return step;
  });
  const listing = [...new Map(steps.map(step => [step.pc, step.decoded.text])).entries()].sort((a, b) => Number(a[0] - b[0])).map(([pc, text]) => ({ pc, text }));
  return { name: program.name, title: TITLES[p] ?? program.name, steps, listing };
});
