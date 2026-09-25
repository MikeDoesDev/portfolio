"use client";
import { useRef, useState } from "react";
interface EmbedFrameProps { src: string; title: string; aspect?: number }
export default function EmbedFrame({ src, title, aspect = 16 / 10 }: EmbedFrameProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [active, setActive] = useState(false);
  const [notice, setNotice] = useState("");
  async function fullscreen() {
    try {
      if (!frame.current?.requestFullscreen) throw new Error("Unavailable");
      await frame.current.requestFullscreen();
      setNotice("");
    } catch { setNotice("Fullscreen isn’t available here. You can open the demo in a new tab instead."); }
  }
  return <div className="demo-shell"><div className="demo-toolbar"><span>{title}</span><a className="text-link" href={src} target="_blank" rel="noopener noreferrer">Open in new tab</a></div><div className="demo-viewport" style={{ aspectRatio: aspect }}>{active ? <iframe ref={frame} src={src} title={title} allow="fullscreen" onError={() => setNotice("The demo couldn’t load. Try opening it in a new tab.")} /> : <div className="demo-start"><p>Explore the working demo</p><button className="button-primary" type="button" onClick={() => setActive(true)}>Load demo</button><p className="demo-hint">Loads when you choose. Your place on this page stays here.</p></div>}</div><div className="demo-bottom">{active && <button type="button" className="text-link" onClick={fullscreen}>Fullscreen</button>}<p>{active ? "If the demo is blank or unavailable, use the direct link above." : "The demo is separate from the portfolio."}</p></div>{notice && <p className="demo-notice" role="status">{notice}</p>}</div>;
}
