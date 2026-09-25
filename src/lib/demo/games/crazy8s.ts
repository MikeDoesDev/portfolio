import { cardName, makeDeck, seeded, shuffle, SUITS, type Card, type Rank, type Suit } from "./cards";

/**
 * Crazy 8s with the rules from Michael's CSCE 120 version: the top card is
 * flipped first, then cards are dealt; play a card matching the rank or suit,
 * or any 8 to declare a new suit; if you can't or won't play, draw one card
 * and your turn ends. An empty draw pile is rebuilt by flipping the discard
 * pile under its top card, and when nothing is left to draw the game is a draw.
 */
export type Ai = "original" | "smart" | "random";
export interface Player { name: string; hand: Card[]; ai: Ai | null }
export interface Game {
  players: Player[];
  draw: Card[];
  discard: Card[];
  rank: Rank;
  suit: Suit;
  turn: number;
  /** Winning seat, -1 for a draw, null while playing. */
  winner: number | null;
  played: Record<Suit, number>;
  log: string[];
  quiet: boolean;
}
export interface Move { index: number; suit?: Suit }

export const AIS: { id: Ai; name: string; note: string }[] = [
  { id: "original", name: "Original AI", note: "Plays the first card it can, as in the C++ version. An 8 keeps its own suit." },
  { id: "smart", name: "Smarter AI", note: "Saves 8s for when nothing else plays, and steers toward the suit it holds most of." },
  { id: "random", name: "Random", note: "Plays any legal card at random. A baseline." },
];

export const handSize = (players: number) => (players === 2 ? 7 : 5);
export const canPlay = (card: Card, game: Pick<Game, "rank" | "suit">) => card.rank === "8" || card.rank === game.rank || card.suit === game.suit;

export function newGame(players: { name: string; ai: Ai | null }[], random: () => number, quiet = false): Game {
  const draw = shuffle(makeDeck(), random);
  const first = draw.pop()!;
  const game: Game = {
    players: players.map(p => ({ ...p, hand: [] })), draw, discard: [first], rank: first.rank, suit: first.suit,
    turn: 0, winner: null, played: { spades: 0, hearts: 0, diamonds: 0, clubs: 0 }, log: [], quiet,
  };
  const cards = handSize(players.length);
  for (let c = 0; c < cards; c++) for (const player of game.players) player.hand.push(draw.pop()!);
  say(game, `The first card is ${cardName(first)}.`);
  return game;
}

function say(game: Game, line: string) { if (!game.quiet) game.log.push(line); }
/** "Original AI plays" but "You play": people at the table are addressed as you. */
const does = (player: Player, verb: string) => `${player.name} ${player.ai === null ? verb : `${verb}s`}`;
function nextTurn(game: Game) { game.turn = (game.turn + 1) % game.players.length; }

export function play(game: Game, index: number, declared?: Suit) {
  const player = game.players[game.turn];
  const card = player.hand[index];
  if (game.winner !== null || !card || !canPlay(card, game)) throw new Error("That card can't be played");
  player.hand.splice(index, 1);
  game.discard.push(card);
  game.played[card.suit]++;
  game.rank = card.rank;
  game.suit = card.rank === "8" ? declared ?? card.suit : card.suit;
  say(game, card.rank === "8" ? `${does(player, "play")} ${cardName(card)} and ${player.ai === null ? "change" : "changes"} the suit to ${game.suit}.` : `${does(player, "play")} ${cardName(card)}.`);
  if (player.hand.length === 0) {
    game.winner = game.turn;
    say(game, `${does(player, "win")}!`);
  } else nextTurn(game);
}

export function drawCard(game: Game) {
  const player = game.players[game.turn];
  if (game.draw.length === 0) {
    if (game.discard.length <= 1) {
      game.winner = -1;
      say(game, `${player.name} can't draw a card. The game is a draw.`);
      return;
    }
    const top = game.discard.pop()!;
    while (game.discard.length) game.draw.push(game.discard.pop()!);
    game.discard.push(top);
    say(game, "Draw pile empty, flipping the discard pile.");
  }
  player.hand.push(game.draw.pop()!);
  say(game, `${does(player, "draw")} a card.`);
  nextTurn(game);
}

/** The suit with the most cards in `hand`, ignoring 8s. */
function longestSuit(hand: Card[]): Suit | undefined {
  let best: Suit | undefined;
  let most = 0;
  for (const suit of SUITS) {
    const count = hand.filter(card => card.suit === suit && card.rank !== "8").length;
    if (count > most) [best, most] = [suit, count];
  }
  return best;
}

export function aiMove(game: Game, random: () => number): Move | null {
  const player = game.players[game.turn];
  const hand = player.hand;
  if (player.ai === "original") {
    const index = hand.findIndex(card => canPlay(card, game));
    return index < 0 ? null : { index, suit: hand[index].suit };
  }
  const legal = hand.flatMap((card, index) => (canPlay(card, game) ? [index] : []));
  if (legal.length === 0) return null;
  if (player.ai === "random") return { index: legal[Math.floor(random() * legal.length)], suit: SUITS[Math.floor(random() * SUITS.length)] };
  // Smarter: keep 8s in reserve, and play the card whose suit I'll still hold the most of.
  const plain = legal.filter(index => hand[index].rank !== "8");
  if (plain.length) {
    const left = (index: number) => hand.filter((card, i) => i !== index && card.suit === hand[index].suit && card.rank !== "8").length;
    return { index: plain.reduce((best, index) => (left(index) > left(best) ? index : best)) };
  }
  const index = legal[0];
  return { index, suit: longestSuit(hand.filter((_, i) => i !== index)) ?? hand[index].suit };
}

export function aiTurn(game: Game, random: () => number) {
  const move = aiMove(game, random);
  if (move) play(game, move.index, move.suit);
  else drawCard(game);
}

/** Plays one all-AI game to the end and returns the winning seat, or -1. */
export function playOut(ais: Ai[], random: () => number, maxTurns = 5000): number {
  const game = newGame(ais.map((ai, seat) => ({ name: `Player ${seat}`, ai })), random, true);
  for (let turn = 0; turn < maxTurns && game.winner === null; turn++) aiTurn(game, random);
  return game.winner ?? -1;
}

/** Head-to-head games between two AIs, alternating who goes first. */
export class Matchup {
  games = 0;
  aWins = 0;
  bWins = 0;
  draws = 0;
  private random: () => number;
  constructor(public a: Ai, public b: Ai, seed: number) { this.random = seeded(seed); }
  run(count: number) {
    for (let i = 0; i < count; i++) {
      const aFirst = this.games % 2 === 0;
      const winner = playOut(aFirst ? [this.a, this.b] : [this.b, this.a], this.random);
      this.games++;
      if (winner < 0) this.draws++;
      else if ((winner === 0) === aFirst) this.aWins++;
      else this.bWins++;
    }
    return this;
  }
  /** Share of all games won by `a`, with a 95% interval half-width. */
  get aRate() { return this.aWins / this.games; }
  get margin() { return 1.96 * Math.sqrt((this.aRate * (1 - this.aRate)) / this.games); }
}
