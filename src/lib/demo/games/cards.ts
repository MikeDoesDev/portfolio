/** Card primitives shared by every game in the suite. */
export const SUITS = ["spades", "hearts", "diamonds", "clubs"] as const;
export type Suit = (typeof SUITS)[number];
export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
export type Rank = (typeof RANKS)[number];
export interface Card { rank: Rank; suit: Suit; id: number }

export const SUIT_SYMBOL: Record<Suit, string> = { spades: "♠", hearts: "♥", diamonds: "♦", clubs: "♣" };
export const isRed = (suit: Suit) => suit === "hearts" || suit === "diamonds";
export const cardName = (card: Card) => `${card.rank}${SUIT_SYMBOL[card.suit]}`;

/** `decks` standard 52-card decks in order. Ids are unique across the whole shoe. */
export function makeDeck(decks = 1): Card[] {
  const cards: Card[] = [];
  for (let d = 0; d < decks; d++) for (const suit of SUITS) for (const rank of RANKS) cards.push({ rank, suit, id: cards.length });
  return cards;
}

/** Seeded PRNG (mulberry32), so simulations and tests repeat exactly. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates, in place. */
export function shuffle<T>(items: T[], random: () => number): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
