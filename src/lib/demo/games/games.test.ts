// Rule and simulation checks for the games suite. Run with: npm run test:games
import assert from "node:assert/strict";
import { makeDeck, seeded, type Card, type Rank, type Suit } from "./cards";
import { basicStrategy, dealerHits, handValue, isBlackjack, mimicDealer, neverBust, Round, Shoe, Simulation, STRATEGIES } from "./blackjack";
import { aiMove, aiTurn, canPlay, Matchup, newGame, playOut, type Ai } from "./crazy8s";

let id = 1000;
const c = (rank: Rank, suit: Suit = "spades"): Card => ({ rank, suit, id: id++ });
const stacked = (...cards: Card[]) => new Shoe(seeded(1), 8, cards);
let passed = 0;
const check = (name: string, fn: () => void) => { fn(); passed++; console.log(`ok  ${name}`); };

// ── Blackjack: totals and the dealer rule
check("hand totals count one ace as 11 when it fits", () => {
  assert.deepEqual(handValue([c("A"), c("K")]), { total: 21, soft: true });
  assert.deepEqual(handValue([c("A"), c("A"), c("9")]), { total: 21, soft: true });
  assert.deepEqual(handValue([c("K"), c("Q"), c("A")]), { total: 21, soft: false });
  assert.deepEqual(handValue([c("A"), c("6"), c("10")]), { total: 17, soft: false });
  assert.ok(isBlackjack([c("A"), c("J")]) && !isBlackjack([c("7"), c("7"), c("7")]));
});
check("dealer stands on soft 17 and hits 16", () => {
  assert.equal(dealerHits([c("A"), c("6")]), false);
  assert.equal(dealerHits([c("10"), c("6")]), true);
});

// ── Blackjack: rounds on stacked shoes (deal order: player, dealer, player, dealer)
check("a natural pays 3:2 without the dealer drawing", () => {
  const round = new Round(stacked(c("A"), c("9"), c("K"), c("7")));
  assert.ok(round.over);
  assert.equal(round.hands[0].result, "blackjack");
  assert.equal(round.net, 1.5);
  assert.equal(round.dealer.length, 2);
});
check("a dealer blackjack ends the round before anyone acts", () => {
  const round = new Round(stacked(c("10"), c("A"), c("9"), c("K")));
  assert.ok(round.over);
  assert.equal(round.net, -1);
});
check("two naturals push", () => {
  assert.equal(new Round(stacked(c("A"), c("A"), c("K"), c("Q"))).net, 0);
});
check("doubling takes one card for twice the bet", () => {
  const round = new Round(stacked(c("5"), c("10"), c("6"), c("7"), c("10")));
  round.act("double");
  assert.ok(round.over);
  assert.equal(round.hands[0].cards.length, 3);
  assert.equal(round.net, 2);
});
check("split aces take one card each and a 21 there is not a blackjack", () => {
  const round = new Round(stacked(c("A"), c("10"), c("A"), c("7"), c("K"), c("9")));
  assert.deepEqual(round.legal().includes("split"), true);
  round.act("split");
  assert.ok(round.over);
  assert.deepEqual(round.hands.map(h => h.result), ["win", "win"]);
  assert.equal(round.net, 2);
});
check("split hands are played in order and can double", () => {
  const round = new Round(stacked(c("8"), c("10"), c("8"), c("9"), c("3"), c("10"), c("10")));
  round.act("split");
  assert.equal(round.hands.length, 2);
  round.act("double"); // 8 + 3 = 11, draws a 10
  round.act("stand"); // 8 + 10 = 18 against 19
  assert.deepEqual(round.hands.map(h => h.net), [2, -1]);
});

// ── Blackjack: strategy chart spot checks
check("basic strategy matches the chart", () => {
  const move = (cards: Card[], up: Rank) => basicStrategy(cards, c(up), ["hit", "stand", "double", ...(cards.length === 2 && handValue([cards[0]]).total === handValue([cards[1]]).total ? ["split" as const] : [])]);
  assert.equal(move([c("10"), c("6")], "10"), "hit");
  assert.equal(move([c("10"), c("2")], "4"), "stand");
  assert.equal(move([c("10"), c("2")], "3"), "hit");
  assert.equal(move([c("6"), c("5")], "6"), "double");
  assert.equal(move([c("6"), c("5")], "A"), "hit");
  assert.equal(move([c("A"), c("A")], "10"), "split");
  assert.equal(move([c("8"), c("8")], "A"), "split");
  assert.equal(move([c("K"), c("Q")], "6"), "stand");
  assert.equal(move([c("9"), c("9")], "7"), "stand");
  assert.equal(move([c("A"), c("7")], "9"), "hit");
  assert.equal(move([c("A"), c("7")], "2"), "stand");
  assert.equal(move([c("A"), c("7")], "5"), "double");
  assert.equal(basicStrategy([c("A"), c("5"), c("A")], c("5"), ["hit", "stand"]), "hit");
  assert.equal(mimicDealer([c("10"), c("6")], c("7"), ["hit", "stand"]), "hit");
  assert.equal(neverBust([c("10"), c("2")], c("10"), ["hit", "stand"]), "stand");
  assert.equal(neverBust([c("6"), c("5")], c("6"), ["hit", "stand", "double"]), "double");
  assert.equal(neverBust([c("A"), c("6")], c("10"), ["hit", "stand"]), "hit");
});

// ── Blackjack: simulations land in sane ranges
check("simulated returns agree with the published house edges", () => {
  for (const strategy of STRATEGIES) {
    const sim = new Simulation(strategy.play, 7).run(1_000_000);
    const margin = 1.96 * sim.standardError;
    console.log(`    ${strategy.name}: ${(sim.mean * 100).toFixed(2)}% ± ${(margin * 100).toFixed(2)} (published ${(strategy.published * 100).toFixed(2)}%)`);
    // Allow the 95% interval plus a little for any small rule differences.
    assert.ok(Math.abs(sim.mean - strategy.published) < margin + 0.002, `${strategy.name} is off the published figure`);
  }
});

// ── Crazy 8s
check("an 8 always plays, otherwise rank or suit must match", () => {
  const top = { rank: "5" as Rank, suit: "diamonds" as Suit };
  assert.ok(canPlay(c("8", "clubs"), top) && canPlay(c("5", "hearts"), top) && canPlay(c("K", "diamonds"), top));
  assert.ok(!canPlay(c("K", "hearts"), top));
});
check("deals 7 cards for two players and 5 for more", () => {
  const two = newGame([{ name: "a", ai: null }, { name: "b", ai: "smart" }], seeded(3));
  assert.deepEqual(two.players.map(p => p.hand.length), [7, 7]);
  assert.equal(two.draw.length, 52 - 1 - 14);
  const four = newGame(["original", "smart", "random", null].map((ai, i) => ({ name: `${i}`, ai: ai as Ai | null })), seeded(3));
  assert.deepEqual(four.players.map(p => p.hand.length), [5, 5, 5, 5]);
});
check("the original AI plays the first playable card and keeps an 8's suit", () => {
  const game = newGame([{ name: "a", ai: "original" }, { name: "b", ai: "original" }], seeded(4), true);
  game.rank = "5";
  game.suit = "diamonds";
  game.players[0].hand = [c("K", "hearts"), c("8", "spades"), c("5", "clubs")];
  assert.deepEqual(aiMove(game, seeded(1)), { index: 1, suit: "spades" });
});
check("the smarter AI saves 8s and steers to its longest suit", () => {
  const game = newGame([{ name: "a", ai: "smart" }, { name: "b", ai: "smart" }], seeded(4), true);
  game.rank = "5";
  game.suit = "diamonds";
  game.players[0].hand = [c("8", "spades"), c("5", "clubs"), c("5", "hearts"), c("K", "hearts"), c("2", "hearts")];
  assert.deepEqual(aiMove(game, seeded(1)), { index: 2 });
  game.rank = "9";
  game.players[0].hand = [c("8", "spades"), c("2", "hearts"), c("3", "hearts"), c("K", "clubs")];
  assert.deepEqual(aiMove(game, seeded(1)), { index: 0, suit: "hearts" });
});
check("cards are conserved and the winner's hand is empty", () => {
  const random = seeded(9);
  let finished = 0;
  for (let g = 0; g < 300; g++) {
    const game = newGame(["smart", "original", "random"].map((ai, i) => ({ name: `${i}`, ai: ai as Ai })), random, true);
    for (let t = 0; t < 5000 && game.winner === null; t++) {
      aiTurn(game, random);
      const total = game.draw.length + game.discard.length + game.players.reduce((n, p) => n + p.hand.length, 0);
      assert.equal(total, 52);
    }
    if (game.winner !== null && game.winner >= 0) {
      assert.equal(game.players[game.winner].hand.length, 0);
      finished++;
    }
  }
  assert.ok(finished > 250, "nearly every game should end with a winner");
  assert.ok(playOut(["smart", "original"], random) >= -1);
});
check("the smarter AI beats the original over many games", () => {
  const matchup = new Matchup("smart", "original", 11).run(4000);
  console.log(`    smart beats original ${(matchup.aRate * 100).toFixed(1)}% ± ${(matchup.margin * 100).toFixed(1)} (draws ${matchup.draws})`);
  assert.ok(matchup.aRate > 0.5);
});
check("decks have 52 unique cards", () => {
  assert.equal(new Set(makeDeck(8).map(card => card.id)).size, 416);
});

console.log(`\n${passed} checks passed`);
