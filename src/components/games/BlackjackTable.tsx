"use client";

import { useRef, useState } from "react";
import { basicStrategy, handValue, RULES, Round, Shoe, type Action, type Hand } from "@/lib/demo/games/blackjack";
import type { Card } from "@/lib/demo/games/cards";
import PlayingCard from "./PlayingCard";

const MOVES: { action: Action; label: string }[] = [
  { action: "hit", label: "Hit" },
  { action: "stand", label: "Stand" },
  { action: "double", label: "Double" },
  { action: "split", label: "Split" },
];
const RESULT = { blackjack: "Blackjack", win: "Win", push: "Push", lose: "Lose" } as const;

const total = (cards: Card[]) => {
  const { total, soft } = handValue(cards);
  return soft && total < 21 ? `Soft ${total}` : `${total}`;
};
const signed = (units: number) => `${units > 0 ? "+" : units < 0 ? "−" : ""}${Math.abs(units)}`;

function summary(round: Round) {
  const net = round.net;
  if (round.hands.length > 1) return `${signed(net)} across ${round.hands.length} hands`;
  const hand = round.hands[0];
  if (hand.result === "blackjack") return "Blackjack pays 3:2, +1.5";
  if (hand.result === "push") return "Push. Your bet comes back.";
  if (handValue(hand.cards).total > 21) return `Bust, ${signed(net)}`;
  if (handValue(round.dealer).total > 21) return `Dealer busts, ${signed(net)}`;
  return hand.result === "win" ? `You win, ${signed(net)}` : `Dealer wins, ${signed(net)}`;
}

export default function BlackjackTable() {
  const shoe = useRef<Shoe | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [, redraw] = useState(0);
  const [coach, setCoach] = useState(false);
  const [score, setScore] = useState({ hands: 0, net: 0 });
  const [shuffled, setShuffled] = useState(false);

  const record = (done: Round) => setScore(s => ({ hands: s.hands + 1, net: s.net + done.net }));
  const deal = () => {
    shoe.current ??= new Shoe(Math.random);
    const reshuffle = shoe.current.pastCut;
    if (reshuffle) shoe.current.reshuffle();
    setShuffled(reshuffle);
    const next = new Round(shoe.current);
    setRound(next);
    if (next.over) record(next);
  };
  const act = (action: Action) => {
    if (!round) return;
    round.act(action);
    if (round.over) record(round);
    redraw(n => n + 1);
  };

  const legal = round?.legal() ?? [];
  const advice = round && !round.over && coach ? basicStrategy(round.hand.cards, round.upcard, legal) : null;

  return <div className="gs-table bj">
    <div className="gs-row">
      <div className="gs-seat">
        <p className="gs-label">Dealer {round && <span>{round.over ? total(round.dealer) : total([round.upcard])}</span>}</p>
        <div className="gs-cards">
          {round ? round.dealer.map((card, i) => <PlayingCard key={card.id} card={card} faceDown={i === 1 && !round.over} />) : <span className="gs-empty">Press deal to start.</span>}
        </div>
      </div>
    </div>
    <div className="gs-row">
      {(round?.hands ?? []).map((hand: Hand, i) => <div key={i} className="gs-seat" data-active={round && !round.over && i === round.active ? true : undefined}>
        <p className="gs-label">{round!.hands.length > 1 ? `Hand ${i + 1}` : "You"} <span>{total(hand.cards)}</span>{hand.bet > 1 && <em>Doubled</em>}{hand.result && <strong data-result={hand.result}>{RESULT[hand.result]}</strong>}</p>
        <div className="gs-cards">{hand.cards.map(card => <PlayingCard key={card.id} card={card} />)}</div>
      </div>)}
    </div>
    <div className="gs-controls">
      {round && !round.over
        ? MOVES.map(({ action, label }) => <button key={action} type="button" className="gs-button" data-advised={advice === action || undefined} disabled={!legal.includes(action)} onClick={() => act(action)}>{label}</button>)
        : <button type="button" className="gs-button gs-primary" onClick={deal}>{round ? "Next hand" : "Deal"}</button>}
      <label className="gs-toggle"><input type="checkbox" checked={coach} onChange={e => setCoach(e.target.checked)} /> Show the basic-strategy move</label>
    </div>
    <p className="gs-status" aria-live="polite">
      {round?.over ? summary(round) : advice ? `Basic strategy says: ${MOVES.find(m => m.action === advice)!.label.toLowerCase()}.` : round ? "Your move." : " "}
    </p>
    <p className="gs-meta">
      <span>{score.hands} {score.hands === 1 ? "hand" : "hands"} played, {signed(score.net)} {Math.abs(score.net) === 1 ? "unit" : "units"}</span>
      <span>{RULES.decks} decks. Dealer stands on soft 17. Blackjack pays 3:2.{shuffled ? " New shoe shuffled." : ""}</span>
    </p>
  </div>;
}
