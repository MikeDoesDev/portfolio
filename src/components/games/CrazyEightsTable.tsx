"use client";

import { useEffect, useState } from "react";
import { AIS, aiTurn, canPlay, drawCard, newGame, play, type Ai, type Game } from "@/lib/demo/games/crazy8s";
import { RANKS, SUITS, SUIT_SYMBOL, type Card, type Suit } from "@/lib/demo/games/cards";
import PlayingCard from "./PlayingCard";

// Group your hand by suit, then rank, so it's easier to read. Play order is unaffected.
const order = (a: Card, b: Card) => SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit) || RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank);
const aiName = (ai: Ai) => AIS.find(entry => entry.id === ai)!.name;

export default function CrazyEightsTable() {
  const [opponents, setOpponents] = useState(1);
  const [ai, setAi] = useState<Ai>("original");
  const [game, setGame] = useState<Game | null>(null);
  const [version, redraw] = useState(0);
  const [choosing, setChoosing] = useState<number | null>(null);

  const start = () => {
    const seats = Array.from({ length: opponents }, (_, i) => ({ name: opponents === 1 ? aiName(ai) : `${aiName(ai)} ${i + 1}`, ai }));
    setGame(newGame([{ name: "You", ai: null }, ...seats], Math.random));
    setChoosing(null);
  };
  const update = (move: (g: Game) => void) => {
    if (!game) return;
    move(game);
    setChoosing(null);
    redraw(n => n + 1);
  };

  // Computer players take their turns one at a time, slowly enough to follow.
  useEffect(() => {
    if (!game || game.winner !== null || game.players[game.turn].ai === null) return;
    const timer = setTimeout(() => {
      aiTurn(game, Math.random);
      redraw(n => n + 1);
    }, 750);
    return () => clearTimeout(timer);
  }, [game, version]);

  const you = game?.players[0];
  const yourTurn = !!game && game.winner === null && game.turn === 0;
  const top = game?.discard[game.discard.length - 1];
  const mostPlayed = game && SUITS.reduce((best, suit) => (game.played[suit] > game.played[best] ? suit : best));

  return <div className="gs-table c8">
    <div className="gs-controls gs-setup">
      <label>Opponents <select value={opponents} onChange={e => setOpponents(Number(e.target.value))}>{[1, 2, 3].map(n => <option key={n}>{n}</option>)}</select></label>
      <label>They play as <select value={ai} onChange={e => setAi(e.target.value as Ai)}>{AIS.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
      <button type="button" className="gs-button gs-primary" onClick={start}>{game ? "New game" : "Deal"}</button>
    </div>
    <p className="gs-note">{AIS.find(entry => entry.id === ai)!.note}</p>
    {game && you && top ? <>
      <div className="gs-row c8-opponents">
        {game.players.slice(1).map((player, i) => <div key={i} className="gs-seat" data-active={game.turn === i + 1 && game.winner === null ? true : undefined}>
          <p className="gs-label">{player.name} <span>{player.hand.length} {player.hand.length === 1 ? "card" : "cards"}</span></p>
          <div className="gs-cards c8-backs">{player.hand.map(card => <PlayingCard key={card.id} card={card} faceDown />)}</div>
        </div>)}
      </div>
      <div className="gs-row c8-center">
        <div className="gs-seat">
          <p className="gs-label">Draw pile <span>{game.draw.length}</span></p>
          {game.draw.length ? <PlayingCard card={game.draw[game.draw.length - 1]} faceDown onClick={yourTurn ? () => update(drawCard) : undefined} label="Draw a card" /> : <span className="gs-empty">Empty</span>}
        </div>
        <div className="gs-seat">
          <p className="gs-label">Discard <span>Play {game.rank === "8" || game.rank === "A" ? "an" : "a"} {game.rank}, any {SUIT_SYMBOL[game.suit]} {game.suit.replace(/s$/, "")}, or an 8</span></p>
          <PlayingCard card={top} />
        </div>
      </div>
      <div className="gs-row">
        <div className="gs-seat" data-active={yourTurn || undefined}>
          <p className="gs-label">Your hand <span>{you.hand.length}</span></p>
          <div className="gs-cards c8-hand">
            {you.hand.map((card, index) => ({ card, index })).sort((a, b) => order(a.card, b.card)).map(({ card, index }) =>
              <PlayingCard key={card.id} card={card} disabled={!yourTurn || !canPlay(card, game)}
                onClick={() => (card.rank === "8" ? setChoosing(index) : update(g => play(g, index)))} />)}
          </div>
        </div>
      </div>
      <div className="gs-controls">
        {choosing !== null
          ? <>{SUITS.map(suit => <button key={suit} type="button" className="gs-button" onClick={() => update(g => play(g, choosing, suit as Suit))}>{SUIT_SYMBOL[suit]} {suit}</button>)}<span className="gs-hint">Pick the new suit.</span></>
          : <button type="button" className="gs-button" disabled={!yourTurn} onClick={() => update(drawCard)}>Draw a card</button>}
      </div>
      <p className="gs-status" aria-live="polite">
        {game.winner !== null
          ? `${game.winner < 0 ? "The game is a draw." : game.winner === 0 ? "You win!" : `${game.players[game.winner].name} wins.`} Most played suit: ${mostPlayed}.`
          : yourTurn ? "Your turn. Play a card or draw." : `${game.players[game.turn].name} is playing…`}
      </p>
      <ol className="gs-log">{game.log.slice(-5).map((line, i) => <li key={`${game.log.length}-${i}`}>{line}</li>)}</ol>
    </> : <p className="gs-empty">Choose your opponents and deal.</p>}
  </div>;
}
