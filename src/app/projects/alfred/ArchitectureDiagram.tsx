/** Inline SVG architecture diagram for the ALFRED case study. Server-safe, token-colored. */

const MONO = "var(--font-mono)";
const INK = "var(--color-ink)";
const SURFACE = "var(--color-surface)";
const RAISED = "var(--color-raised)";
const LINE = "var(--color-line)";
const FG = "var(--color-fg)";
const MUTED = "var(--color-muted)";
const COPPER = "var(--color-copper)";

const TABS = ["SCHEDULE", "EMAIL", "HABITS", "ALFRED", "BRAIN"];

const ROUTES = [
  { y: 168, label: "/api/chat" },
  { y: 204, label: "/api/calendar" },
  { y: 240, label: "/api/gmail" },
];

const SERVICES = [
  { y: 96, title: "CLAUDE API", sub: "streaming chat · context injected" },
  { y: 186, title: "GOOGLE CALENDAR", sub: "OAuth · read / write" },
  { y: 276, title: "GMAIL API", sub: "read-only · full-body decode" },
];

export default function ArchitectureDiagram() {
  return (
    <svg
      viewBox="0 0 840 470"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="ALFRED architecture: browser UI with five tabs talking to Next.js API routes, which connect to the Claude API, Google Calendar, and Gmail; habits persist to localStorage with Supabase planned."
    >
      <defs>
        <marker id="alfred-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 z" fill={COPPER} />
        </marker>
      </defs>

      {/* backdrop + blueprint grid */}
      <rect width="840" height="470" fill={INK} />
      {[100, 200, 300, 400].map((y) => (
        <line key={y} x1="0" y1={y} x2="840" y2={y} stroke="rgba(51,41,31,0.05)" strokeWidth="1" />
      ))}
      {[140, 280, 420, 560, 700].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="470" stroke="rgba(51,41,31,0.05)" strokeWidth="1" />
      ))}

      {/* ── Browser UI ── */}
      <rect x="28" y="56" width="220" height="360" rx="10" fill={SURFACE} stroke={LINE} />
      <text x="44" y="84" fontFamily={MONO} fontSize="12" letterSpacing="2" fill={COPPER}>
        BROWSER UI
      </text>
      {/* HUD bar */}
      <rect x="44" y="100" width="188" height="26" rx="4" fill={RAISED} stroke={LINE} />
      <text x="52" y="117" fontFamily={MONO} fontSize="10" fill={MUTED}>
        HUD BAR · DAILY BULLETIN
      </text>
      {/* tab rows */}
      <text x="44" y="152" fontFamily={MONO} fontSize="9" letterSpacing="1.5" fill={MUTED}>
        TAB PANEL
      </text>
      {TABS.map((tab, i) => (
        <g key={tab}>
          <rect x="44" y={162 + i * 36} width="188" height="26" rx="4" fill={RAISED} stroke={tab === "ALFRED" ? COPPER : LINE} />
          <text x="56" y={179 + i * 36} fontFamily={MONO} fontSize="10" fill={tab === "ALFRED" ? COPPER : FG}>
            {tab}
          </text>
        </g>
      ))}
      {/* chat panel */}
      <rect x="44" y="352" width="188" height="46" rx="4" fill={RAISED} stroke={LINE} />
      <text x="56" y="371" fontFamily={MONO} fontSize="10" fill={FG}>
        CHAT PANEL
      </text>
      <text x="56" y="386" fontFamily={MONO} fontSize="9" fill={MUTED}>
        streamed tokens
      </text>

      {/* ── Next.js API routes ── */}
      <rect x="340" y="132" width="180" height="150" rx="10" fill={SURFACE} stroke={LINE} />
      <text x="356" y="158" fontFamily={MONO} fontSize="12" letterSpacing="2" fill={COPPER}>
        NEXT.JS ROUTES
      </text>
      {ROUTES.map((r) => (
        <g key={r.label}>
          <rect x="356" y={r.y} width="148" height="24" rx="4" fill={RAISED} stroke={LINE} />
          <text x="366" y={r.y + 16} fontFamily={MONO} fontSize="10" fill={FG}>
            {r.label}
          </text>
        </g>
      ))}

      {/* ── External services ── */}
      {SERVICES.map((s) => (
        <g key={s.title}>
          <rect x="612" y={s.y} width="200" height="60" rx="10" fill={SURFACE} stroke={LINE} />
          <text x="628" y={s.y + 25} fontFamily={MONO} fontSize="11" letterSpacing="1.5" fill={FG}>
            {s.title}
          </text>
          <text x="628" y={s.y + 44} fontFamily={MONO} fontSize="9" fill={MUTED}>
            {s.sub}
          </text>
        </g>
      ))}

      {/* ── Persistence ── */}
      <rect x="340" y="340" width="180" height="76" rx="10" fill={SURFACE} stroke={LINE} strokeDasharray="5 4" />
      <text x="356" y="366" fontFamily={MONO} fontSize="11" letterSpacing="1.5" fill={FG}>
        localStorage
      </text>
      <text x="356" y="384" fontFamily={MONO} fontSize="10" fill={COPPER}>
        → Supabase
      </text>
      <text x="356" y="400" fontFamily={MONO} fontSize="9" fill={MUTED}>
        habit persistence (planned)
      </text>

      {/* ── Connections ── */}
      {/* browser → routes */}
      <line x1="248" y1="207" x2="336" y2="207" stroke={COPPER} strokeWidth="1.5" markerEnd="url(#alfred-arrow)" />
      <text x="292" y="197" fontFamily={MONO} fontSize="9" fill={MUTED} textAnchor="middle">
        fetch · SSE
      </text>
      {/* browser → persistence */}
      <line x1="248" y1="375" x2="336" y2="375" stroke={COPPER} strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#alfred-arrow)" />
      <text x="292" y="365" fontFamily={MONO} fontSize="9" fill={MUTED} textAnchor="middle">
        habits
      </text>
      {/* routes → services */}
      <line x1="520" y1="180" x2="608" y2="128" stroke={COPPER} strokeWidth="1.5" markerEnd="url(#alfred-arrow)" />
      <line x1="520" y1="216" x2="608" y2="216" stroke={COPPER} strokeWidth="1.5" markerEnd="url(#alfred-arrow)" />
      <line x1="520" y1="252" x2="608" y2="304" stroke={COPPER} strokeWidth="1.5" markerEnd="url(#alfred-arrow)" />
    </svg>
  );
}
