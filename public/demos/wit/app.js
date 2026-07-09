/* ============================================================================
   WIT — Whatever It Takes  ·  APP
   Wires the pure core (wit-core.js) to the DOM: state, render, canvas, motion.
   ========================================================================== */
(function () {
  'use strict';

  var W = window.WIT;
  var STORAGE_KEY = 'wit.experience.v1';   // key unchanged — migration is by content
  var STORAGE_VERSION = 4;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------------------------------------------------------ state
  var prevBadges = [];   // to detect newly-earned badges for toasts
  var prevStats = null;  // for celebrationFor diff
  var prevSpent = {};    // shield-spent tracker per habit (id -> spent count)
  var firstRender = true;
  var lastRenderedDayKey = null;   // the day the DOM currently reflects (midnight guard)
  var lastWitSig = null; // dirty-check for WIT score + quote card

  // ------------------------------------------------------------------ store layer
  // cloneHabit replaced by W.copyHabit everywhere (v4: new fields round-trip)

  function defaultState() {
    var demo = W.seedDemo(84);
    return {
      version: STORAGE_VERSION,
      completions: demo.completions,
      logs: demo.logs,
      habits: W.DEFAULT_HABITS.map(W.copyHabit),
      goal: W.DEFAULT_GOAL
    };
  }

  // valid YYYY-MM-DD — thin alias for core (testable there)
  function isDayKey(key) { return W.isDayKey(key); }

  // Reshape only — never clean. Lifts legacy shapes to v4.
  function migrate(raw) {
    if (!raw || typeof raw !== 'object') return defaultState();
    var v = (typeof raw.version === 'number') ? raw.version : 0;
    if (v < 1) {
      raw = { version: 3, completions: raw.completions, habits: raw.habits, goal: raw.goal };
    }
    if (v < 4) {
      // v3 -> v3-FULL: logs sidecar appears; habit v4 fields default in validateHabits
      raw.logs = raw.logs || {};
    }
    raw.version = STORAGE_VERSION;
    return raw;
  }

  // THE ONLY trust boundary. Total function: never throws, always a full valid state.
  function validate(input) {
    if (!input || typeof input !== 'object') return defaultState();

    // ---- habits: delegate to core's validator; fall back to defaults on failure
    var hv = W.validateHabits(input.habits);
    var habits = hv.ok ? hv.habits : W.DEFAULT_HABITS.map(W.copyHabit);

    var knownId = {};
    habits.forEach(function (h) { knownId[h.id] = true; });

    // ---- completions: every value MUST be an array of known, de-duped ids
    var completions = {};
    var src = (input.completions && typeof input.completions === 'object') ? input.completions : {};
    Object.keys(src).forEach(function (key) {
      if (!isDayKey(key)) return;
      var day = src[key];
      if (!Array.isArray(day)) return;            // protects toggle()'s .slice()
      var clean = [], seen = {};
      for (var i = 0; i < day.length; i++) {
        var hid = day[i];
        if (typeof hid !== 'string' || seen[hid] || !knownId[hid]) continue;
        seen[hid] = true; clean.push(hid);
      }
      if (clean.length) completions[key] = clean; // mirror toggle(): no empty arrays
    });

    // ---- logs: orphan-pruned via core trust-boundary cleaner
    var logs = W.cleanLogs(input.logs, completions, knownId);

    // ---- goal: clamped integer in [1, habits.length]
    return {
      version: STORAGE_VERSION,
      completions: completions,
      habits: habits,
      goal: W.clampGoal(input.goal),
      logs: logs
    };
  }

  // ---- THE PERSISTENCE SEAM (swap these two bodies for Supabase later) ----
  function loadState() {
    var raw = null;
    try { var s = localStorage.getItem(STORAGE_KEY); if (s) raw = JSON.parse(s); }
    catch (e) { raw = null; }
    return validate(migrate(raw));
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); stampSaved(true); }
    catch (e) { stampSaved(false); }      // quota / private-mode — tell the user
  }

  // thin aliases so existing call sites don't churn
  function load() { return loadState(); }
  function save() { saveState(); }

  function stampSaved(ok) {
    var n = document.getElementById('savedLine');
    if (!n) return;
    if (!ok) { n.textContent = ' · Warning: could not save (storage blocked)'; n.style.color = 'var(--danger)'; return; }
    var t = new Date();
    n.textContent = ' · saved ' + t.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    n.style.color = '';
  }

  var state = load();

  // ------------------------------------------------------------------ core sync
  function applyHabits() {
    var v = W.validateHabits(state.habits);
    if (!v.ok) { state.habits = W.DEFAULT_HABITS.map(W.copyHabit); v = W.validateHabits(state.habits); }
    state.habits = W.setHabits(v.habits);   // normalized; core now in sync with state
  }

  // ------------------------------------------------------------------ utils
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  var CHECK_SVG = '<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>';

  function animateNumber(node, to, opts) {
    opts = opts || {};
    var suffix = opts.suffix || '';
    var prefix = opts.prefix || '';
    var from = parseFloat(node.getAttribute('data-v'));
    if (isNaN(from)) from = 0;
    node.setAttribute('data-v', to);
    var dur = reduceMotion ? 0 : (opts.dur || 700);

    // kill any in-flight animation on this node so they can't fight
    if (node._raf) cancelAnimationFrame(node._raf);
    if (node._timer) clearTimeout(node._timer);
    function finalize() { node.textContent = prefix + Math.round(to) + suffix; }

    if (dur === 0 || from === to) { finalize(); return; }

    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var e = 1 - Math.pow(1 - p, 3); // easeOutCubic
      node.textContent = prefix + Math.round(from + (to - from) * e) + suffix;
      if (p < 1) node._raf = requestAnimationFrame(step); else finalize();
    }
    node._raf = requestAnimationFrame(step);
    // guarantee the end state even if rAF is throttled (background tab, etc.)
    node._timer = setTimeout(finalize, dur + 140);
  }

  // ============================================================ v2 HELPERS
  // ---- command-center derivations (week-over-week) ----
  function activeDaysWindow(days, endShift) {
    endShift = endShift || 0; var today = W.todayKey(), n = 0;
    for (var i = 0; i < days; i++) if ((state.completions[W.shiftKey(today, -(i + endShift))] || []).length > 0) n++;
    return n;
  }
  function fourWinsWindow(days, endShift) {
    endShift = endShift || 0; var today = W.todayKey(), n = 0;
    for (var i = 0; i < days; i++) if (W.isFourWinsDay(state.completions, W.shiftKey(today, -(i + endShift)))) n++;
    return n;
  }
  function deltaVsPrior(curr, prior) {
    if (prior === 0) return { pct: curr > 0 ? 100 : 0, trend: curr > 0 ? 'up' : 'flat' };
    var d = Math.round(((curr - prior) / prior) * 100);
    return { pct: d, trend: d > 0 ? 'up' : d < 0 ? 'down' : 'flat' };
  }
  // honest integer deltas (no ratio-on-tiny-ints distortion)
  function signTrend(n) { return n > 0 ? 'up' : n < 0 ? 'down' : 'flat'; }
  function fmtInt(n) { return (n > 0 ? '▲ +' : n < 0 ? '▼ ' : '· ') + n; }
  function setDelta(el, text, trend) { if (!el) return; el.textContent = text; el.dataset.trend = trend; }
  // mean daily score over a window ending `endShift` days back (excludes today when endShift=1)
  function avgScorePrev(days, endShift) {
    endShift = endShift || 0; var today = W.todayKey(), sum = 0;
    for (var i = 0; i < days; i++) {
      sum += (state.completions[W.shiftKey(today, -(i + endShift))] || [])
        .filter(function (id) { return W.catOf(id); }).length;
    }
    return days ? sum / days : 0;
  }
  function winCurrentStreak(catKey) {
    var best = 0; W.habitsIn(catKey).forEach(function (h) { var s = W.habitStreak(state.completions, h.id); if (s > best) best = s; });
    return best;
  }
  function winDailyCounts(catKey, days) {
    var out = [], today = W.todayKey();
    for (var i = days - 1; i >= 0; i--) {
      var list = state.completions[W.shiftKey(today, -i)] || [];
      out.push(list.filter(function (id) { return W.catOf(id) === catKey; }).length);
    }
    return out;
  }

  // ---- goal tracker (The Record) UI state ----
  var recordView = { days: 14, showAvg: true };
  var CAT_COLOR = {};
  W.CATEGORIES.forEach(function (c) { CAT_COLOR[c.key] = c.color; });
  var recordTip;
  var lastRecordSig = null;   // dirty-check so we don't rebuild the matrix/trend needlessly

  // ---- sparkline (tiny inline trend) ----
  function sparkPath(values, H) {
    H = H || 28;
    var n = values.length;
    if (n < 2) return { line: '', area: '', headY: H / 2 };
    var max = Math.max.apply(null, values), min = Math.min.apply(null, values);
    var span = (max - min) || 1, pad = 3, usableH = H - pad * 2;
    function x(i) { return (i / (n - 1)) * 100; }
    function y(v) { return pad + (1 - (v - min) / span) * usableH; }
    var d = 'M' + x(0).toFixed(2) + ' ' + y(values[0]).toFixed(2);
    for (var i = 1; i < n; i++) d += ' L' + x(i).toFixed(2) + ' ' + y(values[i]).toFixed(2);
    return { line: d, area: d + ' L100 ' + H + ' L0 ' + H + ' Z', headY: y(values[n - 1]) };
  }
  function buildSpark(values, colorVar) {
    var H = 28, p = sparkPath(values, H);
    var svg = el('svg', 'spark');
    svg.setAttribute('viewBox', '0 0 100 ' + H);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.setProperty('--c', colorVar);
    svg.innerHTML =
      '<path class="spark__area" d="' + p.area + '"/>' +
      '<path class="spark__line" d="' + p.line + '"/>' +
      '<circle class="spark__head" cx="100" cy="' + p.headY.toFixed(2) + '" r="2"/>';
    return svg;
  }

  // ============================================================ v2 GAUGES
  var GAUGE_CIRC = 2 * Math.PI * 52; // 326.726 — matches CSS dasharray
  var GAUGES = [
    { key: 'today',    label: 'Today',        color: 'var(--wit)',
      value: function (s) { return s.scheduledToday ? Math.min(100, Math.round((s.todayCount / s.scheduledToday) * 100)) : 100; } },
    { key: 'weekly',   label: 'Weekly',       color: 'var(--mental)',
      value: function (s) { return W.weeklyConsistency(state.completions).ratePct; } },
    { key: 'rank',     label: 'To next rank', color: 'var(--wit)',
      value: function (s) { return Math.round(s.rank.progress * 100); } },
    { key: 'fourwins', label: '4-Wins rate',  color: 'var(--spiritual)',
      value: function (s) { return Math.round((fourWinsWindow(14) / 14) * 100); } }
  ];
  function buildGauges() {
    var host = $('#gauges'); if (!host) return;
    GAUGES.forEach(function (g) {
      var card = el('article', 'gauge');
      card.dataset.key = g.key;
      card.style.setProperty('--c', g.color);
      card.innerHTML =
        '<div class="gauge__ring-wrap">' +
          '<svg class="gauge__svg" viewBox="0 0 120 120" aria-hidden="true">' +
            '<defs><linearGradient id="gaugeGrad-' + g.key + '" x1="0" y1="0" x2="1" y2="1">' +
              '<stop offset="0" stop-color="var(--c)" stop-opacity="0.55"/>' +
              '<stop offset="1" stop-color="var(--c)"/>' +
            '</linearGradient></defs>' +
            '<circle class="gauge__track" cx="60" cy="60" r="52"/>' +
            '<circle class="gauge__fill" cx="60" cy="60" r="52" stroke="url(#gaugeGrad-' + g.key + ')"/>' +
          '</svg>' +
          '<div class="gauge__center"><span class="gauge__value" data-gauge-val data-v="0">0</span>' +
          '<span class="gauge__unit">%</span></div>' +
        '</div>' +
        '<div class="gauge__meta"><span class="gauge__label">' + g.label + '</span>' +
        '<span class="gauge__delta" data-gauge-delta data-trend="flat">—</span></div>';
      host.appendChild(card);
    });
  }
  function renderGauges(stats) {
    $$('.gauge').forEach(function (card) {
      var key = card.dataset.key;
      var cfg = GAUGES.filter(function (g) { return g.key === key; })[0];
      if (!cfg) return;
      var pct = Math.max(0, Math.min(100, cfg.value(stats)));
      $('.gauge__fill', card).style.strokeDashoffset = GAUGE_CIRC * (1 - pct / 100);
      animateNumber($('[data-gauge-val]', card), pct);

      // honest deltas — count gauges compare like-for-like, no ratio-on-tiny-ints
      var dEl = $('[data-gauge-delta]', card);
      if (key === 'today') {
        var todayDeltaText = stats.scheduledToday === 0
          ? 'Rest day — nothing scheduled'
          : stats.todayCount + ' of ' + stats.scheduledToday + ' scheduled';
        setDelta(dEl, todayDeltaText, 'flat');
      } else if (key === 'weekly') {
        var wc = W.weeklyConsistency(state.completions);       // tested; percentage-point delta
        setDelta(dEl, fmtInt(wc.deltaPct) + '% vs last wk', signTrend(wc.deltaPct));
      } else if (key === 'fourwins') {
        var diff = fourWinsWindow(14) - fourWinsWindow(14, 14); // prior 14 completed days
        setDelta(dEl, fmtInt(diff) + ' vs prev 14', signTrend(diff));
      } else if (key === 'rank') {
        setDelta(dEl, stats.rank.next
          ? stats.rank.toNext.toLocaleString() + ' XP to ' + stats.rank.next.name : 'Max rank', 'flat');
      }
    });
  }

  // ============================================================ v2 STATUS CARDS
  var WIN_STATE_LABEL = { 'on-track': 'On track', 'ready': 'Ready', 'slipping': 'Slipping', 'cold': 'Cold', 'rest-day': 'Resting' };
  var WIN_STATE_ICON = {
    'on-track': 'M5 13l4 4L19 7',
    'ready':    'M8 6v12l10-6z',
    'slipping': 'M12 4l9 16H3z M12 10v5 M12 17.5v.5',
    'cold':     'M12 4l8 8-8 8-8-8z',
    'rest-day': 'M20 14a8 8 0 1 1-9-8 6 6 0 0 0 9 8z'
  };
  function buildWincards() {
    var host = $('#wincards'); if (!host) return;
    W.CATEGORIES.forEach(function (c) {
      var card = el('article', 'wincard');
      card.dataset.cat = c.key;
      card.dataset.state = 'cold';
      card.style.setProperty('--c', c.color);
      card.innerHTML =
        '<div class="wincard__top">' +
          '<span class="wincard__icon"><svg viewBox="0 0 24 24"><path d=""/></svg></span>' +
          '<span class="wincard__state" data-wincard-state>—</span></div>' +
        '<h3 class="wincard__label">' + c.label + '</h3>' +
        '<div class="wincard__metric"><span class="wincard__metric-lab">Streak</span>' +
        '<span class="wincard__num" data-wincard-num data-v="0">0</span></div>' +
        '<div class="wincard__spark"></div>' +
        '<div class="wincard__foot" data-wincard-foot></div>';
      host.appendChild(card);
    });
  }
  function winState(catKey, stats) {
    var pc = stats.perCat[catKey];
    // Nothing due in this Win = rest day for it (perWeek never hard-schedules)
    if (pc.todayTotal === 0) return 'rest-day';
    var streak = winBestStreak(catKey, stats);
    var done = pc.todayDone, total = pc.todayTotal;
    if (done === total && total > 0) return 'on-track';
    if (streak >= 3) return 'on-track';
    if (done > 0) return 'slipping';
    return streak > 0 ? 'ready' : 'cold';
  }

  // Best live streak across habits in a Win, using pre-computed timelines
  function winBestStreak(catKey, stats) {
    var best = 0;
    W.habitsIn(catKey).forEach(function (h) {
      var tl = stats.timelines && stats.timelines[h.id];
      var s = tl ? tl.streak : 0;
      if (s > best) best = s;
    });
    return best;
  }

  // Best streak unit suffix for the winning habit in a category
  function winStreakSuffix(catKey, stats) {
    var best = 0, unit = 'd';
    W.habitsIn(catKey).forEach(function (h) {
      var tl = stats.timelines && stats.timelines[h.id];
      var s = tl ? tl.streak : 0;
      if (s > best) { best = s; unit = W.streakUnit(h); }
    });
    return unit;
  }
  function renderWincards(stats) {
    $$('.wincard').forEach(function (card) {
      var cat = card.dataset.cat;
      var pc = stats.perCat[cat];
      var state2 = winState(cat, stats);
      card.dataset.state = state2;
      $('.wincard__icon path', card).setAttribute('d', WIN_STATE_ICON[state2]);
      $('[data-wincard-state]', card).textContent = WIN_STATE_LABEL[state2];
      var bestStreak = winBestStreak(cat, stats);
      var suffix = winStreakSuffix(cat, stats);
      animateNumber($('[data-wincard-num]', card), bestStreak, { suffix: suffix });
      $('[data-wincard-foot]', card).textContent = pc.todayDone + ' / ' + pc.todayTotal + ' today';
      var sparkHost = $('.wincard__spark', card);
      sparkHost.innerHTML = '';
      sparkHost.appendChild(buildSpark(winDailyCounts(cat, 10), 'var(--state)'));
    });
  }

  // ============================================================ v2 THE RECORD
  // ---- back-fill: editable window helper ----
  var EDIT_DAYS_BACK = 2;                       // today + previous 2 days
  function editableKeys() {
    var t = W.todayKey(), set = {};
    for (var i = 0; i <= EDIT_DAYS_BACK; i++) set[W.shiftKey(t, -i)] = true;
    return set;
  }

  function flashLocked(cell) {
    if (!cell) return;
    cell.classList.remove('mcell--locked');
    void cell.offsetWidth; // reflow to restart animation
    cell.classList.add('mcell--locked');
    setTimeout(function () { cell.classList.remove('mcell--locked'); }, 600);
  }

  function onMatrixToggle(e) {
    var cell = e.target.closest('.mcell');
    if (!cell) return;
    var key = cell.dataset.key;
    var id = cell.dataset.id;
    if (!key || !id) return;
    if (!editableKeys()[key]) { flashLocked(cell); return; }
    var wasDone = (state.completions[key] || []).indexOf(id) !== -1;
    state.completions = W.toggle(state.completions, id, key);
    if (wasDone) {
      // toggle-OFF: clear log for this back-fill day
      state.logs = W.setLog(state.logs || {}, id, key, 0);
    }
    save();
    lastRecordSig = null;
    render({ silent: true });  // back-fill never celebrates
    var h = W.HABIT_BY_ID[id];
    if (h && !wasDone) {
      var dayLabel = matrixDateLabel(key);
      toast('+' + W.XP.perHabit, h.name, dayLabel, 'xp');
    }
  }

  function buildRecord() {
    recordTip = el('div', 'record-tip');
    document.body.appendChild(recordTip);
    $$('#recordWindows .seg').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var d = +btn.dataset.days; if (d === recordView.days) return;
        recordView.days = d;
        $$('#recordWindows .seg').forEach(function (b) { b.setAttribute('aria-selected', b === btn ? 'true' : 'false'); });
        renderRecord();
      });
    });
    var avg = $('#recordAvg');
    if (avg) avg.addEventListener('change', function () { recordView.showAvg = avg.checked; renderRecord(); });
    var m = $('#matrix'); if (m) m.addEventListener('click', onMatrixToggle);
  }
  function buildMatrixGrid(series, stats) {
    var m = $('#matrix'); if (!m) return;
    m.style.setProperty('--cols', W.HABITS.length);
    var todayK = W.todayKey();
    var canEdit = editableKeys();
    var timelines = (stats && stats.timelines) || {};
    var html = '<div class="matrix__corner"></div>';
    W.HABITS.forEach(function (h) {
      var sched = schedLabel(h);
      html += '<div class="mcolhead" style="--c:' + (CAT_COLOR[h.cat] || 'var(--text-dim)') + '">' +
              '<span class="mcolhead__label">' + esc(W.shortOf(h)) + '</span>' +
              '<span class="mcolhead__sched">' + esc(sched) + '</span></div>';
    });
    series.forEach(function (d) {
      var isToday = d.key === todayK;
      var editable = !!canEdit[d.key];
      var dt = W.parseKey(d.key);
      var isMonday = dt.getDay() === 1;  // Monday hairline
      html += '<div class="mrow-date' + (isToday ? ' is-today' : '') + (isMonday ? ' is-weekstart' : '') + '">' + matrixDateLabel(d.key) + '</div>';
      W.HABITS.forEach(function (h) {
        var color = CAT_COLOR[h.cat] || 'var(--wit)';
        var tl = timelines[h.id];
        var st = W.dayCellState(state.completions, h, d.key, todayK, tl);
        var done = st === 'done' || st === 'bonus';
        // build tooltip
        var tipText = '';
        if (st === 'done') {
          var amt = W.amountOn(state.logs, d.key, h.id);
          tipText = amt ? ('done · ' + amt + ' ' + (h.target ? h.target.unit : '')) : 'done';
        } else if (st === 'bonus') { tipText = 'bonus'; }
        else if (st === 'missed') { tipText = 'missed'; }
        else if (st === 'rest') { tipText = 'Rest day — not scheduled'; }
        else if (st === 'free') { tipText = 'Flexible day'; }
        else if (st === 'shielded') { tipText = 'Shield used — streak protected'; }
        else if (st === 'pending') { tipText = 'Pending'; }
        html += '<div class="mcell is-' + st + (isToday ? ' in-today' : '') +
                (editable ? ' is-editable' : '') + '"' +
                ' style="--c:' + color + '"' +
                ' data-key="' + d.key + '" data-id="' + h.id + '"' +
                ' data-name="' + esc(h.name) + '" data-cat="' + h.cat + '"' +
                ' data-date="' + matrixDateLabel(d.key) + '" data-done="' + done + '"' +
                ' title="' + esc(h.name) + ' · ' + tipText + '">' +
                (done ? CHECK_SVG : '') +
                (st === 'shielded' ? '<svg class="mcell__shield" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/></svg>' : '') +
                '</div>';
      });
    });
    m.innerHTML = html;
  }
  function matrixDateLabel(key) {
    var dt = W.parseKey(key);
    return W.WEEKDAYS[dt.getDay()] + ' ' + dt.getDate();   // "Mon 12"
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function buildTrend(series, showAvg) {
    var svg = $('#trend'); if (!svg) return;
    var W3 = 720, H3 = 300, padL = 30, padR = 14, padT = 14, padB = 18;
    var iw = W3 - padL - padR, ih = H3 - padT - padB, maxY = W.HABITS.length, n = series.length, todayK = W.todayKey();
    function X(i) { return padL + (n <= 1 ? 0 : (i / (n - 1)) * iw); }
    function Y(v) { return padT + ih - (v / maxY) * ih; }
    var parts = [];
    [0, 3, 6, 9, 12].forEach(function (v) {
      var y = Y(v).toFixed(1);
      parts.push('<line class="trend__grid" x1="' + padL + '" y1="' + y + '" x2="' + (W3 - padR) + '" y2="' + y + '"/>');
      parts.push('<text class="trend__ytick" x="' + (padL - 6) + '" y="' + (+y + 3).toFixed(1) + '" text-anchor="end">' + v + '</text>');
    });
    var gy = Y(W.DEFAULT_GOAL).toFixed(1);
    parts.push('<line class="trend__goal" x1="' + padL + '" y1="' + gy + '" x2="' + (W3 - padR) + '" y2="' + gy + '"/>');
    parts.push('<text class="trend__goal-label" x="' + (W3 - padR) + '" y="' + (+gy - 5).toFixed(1) + '" text-anchor="end">goal ' + W.DEFAULT_GOAL + '</text>');
    var linePts = series.map(function (d, i) { return X(i).toFixed(1) + ',' + Y(d.score).toFixed(1); });
    if (n) {
      var areaD = 'M ' + X(0).toFixed(1) + ',' + Y(0).toFixed(1) + ' L ' + linePts.join(' L ') + ' L ' + X(n - 1).toFixed(1) + ',' + Y(0).toFixed(1) + ' Z';
      parts.push('<defs><linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--wit)" stop-opacity="0.34"/><stop offset="1" stop-color="var(--wit)" stop-opacity="0"/></linearGradient></defs>');
      parts.push('<path class="trend__area" d="' + areaD + '" fill="url(#trendGrad)"/>');
    }
    if (showAvg) {
      var avg = W.rollingAverage(series.map(function (d) { return d.score; }), 7);
      parts.push('<polyline class="trend__avg" points="' + avg.map(function (v, i) { return X(i).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' ') + '"/>');
    }
    parts.push('<polyline class="trend__line" points="' + linePts.join(' ') + '"/>');
    series.forEach(function (d, i) {
      var isToday = d.key === todayK;
      parts.push('<circle class="trend__dot' + (isToday ? ' is-today' : '') + '" cx="' + X(i).toFixed(1) + '" cy="' + Y(d.score).toFixed(1) +
        '" r="' + (isToday ? 5 : 3.2) + '" data-trend="1" data-date="' + matrixDateLabel(d.key) + '" data-score="' + d.score + '" data-fw="' + d.fourWins + '"/>');
    });
    svg.innerHTML = parts.join('');
    var axis = $('#trendAxis'); if (!axis) return;
    var idxs = pickAxisIdx(n);
    axis.innerHTML = idxs.map(function (i) {
      var lab = matrixDateLabel(series[i].key);
      return '<span>' + (i === idxs[0] || i === idxs[idxs.length - 1] ? lab : lab.split(' ')[1]) + '</span>';
    }).join('');
  }
  function pickAxisIdx(n) {
    if (n <= 1) return [0];
    var want = Math.min(7, n), out = [];
    for (var k = 0; k < want; k++) out.push(Math.round(k * (n - 1) / (want - 1)));
    return out.filter(function (v, i, a) { return a.indexOf(v) === i; });
  }
  function renderRecord(stats) {
    // dirty-check: today's row is the only mutable day; reset/midnight change the rest
    // Extended sig: shields depend on more than completions — bust when habits change too
    var tk = W.todayKey();
    var sig = recordView.days + '|' + recordView.showAvg + '|' + tk + '|' +
      (state.completions[tk] || []).slice().sort().join(',') + '|' + Object.keys(state.completions).length +
      '|' + W.HABITS.map(function(h){return h.id+h.grace+(h.sched?h.sched.type:'');}).join(',');
    if (sig === lastRecordSig) return;
    lastRecordSig = sig;
    var series = W.dailyScores(state.completions, recordView.days);
    buildMatrixGrid(series, stats);
    buildTrend(series, recordView.showAvg);
    wireRecordTips();
    var today = series[series.length - 1];
    var todayScore = today ? today.score : 0;
    animateNumber($('#trendNow'), todayScore, { dur: 600 });
    var weekAgo = series.length > 7 ? series[series.length - 8] : null;
    var deltaEl = $('#trendDelta');
    if (weekAgo) {
      var diff = todayScore - weekAgo.score;
      deltaEl.textContent = (diff > 0 ? '▲ +' : diff < 0 ? '▼ ' : '· ') + diff + ' vs last wk';
      deltaEl.className = 'trend-card__delta ' + (diff > 0 ? 'up' : diff < 0 ? 'down' : '');
    } else { deltaEl.textContent = ''; deltaEl.className = 'trend-card__delta'; }
    $('#trendSub').textContent = 'last ' + recordView.days + ' days · goal ' + state.goal + ' · light days auto-capped';
  }
  function tipForTarget(target) {
    if (!target || !target.closest) return false;
    var cell = target.closest('.mcell'), dot = target.closest('.trend__dot');
    if (cell) {
      var done = cell.dataset.done === 'true';
      recordTip.innerHTML = '<div><b>' + esc(cell.dataset.name) + '</b></div><div class="rt-cat">' +
        esc(cap(cell.dataset.cat)) + ' · ' + esc(cell.dataset.date) + '</div><div>' + (done ? '✓ done' : '— missed') + '</div>';
      return true;
    }
    if (dot) {
      recordTip.innerHTML = '<div><b>' + esc(dot.getAttribute('data-score')) + '/' + W.HABITS.length + ' wins</b></div><div class="rt-cat">' +
        esc(dot.getAttribute('data-date')) + (dot.getAttribute('data-fw') === 'true' ? ' · Four Wins ✦' : '') + '</div>';
      return true;
    }
    return false;
  }
  function wireRecordTips() {
    var section = $('#record'); if (!section || section._tipsWired) return;
    section._tipsWired = true;
    // hover for mouse / pen
    section.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;          // touch handled on tap below
      if (tipForTarget(e.target)) showTip(e); else hideTip();
    });
    section.addEventListener('pointerleave', hideTip);
    // tap for touch (the primary target) — show above the finger
    section.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'touch') return;
      if (tipForTarget(e.target)) showTip(e, true); else hideTip();
    });
    // tap anywhere else dismisses
    document.addEventListener('pointerdown', function (e) {
      if (!section.contains(e.target)) hideTip();
    });
  }
  function showTip(e, above) {
    recordTip.classList.add('is-on');
    var w = recordTip.offsetWidth, h = recordTip.offsetHeight;
    var x = e.clientX + 14, y = e.clientY + (above ? -(h + 16) : 14);
    x = Math.max(8, Math.min(x, window.innerWidth - w - 8));   // clamp both axes
    y = Math.max(8, Math.min(y, window.innerHeight - h - 8));
    recordTip.style.left = x + 'px'; recordTip.style.top = y + 'px';
  }
  function hideTip() { recordTip.classList.remove('is-on'); }

  // Format a schedule as a short label (e.g. '4x/wk', 'Mon·Wed·Fri', 'daily')
  function schedLabel(h) {
    var s = W.schedOf(h);
    if (s.type === 'daily') return 'daily';
    if (s.type === 'perWeek') return s.n + 'x/wk';
    var DAY_ABBR = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return s.days.map(function (d) { return DAY_ABBR[d]; }).join('·');
  }

  // ============================================================ TRACKER COLUMNS (extracted)
  function buildTrackerColumns() {
    var tr = $('#tracker');
    if (!tr) return;
    W.CATEGORIES.forEach(function (c) {
      var col = el('div', 'col');
      col.style.setProperty('--c', c.color);
      col.dataset.cat = c.key;
      var head =
        '<div class="col__head"><span class="col__dot"></span>' +
        '<span class="col__name">' + c.label + '</span>' +
        '<span class="col__tally" data-tally></span></div>';
      var body = '';
      W.habitsIn(c.key).forEach(function (h) {
        var sched = schedLabel(h);
        var hasTarget = !!h.target;
        var targetTip = hasTarget ? esc(W.targetLabel(h.target)) : '';
        body +=
          '<div class="habit-wrap" data-hwrap="' + h.id + '">' +
          '<button class="habit" type="button" data-id="' + h.id + '" style="min-height:56px;touch-action:manipulation">' +
          '<span class="habit__check">' + CHECK_SVG + '</span>' +
          '<span class="habit__body"><span class="habit__name">' + esc(h.name) + '</span>' +
          '<span class="habit__hint" data-hint>' + esc(W.cueLine(h)) + '</span></span>' +
          '<span class="habit__chips">' +
          '<span class="habit__sched">' + esc(sched) + '</span>' +
          '<span class="habit__streak" data-streak style="display:none">🔥 <span data-streak-n>0</span><span class="habit__streak-unit"></span></span>' +
          '<span class="habit__shield" data-shield style="display:none" title="shield(s) banked — earned, not given">&#128737;</span>' +
          (h.sched && h.sched.type === 'perWeek' ? '<span class="habit__week" data-week>0/' + h.sched.n + ' wk</span>' : '') +
          (hasTarget ? '<button class="habit__value" type="button" data-value title="' + targetTip + '" aria-label="Log amount"></button>' : '') +
          '</span>' +
          '</button>' +
          '<div class="habit__journey" data-journey style="--j:0" title="Day 0 of 66 to automatic"></div>' +
          '</div>';
      });
      col.innerHTML = head + body;
      tr.appendChild(col);
    });
  }

  // ============================================================ HABIT EDITOR
  var editor = { draft: null, open: false };

  function commitHabits(nextList) {
    var v = W.validateHabits(nextList);
    if (!v.ok) return { ok: false, error: v.error };
    state.habits = W.setHabits(v.habits);
    save();
    rebuildHabitDOM();       // only #tracker + #matrix are habit-keyed
    lastRecordSig = null;    // force the Record to rebuild (new columns)
    render();
    return { ok: true };
  }
  function rebuildHabitDOM() {
    var tr = $('#tracker'); if (tr) tr.innerHTML = '';
    buildTrackerColumns();
    // win cards, gauges, radar, ladder, badges are CATEGORY/rank-keyed (the 4 fixed Wins),
    // not habit-keyed — their meters re-derive in render(); no structural rebuild needed.
    // The matrix rebuilds via renderRecord() because we nulled lastRecordSig.
    // Re-wire the tracker click handler (innerHTML wipe removed it)
    var newTr = $('#tracker');
    if (newTr) newTr.addEventListener('click', onToggle);
  }

  function initEditor() {
    var btn = $('#editHabitsBtn');
    if (btn) btn.addEventListener('click', openEditor);
    var sheet = $('#habitEditor');
    if (!sheet) return;
    var closeBtn = sheet.querySelector('.heditor__x');
    if (closeBtn) closeBtn.addEventListener('click', closeEditor);
    var cancelBtn = sheet.querySelector('.heditor__cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', closeEditor);
    sheet.addEventListener('click', function (e) {
      var t = e.target;
      if (t === sheet) closeEditor(); // backdrop click
      var row = t.closest('[data-draft-idx]');
      if (row) onEditorRowClick(e, row);
      var addBtn = t.closest('.heditor-add');
      if (addBtn) addHabitRow(addBtn.dataset.cat);
      if (t.closest('.heditor__save')) onEditorSave();
      if (t.closest('.heditor__reset')) onEditorReset();
    });
    sheet.addEventListener('input', function (e) {
      var row = e.target.closest('[data-draft-idx]');
      if (row) onEditorRowInput(e, row);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && editor.open) closeEditor();
    });
  }

  function openEditor() {
    editor.draft = W.getHabits();
    editor.open = true;
    var sheet = $('#habitEditor');
    if (sheet) { sheet.hidden = false; renderEditor(); }
  }

  function closeEditor() {
    editor.open = false;
    var sheet = $('#habitEditor');
    if (sheet) sheet.hidden = true;
  }

  function renderEditor() {
    var sheet = $('#habitEditor');
    if (!sheet) return;
    var body = sheet.querySelector('.heditor__body');
    if (!body) return;
    var html = '';
    W.CATEGORIES.forEach(function (c) {
      var inCat = editor.draft.filter(function (h) { return h.cat === c.key; });
      html += '<div class="heditor-cat" data-cat="' + c.key + '" style="--c:' + c.color + '">' +
              '<div class="heditor-cat__head">' + c.label + '</div>';
      inCat.forEach(function (h) {
        var draftIdx = editor.draft.indexOf(h);
        var posInWin = inCat.indexOf(h), winCount = inCat.length;
        html += habitRowHtml(h, draftIdx, posInWin, winCount);
      });
      html += '<button class="heditor-add" type="button" data-cat="' + c.key + '">+ Add habit</button>';
      html += '</div>';
    });
    body.innerHTML = html;
    showEditorError('');
  }

  function habitRowHtml(h, draftIdx, posInWin, winCount) {
    var canDelete = editor.draft.length > 1;
    var cats = W.CATEGORIES.map(function (c) {
      return '<option value="' + c.key + '"' + (h.cat === c.key ? ' selected' : '') + '>' + c.label + '</option>';
    }).join('');
    var sc = h.sched || { type: 'daily' };
    var scType = sc.type || 'daily';
    var scN = sc.n || 3;
    var scDays = sc.days || [];
    var DAYNAMES = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    var DAYVALS = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun as JS getDay values
    var daychips = DAYVALS.map(function (dv, i) {
      var active = scDays.indexOf(dv) !== -1;
      return '<button class="daychip" type="button" data-field="sched-day" data-day="' + dv + '" aria-pressed="' + (active ? 'true' : 'false') + '">' + DAYNAMES[i] + '</button>';
    }).join('');
    var hasTarget = !!(h.target);
    var tgt = h.target || {};
    return '<div class="hrow" data-draft-idx="' + draftIdx + '">' +
      '<span class="hrow__grip" aria-hidden="true">&#9723;</span>' +
      '<div class="hrow__moves">' +
        '<button class="hrow__mv" data-dir="-1" type="button" title="Move up" ' + (posInWin === 0 ? 'disabled' : '') + '>▲</button>' +
        '<button class="hrow__mv" data-dir="1" type="button" title="Move down" ' + (posInWin === winCount - 1 ? 'disabled' : '') + '>▼</button>' +
      '</div>' +
      '<div class="hrow__fields">' +
        '<input class="hrow__name" type="text" placeholder="Habit name" value="' + esc(h.name) + '" data-field="name" />' +
        '<input class="hrow__hint" type="text" placeholder="Hint (optional)" value="' + esc(h.hint || '') + '" data-field="hint" />' +
        '<input class="hrow__short" type="text" placeholder="Short label" value="' + esc(h.shortLabel || '') + '" data-field="shortLabel" maxlength="10" />' +
        '<div class="cuewrap"><span class="cuewrap__prefix">After I…</span><input class="hrow__cue" type="text" placeholder="finish coaching · pour my coffee" value="' + esc(h.cue || '') + '" data-field="cue" maxlength="60"/></div>' +
        '<div class="schedpick">' +
          '<div class="schedpick__modes">' +
            '<button class="schedpick__mode' + (scType === 'daily' ? ' is-active' : '') + '" type="button" data-field="sched-type" data-stype="daily">Daily</button>' +
            '<button class="schedpick__mode' + (scType === 'perWeek' ? ' is-active' : '') + '" type="button" data-field="sched-type" data-stype="perWeek">×/wk</button>' +
            '<button class="schedpick__mode' + (scType === 'days' ? ' is-active' : '') + '" type="button" data-field="sched-type" data-stype="days">Days</button>' +
          '</div>' +
          (scType === 'perWeek' ? '<div class="schedpick__perweek"><button class="stepbtn" type="button" data-field="sched-n-dec">−</button><span class="schedpick__n">' + scN + '</span><button class="stepbtn" type="button" data-field="sched-n-inc">+</button></div>' : '') +
          (scType === 'days' ? '<div class="daychips">' + daychips + '</div>' : '') +
        '</div>' +
        '<label class="switch-label"><input type="checkbox" data-field="target-on"' + (hasTarget ? ' checked' : '') + '/> Track amount</label>' +
        (hasTarget ? '<div class="targetpick"><div class="targetpick__row"><span class="targetpick__label">Amount</span><input class="hrow__target-amount" type="number" min="0" step="any" placeholder="e.g. 3" value="' + esc(String(tgt.amount || '')) + '" data-field="target-amount"/></div><div class="targetpick__row"><span class="targetpick__label">Unit</span><input class="hrow__target-unit" type="text" placeholder="mi, min, pages" value="' + esc(tgt.unit || '') + '" data-field="target-unit" maxlength="10"/></div><div class="targetpick__row"><span class="targetpick__label">Min</span><input class="hrow__target-min" type="number" min="0" step="any" placeholder="floor" value="' + esc(String(tgt.min || '')) + '" data-field="target-min"/></div></div>' : '') +
        '<label class="strictmode-label"><input type="checkbox" data-field="grace"' + (h.grace !== 'none' ? ' checked' : '') + '/> Shield enabled (uncheck = strict — no shields)</label>' +
      '</div>' +
      '<select class="hrow__win" data-field="cat">' + cats + '</select>' +
      '<button class="hrow__del" type="button" title="Delete"' + (canDelete ? '' : ' disabled') + '>×</button>' +
      '</div>';
  }

  function onEditorRowInput(e, row) {
    var idx = +row.dataset.draftIdx;
    var field = e.target.dataset.field;
    if (!field || idx < 0 || idx >= editor.draft.length) return;
    var h = editor.draft[idx];
    if (field === 'name' || field === 'hint' || field === 'shortLabel' || field === 'cue') {
      h[field] = e.target.value;
    } else if (field === 'cat') {
      h.cat = e.target.value;
      renderEditor();
    } else if (field === 'sched-type') {
      // handled by click, not input
    } else if (field === 'target-on') {
      if (e.target.checked) {
        h.target = h.target || { amount: 1, unit: '', min: 0 };
      } else {
        h.target = null;
      }
      renderEditor();
    } else if (field === 'target-amount') {
      h.target = h.target || {};
      h.target.amount = parseFloat(e.target.value) || 1;
    } else if (field === 'target-unit') {
      h.target = h.target || {};
      h.target.unit = e.target.value;
    } else if (field === 'target-min') {
      h.target = h.target || {};
      h.target.min = parseFloat(e.target.value) || 0;
    } else if (field === 'grace') {
      h.grace = e.target.checked ? 'shield' : 'none';
    }
  }

  function onEditorRowClick(e, row) {
    var t = e.target;
    var idx = +row.dataset.draftIdx;
    var h = editor.draft[idx];
    if (t.classList.contains('hrow__del')) {
      if (editor.draft.length <= 1) return;
      editor.draft.splice(idx, 1);
      renderEditor();
      return;
    }
    var mv = t.closest('.hrow__mv');
    if (mv) {
      var dir = +mv.dataset.dir;
      moveWithinWin(idx, dir);
      return;
    }
    // schedule type toggle
    var stBtn = t.closest('[data-field="sched-type"]');
    if (stBtn) {
      h.sched = h.sched || { type: 'daily' };
      h.sched.type = stBtn.dataset.stype;
      if (h.sched.type === 'perWeek' && !h.sched.n) h.sched.n = 3;
      if (h.sched.type === 'days' && !h.sched.days) h.sched.days = [1, 3, 5];
      renderEditor();
      return;
    }
    // perWeek n stepper
    if (t.dataset.field === 'sched-n-dec' || t.dataset.field === 'sched-n-inc') {
      h.sched = h.sched || { type: 'perWeek', n: 3 };
      var n = (h.sched.n || 3) + (t.dataset.field === 'sched-n-inc' ? 1 : -1);
      h.sched.n = Math.max(1, Math.min(6, n));
      renderEditor();
      return;
    }
    // day chip toggle
    var dc = t.closest('[data-field="sched-day"]');
    if (dc) {
      h.sched = h.sched || { type: 'days', days: [] };
      h.sched.days = h.sched.days || [];
      var dv = +dc.dataset.day;
      var idx2 = h.sched.days.indexOf(dv);
      if (idx2 === -1) h.sched.days.push(dv);
      else h.sched.days.splice(idx2, 1);
      h.sched.days.sort(function (a, b) { return a - b; });
      renderEditor();
      return;
    }
  }

  function moveWithinWin(draftIdx, dir) {
    var h = editor.draft[draftIdx];
    var cat = h.cat;
    var catItems = editor.draft.filter(function (x) { return x.cat === cat; });
    var posInCat = catItems.indexOf(h);
    var newPos = posInCat + dir;
    if (newPos < 0 || newPos >= catItems.length) return;
    // swap in the draft array
    var globalTarget = editor.draft.indexOf(catItems[newPos]);
    editor.draft.splice(draftIdx, 1);
    editor.draft.splice(globalTarget, 0, h);
    renderEditor();
  }

  function addHabitRow(catKey) {
    catKey = catKey || 'physical';
    var newId = W.uniqueId('habit', (function () {
      var taken = {};
      editor.draft.forEach(function (h) { taken[h.id] = true; });
      return taken;
    })());
    editor.draft.push({ id: newId, cat: catKey, name: '', hint: '', shortLabel: '', cue: '', sched: { type: 'daily' }, grace: 'shield', target: null });
    renderEditor();
  }

  function onEditorSave() {
    var res = commitHabits(editor.draft);
    if (res.ok) {
      closeEditor();
      toast('✓', W.HABITS.length + ' active habits', 'saved', 'xp');
    } else {
      showEditorError(res.error);
    }
  }

  function onEditorReset() {
    editor.draft = W.DEFAULT_HABITS.map(W.copyHabit);
    renderEditor();
  }

  function showEditorError(msg) {
    var sheet = $('#habitEditor');
    if (!sheet) return;
    var errEl = sheet.querySelector('.heditor__error');
    if (errEl) errEl.textContent = msg || '';
  }

  // ============================================================ STATIC BUILD
  function buildStatic() {
    // marquee
    var mq = $('#marquee');
    var words = ['WHATEVER IT TAKES', 'FOUR WINS', 'NO EXCUSES', 'EARN IT', 'SHOW UP', 'LOCKED IN', 'DON’T LET IT SPIRAL'];
    var line = '';
    for (var r = 0; r < 2; r++) {
      words.forEach(function (w) {
        line += '<span>' + w + '</span><span class="dot">◆</span>';
      });
    }
    mq.innerHTML = line;

    // four-wins cards
    var wg = $('#winsGrid');
    W.CATEGORIES.forEach(function (c) {
      var card = el('article', 'win');
      card.style.setProperty('--c', c.color);
      card.dataset.cat = c.key;
      card.innerHTML =
        '<div class="win__icon"><svg viewBox="0 0 24 24"><path d="' + c.glyph + '"/></svg></div>' +
        '<h3 class="win__name">' + c.label + '</h3>' +
        '<p class="win__tag">' + c.tagline + '</p>' +
        '<div class="win__meter"><span class="win__meter-fill"></span></div>' +
        '<div class="win__count" data-count></div>';
      wg.appendChild(card);
    });

    // tracker columns
    buildTrackerColumns();

    // ladder rungs
    var ladder = $('#ladder');
    W.RANKS.forEach(function (rk, i) {
      var li = el('li', 'rung');
      li.dataset.idx = i;
      li.innerHTML =
        '<div class="rung__idx">' + String(i + 1).padStart(2, '0') + '</div>' +
        '<div class="rung__name">' + rk.name + '</div>' +
        '<div class="rung__xp">' + rk.min.toLocaleString() + ' XP</div>';
      ladder.appendChild(li);
    });

    // per-category rank cards
    var rc = $('#rankCats');
    W.CATEGORIES.forEach(function (c) {
      var card = el('div', 'catrank');
      card.style.setProperty('--c', c.color);
      card.dataset.cat = c.key;
      card.innerHTML =
        '<div class="catrank__top"><span class="catrank__dot"></span><span class="catrank__cat">' + c.label + '</span></div>' +
        '<div class="catrank__rank" data-crank>Recruit</div>' +
        '<div class="catrank__bar"><span class="catrank__fill"></span></div>' +
        '<div class="catrank__xp" data-cxp>0 XP</div>';
      rc.appendChild(card);
    });

    // badges
    var bg = $('#badges');
    W.BADGES.forEach(function (b) {
      var card = el('div', 'badge');
      card.dataset.id = b.id;
      var initials = b.name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2);
      card.innerHTML =
        '<div class="badge__lock">🔒</div>' +
        '<div class="badge__medal">' + initials + '</div>' +
        '<div class="badge__name">' + b.name + '</div>' +
        '<div class="badge__desc">' + b.desc + '</div>';
      bg.appendChild(card);
    });

    // heatmap cells (12 weeks, column = week, row = weekday)
    buildHeatmap();

    // radar skeleton
    buildRadarSkeleton();

    // v2: command center + the record
    buildGauges();
    buildWincards();
    buildRecord();
    renderDebrief();
    buildCatchup();
  }

  // ============================================================ CATCH-UP CHIPS
  function buildCatchup() {
    var host = $('#catchup'); if (!host) return;
    host.innerHTML = '';
  }

  function renderCatchup() {
    var host = $('#catchup'); if (!host) return;
    var yesterday = W.shiftKey(W.todayKey(), -1);
    var done = state.completions[yesterday] || [];
    // Only offer habits that were due yesterday and not done (not a rest/free day)
    var missing = W.HABITS.filter(function (h) {
      return done.indexOf(h.id) === -1 && W.isDueOn(state.completions, h, yesterday);
    });
    if (!missing.length) { host.hidden = true; return; }
    host.hidden = false;
    var html = '<span class="catchup__label">Yesterday missing:</span>';
    missing.forEach(function (h) {
      html += '<button class="chip" type="button" data-key="' + yesterday + '" data-id="' + h.id + '">' +
              esc(W.shortOf(h)) + '</button>';
    });
    host.innerHTML = html;
    // wire chips
    host.onclick = function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      var key = chip.dataset.key, id = chip.dataset.id;
      if (!key || !id) return;
      state.completions = W.toggle(state.completions, id, key);
      save();
      lastRecordSig = null;
      renderCatchup();
      render();
    };
  }

  function renderDaySafe() {
    var host = $('#daySafe'); if (!host) return;
    var todayK = W.todayKey();
    var todayList = state.completions[todayK] || [];
    var streak = 0;
    W.HABITS.forEach(function (h) { var s = W.habitStreak(state.completions, h.id); if (s > streak) streak = s; });
    var state2 = todayList.length > 0 ? 'active' : streak > 0 ? 'alive' : 'start';
    host.dataset.state = state2;
    if (state2 === 'active') host.textContent = todayList.length + ' habits logged today. Streak safe.';
    else if (state2 === 'alive') host.textContent = streak + '-day streak alive — log at least one habit today.';
    else host.textContent = 'Start your run — check off your first habit.';
  }

  // -------------------------------------------------------------- heatmap
  var HEAT_DAYS = 84;
  function buildHeatmap() {
    var hm = $('#heatmap');
    hm.innerHTML = '';
    var todayK = W.todayKey();
    // align so the grid ends on today, columns are weeks (Mon-first not required)
    // start so that we render HEAT_DAYS cells ending today, grid-auto-flow column, 7 rows.
    // We offset by the weekday of the start to keep rows = weekday.
    var start = W.shiftKey(todayK, -(HEAT_DAYS - 1));
    var startDow = W.parseKey(start).getDay();
    // pad front so first column starts on row 0 (Sunday)
    for (var p = 0; p < startDow; p++) {
      var pad = el('div', 'heatmap__cell');
      pad.style.visibility = 'hidden';
      hm.appendChild(pad);
    }
    for (var d = 0; d < HEAT_DAYS; d++) {
      var key = W.shiftKey(start, d);
      var cell = el('div', 'heatmap__cell');
      cell.dataset.key = key;
      if (key === todayK) cell.classList.add('is-today');
      hm.appendChild(cell);
    }
  }

  function renderHeatmap(stats) {
    $$('#heatmap .heatmap__cell').forEach(function (cell) {
      var key = cell.dataset.key;
      if (!key) return;
      var list = state.completions[key] || [];
      var doneKnown = list.filter(function (id) { return !!W.catOf(id); }).length;
      var due = W.dueHabits(state.completions, W.HABITS, key).length;
      var lvl = W.heatLevel(doneKnown, due);
      cell.setAttribute('data-lvl', lvl);
      cell.title = key + ' — ' + doneKnown + '/' + due + ' scheduled';
    });
  }

  // --------------------------------------------------------------- radar
  var RADAR_CX = 160, RADAR_CY = 160, RADAR_R = 104;
  function radarPoint(i, frac) {
    var n = W.CATEGORIES.length;
    var ang = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return [RADAR_CX + Math.cos(ang) * RADAR_R * frac, RADAR_CY + Math.sin(ang) * RADAR_R * frac];
  }
  function buildRadarSkeleton() {
    var svg = $('#radar');
    var n = W.CATEGORIES.length;
    var ns = 'http://www.w3.org/2000/svg';
    var html = '';
    // rings
    [0.25, 0.5, 0.75, 1].forEach(function (f) {
      var pts = [];
      for (var i = 0; i < n; i++) { var p = radarPoint(i, f); pts.push(p[0].toFixed(1) + ',' + p[1].toFixed(1)); }
      html += '<polygon points="' + pts.join(' ') + '" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>';
    });
    // spokes + labels
    for (var i = 0; i < n; i++) {
      var p = radarPoint(i, 1);
      html += '<line x1="' + RADAR_CX + '" y1="' + RADAR_CY + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>';
      var lp = radarPoint(i, 1.12);
      var c = W.CATEGORIES[i];
      var anchor = Math.abs(lp[0] - RADAR_CX) < 4 ? 'middle' : (lp[0] > RADAR_CX ? 'start' : 'end');
      html += '<text x="' + lp[0].toFixed(1) + '" y="' + (lp[1] + 4).toFixed(1) + '" fill="' + c.color + '" font-size="10.5" font-family="JetBrains Mono, monospace" text-anchor="' + anchor + '">' + c.label + '</text>';
    }
    // the data polygon (updated later)
    html += '<polygon id="radarShape" points="" fill="rgba(202,255,77,0.16)" stroke="var(--wit)" stroke-width="2" stroke-linejoin="round" style="transition: all .7s cubic-bezier(.22,1,.36,1)"/>';
    // vertex dots
    for (var j = 0; j < n; j++) {
      html += '<circle id="radarDot' + j + '" cx="' + RADAR_CX + '" cy="' + RADAR_CY + '" r="3.5" fill="' + W.CATEGORIES[j].color + '"/>';
    }
    svg.innerHTML = html;
  }

  function renderRadar(stats) {
    var n = W.CATEGORIES.length;
    var pts = [];
    W.CATEGORIES.forEach(function (c, i) {
      var pc = stats.perCat[c.key];
      var frac = pc.todayTotal ? pc.todayDone / pc.todayTotal : 0;
      // floor only once the day has begun — an empty day reads honestly as zero
      frac = stats.todayCount > 0 ? Math.max(0.09, frac) : 0;
      var p = radarPoint(i, frac);
      pts.push(p[0].toFixed(1) + ',' + p[1].toFixed(1));
      var dot = $('#radarDot' + i);
      if (dot) { dot.setAttribute('cx', p[0].toFixed(1)); dot.setAttribute('cy', p[1].toFixed(1)); }
    });
    var shape = $('#radarShape');
    if (shape) shape.setAttribute('points', pts.join(' '));
  }

  // ============================================================ RENDER
  var DAY_RING_CIRC = 2 * Math.PI * 86; // r=86

  function render(opts) {
    opts = opts || {};
    var stats = W.deriveStats(state.completions);
    var todayK = W.todayKey();
    var todayList = state.completions[todayK] || [];

    // v2: command-center gauges + status cards
    renderGauges(stats);
    renderWincards(stats);

    // --- habit checks + streaks + new chips ---
    $$('.habit').forEach(function (btn) {
      var id = btn.dataset.id;
      var done = todayList.indexOf(id) !== -1;
      btn.classList.toggle('is-done', done);
      var h = W.HABIT_BY_ID[id];
      if (!h) return;

      // due state on row
      var isDue = W.isDueOn(state.completions, h, todayK);
      var weekSched = W.schedOf(h).type === 'perWeek';
      var weekTallyNow = weekSched ? W.weekTally(state.completions, id, W.weekStartKey(todayK), todayK) : 0;
      var weekTarget = weekSched ? W.schedOf(h).n : 0;
      var weekDone = weekSched && weekTallyNow >= weekTarget;
      if (!isDue && !done) {
        btn.dataset.due = weekDone ? 'done-week' : 'rest';
      } else {
        delete btn.dataset.due;
      }

      // hint text: rest-day override
      var hintEl = $('[data-hint]', btn);
      if (hintEl) {
        if (btn.dataset.due === 'rest') {
          hintEl.textContent = 'Rest day — off the schedule';
        } else if (btn.dataset.due === 'done-week') {
          hintEl.textContent = 'Done for the week — extra still pays.';
        } else {
          hintEl.textContent = W.cueLine(h);
        }
      }

      var tl = stats.timelines && stats.timelines[id];
      var streak = tl ? tl.streak : 0;
      var shieldsCount = tl ? tl.shields : 0;
      var unit = W.streakUnit(h);

      var sEl = $('[data-streak]', btn);
      var nEl = $('[data-streak-n]', btn);
      var unitEl = sEl ? $('.habit__streak-unit', sEl) : null;
      if (nEl) nEl.textContent = streak;
      if (unitEl) unitEl.textContent = unit;
      if (sEl) sEl.style.display = streak >= 2 ? '' : 'none';

      // shield chip
      var shieldEl = $('[data-shield]', btn);
      if (shieldEl) {
        shieldEl.style.display = shieldsCount > 0 ? '' : 'none';
        if (shieldsCount > 0) shieldEl.textContent = shieldsCount + ' \u{1F6E1}';
        shieldEl.title = shieldsCount + ' shield(s) banked — earned, not given';
      }

      // week chip for perWeek habits
      var weekEl = $('[data-week]', btn);
      if (weekEl && weekSched) {
        weekEl.textContent = weekTallyNow + '/' + weekTarget + ' wk';
        weekEl.className = 'habit__week' + (weekDone ? ' is-hit' : (isDue && !done ? ' is-behind' : ''));
      }

      // shield toast: if spent count grew since last render
      if (tl) {
        if (!firstRender && !opts.silent && tl.spent > (prevSpent[id] || 0)) {
          var shToastH = h;
          toast('\u{1F6E1}', 'Shield used', shToastH.name + ' streak protected — you earned this');
        }
        prevSpent[id] = tl.spent;
      }

      // value chip
      var valChip = $('[data-value]', btn.closest('.habit-wrap') || btn.parentNode);
      if (valChip && h.target) {
        var logged = W.amountOn(state.logs, todayK, id);
        if (done) {
          if (logged) {
            var below = logged < h.target.min;
            valChip.textContent = logged + ' ' + h.target.unit;
            valChip.className = 'habit__value' + (below ? ' is-below' : ' is-done');
          } else {
            valChip.textContent = 'log ' + h.target.amount + ' ' + h.target.unit + '?';
            valChip.className = 'habit__value is-ghost';
          }
          valChip.style.display = '';
        } else {
          valChip.style.display = 'none';
        }
      }

      // journey hairline
      var journeyEl = btn.closest('.habit-wrap') ? $('[data-journey]', btn.closest('.habit-wrap')) : null;
      if (journeyEl) {
        var jp = W.journeyProgress(state.completions, id);
        journeyEl.style.setProperty('--j', jp.pct / 100);
        journeyEl.title = jp.automatic ? 'Automatic. This one\'s part of you now.' : 'Day ' + jp.day + ' of 66 to automatic';
        journeyEl.classList.toggle('is-automatic', jp.automatic);
      }
    });

    // --- column tallies ---
    $$('.col').forEach(function (col) {
      var cat = col.dataset.cat;
      var pc = stats.perCat[cat];
      var t = $('[data-tally]', col);
      if (t) t.innerHTML = '<b>' + pc.todayDone + '</b>/' + pc.todayTotal;
    });

    // --- day ring (schedule-aware) ---
    var doneToday = stats.todayCount;
    var scheduledToday = stats.scheduledToday;
    var pct = scheduledToday ? Math.min(1, doneToday / scheduledToday) : 1;
    var ring = $('#dayRingFg');
    ring.style.strokeDashoffset = DAY_RING_CIRC * (1 - pct);
    animateNumber($('#dayPct'), Math.round(pct * 100), { suffix: '%' });
    $('#statDone').textContent = doneToday + '/' + scheduledToday;

    // xp earned today (simple: completions today * 10 + bonuses estimate)
    var xpToday = doneToday * W.XP.perHabit + (stats.todayFourWins ? W.XP.fourWinsDay : 0);
    animateNumber($('#statXpToday'), xpToday);
    animateNumber($('#statStreak'), stats.bestCurrentStreak);

    var fw = $('#dayFourWins');
    fw.dataset.on = stats.todayFourWins ? 'true' : 'false';

    var dd = $('#dayDate');
    dd.textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

    // --- four-wins cards meters (today progress per cat) ---
    $$('.win').forEach(function (card) {
      var cat = card.dataset.cat;
      var pc = stats.perCat[cat];
      var frac = pc.todayTotal ? pc.todayDone / pc.todayTotal : 0;
      $('.win__meter-fill', card).style.width = (frac * 100) + '%';
      $('[data-count]', card).innerHTML = '<b>' + pc.todayDone + '</b> / ' + pc.todayTotal + ' today · ' + pc.rank.current.name;
    });

    // --- radar ---
    renderRadar(stats);

    // --- overall rank ---
    animateNumber($('#rankXp'), stats.xp.total);
    $('#rankName').textContent = stats.rank.current.name;
    $('#rankBar').style.width = (stats.rank.progress * 100) + '%';
    $('#rankNext').textContent = stats.rank.next
      ? stats.rank.toNext.toLocaleString() + ' XP to ' + stats.rank.next.name
      : 'Max rank — Legend status';

    // ladder
    $$('.rung').forEach(function (rung) {
      var i = +rung.dataset.idx;
      rung.classList.toggle('is-reached', i <= stats.rank.index);
      rung.classList.toggle('is-current', i === stats.rank.index);
    });

    // per-cat ranks
    $$('.catrank').forEach(function (card) {
      var cat = card.dataset.cat;
      var pc = stats.perCat[cat];
      $('[data-crank]', card).textContent = pc.rank.current.name;
      $('.catrank__fill', card).style.width = (pc.rank.progress * 100) + '%';
      $('[data-cxp]', card).textContent = pc.xp.toLocaleString() + ' XP';
    });

    // --- proof numbers ---
    animateNumber($('#gridActive'), stats.activeDays);
    animateNumber($('#gridBest'), stats.bestHabitStreak);
    animateNumber($('#gridTotal'), stats.totalCompletions);
    renderHeatmap(stats);

    // --- badges ---
    $$('.badge').forEach(function (card) {
      card.classList.toggle('is-earned', stats.badges.indexOf(card.dataset.id) !== -1);
    });

    // --- celebrations (tier-1 only: toast for badge/four-wins/streak; cinematic cut) ---
    if (!opts.silent && !firstRender && prevStats) {
      var cel = W.celebrationFor(prevStats, stats);
      if (cel) {
        // tier 3 cinematic cut per scope decision; tier 2 gets a toast
        if (cel.tier >= 2) {
          if (cel.kind === 'badge') {
            var b2 = W.BADGES.filter(function (x) { return x.id === cel.detail; })[0];
            var bInit = b2 ? b2.name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2) : '★';
            toast(bInit, 'Badge unlocked', b2 ? b2.name : cel.detail, 'xp');
          } else if (cel.kind === 'four-wins') {
            toast('✦', 'Four Wins', 'All four fronts covered today', 'xp');
          } else if (cel.kind === 'streak') {
            toast('🔥', cel.detail + ' streak!', 'Whatever it takes.', 'xp');
          }
        }
      }
    }
    prevBadges = stats.badges.slice();
    prevStats = stats;

    // v2: the record (matrix + trend) — reads state.completions directly
    renderRecord(stats);
    renderCatchup();
    renderDaySafe();

    // v2: command center header
    var cDate = $('#commandDate');
    if (cDate) cDate.textContent = new Date().toLocaleDateString(undefined,
      { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    var cStatus = $('#commandStatus');
    if (cStatus) cStatus.textContent =
      stats.todayCount + ' of ' + stats.scheduledToday + ' scheduled today · ' +
      stats.rank.current.name + ' · ' + stats.bestCurrentStreak + ' streak';

    // --- WIT Score + quote card ---
    renderWitScore(stats, todayK);

    lastRenderedDayKey = todayK;   // todayK already computed at render() top
    firstRender = false;
  }

  // --------------------------------------------------------------- toasts
  function toast(medal, title, sub, kind) {
    var host = $('#toasts');
    var t = el('div', 'toast' + (kind === 'xp' ? ' toast--xp' : ''));
    t.innerHTML = '<div class="toast__medal">' + medal + '</div>' +
      '<div><div class="toast__title">' + title + '</div><div class="toast__sub">' + sub + '</div></div>';
    host.appendChild(t);
    requestAnimationFrame(function () { requestAnimationFrame(function () { t.classList.add('is-in'); }); });
    setTimeout(function () {
      t.classList.remove('is-in');
      setTimeout(function () { t.remove(); }, 600);
    }, 3200);
  }

  // ============================================================ WIT SCORE + QUOTE
  function renderWitScore(stats, todayK) {
    var ws = W.witScore(state.completions, todayK);
    var witSig = ws.score + '|' + ws.band + '|' + todayK;
    if (witSig === lastWitSig) return;
    lastWitSig = witSig;

    var card = $('#witScore');
    if (card) {
      card.dataset.band = ws.band;
      var numEl = $('#witScoreNum');
      if (numEl) animateNumber(numEl, ws.score, { dur: 900 });
      var bandEl = $('#witScoreBand');
      if (bandEl) bandEl.textContent = ws.band.toUpperCase();
      var briefEl = $('#witScoreBrief');
      if (briefEl) briefEl.textContent = ws.brief;
      var fill = card.querySelector('.witscore__fill');
      if (fill) fill.style.strokeDashoffset = 376.99 * (1 - ws.score / 100);
    }

    var ctx = W.motivationContext(state.completions, todayK, new Date().getHours());
    var q = W.pickQuote(ctx, todayK);
    var quoteCard = $('#quoteCard');
    if (quoteCard) quoteCard.dataset.voice = q.voice;
    var qText = $('#quoteText');
    if (qText) qText.textContent = q.text;
    var qAttr = $('#quoteAttr');
    if (qAttr) qAttr.textContent = '— ' + q.by;
  }

  // ============================================================ WEEKLY DEBRIEF
  // localStorage pref helpers (device prefs — never inside state, never exported)
  function prefGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function prefSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function fmtRange(ws, we) {
    var a = W.parseKey(ws), b = W.parseKey(we);
    var mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return mo[a.getMonth()] + ' ' + a.getDate() + ' – ' + mo[b.getMonth()] + ' ' + b.getDate();
  }

  function debriefLine(db) {
    if (db.rate >= 0.85) {
      // find weakest win
      var catScores = {};
      W.CATEGORIES.forEach(function (c) {
        var inCat = db.perHabit.filter(function (p) {
          var h = W.HABIT_BY_ID[p.id];
          return h && h.cat === c.key;
        });
        var done = 0, target = 0;
        inCat.forEach(function (p) { done += p.done; target += p.target; });
        catScores[c.key] = target ? done / target : 1;
      });
      var weakKey = W.CATEGORIES.reduce(function (w, c) {
        return catScores[c.key] < catScores[w] ? c.key : w;
      }, W.CATEGORIES[0].key);
      var weakCat = W.CATEGORIES.filter(function (c) { return c.key === weakKey; })[0];
      return 'Strong week. ' + (weakCat ? weakCat.label : 'One Win') + ' lagged — schedule it like it\'s training.';
    }
    if (db.rate >= 0.6) return 'Held the line. One clean sweep tips next week.';
    return 'Rebuild week. Floors only — get the engine turning.';
  }

  function renderDebrief() {
    var host = $('#debrief'); if (!host) return;
    var db = W.weeklyDebrief(state.completions);
    var hasWeek = db.totalChecks > 0 || Object.keys(state.completions).some(function (k) { return k < db.weekStart; });
    var dismissed = prefGet('wit.debrief.dismissed.v1') === db.weekEnd;
    host.hidden = !hasWeek || dismissed;
    if (host.hidden) return;
    var rangeEl = $('#debriefRange');
    if (rangeEl) rangeEl.textContent = fmtRange(db.weekStart, db.weekEnd);
    var rateEl = host.querySelector('[data-db="rate"]');
    if (rateEl) rateEl.textContent = Math.round(db.rate * 100) + '%';
    var fwEl = host.querySelector('[data-db="fw"]');
    if (fwEl) fwEl.textContent = db.fourWinsDays;
    var hitsEl = host.querySelector('[data-db="hits"]');
    if (hitsEl) hitsEl.textContent = db.habitsHit + '/' + db.habitsTotal;
    var deltaEl = host.querySelector('[data-db="delta"]');
    if (deltaEl) deltaEl.textContent = fmtInt(db.deltaChecks) + ' checks vs prior wk';
    var lineEl = $('#debriefLine');
    if (lineEl) lineEl.textContent = hasWeek ? debriefLine(db) : 'Your first debrief lands Monday.';
  }

  function initDebriefDismiss() {
    var btn = $('#debriefDismiss');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var db = W.weeklyDebrief(state.completions);
      prefSet('wit.debrief.dismissed.v1', db.weekEnd);
      var host = $('#debrief');
      if (host) host.hidden = true;
    });
  }

  // ============================================================ SOUND PREFS (tier-1 audio)
  var _audioCtx = null;
  function getAudioCtx() {
    if (!_audioCtx) { try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {} }
    return _audioCtx;
  }
  function soundOn() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return prefGet('wit.sound.v1') !== 'off';
  }
  function playTone(freq, dur, delay) {
    if (!soundOn()) return;
    var ctx = getAudioCtx(); if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      var t = ctx.currentTime + (delay || 0);
      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur / 1000);
      osc.start(t); osc.stop(t + dur / 1000 + 0.01);
    } catch(e) {}
  }
  function sfxTick() { playTone(880, 80, 0); }
  function sfxDone() { playTone(660, 90, 0); playTone(990, 90, 0.13); }

  function initSoundPref() {
    var btn = $('#soundBtn');
    if (!btn) return;
    function update() {
      var on = soundOn();
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.textContent = on ? '🔊 Sound' : '🔇 Sound';
    }
    btn.addEventListener('click', function () {
      prefSet('wit.sound.v1', soundOn() ? 'off' : 'on');
      update();
      // resume AudioContext on user gesture
      var ctx = getAudioCtx();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    });
    update();
  }

  // ============================================================ CINEMATIC (tier-3 stub)
  function openCinematic(stats) {
    var el2 = $('#rankCinematic'); if (!el2) return;
    var nameEl = $('#cineName');
    if (nameEl) nameEl.textContent = stats.rank.current.name;
    var xpEl = $('#cineXp');
    if (xpEl) { xpEl.setAttribute('data-v', '0'); animateNumber(xpEl, stats.xp.total, { dur: 1200 }); }
    var todayK = W.todayKey();
    var q = W.pickQuote('milestone', todayK);
    var qEl = $('#cineQuote');
    if (qEl) qEl.textContent = q.text;
    el2.hidden = false;
  }
  function closeCinematic() {
    var el2 = $('#rankCinematic'); if (!el2) return;
    el2.hidden = true;
  }
  function initCinematic() {
    var cont = $('#cineContinue');
    if (cont) cont.addEventListener('click', closeCinematic);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { var el2 = $('#rankCinematic'); if (el2 && !el2.hidden) closeCinematic(); }
    });
    var el2 = $('#rankCinematic');
    if (el2) el2.addEventListener('click', function (e) { if (e.target === el2 || e.target.closest('.cine__scrim')) closeCinematic(); });
  }

  // ============================================================ VALUE POPOVER
  var valPopState = { habitId: null, dayK: null };

  function openValPop(chipEl, h, dayK) {
    var pop = $('#valpop'); if (!pop) return;
    valPopState.habitId = h.id;
    valPopState.dayK = dayK;
    var numEl = $('#valpopNum');
    var unitEl = $('#valpopUnit');
    var quickEl = $('#valpopQuick');
    var floorEl = $('#valpopFloor');
    if (!h.target) return;
    var logged = W.amountOn(state.logs, dayK, h.id) || h.target.amount;
    if (numEl) { numEl.value = logged; numEl.setAttribute('aria-label', 'Amount in ' + h.target.unit); }
    if (unitEl) unitEl.textContent = h.target.unit;
    // quick chips: floor, half, target, target*1.33
    if (quickEl) {
      var quicks = [];
      if (h.target.min > 0) quicks.push({ v: h.target.min, label: h.target.min + ' ' + h.target.unit + ' (floor)' });
      var half = Math.round(h.target.amount / 2 * 10) / 10;
      if (half > h.target.min && half < h.target.amount) quicks.push({ v: half, label: half + '' });
      quicks.push({ v: h.target.amount, label: h.target.amount + ' (target)', cls: 'is-target' });
      quickEl.innerHTML = quicks.map(function (q2) {
        return '<button class="valpop__quick-btn ' + (q2.cls || '') + '" type="button" data-vq="' + q2.v + '">' + esc(q2.label) + '</button>';
      }).join('');
    }
    if (floorEl) {
      floorEl.textContent = h.target.min > 0
        ? h.target.min + ' ' + h.target.unit + ' still counts. Showing up is the win.'
        : 'Any amount counts. Just show up.';
    }
    // position near chip
    pop.hidden = false;
    var rect = chipEl.getBoundingClientRect();
    pop.style.top = Math.max(8, rect.top - pop.offsetHeight - 8) + 'px';
    pop.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - 248)) + 'px';
    if (numEl) numEl.focus();
  }

  function closeValPop(save2) {
    var pop = $('#valpop'); if (!pop || pop.hidden) return;
    if (save2) {
      var numEl = $('#valpopNum');
      var v = numEl ? parseFloat(numEl.value) : NaN;
      if (isFinite(v) && v > 0) {
        state.logs = W.setLog(state.logs, valPopState.habitId, valPopState.dayK, v);
        save();
        render();
      }
    }
    pop.hidden = true;
    valPopState.habitId = null; valPopState.dayK = null;
  }

  function initValuePopover() {
    var pop = $('#valpop'); if (!pop) return;
    // step buttons
    pop.addEventListener('click', function (e) {
      var step = e.target.closest('[data-vstep]');
      if (step) {
        var numEl = $('#valpopNum');
        var h2 = valPopState.habitId ? W.HABIT_BY_ID[valPopState.habitId] : null;
        var stepSize = (h2 && h2.target && h2.target.amount >= 20) ? 5 : 1;
        var cur = parseFloat(numEl ? numEl.value : 0) || 0;
        var nv = Math.max(0.1, cur + (+step.dataset.vstep) * stepSize);
        if (numEl) numEl.value = Math.round(nv * 10) / 10;
        return;
      }
      var qbtn = e.target.closest('[data-vq]');
      if (qbtn) {
        var numEl2 = $('#valpopNum');
        if (numEl2) numEl2.value = qbtn.dataset.vq;
        return;
      }
    });
    // confirm on enter
    pop.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); closeValPop(true); }
      if (e.key === 'Escape') { closeValPop(false); }
    });
    // delegated listener on tracker for value chips
    var trackerArea = $('#tracker');
    if (trackerArea) {
      trackerArea.addEventListener('click', function (e) {
        var chip = e.target.closest('[data-value]');
        if (!chip) return;
        e.stopPropagation(); // don't also fire onToggle
        var wrap = chip.closest('.habit-wrap') || chip.closest('.habit');
        var btn = wrap ? (wrap.querySelector('.habit') || wrap) : chip;
        var id = btn.dataset.id;
        var h = id ? W.HABIT_BY_ID[id] : null;
        if (!h || !h.target) return;
        openValPop(chip, h, W.todayKey());
      });
    }
    // tap-outside closes (save)
    document.addEventListener('pointerdown', function (e) {
      if (!pop.hidden && !pop.contains(e.target)) {
        var isChip = e.target.closest('[data-value]');
        if (!isChip) closeValPop(true);
      }
    });
  }

  // ============================================================ DAY-BOUNDARY GUARD
  // A tab left open past midnight keeps showing yesterday as "today". We watch three
  // cheap signals and re-render so tracker, today gauge, matrix today-row, and trend
  // today-dot roll forward. State is never written here — only the derived view.
  var dayGuardTimer = null;

  function onDayBoundary() {
    lastRecordSig = null;            // bust the Record dirty-check so matrix/trend roll
    render({ silent: true });        // a fresh empty day can't newly-earn a badge
    toast('☀', 'New day', 'fresh sheet', 'xp');
  }
  function checkDayBoundary() {
    if (W.todayKey() !== lastRenderedDayKey) onDayBoundary();
  }
  function initDayGuard() {
    document.addEventListener('visibilitychange', function () { if (!document.hidden) checkDayBoundary(); });
    window.addEventListener('focus', checkDayBoundary);
    if (dayGuardTimer) clearInterval(dayGuardTimer);   // never double-arm
    dayGuardTimer = setInterval(checkDayBoundary, 60000);
  }

  // ----------------------------------------------------------- interactions
  function onToggle(e) {
    var btn = e.target.closest('.habit');
    if (!btn) return;
    var id = btn.dataset.id;

    var dayK = W.todayKey();                 // read the clock ONCE

    // First action after a silent midnight rollover: the visible sheet is still
    // yesterday's. Roll the view forward and swallow this tap (safe no-op) rather
    // than writing to a day the user can't see. They re-tap on the correct sheet.
    if (dayK !== lastRenderedDayKey) { onDayBoundary(); return; }

    var before = (state.completions[dayK] || []).length;
    state.completions = W.toggle(state.completions, id, dayK);   // explicit key — no drift
    var after = (state.completions[dayK] || []).length;
    if (after < before) {
      // toggle-OFF: clear log for this habit+day
      state.logs = W.setLog(state.logs || {}, id, dayK, 0);
    }
    save();
    if (after > before) {
      var h = W.HABIT_BY_ID[id];
      toast('+' + W.XP.perHabit, h.name, '+' + W.XP.perHabit + ' XP · ' + cap(h.cat), 'xp');
      pulseCheck(btn);
      // tier-1 audio: tick on check; done-tone only on the TRANSITION into a complete day
      var newSt = W.deriveStats(state.completions, dayK);
      var wasComplete = prevStats && prevStats.scheduledToday > 0 &&
                        prevStats.todayCount >= prevStats.scheduledToday;
      if (!wasComplete && newSt.scheduledToday > 0 && newSt.todayCount >= newSt.scheduledToday) {
        sfxDone();
      } else {
        sfxTick();
      }
    }
    render();
  }

  function pulseCheck(btn) {
    if (reduceMotion) return;
    var chk = $('.habit__check', btn);
    if (!chk) return;
    chk.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }],
      { duration: 360, easing: 'cubic-bezier(.22,1,.36,1)' }
    );
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // ================================================================= CANVAS
  function initConstellation() {
    var canvas = $('#constellation');
    var ctx = canvas.getContext('2d');
    var W2 = 0, H2 = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cx = 0, cy = 0;
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    var t = 0;

    var nodes = W.CATEGORIES.map(function (c, i) {
      return {
        color: c.color,
        baseAng: (i / W.CATEGORIES.length) * Math.PI * 2,
        orbit: 0,
        speed: 0.12 + i * 0.015,
        r: 0
      };
    });

    // background particles
    var particles = [];
    function seedParticles() {
      particles = [];
      var count = Math.min(90, Math.floor((W2 * H2) / 22000));
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * W2,
          y: Math.random() * H2,
          z: 0.3 + Math.random() * 0.7,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12
        });
      }
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      W2 = rect.width; H2 = rect.height;
      canvas.width = W2 * dpr; canvas.height = H2 * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W2 * 0.5; cy = H2 * 0.46;
      var base = Math.min(W2, H2);
      nodes.forEach(function (n, i) { n.orbit = base * (0.16 + i * 0.052); n.r = base * 0.012 + 2; });
      seedParticles();
    }

    function frame() {
      t += 0.0045;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      var px = (mouse.x - cx) * 0.02;
      var py = (mouse.y - cy) * 0.02;

      ctx.clearRect(0, 0, W2, H2);

      // particles
      ctx.globalCompositeOperation = 'lighter';
      particles.forEach(function (p) {
        p.x += p.vx * p.z; p.y += p.vy * p.z;
        if (p.x < 0) p.x = W2; if (p.x > W2) p.x = 0;
        if (p.y < 0) p.y = H2; if (p.y > H2) p.y = 0;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,' + (0.04 + p.z * 0.06) + ')';
        ctx.arc(p.x + px * p.z * 2, p.y + py * p.z * 2, p.z * 1.3, 0, Math.PI * 2);
        ctx.fill();
      });

      // node positions
      var pos = nodes.map(function (n) {
        var a = n.baseAng + t * n.speed * (reduceMotion ? 0 : 1);
        return {
          x: cx + Math.cos(a) * n.orbit + px * (1 + n.orbit / 200),
          y: cy + Math.sin(a) * n.orbit * 0.78 + py * (1 + n.orbit / 200),
          color: n.color, r: n.r
        };
      });

      // connecting lines (node to node + node to center)
      ctx.lineWidth = 1;
      for (var i = 0; i < pos.length; i++) {
        var grad = ctx.createLinearGradient(cx, cy, pos[i].x, pos[i].y);
        grad.addColorStop(0, 'rgba(255,255,255,0.0)');
        grad.addColorStop(1, hexA(pos[i].color, 0.22));
        ctx.strokeStyle = grad;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(pos[i].x, pos[i].y); ctx.stroke();
        for (var j = i + 1; j < pos.length; j++) {
          ctx.strokeStyle = 'rgba(255,255,255,0.05)';
          ctx.beginPath(); ctx.moveTo(pos[i].x, pos[i].y); ctx.lineTo(pos[j].x, pos[j].y); ctx.stroke();
        }
      }

      // center core
      var pulse = 1 + Math.sin(t * 6) * 0.06;
      var coreR = Math.min(W2, H2) * 0.02 * pulse;
      var cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 5);
      cg.addColorStop(0, 'rgba(202,255,77,0.5)');
      cg.addColorStop(1, 'rgba(202,255,77,0)');
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(cx, cy, coreR * 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#caff4d';
      ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, Math.PI * 2); ctx.fill();

      // nodes with glow
      pos.forEach(function (p) {
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        g.addColorStop(0, hexA(p.color, 0.55));
        g.addColorStop(1, hexA(p.color, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });

      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(frame);
    }

    function hexA(hex, a) {
      var h = hex.replace('#', '');
      var r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
      return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    }

    var raf;
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', function (e) {
      var rect = canvas.getBoundingClientRect();
      mouse.tx = e.clientX - rect.left; mouse.ty = e.clientY - rect.top;
    });
    resize();
    mouse.x = mouse.tx = cx; mouse.y = mouse.ty = cy;
    frame();

    // pause when hero off-screen (perf)
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { if (!raf) frame(); }
        else { cancelAnimationFrame(raf); raf = null; }
      });
    }, { threshold: 0.02 });
    io.observe(canvas);
  }

  // ============================================================ SCROLL FX
  function initReveals() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (n) { io.observe(n); });
    // section-level fade-ups
    $$('.section__head, .wins__layout, .system__board, .rank__hero, .ladder, .rank__cats, .grid-card, .badges').forEach(function (n) {
      n.classList.add('fade-up'); io.observe(n);
    });
  }

  function initNav() {
    var nav = $('#nav');
    var io = new IntersectionObserver(function (entries) {
      nav.classList.toggle('is-stuck', !entries[0].isIntersecting);
    }, { threshold: 0, rootMargin: '-80px 0px 0px 0px' });
    io.observe($('#top'));
  }

  function initReset() {
    var modal = $('#resetConfirm'), openBtn = $('#resetBtn');
    var cancelBtn = $('#resetCancel'), goBtn = $('#resetConfirmGo');
    if (!modal || !openBtn) return;
    var lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      modal.hidden = false;
      if (cancelBtn) cancelBtn.focus();              // focus the SAFE choice
      document.addEventListener('keydown', onKey);
    }
    function close() {
      modal.hidden = true;
      document.removeEventListener('keydown', onKey);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    // DESTRUCTIVE — only reachable from the modal. Resets DEMO DATA, keeps the user's habits + goal.
    function doReset() {
      close();
      var demo = W.seedDemo(84);
      state = validate({
        version: STORAGE_VERSION,
        completions: demo.completions,
        logs: demo.logs,
        habits: state.habits,
        goal: state.goal
      });
      applyHabits();                                 // re-assert core matches state.habits
      save();
      prevBadges = []; firstRender = true; lastRecordSig = null;
      render({ silent: true });
      toast('↺', 'Demo data loaded', 'Fresh 12-week run — yours was cleared', 'xp');
      window.scrollTo({ top: $('#system').offsetTop - 70, behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    openBtn.addEventListener('click', open);
    if (cancelBtn) cancelBtn.addEventListener('click', close);
    if (goBtn) goBtn.addEventListener('click', doReset);
    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.closest('[data-confirm-cancel]')) close();
    });
  }

  // ============================================================ EXPORT / IMPORT
  function exportState() {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'wit-backup-' + W.todayKey() + '.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function importStateFromFile(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var parsed = JSON.parse(e.target.result);
        var next = validate(migrate(parsed));
        // refuse if validated state is empty but we have a real streak
        var hasStreak = Object.keys(state.completions).length > 0;
        var isEmpty = Object.keys(next.completions).length === 0;
        if (hasStreak && isEmpty) {
          toast('✕', 'Import rejected', 'That file has no valid data — your run is safe', 'xp');
          return;
        }
        state = next;
        applyHabits();
        save();
        prevBadges = []; firstRender = true; lastRecordSig = null;
        render({ silent: true });
        toast('⤒', 'Backup imported', 'Your data has been restored', 'xp');
      } catch (err) {
        toast('✕', 'Import failed', 'Could not parse that file', 'xp');
      }
    };
    reader.readAsText(file);
  }

  function initBackup() {
    var exportBtn = $('#exportBtn'), importBtn = $('#importBtn'), importInput = $('#importInput');
    if (exportBtn) exportBtn.addEventListener('click', exportState);
    if (importBtn && importInput) {
      importBtn.addEventListener('click', function () { importInput.click(); });
      importInput.addEventListener('change', function () {
        if (importInput.files && importInput.files[0]) {
          importStateFromFile(importInput.files[0]);
          importInput.value = '';
        }
      });
    }
  }

  // ============================================================ SELF-TESTS
  function runTests() {
    try {
      var res = W.runSelfTests();
      var line = $('#testLine');
      if (res.failed === 0) {
        line.innerHTML = ' · core logic: <b>' + res.passed + '/' + res.passed + ' tests pass</b>';
        console.log('%cWIT core: ' + res.passed + '/' + res.passed + ' tests pass ✓', 'color:#caff4d;font-weight:700');
      } else {
        line.innerHTML = ' · core logic: <b style="color:#ff6b6b">' + res.failed + ' FAILING</b>';
        console.group('%cWIT core: ' + res.failed + ' FAILING', 'color:#ff6b6b;font-weight:700');
        res.results.filter(function (r) { return !r.ok; }).forEach(function (r) {
          console.error(r.name, '— got', r.got, 'want', r.want);
        });
        console.groupEnd();
      }
    } catch (e) { console.error('Self-tests crashed', e); }
  }

  // ================================================================== BOOT
  function boot() {
    applyHabits();                                   // sync core to saved habits FIRST
    buildStatic();
    $('#tracker').addEventListener('click', onToggle);
    initReveals();
    initNav();
    initReset();                                     // now drives the confirm modal
    initBackup();                                    // export/import
    initEditor();                                    // habit editor
    initDayGuard();                                  // midnight guard
    initValuePopover();                              // one delegated listener on #tracker + #valpop
    initCinematic();                                 // CONTINUE/Esc bindings, bound once
    initDebriefDismiss();
    initSoundPref();
    if (!reduceMotion) initConstellation();
    render({ silent: true });
    runTests();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
