/**
 * Decoder for the LEGv8 subset the ECEN 350 processor runs, plus the
 * semantics the datapath explorer and its checks need.
 */
export type Mnemonic = "ADD" | "SUB" | "AND" | "ORR" | "ADDI" | "SUBI" | "LDUR" | "STUR" | "CBZ" | "B" | "MOVZ";
export type Format = "R" | "I" | "D" | "CB" | "B" | "IW";
export interface Decoded { mnemonic: Mnemonic; format: Format; text: string; rd: number; rn: number; rm: number; imm: bigint; hw: number }

const OPCODES: { mnemonic: Mnemonic; format: Format; width: number; code: number }[] = [
  { mnemonic: "ADD", format: "R", width: 11, code: 0b10001011000 },
  { mnemonic: "SUB", format: "R", width: 11, code: 0b11001011000 },
  { mnemonic: "AND", format: "R", width: 11, code: 0b10001010000 },
  { mnemonic: "ORR", format: "R", width: 11, code: 0b10101010000 },
  { mnemonic: "LDUR", format: "D", width: 11, code: 0b11111000010 },
  { mnemonic: "STUR", format: "D", width: 11, code: 0b11111000000 },
  { mnemonic: "ADDI", format: "I", width: 10, code: 0b1001000100 },
  { mnemonic: "SUBI", format: "I", width: 10, code: 0b1101000100 },
  { mnemonic: "MOVZ", format: "IW", width: 9, code: 0b110100101 },
  { mnemonic: "CBZ", format: "CB", width: 8, code: 0b10110100 },
  { mnemonic: "B", format: "B", width: 6, code: 0b000101 },
];

// BigInt() rather than 1n literals: the project's TypeScript target predates them.
export const ZERO = BigInt(0);
export const MASK = (BigInt(1) << BigInt(64)) - BigInt(1);
const field = (word: number, high: number, low: number) => (word >>> low) & ((1 << (high - low + 1)) - 1);
const signed = (value: number, bits: number) => (value & (1 << (bits - 1)) ? value - (1 << bits) : value);
export const reg = (n: number) => (n === 31 ? "XZR" : `X${n}`);
export const hex = (value: bigint | number) => `0x${(BigInt(value) & MASK).toString(16)}`;

/** Decode a 32-bit instruction at `pc`. Branch immediates are byte offsets. */
export function decode(word: number, pc: bigint): Decoded {
  const op = OPCODES.find(entry => word >>> (32 - entry.width) === entry.code);
  if (!op) throw new Error(`Unknown instruction ${word.toString(16)}`);
  const rd = field(word, 4, 0), rn = field(word, 9, 5), rm = field(word, 20, 16), hw = field(word, 22, 21);
  let imm = ZERO;
  let text: string;
  switch (op.format) {
    case "R": text = `${op.mnemonic} ${reg(rd)}, ${reg(rn)}, ${reg(rm)}`; break;
    case "I": imm = BigInt(field(word, 21, 10)); text = `${op.mnemonic} ${reg(rd)}, ${reg(rn)}, #${imm}`; break;
    case "D": imm = BigInt(signed(field(word, 20, 12), 9)); text = `${op.mnemonic} ${reg(rd)}, [${reg(rn)}, #${hex(imm)}]`; break;
    case "CB": imm = BigInt(signed(field(word, 23, 5), 19) * 4); text = `CBZ ${reg(rd)}, ${hex(pc + imm)}`; break;
    case "B": imm = BigInt(signed(field(word, 25, 0), 26) * 4); text = `B ${hex(pc + imm)}`; break;
    case "IW": imm = BigInt(field(word, 20, 5)) << BigInt(16 * hw); text = `MOVZ ${reg(rd)}, #${hex(field(word, 20, 5))}${hw ? `, LSL #${16 * hw}` : ""}`; break;
  }
  return { mnemonic: op.mnemonic, format: op.format, text, rd, rn, rm, imm, hw };
}

/** What each instruction does, in the words the explorer shows. */
export const DESCRIBE: Record<Mnemonic, string> = {
  ADD: "Adds two registers.",
  SUB: "Subtracts one register from another.",
  AND: "Bitwise AND of two registers.",
  ORR: "Bitwise OR of two registers.",
  ADDI: "Adds a 12-bit constant to a register.",
  SUBI: "Subtracts a 12-bit constant from a register.",
  LDUR: "Loads a 64-bit word from data memory. The ALU adds the offset to the base register to form the address.",
  STUR: "Stores a register to data memory at base plus offset.",
  CBZ: "Branches if the register is zero. The ALU passes the register through so the zero flag can be tested.",
  B: "Always branches. The target is the PC plus a sign-extended, word-aligned offset.",
  MOVZ: "Places a 16-bit constant in one of four 16-bit slots, zeroing the rest.",
};

/** The value the ALU should produce for this instruction. */
export function aluResult(mnemonic: Mnemonic, a: bigint, b: bigint): bigint {
  switch (mnemonic) {
    case "ADD": case "ADDI": case "LDUR": case "STUR": return (a + b) & MASK;
    case "SUB": case "SUBI": return (a - b) & MASK;
    case "AND": return a & b;
    case "ORR": return a | b;
    case "CBZ": case "MOVZ": case "B": return b;
  }
}

/** Control signals the single-cycle control unit should raise. */
export const CONTROL: Record<Mnemonic, Partial<Record<"Reg2Loc" | "ALUSrc" | "MemtoReg" | "RegWrite" | "MemRead" | "MemWrite" | "Branch" | "Uncondbranch", number>>> = {
  ADD: { Reg2Loc: 0, ALUSrc: 0, MemtoReg: 0, RegWrite: 1, MemRead: 0, MemWrite: 0, Branch: 0, Uncondbranch: 0 },
  SUB: { Reg2Loc: 0, ALUSrc: 0, MemtoReg: 0, RegWrite: 1, MemRead: 0, MemWrite: 0, Branch: 0, Uncondbranch: 0 },
  AND: { Reg2Loc: 0, ALUSrc: 0, MemtoReg: 0, RegWrite: 1, MemRead: 0, MemWrite: 0, Branch: 0, Uncondbranch: 0 },
  ORR: { Reg2Loc: 0, ALUSrc: 0, MemtoReg: 0, RegWrite: 1, MemRead: 0, MemWrite: 0, Branch: 0, Uncondbranch: 0 },
  ADDI: { ALUSrc: 1, MemtoReg: 0, RegWrite: 1, MemRead: 0, MemWrite: 0, Branch: 0, Uncondbranch: 0 },
  SUBI: { ALUSrc: 1, MemtoReg: 0, RegWrite: 1, MemRead: 0, MemWrite: 0, Branch: 0, Uncondbranch: 0 },
  LDUR: { ALUSrc: 1, MemtoReg: 1, RegWrite: 1, MemRead: 1, MemWrite: 0, Branch: 0, Uncondbranch: 0 },
  STUR: { Reg2Loc: 1, ALUSrc: 1, RegWrite: 0, MemRead: 0, MemWrite: 1, Branch: 0, Uncondbranch: 0 },
  CBZ: { Reg2Loc: 1, ALUSrc: 0, RegWrite: 0, MemRead: 0, MemWrite: 0, Branch: 1, Uncondbranch: 0 },
  B: { RegWrite: 0, MemRead: 0, MemWrite: 0, Uncondbranch: 1 },
  MOVZ: { ALUSrc: 1, MemtoReg: 0, RegWrite: 1, MemRead: 0, MemWrite: 0, Branch: 0, Uncondbranch: 0 },
};
