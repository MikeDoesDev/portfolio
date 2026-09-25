import { makeDeck, seeded, shuffle, type Card, type Rank } from "./cards";

/**
 * Blackjack with Atlantic City style rules, the rules behind the published
 * house edges the simulator is checked against: eight decks, the dealer
 * stands on soft 17, blackjack pays 3:2, the dealer checks for blackjack
 * before anyone acts, double on any first two cards (including after a
 * split), split up to four hands, split aces take one card each and can't be
 * resplit, no surrender.
 */
export const RULES = { decks: 8, penetration: 0.75, maxHands: 4 };

export type Action = "hit" | "stand" | "double" | "split";
export type Result = "blackjack" | "win" | "push" | "lose";
export interface Hand { cards: Card[]; bet: number; splitAces: boolean; fromSplit: boolean; done: boolean; result?: Result; net?: number }

export const points = (rank: Rank) => (rank === "A" ? 1 : rank === "J" || rank === "Q" || rank === "K" ? 10 : Number(rank));

/** Best total, counting one ace as 11 when that doesn't bust the hand. */
export function handValue(cards: Card[]): { total: number; soft: boolean } {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    total += points(card.rank);
    if (card.rank === "A") aces++;
  }
  const soft = aces > 0 && total + 10 <= 21;
  return { total: soft ? total + 10 : total, soft };
}

export const isBlackjack = (cards: Card[]) => cards.length === 2 && handValue(cards).total === 21;
export const dealerHits = (cards: Card[]) => handValue(cards).total < 17;

export class Shoe {
  private cards: Card[];
  private next = 0;
  constructor(private random: () => number, private decks = RULES.decks, preset?: Card[]) {
    this.cards = preset ?? shuffle(makeDeck(decks), random);
  }
  reshuffle() {
    this.cards = shuffle(makeDeck(this.decks), this.random);
    this.next = 0;
  }
  /** True once the cut card has come out: shuffle before the next round. */
  get pastCut() { return this.next >= this.cards.length * RULES.penetration; }
  get remaining() { return this.cards.length - this.next; }
  draw(): Card {
    if (this.next >= this.cards.length) this.reshuffle();
    return this.cards[this.next++];
  }
}

export class Round {
  dealer: Card[] = [];
  hands: Hand[];
  active = 0;
  over = false;

  constructor(private shoe: Shoe, bet = 1) {
    const hand: Hand = { cards: [], bet, splitAces: false, fromSplit: false, done: false };
    this.hands = [hand];
    hand.cards.push(shoe.draw());
    this.dealer.push(shoe.draw());
    hand.cards.push(shoe.draw());
    this.dealer.push(shoe.draw());
    // The dealer checks for blackjack up front, so a natural on either side ends the round.
    if (isBlackjack(this.dealer) || isBlackjack(hand.cards)) this.finish();
  }

  get hand() { return this.hands[this.active]; }
  get upcard() { return this.dealer[0]; }
  get net() { return this.hands.reduce((sum, hand) => sum + (hand.net ?? 0), 0); }

  /** Moves allowed for the hand being played. */
  legal(): Action[] {
    if (this.over) return [];
    const hand = this.hand;
    const moves: Action[] = ["hit", "stand"];
    if (hand.cards.length === 2) {
      moves.push("double");
      if (this.hands.length < RULES.maxHands && points(hand.cards[0].rank) === points(hand.cards[1].rank)) moves.push("split");
    }
    return moves;
  }

  act(action: Action) {
    if (!this.legal().includes(action)) throw new Error(`Can't ${action} now`);
    const hand = this.hand;
    if (action === "hit") {
      hand.cards.push(this.shoe.draw());
      if (handValue(hand.cards).total >= 21) hand.done = true;
    } else if (action === "stand") {
      hand.done = true;
    } else if (action === "double") {
      hand.bet *= 2;
      hand.cards.push(this.shoe.draw());
      hand.done = true;
    } else {
      const aces = hand.cards[0].rank === "A";
      const other: Hand = { cards: [hand.cards.pop()!], bet: hand.bet, splitAces: aces, fromSplit: true, done: false };
      hand.fromSplit = true;
      hand.splitAces = aces;
      this.hands.splice(this.active + 1, 0, other);
      for (const split of [hand, other]) {
        split.cards.push(this.shoe.draw());
        // Split aces get one card each; any split hand at 21 has nothing left to do.
        if (aces || handValue(split.cards).total === 21) split.done = true;
      }
    }
    while (this.active < this.hands.length && this.hands[this.active].done) this.active++;
    if (this.active === this.hands.length) {
      this.active--;
      this.finish();
    }
  }

  private finish() {
    this.over = true;
    const natural = this.hands.length === 1 && !this.hands[0].fromSplit && isBlackjack(this.hands[0].cards);
    const dealerNatural = isBlackjack(this.dealer);
    const live = this.hands.some(hand => handValue(hand.cards).total <= 21);
    if (!natural && !dealerNatural && live) while (dealerHits(this.dealer)) this.dealer.push(this.shoe.draw());
    const dealer = handValue(this.dealer).total;
    for (const hand of this.hands) {
      const total = handValue(hand.cards).total;
      let result: Result;
      if (natural) result = dealerNatural ? "push" : "blackjack";
      else if (dealerNatural || total > 21) result = "lose";
      else if (dealer > 21 || total > dealer) result = "win";
      else result = total === dealer ? "push" : "lose";
      hand.result = result;
      hand.net = result === "blackjack" ? hand.bet * 1.5 : result === "win" ? hand.bet : result === "push" ? 0 : -hand.bet;
    }
  }
}

export type Strategy = (cards: Card[], upcard: Card, legal: Action[]) => Action;

/** Basic strategy for these rules (multi-deck, dealer stands on soft 17, double after split). */
export const basicStrategy: Strategy = (cards, upcard, legal) => {
  const up = upcard.rank === "A" ? 11 : points(upcard.rank);
  const can = (move: Action) => legal.includes(move);
  const double = (otherwise: Action): Action => (can("double") ? "double" : otherwise);
  if (can("split")) {
    const pair = points(cards[0].rank);
    const split =
      pair === 1 || pair === 8 ||
      (pair === 9 && up !== 7 && up <= 9) ||
      ((pair === 2 || pair === 3 || pair === 7) && up <= 7) ||
      (pair === 6 && up <= 6) ||
      (pair === 4 && (up === 5 || up === 6));
    if (split) return "split";
  }
  const { total, soft } = handValue(cards);
  if (soft) {
    if (total >= 19) return "stand";
    if (total === 18) return up >= 3 && up <= 6 ? double("stand") : up <= 8 ? "stand" : "hit";
    if (total === 17) return up >= 3 && up <= 6 ? double("hit") : "hit";
    if (total >= 15) return up >= 4 && up <= 6 ? double("hit") : "hit";
    return up === 5 || up === 6 ? double("hit") : "hit";
  }
  if (total >= 17) return "stand";
  if (total >= 13) return up <= 6 ? "stand" : "hit";
  if (total === 12) return up >= 4 && up <= 6 ? "stand" : "hit";
  if (total === 11) return up <= 10 ? double("hit") : "hit";
  if (total === 10) return up <= 9 ? double("hit") : "hit";
  if (total === 9) return up >= 3 && up <= 6 ? double("hit") : "hit";
  return "hit";
};

/** Play the way the dealer must: hit below 17, never double or split. */
export const mimicDealer: Strategy = cards => (handValue(cards).total < 17 ? "hit" : "stand");

/** Basic strategy, except never hit a hard 12 or more (the Wizard of Odds definition). */
export const neverBust: Strategy = (cards, upcard, legal) => {
  const move = basicStrategy(cards, upcard, legal);
  const { total, soft } = handValue(cards);
  return move === "hit" && !soft && total >= 12 ? "stand" : move;
};

/**
 * Published house edges from the Wizard of Odds for these strategies, under
 * similar rules (dealer stands on soft 17, split to 4, double after split).
 * https://wizardofodds.com/games/blackjack/basics/
 */
export const STRATEGIES = [
  { id: "basic", name: "Basic strategy", play: basicStrategy, published: -0.0043 },
  { id: "never-bust", name: "Never bust", play: neverBust, published: -0.0391 },
  { id: "mimic", name: "Mimic the dealer", play: mimicDealer, published: -0.0548 },
] as const;

/** Plays rounds in batches and keeps running totals, so a UI can report progress. */
export class Simulation {
  rounds = 0;
  private sum = 0;
  private sumSq = 0;
  wins = 0;
  pushes = 0;
  losses = 0;
  private shoe: Shoe;
  constructor(private strategy: Strategy, seed: number) {
    this.shoe = new Shoe(seeded(seed));
  }
  run(count: number) {
    for (let i = 0; i < count; i++) {
      if (this.shoe.pastCut) this.shoe.reshuffle();
      const round = new Round(this.shoe);
      while (!round.over) round.act(this.strategy(round.hand.cards, round.upcard, round.legal()));
      const net = round.net;
      this.rounds++;
      this.sum += net;
      this.sumSq += net * net;
      if (net > 0) this.wins++;
      else if (net < 0) this.losses++;
      else this.pushes++;
    }
    return this;
  }
  /** Average net per round, in units of the starting bet, with its standard error. */
  get mean() { return this.sum / this.rounds; }
  get standardError() {
    const variance = this.sumSq / this.rounds - this.mean ** 2;
    return Math.sqrt(variance / this.rounds);
  }
}
