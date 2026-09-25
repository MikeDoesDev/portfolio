"use client";

import { useState, type CSSProperties } from "react";
import type { BookSeries } from "@/content/bookshelf";

// Spines on shelves. Hovering a book (tapping on touch screens, or the arrow
// keys once the shelf has focus) slides it out and turns it to show its cover.
// Each series is one flex item, so a series never splits across shelves.
export default function Bookshelf({ shelf }: { shelf: BookSeries[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const starts = shelf.map((_, s) => shelf.slice(0, s).reduce((n, set) => n + set.books.length, 0));
  const count = shelf.reduce((n, set) => n + set.books.length, 0);
  const step = (by: number) => setOpen(o => (o === null ? (by > 0 ? 0 : count - 1) : Math.min(count - 1, Math.max(0, o + by))));

  return <ul className="bookshelf" tabIndex={0} aria-label="Bookshelf. Use the arrow keys to pull out a book."
    onKeyDown={e => {
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Escape") setOpen(null);
      else return;
      e.preventDefault();
    }}
    onBlur={() => setOpen(null)}>
    {shelf.map(({ series, author, h, books }, s) => <li key={books[0].title} className="book-set"><ul>
      {books.map((book, b) => {
        const i = starts[s] + b;
        // Shrink long titles until they fit up the spine.
        const fs = Math.max(7, Math.min(11, book.w * 0.42, (h - 20) / (book.title.length * 0.6)));
        const style = { "--w": `${book.w}px`, "--h": `${h}px`, "--fs": `${fs.toFixed(1)}px`, "--spine": book.color, "--ink": book.ink } as CSSProperties;
        return <li key={book.title} className="book" style={style} data-open={open === i || undefined}
          onClick={() => { if (matchMedia("(hover: none)").matches) setOpen(o => (o === i ? null : i)); }}>
          <span className="sr-only">{series ? `${series}: ` : ""}{book.title}{author ? ` by ${author}` : ""}</span>
          <span className="book-body" aria-hidden="true">
            <span className="book-spine">{book.title}</span>
            <span className="book-cover">{series && <small>{series}</small>}<strong>{book.title}</strong>{author && <span>{author}</span>}</span>
          </span>
        </li>;
      })}
    </ul></li>)}
  </ul>;
}
