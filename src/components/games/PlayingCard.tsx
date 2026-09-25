import { isRed, SUIT_SYMBOL, type Card } from "@/lib/demo/games/cards";

const SUIT_NAME = { spades: "spades", hearts: "hearts", diamonds: "diamonds", clubs: "clubs" } as const;
const RANK_NAME: Record<string, string> = { A: "ace", J: "jack", Q: "queen", K: "king" };
export const describeCard = (card: Card) => `${RANK_NAME[card.rank] ?? card.rank} of ${SUIT_NAME[card.suit]}`;

/** A playing card. Face down shows the back; with `onClick` it becomes a button. */
export default function PlayingCard({ card, faceDown = false, onClick, disabled, label }: {
  card: Card; faceDown?: boolean; onClick?: () => void; disabled?: boolean; label?: string;
}) {
  const face = faceDown
    ? <span className="pc-face pc-back" />
    : <span className="pc-face">
        <span className="pc-corner">{card.rank}<small>{SUIT_SYMBOL[card.suit]}</small></span>
        <span className="pc-pip" aria-hidden="true">{SUIT_SYMBOL[card.suit]}</span>
        <span className="pc-corner pc-corner-end">{card.rank}<small>{SUIT_SYMBOL[card.suit]}</small></span>
      </span>;
  const name = faceDown ? "Face-down card" : label ?? describeCard(card);
  const red = !faceDown && isRed(card.suit) ? true : undefined;
  return onClick
    ? <button type="button" className="pc" data-red={red} onClick={onClick} disabled={disabled} aria-label={name}>{face}</button>
    : <span className="pc" data-red={red} role="img" aria-label={name}>{face}</span>;
}
