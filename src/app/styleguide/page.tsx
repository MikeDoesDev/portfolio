import type { Metadata } from "next";
import styles from "./styleguide.module.css";

/** Phase 0 prototype. Throwaway route for judging the warm direction before any
 *  live page is converted. Noindex, and deliberately not in the navbar. */
export const metadata: Metadata = {
  title: "Style prototype",
  robots: { index: false, follow: false },
};

/* ────────────────────────────────────────────────────────────────
   COPY
   Every word that appears on this page lives here. Change the words
   in this block and nothing else, and the page updates.
   House rule: no em dashes anywhere in this file.
   ──────────────────────────────────────────────────────────────── */

const COPY = {
  kicker: "Phase 0 · style prototype",
  title: "The warm direction",
  lede:
    "Nothing here is wired into the site. Every token is scoped to this page, so the home page and all five project pages are still dark and still working. This is only for deciding whether the look is right. Once it is, the tokens get promoted into globals.css in one move.",

  paletteNote:
    "Your four colours, plus three added tones. All four of yours are light, so the set had no usable text colour. Ink and quiet fill that gap, and device is the warm near-black that embedded demos sit on.",

  contrastNote:
    "WCAG needs 4.5:1 for body text and 3:1 for large text. Sage misses both, which is the one rule to remember: it is a fill, not an ink.",

  typeNote:
    "Same three families as today, because they read well on light. The change is that mono labels get rare. Their density is a large part of why the current site feels like instrumentation.",

  buttonsNote:
    "The primary button takes dark type on sage. Cream on sage measures 2.71:1 and would fail, so the obvious looking version is the wrong one.",
  badgesNote:
    "On the shelf is the new fourth state, the honest home for Gladiator Dash timing and anything else designed but not started.",

  heroEyebrow: "Computer & Electrical Engineering, Texas A&M ’28",
  heroGreeting: "Hi I’m Andrew “Michael” Coggins",
  heroLine:
    "I build things that make life easier and faster. Most of them are things I needed and couldn’t buy.",
  heroPrimary: "See the work",
  heroSecondary: "Résumé",

  deviceNote:
    "You were right that a dark panel is good contrast. The issue was never darkness. It is that both demos are cool blue-blacks and every colour you picked is warm. Left is what they look like today. Right is the same panel on the warm device tone, with the lime pulled toward the sage family.",
  deviceLeftTitle: "As they are now",
  deviceLeftCaption: "Cool blue-black, neon lime. Reads as a hole cut in the paper.",
  deviceRightTitle: "Retuned warm",
  deviceRightCaption:
    "Warm near-black, lime tamed toward sage. Reads as a screen you’re looking into.",
  deviceClosing:
    "Both keep the dark. The question is only whether WIT’s neon lime stays as a deliberate jolt or gets pulled into the family. Neighbouring hues that don’t agree read as a mistake, while distant ones read as a choice.",

  aboutNote: "About page only, never the home page. Placeholders until you send the real entries.",
  pullquote:
    "I like seeing things work. I want them fast, simple, and finished like they were cared about.",

  footer:
    "Prototype only. Delete this route before launch, or keep it out of the sitemap. Nothing on this page is wired into the live site.",
};

const PALETTE = [
  { name: "Ground", hex: "#F7F2EB", role: "Page background. Yours.", border: false },
  { name: "Raised", hex: "#EAE2D6", role: "Cards, panels, the device lip. Yours.", border: false },
  { name: "Accent", hex: "#8B9A6E", role: "Sage. Shapes and fills, never text on cream. Yours.", border: false },
  { name: "Hairline", hex: "#EEEEEE", role: "Rules and dividers. Yours.", border: true },
  { name: "Ink", hex: "#33291F", role: "Warm bark. Body text. Added, because your four are all too light.", border: false },
  { name: "Quiet", hex: "#6B6259", role: "Secondary text and captions. Added.", border: false },
  { name: "Device", hex: "#1E1A14", role: "Warm near-black behind embedded demos. Added.", border: false },
];

const CONTRAST = [
  { pair: "Ink on ground", ratio: "12.76:1", verdict: "AAA", pass: true, use: "Body text, headings" },
  { pair: "Quiet on ground", ratio: "5.60:1", verdict: "AA", pass: true, use: "Captions, meta" },
  { pair: "Ink on sage", ratio: "4.34:1", verdict: "AA", pass: true, use: "Primary button label" },
  { pair: "Sage on ground", ratio: "2.71:1", verdict: "Fails", pass: false, use: "Never text, fills only" },
  { pair: "Ground on sage", ratio: "2.71:1", verdict: "Fails", pass: false, use: "Why buttons take dark type" },
];

const BADGES = [
  { cls: styles.bShipped, label: "Shipped" },
  { cls: styles.bProgress, label: "In progress" },
  { cls: styles.bPlanning, label: "Architecture phase" },
  { cls: styles.bShelf, label: "On the shelf" },
];

export default function StyleguidePage() {
  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <header className={styles.masthead}>
          <p className={styles.kicker}>{COPY.kicker}</p>
          <h1 className={styles.mastheadTitle}>{COPY.title}</h1>
          <p className={styles.lede}>{COPY.lede}</p>
        </header>

        {/* palette */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>01</p>
            <h2 className={styles.sectionTitle}>Palette</h2>
            <p className={styles.note}>{COPY.paletteNote}</p>
          </div>

          <div className={styles.swatchGrid}>
            {PALETTE.map((c) => (
              <div key={c.name} className={styles.swatch}>
                <div
                  className={styles.chip}
                  style={{
                    background: c.hex,
                    ...(c.border ? { boxShadow: "inset 0 0 0 1px #e0e0e0" } : {}),
                  }}
                />
                <div className={styles.swatchMeta}>
                  <strong className={styles.swatchName}>{c.name}</strong>
                  <span className={styles.swatchHex}>{c.hex}</span>
                  <span className={styles.swatchRole}>{c.role}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* contrast */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>02</p>
            <h2 className={styles.sectionTitle}>Contrast</h2>
            <p className={styles.note}>{COPY.contrastNote}</p>
          </div>

          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Pair</th>
                  <th scope="col">Ratio</th>
                  <th scope="col">Verdict</th>
                  <th scope="col">Where it is used</th>
                </tr>
              </thead>
              <tbody>
                {CONTRAST.map((r) => (
                  <tr key={r.pair}>
                    <td>{r.pair}</td>
                    <td className={styles.ratio}>{r.ratio}</td>
                    <td className={r.pass ? styles.pass : styles.fail}>{r.verdict}</td>
                    <td>{r.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* type */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>03</p>
            <h2 className={styles.sectionTitle}>Type</h2>
            <p className={styles.note}>{COPY.typeNote}</p>
          </div>

          <div className={styles.typeRow}>
            <span className={styles.typeLabel}>Display</span>
            <span className={styles.tDisplay}>{COPY.heroGreeting}</span>
          </div>
          <div className={styles.typeRow}>
            <span className={styles.typeLabel}>Title</span>
            <span className={styles.tTitle}>Things I’ve built</span>
          </div>
          <div className={styles.typeRow}>
            <span className={styles.typeLabel}>Lede</span>
            <span className={styles.tLede}>I build things that make life easier and faster.</span>
          </div>
          <div className={styles.typeRow}>
            <span className={styles.typeLabel}>Body</span>
            <span className={styles.tBody}>
              Most of what I build is something I needed and couldn’t buy.
            </span>
          </div>
          <div className={styles.typeRow}>
            <span className={styles.typeLabel}>Mono label</span>
            <span className={styles.tMono}>Selected work</span>
          </div>
        </section>

        {/* buttons and badges */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>04</p>
            <h2 className={styles.sectionTitle}>Buttons and status badges</h2>
            <p className={styles.note}>{COPY.buttonsNote}</p>
          </div>

          <div className={styles.row}>
            <span className={styles.btnPrimary}>See the work</span>
            <span className={styles.btnGhost}>Résumé, hardware</span>
            <span className={styles.btnGhost}>Résumé, software</span>
          </div>

          <div className={styles.row} style={{ marginTop: "2rem" }}>
            {BADGES.map((b) => (
              <span key={b.label} className={`${styles.badge} ${b.cls}`}>
                <span className={styles.badgeDot} aria-hidden="true" />
                {b.label}
              </span>
            ))}
          </div>
          <p className={styles.note}>{COPY.badgesNote}</p>
        </section>

        {/* home */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>05 · demo</p>
            <h2 className={styles.sectionTitle}>Home</h2>
          </div>

          <div className={styles.demoFrame}>
            <p className={styles.tMono}>{COPY.heroEyebrow}</p>
            <h3 className={styles.heroGreeting} style={{ marginTop: "1.25rem" }}>
              {COPY.heroGreeting}
            </h3>
            <p className={styles.heroLine}>{COPY.heroLine}</p>
            <div className={`${styles.row} ${styles.heroActions}`}>
              <span className={styles.btnPrimary}>{COPY.heroPrimary}</span>
              <span className={styles.btnGhost}>{COPY.heroSecondary}</span>
            </div>
          </div>
        </section>

        {/* project cards */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>06 · demo</p>
            <h2 className={styles.sectionTitle}>Project cards</h2>
          </div>

          <div className={styles.cardGrid}>
            <article className={styles.card}>
              <div className={styles.cardTop}>
                <span className={`${styles.badge} ${styles.bShipped}`}>
                  <span className={styles.badgeDot} aria-hidden="true" />
                  Shipped
                </span>
                <span className={styles.cardYear}>2026</span>
              </div>
              <h3 className={styles.cardTitle}>TAMU Schedule Optimizer</h3>
              <p className={styles.cardTagline}>Every conflict-free schedule, scored</p>
              <p className={styles.cardBlurb}>
                Pulls 21k+ course sections, enriches them with professor ratings and real
                grade distributions, and ranks every possible schedule against my weights.
              </p>
              <div className={styles.tagRow}>
                {["Python", "Flask", "GraphQL", "Data pipelines"].map((t) => (
                  <span key={t} className={styles.tag}>{t}</span>
                ))}
              </div>
            </article>

            <article className={styles.card}>
              <div className={styles.cardTop}>
                <span className={`${styles.badge} ${styles.bShelf}`}>
                  <span className={styles.badgeDot} aria-hidden="true" />
                  On the shelf
                </span>
                <span className={styles.cardYear}>2026</span>
              </div>
              <h3 className={styles.cardTitle}>Gladiator Dash RFID Timing</h3>
              <p className={styles.cardTagline}>Race timing, designed to be built</p>
              <p className={styles.cardBlurb}>
                An embedded RFID timing system for our philanthropy’s mud run. One reader,
                two antennas, and a hard think about cross-reads 25 feet apart.
              </p>
              <div className={styles.tagRow}>
                {["Raspberry Pi", "RFID / LLRP", "Embedded", "SQLite"].map((t) => (
                  <span key={t} className={styles.tag}>{t}</span>
                ))}
              </div>
            </article>
          </div>
        </section>

        {/* embedded demos */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>07</p>
            <h2 className={styles.sectionTitle}>How the embedded demos sit</h2>
            <p className={styles.note}>{COPY.deviceNote}</p>
          </div>

          <div className={styles.deviceSplit}>
            <div className={styles.deviceCol}>
              <h3>{COPY.deviceLeftTitle}</h3>
              <p className={styles.deviceCaption}>{COPY.deviceLeftCaption}</p>
              <div className={styles.device}>
                <div className={styles.deviceBarCool}>
                  <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
                </div>
                <div className={styles.deviceBodyCool}>
                  <span className={`${styles.deviceHeadline} ${styles.coolHeadline}`}>
                    Day 41 · <span className={styles.limeNeon}>Locked In</span>
                  </span>
                  <div className={`${styles.deviceMeter} ${styles.meterCool}`}>
                    <div className={styles.meterFillNeon} />
                  </div>
                  <p className={styles.deviceSmall}>
                    physical · mental · spiritual · rest<br />
                    7-day average 68%
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.deviceCol}>
              <h3>{COPY.deviceRightTitle}</h3>
              <p className={styles.deviceCaption}>{COPY.deviceRightCaption}</p>
              <div className={styles.device}>
                <div className={styles.deviceBarWarm}>
                  <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
                </div>
                <div className={styles.deviceBodyWarm}>
                  <span className={`${styles.deviceHeadline} ${styles.warmHeadline}`}>
                    Day 41 · <span className={styles.limeTamed}>Locked In</span>
                  </span>
                  <div className={`${styles.deviceMeter} ${styles.meterWarm}`}>
                    <div className={styles.meterFillTamed} />
                  </div>
                  <p className={styles.deviceSmall}>
                    physical · mental · spiritual · rest<br />
                    7-day average 68%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className={styles.note}>{COPY.deviceClosing}</p>
        </section>

        {/* about */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>08 · demo</p>
            <h2 className={styles.sectionTitle}>About</h2>
            <p className={styles.note}>{COPY.aboutNote}</p>
          </div>

          <blockquote className={styles.pullquote}>{COPY.pullquote}</blockquote>

          <div className={styles.aboutGrid} style={{ marginTop: "2.5rem" }}>
            <div className={styles.aboutCol}>
              <h3>Off the clock</h3>
              <ul className={styles.aboutList}>
                <li>
                  Fridays at Still Creek Ranch
                  <span>Basketball, cards, and actual conversations</span>
                </li>
                <li>
                  Coaching tennis
                  <span>Zero to 20+ students since 2024</span>
                </li>
                <li>
                  One Army
                  <span>Class Candidate Advisor, 90+ members</span>
                </li>
              </ul>
            </div>
            <div className={styles.aboutCol}>
              <h3>Currently</h3>
              <ul className={styles.aboutList}>
                <li>
                  Reading
                  <span>Send me the title</span>
                </li>
                <li>
                  Watching
                  <span>Letterboxd feed goes here</span>
                </li>
                <li>
                  Following
                  <span>Teams go here</span>
                </li>
              </ul>
            </div>
            <div className={styles.aboutCol}>
              <h3>Been there</h3>
              <ul className={styles.aboutList}>
                <li>
                  Belfast and Dublin
                  <span>Queen’s University, summer 2026</span>
                </li>
                <li>
                  More to come
                  <span>Send me the list</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <footer className={styles.foot}>
          <p>{COPY.footer}</p>
        </footer>
      </div>
    </div>
  );
}
