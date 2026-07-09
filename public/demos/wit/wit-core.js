/* ============================================================================
   WIT — Whatever It Takes  ·  CORE LOGIC
   Pure, dependency-free functions. No DOM, no globals beyond `window.WIT`.
   Everything is derived from one source of truth: a map of completions per day.

   Honors the WIT-Blueprint testing strategy: "Test what breaks users."
   The five things the blueprint says to unit-test live here, and the built-in
   runSelfTests() exercises them. Open the console to see PASS/FAIL.
   ========================================================================== */
(function (global) {
  'use strict';

  // ---------------------------------------------------------------------------
  // The Four Wins  — Michael's whole-person framework.
  // ---------------------------------------------------------------------------
  var CATEGORIES = [
    {
      key: 'physical',
      label: 'Physical',
      tagline: 'Train the body. Move every day.',
      color: '#caff4d',
      glyph: 'M3 12h3l2-7 4 14 2-7h3' // EKG / pulse
    },
    {
      key: 'mental',
      label: 'Mental',
      tagline: 'Sharpen the mind. Read, focus, build.',
      color: '#4dd6ff',
      glyph: 'M12 3a4 4 0 0 0-4 4 4 4 0 0 0-1 7 3 3 0 0 0 5 2 3 3 0 0 0 5-2 4 4 0 0 0-1-7 4 4 0 0 0-4-4z'
    },
    {
      key: 'spiritual',
      label: 'Spiritual',
      tagline: 'Whatever it takes to follow Christ.',
      color: '#b98cff',
      glyph: 'M12 3v18M7 8h10' // cross
    },
    {
      key: 'rest',
      label: 'Rest',
      tagline: 'Recover on purpose. Rest is a win.',
      color: '#ffc24d',
      glyph: 'M20 14a8 8 0 1 1-9-8 6 6 0 0 0 9 8z' // moon
    }
  ];

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------
  var WEEK_START = 1;          // Monday — decision C
  var JOURNEY_DAYS = 66;       // Lally et al. 2010 — median days to near-automaticity
  var SHIELD_RULES = Object.freeze({
    cap: 2,            // max banked per habit; earns beyond the cap are forfeited
    earnEveryDays: 7,  // daily/days: +1 shield per 7 REAL completions in a live streak
    earnEveryWeeks: 3  // perWeek:    +1 shield per 3 consecutive target weeks
  });

  // ---------------------------------------------------------------------------
  // 12 habits — three per Win. Mixed schedules per spec decision E.
  // ---------------------------------------------------------------------------
  var HABITS = [
    { id: 'p-train',    cat: 'physical',  name: 'Train',          hint: 'Lift or court time',           shortLabel: 'Train',
      cue: 'my last lesson wraps',            grace: 'shield', sched: { type: 'perWeek', n: 5 },           target: { amount: 45, unit: 'min', min: 20 } },
    { id: 'p-run',      cat: 'physical',  name: 'Run / Cardio',   hint: 'Ironman doesn\'t train itself', shortLabel: 'Cardio',
      cue: 'my feet hit the floor',           grace: 'shield', sched: { type: 'perWeek', n: 4 },           target: { amount: 3, unit: 'mi', min: 1 } },
    { id: 'p-fuel',     cat: 'physical',  name: 'Fuel clean',     hint: 'Eat like it matters',          shortLabel: 'Fuel',
      cue: 'I sit down to breakfast',         grace: 'shield', sched: { type: 'daily' },                   target: null },
    { id: 'm-read',     cat: 'mental',    name: 'Read 20 min',    hint: 'Feed the mind',                shortLabel: 'Read',
      cue: 'I get into bed',                  grace: 'shield', sched: { type: 'daily' },                   target: { amount: 20, unit: 'min', min: 5 } },
    { id: 'm-deep',     cat: 'mental',    name: 'Deep work',      hint: 'Build ALFRED',                 shortLabel: 'Deep',
      cue: 'I open the laptop',               grace: 'shield', sched: { type: 'days', days: [1,2,3,4,5] }, target: { amount: 90, unit: 'min', min: 25 } },
    { id: 'm-noscroll', cat: 'mental',    name: 'No doomscroll',  hint: 'Protect attention',            shortLabel: 'Focus',
      cue: 'I catch the thumb reaching',      grace: 'none',   sched: { type: 'daily' },                   target: null },
    { id: 's-pray',     cat: 'spiritual', name: 'Pray',           hint: 'Start with surrender',         shortLabel: 'Pray',
      cue: 'I silence the alarm',             grace: 'shield', sched: { type: 'daily' },                   target: null },
    { id: 's-word',     cat: 'spiritual', name: 'Scripture',      hint: 'Daily bread',                  shortLabel: 'Word',
      cue: 'the morning coffee is poured',    grace: 'shield', sched: { type: 'daily' },                   target: { amount: 1, unit: 'chapter', min: 1 } },
    { id: 's-grateful', cat: 'spiritual', name: 'Gratitude',      hint: 'Name three',                   shortLabel: 'Grateful',
      cue: 'I turn off the bedside light',    grace: 'shield', sched: { type: 'daily' },                   target: { amount: 3, unit: 'things', min: 1 } },
    { id: 'r-sleep',    cat: 'rest',      name: '7+ hrs sleep',   hint: 'Recovery is a rep',            shortLabel: 'Sleep',
      cue: '',                                grace: 'shield', sched: { type: 'daily' },                   target: { amount: 7, unit: 'hrs', min: 6 } },
    { id: 'r-unplug',   cat: 'rest',      name: 'Unplug by 10',   hint: 'Screens off',                  shortLabel: 'Unplug',
      cue: 'the 10:00 wind-down alarm rings', grace: 'shield', sched: { type: 'daily' },                   target: null },
    { id: 'r-recharge', cat: 'rest',      name: 'Recharge',       hint: 'Walk, sauna, stillness',       shortLabel: 'Recharge',
      cue: 'the afternoon opens up',          grace: 'shield', sched: { type: 'days', days: [0,3] },       target: { amount: 30, unit: 'min', min: 10 } }
  ];

  // ---------------------------------------------------------------------------
  // XP rules  — adapted from the blueprint to this demo's habit set.
  // ---------------------------------------------------------------------------
  var XP = {
    perHabit: 10,        // +10 to the habit's category (and total)
    fourWinsDay: 25,     // bonus: at least one habit in all four Wins, same day
    streak7: 50,         // one-time when a habit crosses a 7-unit streak
    streak30: 200        // one-time when a habit crosses a 30-unit streak
  };

  // COD-style ladder — straight from the WIT-Blueprint.
  var RANKS = [
    { name: 'Recruit',    min: 0 },
    { name: 'Grinder',    min: 500 },
    { name: 'Consistent', min: 2000 },
    { name: 'Locked In',  min: 5000 },
    { name: 'WIT',        min: 15000 },
    { name: 'Legend',     min: 50000 }
  ];

  // Badges — conditions are pure functions of the derived stats object.
  var BADGES = [
    { id: 'first-blood', name: 'First Blood',     desc: 'Complete your first habit.',
      test: function (s) { return s.totalCompletions >= 1; } },
    { id: 'on-fire',     name: 'On Fire',         desc: 'Hold a 7 straight on any habit.',
      test: function (s) { return s.bestHabitStreak >= 7; } },
    { id: 'locked-in',   name: 'Locked In',       desc: 'Hit a 14 straight on any habit.',
      test: function (s) { return s.bestHabitStreak >= 14; } },
    { id: 'four-wins',   name: 'Four Wins',       desc: 'Complete all four Wins in one day.',
      test: function (s) { return s.bestFourWinsDay; } },
    { id: 'iron-week',   name: 'Iron Week',       desc: 'A perfect week — every Win, 7 days running.',
      test: function (s) { return s.fourWinDayStreak >= 7; } },
    { id: 'consistent',  name: 'Consistent',      desc: 'Reach the Consistent rank.',
      test: function (s) { return s.xp.total >= 2000; } },
    { id: 'centurion',   name: 'Centurion',       desc: 'Log 100 total completions.',
      test: function (s) { return s.totalCompletions >= 100; } },
    { id: 'whatever',    name: 'Whatever It Takes',desc: 'A 30-unit streak. No excuses.',
      test: function (s) { return s.bestHabitStreak >= 30; } }
  ];

  // ---------------------------------------------------------------------------
  // Date helpers — local-time, YYYY-MM-DD keys. Streaks live and die here, so
  // these stay small and obviously correct.
  // ---------------------------------------------------------------------------
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  var WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function dayKey(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function parseKey(key) {
    var p = key.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  // shift a YYYY-MM-DD key by n days (n can be negative)
  function shiftKey(key, n) {
    var d = parseKey(key);
    d.setDate(d.getDate() + n);
    return dayKey(d);
  }

  function todayKey() { return dayKey(new Date()); }

  // valid YYYY-MM-DD that round-trips
  function isDayKey(key) {
    if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
    return dayKey(parseKey(key)) === key;
  }

  function weekStartKey(key) {
    var back = (parseKey(key).getDay() - WEEK_START + 7) % 7;
    return shiftKey(key, -back);
  }

  // completions of habitId inside the week starting ws, optionally capped at uptoKey
  function weekTally(completions, habitId, ws, uptoKey) {
    var n = 0;
    for (var i = 0; i < 7; i++) {
      var k = shiftKey(ws, i);
      if (uptoKey && k > uptoKey) break;
      if ((completions[k] || []).indexOf(habitId) !== -1) n++;
    }
    return n;
  }

  // completions of habitId in [weekStart(key) .. key-1] — max 6 iterations
  function countInWeekBefore(completions, habitId, key) {
    var k = weekStartKey(key), n = 0;
    while (k !== key) {
      if ((completions[k] || []).indexOf(habitId) !== -1) n++;
      k = shiftKey(k, 1);
    }
    return n;
  }

  // ---------------------------------------------------------------------------
  // Lookups
  // ---------------------------------------------------------------------------
  var HABIT_BY_ID = {};
  function reindexHabits() {
    // wipe in place — keep the same exported object reference
    Object.keys(HABIT_BY_ID).forEach(function (k) { delete HABIT_BY_ID[k]; });
    HABITS.forEach(function (h) { HABIT_BY_ID[h.id] = h; });
  }
  reindexHabits();

  var CAT_KEYS = CATEGORIES.map(function (c) { return c.key; }); // ['physical','mental','spiritual','rest']

  function slugifyId(name) {
    var base = String(name).toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return base || 'habit';
  }
  // id that doesn't collide with anything in `taken` (an object used as a set)
  function uniqueId(seedName, taken) {
    var base = slugifyId(seedName), id = base, n = 2;
    while (taken[id]) { id = base + '-' + n; n++; }
    return id;
  }
  // short label for cramped UI (the Record matrix). Prefer shortLabel, else first word.
  function shortOf(habit) {
    if (!habit) return '';
    if (habit.shortLabel) return habit.shortLabel;
    return habit.name.split(/[\s/]+/)[0]; // "Run / Cardio" -> "Run"
  }

  // ---------------------------------------------------------------------------
  // Schedule normalizers
  // ---------------------------------------------------------------------------
  function normalizeSched(s) {
    if (!s || typeof s !== 'object') return { type: 'daily' };
    if (s.type === 'perWeek') {
      var n = Math.round(Number(s.n));
      if (!isFinite(n) || n >= 7) return { type: 'daily' };   // 7+/wk IS daily
      if (n < 1) n = 1;
      return { type: 'perWeek', n: n };
    }
    if (s.type === 'days') {
      var seen = {}, days = [];
      (Array.isArray(s.days) ? s.days : []).forEach(function (d) {
        d = Math.round(Number(d));
        if (isFinite(d) && d >= 0 && d <= 6 && !seen[d]) { seen[d] = true; days.push(d); }
      });
      days.sort(function (a, b) { return a - b; });
      if (!days.length || days.length === 7) return { type: 'daily' };
      return { type: 'days', days: days };
    }
    return { type: 'daily' };
  }
  function schedOf(h) { return normalizeSched(h && h.sched); }

  function normalizeTarget(t) {
    if (!t || typeof t !== 'object') return null;
    var amount = Number(t.amount);
    var unit = (t.unit == null ? '' : String(t.unit)).trim().slice(0, 12);
    if (!isFinite(amount) || amount <= 0 || !unit) return null;
    var min = Number(t.min);
    if (!isFinite(min) || min < 0) min = 0;
    if (min > amount) min = amount;
    return { amount: amount, unit: unit, min: min };
  }

  // ONE copy helper for habits — replaces all inline copy-maps
  function copyHabit(h) {
    return {
      id: h.id, cat: h.cat, name: h.name, hint: h.hint, shortLabel: h.shortLabel,
      cue: h.cue || '',
      grace: h.grace === 'none' ? 'none' : 'shield',
      sched: schedOf(h),                     // normalized copy — never a shared reference
      target: h.target
        ? { amount: h.target.amount, unit: h.target.unit, min: h.target.min }
        : null
    };
  }

  // Display helpers
  function cueLine(h)  { return h && h.cue ? 'After ' + h.cue : (h && h.hint) || ''; }
  function targetLabel(t) {
    if (!t) return '';
    return t.amount + ' ' + t.unit + (t.min > 0 && t.min < t.amount ? ' · ' + t.min + ' counts' : '');
  }

  // Pure. Returns { ok, habits, error }. Normalizes to exactly the fields core expects.
  function validateHabits(list) {
    if (!Array.isArray(list) || list.length < 1) {
      return { ok: false, error: 'Need at least one habit.' };
    }
    var seen = {}, out = [];
    for (var i = 0; i < list.length; i++) {
      var h = list[i] || {};
      var name = (h.name == null ? '' : String(h.name)).trim();
      var cat  = String(h.cat || '');
      var id   = (h.id == null ? '' : String(h.id)).trim();
      if (!name)                        return { ok: false, error: 'Habit ' + (i + 1) + ' needs a name.' };
      if (CAT_KEYS.indexOf(cat) === -1) return { ok: false, error: '"' + name + '" has an unknown Win.' };
      if (!id)                          id = uniqueId(name, seen);
      if (seen[id])                     return { ok: false, error: 'Duplicate habit id: ' + id };
      seen[id] = true;
      out.push({
        id: id, cat: cat, name: name,
        hint: (h.hint == null ? '' : String(h.hint)).trim(),
        shortLabel: (h.shortLabel == null ? '' : String(h.shortLabel)).trim(),
        cue:   (h.cue == null ? '' : String(h.cue)).trim().slice(0, 120),
        grace: (h.grace === 'none' ? 'none' : 'shield'),
        sched: normalizeSched(h.sched),
        target: normalizeTarget(h.target)
      });
    }
    return { ok: true, habits: out };
  }

  // Frozen deep-clone of the shipped 12. The tests + "reset to defaults" depend on it.
  // Built via validateHabits so it is normalized by construction.
  var DEFAULT_HABITS = (function () {
    var v = validateHabits(HABITS);
    var arr = v.habits;
    // deep-freeze: freeze sched.days arrays + target objects + habit objects + array
    arr.forEach(function (h) {
      if (h.sched && h.sched.days) Object.freeze(h.sched.days);
      if (h.sched) Object.freeze(h.sched);
      if (h.target) Object.freeze(h.target);
      Object.freeze(h);
    });
    Object.freeze(arr);
    return arr;
  }());

  // The only function allowed to change the active set. Mutates HABITS IN PLACE so
  // every closure + window.WIT.HABITS (same reference) sees the new contents.
  function setHabits(list) {
    var v = validateHabits(list);
    if (!v.ok) throw new Error('setHabits: ' + v.error);
    HABITS.length = 0;
    v.habits.forEach(function (h) { HABITS.push(h); });
    reindexHabits();
    return HABITS;
  }
  function getHabits() {            // defensive deep copy for callers that want a draft
    return HABITS.map(copyHabit);
  }
  function resetHabitsToDefault() {
    return setHabits(DEFAULT_HABITS.map(copyHabit));
  }

  function catOf(habitId) {
    var h = HABIT_BY_ID[habitId];
    return h ? h.cat : null;
  }

  function habitsIn(catKey) {
    return HABITS.filter(function (h) { return h.cat === catKey; });
  }

  // HARD schedule: is this a day the plan names? perWeek never hard-schedules.
  function isScheduled(habit, key) {
    var s = schedOf(habit);
    if (s.type === 'daily') return true;
    if (s.type === 'days') return s.days.indexOf(parseKey(key).getDay()) !== -1;
    return false;                                         // perWeek: flexible
  }
  function scheduledHabits(habits, key) {
    return (habits || []).filter(function (h) { return isScheduled(h, key); });
  }

  // URGENCY (decision D): is this habit expected — or already done — on `key`?
  function isDueOn(completions, habit, key) {
    if (((completions && completions[key]) || []).indexOf(habit.id) !== -1) return true;
    var s = schedOf(habit);
    if (s.type === 'daily') return true;
    var dow = parseKey(key).getDay();
    if (s.type === 'days') return s.days.indexOf(dow) !== -1;
    var need = s.n - countInWeekBefore(completions, habit.id, key);
    if (need <= 0) return false;
    var daysLeftIncl = 7 - ((dow - WEEK_START + 7) % 7);
    return need >= daysLeftIncl;
  }
  function dueHabits(completions, habits, key) {
    return (habits || []).filter(function (h) { return isDueOn(completions, h, key); });
  }

  // honest weekly slot count: daily=7, perWeek=n, days=days.length
  function weekCapacity(habits) {
    var sum = 0;
    (habits || []).forEach(function (h) {
      var s = schedOf(h);
      sum += s.type === 'daily' ? 7 : s.type === 'perWeek' ? s.n : s.days.length;
    });
    return sum;
  }

  // ---------------------------------------------------------------------------
  // LOGS — pure helpers (R2)
  // ---------------------------------------------------------------------------
  function setLog(logs, habitId, key, amount) {
    var next = {};
    Object.keys(logs || {}).forEach(function (k) {
      next[k] = {};
      Object.keys(logs[k]).forEach(function (h) { next[k][h] = logs[k][h]; });
    });
    var day = next[key] || (next[key] = {});
    var v = Number(amount);
    if (!isFinite(v) || v <= 0) delete day[habitId]; else day[habitId] = v;
    if (!Object.keys(day).length) delete next[key];
    return next;
  }
  function amountOn(logs, key, habitId) {
    var d = logs && logs[key];
    var v = d && d[habitId];
    return (typeof v === 'number' && v > 0) ? v : null;
  }

  function cleanLogs(logs, completions, knownIds) {
    var out = {};
    if (!logs || typeof logs !== 'object' || Array.isArray(logs)) return out;
    Object.keys(logs).forEach(function (key) {
      if (!isDayKey(key)) return;
      var day = logs[key], doneList = completions[key];
      if (!day || typeof day !== 'object' || Array.isArray(day) || !doneList) return;
      var clean = {};
      Object.keys(day).forEach(function (hid) {
        if (!knownIds[hid]) return;
        if (doneList.indexOf(hid) === -1) return;      // orphan: no completion, no log
        var v = Number(day[hid]);
        if (!isFinite(v) || v <= 0) return;
        clean[hid] = v;
      });
      if (Object.keys(clean).length) out[key] = clean;
    });
    return out;
  }

  // ---------------------------------------------------------------------------
  // STREAK ENGINE — ONE deterministic forward replay per habit
  // ---------------------------------------------------------------------------
  function habitTimeline(completions, habit, asOfKey) {
    asOfKey = asOfKey || todayKey();
    var s = schedOf(habit);
    if (s.type === 'perWeek') return weeklyTimeline(completions, habit, s, asOfKey);
    return dailyTimeline(completions, habit, s, asOfKey);
  }

  function firstCompletionKey(completions, habitId, asOfKey) {
    var first = null;
    Object.keys(completions).forEach(function (k) {
      if (k <= asOfKey && (completions[k] || []).indexOf(habitId) !== -1 &&
          (first === null || k < first)) first = k;
    });
    return first;
  }

  function dailyTimeline(completions, habit, sched, asOfKey) {
    var id = habit.id;
    var useShields = habit.grace !== 'none';
    var first = firstCompletionKey(completions, id, asOfKey);
    var out = { unit: 'day', streak: 0, best: 0, shields: 0,
                earned: 0, spent: 0, covered: {}, hit7: 0, hit30: 0 };
    if (first === null) return out;

    var run = 0, sinceEarn = 0;
    for (var k = first; k <= asOfKey; k = shiftKey(k, 1)) {
      if (!isScheduled(habit, k)) continue;                 // rest day: transparent
      var done = (completions[k] || []).indexOf(id) !== -1;
      if (done) {
        run++;
        if (run > out.best) out.best = run;
        if (run === 7)  out.hit7++;
        if (run === 30) out.hit30++;
        if (useShields) {
          sinceEarn++;
          if (sinceEarn === SHIELD_RULES.earnEveryDays) {   // earned by REAL reps only
            sinceEarn = 0; out.earned++;
            if (out.shields < SHIELD_RULES.cap) out.shields++;
          }
        }
      } else if (k === asOfKey) {
        // today is open — never judged (preserves "yesterday alive")
      } else if (run > 0 && out.shields > 0) {
        out.shields--; out.spent++; out.covered[k] = true;  // auto-cover: run PRESERVED, not grown
      } else {
        run = 0; sinceEarn = 0;                             // streak breaks; bank persists
      }
    }
    out.streak = run;
    return out;
  }

  function weeklyTimeline(completions, habit, sched, asOfKey) {
    var id = habit.id, n = sched.n;
    var useShields = habit.grace !== 'none';
    var first = firstCompletionKey(completions, id, asOfKey);
    var out = { unit: 'week', streak: 0, best: 0, shields: 0,
                earned: 0, spent: 0, covered: {}, hit7: 0, hit30: 0 };
    if (first === null) return out;

    var curWeek = weekStartKey(asOfKey);
    var run = 0, sinceEarn = 0;
    for (var ws = weekStartKey(first); ws <= curWeek; ws = shiftKey(ws, 7)) {
      var live = (ws === curWeek);
      var tally = weekTally(completions, id, ws, asOfKey);
      if (tally >= n) {
        run++;                                              // live week counts the moment it's hit
        if (run > out.best) out.best = run;
        if (run === 7)  out.hit7++;
        if (run === 30) out.hit30++;
        if (useShields) {
          sinceEarn++;
          if (sinceEarn === SHIELD_RULES.earnEveryWeeks) {
            sinceEarn = 0; out.earned++;
            if (out.shields < SHIELD_RULES.cap) out.shields++;
          }
        }
      } else if (live) {
        // current week still open — never judged
      } else {
        var deficit = n - tally;
        if (run > 0 && deficit <= out.shields) {            // cover ONLY if fully affordable
          out.shields -= deficit; out.spent += deficit; out.covered[ws] = deficit;
        } else {
          run = 0; sinceEarn = 0;                           // break; never waste a partial cover
        }
      }
    }
    out.streak = run;
    return out;
  }

  // Same signatures as before — bodies replaced in place.
  function habitStreak(completions, habitId, asOfKey) {
    var habit = HABIT_BY_ID[habitId] || { id: habitId, sched: { type: 'daily' } };
    return habitTimeline(completions, habit, asOfKey || todayKey()).streak;
  }
  function bestHabitStreakEver(completions, habitId) {
    var habit = HABIT_BY_ID[habitId] || { id: habitId, sched: { type: 'daily' } };
    var keys = Object.keys(completions).filter(function (k) {
      return (completions[k] || []).indexOf(habitId) !== -1;
    }).sort();
    var asOf = keys.length ? keys[keys.length - 1] : todayKey();
    return habitTimeline(completions, habit, asOf).best;
  }
  function habitShields(completions, habitId, asOfKey) {
    var habit = HABIT_BY_ID[habitId] || { id: habitId, sched: { type: 'daily' } };
    return habitTimeline(completions, habit, asOfKey || todayKey()).shields;
  }
  function streakUnit(habit) {
    return schedOf(habit).type === 'perWeek' ? 'wk' : 'day';
  }

  // ---------------------------------------------------------------------------
  // FOUR-WINS DAY v3-FULL
  // ---------------------------------------------------------------------------
  function isFourWinsDay(completions, key) {
    var day = completions[key];
    if (!day || !day.length) return false;
    var hit = {}, anyReal = false;
    day.forEach(function (id) {
      var c = catOf(id);
      if (c) { hit[c] = true; anyReal = true; }
    });
    if (!anyReal) return false;
    return CATEGORIES.every(function (c) {
      if (hit[c.key]) return true;
      return habitsIn(c.key).filter(function (h) { return isScheduled(h, key); }).length === 0;
    });
  }

  // Current run of consecutive four-wins days ending today/yesterday.
  function fourWinsDayStreak(completions, asOfKey) {
    asOfKey = asOfKey || todayKey();
    var start;
    if (isFourWinsDay(completions, asOfKey)) start = asOfKey;
    else if (isFourWinsDay(completions, shiftKey(asOfKey, -1))) start = shiftKey(asOfKey, -1);
    else return 0;
    var streak = 0, k = start;
    while (isFourWinsDay(completions, k)) { streak++; k = shiftKey(k, -1); }
    return streak;
  }

  // ---------------------------------------------------------------------------
  // XP — schedule-aware, shield-aware, once per crossing.
  // ---------------------------------------------------------------------------
  function computeXp(completions) {
    var xp = { total: 0, physical: 0, mental: 0, spiritual: 0, rest: 0 };
    var keys = Object.keys(completions).sort();
    keys.forEach(function (key) {
      (completions[key] || []).forEach(function (id) {
        var cat = catOf(id);
        if (!cat) return;
        xp.total += XP.perHabit;          // +10 incl. bonus checks on unscheduled days
        xp[cat]  += XP.perHabit;
      });
      if (isFourWinsDay(completions, key)) xp.total += XP.fourWinsDay;
    });
    // Streak milestone bonuses — schedule-aware, shield-aware, once per crossing.
    if (keys.length) {
      var last = keys[keys.length - 1];
      HABITS.forEach(function (h) {
        var tl = habitTimeline(completions, h, last);
        xp.total  += tl.hit7 * XP.streak7 + tl.hit30 * XP.streak30;
        xp[h.cat] += tl.hit7 * XP.streak7 + tl.hit30 * XP.streak30;
      });
    }
    return xp;
  }

  // ---------------------------------------------------------------------------
  // RANKS
  // ---------------------------------------------------------------------------
  function rankForXp(xp) {
    var current = RANKS[0], next = null;
    for (var i = 0; i < RANKS.length; i++) {
      if (xp >= RANKS[i].min) { current = RANKS[i]; next = RANKS[i + 1] || null; }
    }
    var floor = current.min;
    var ceil = next ? next.min : current.min;
    var progress = next ? (xp - floor) / (ceil - floor) : 1;
    return {
      index: RANKS.indexOf(current),
      current: current,
      next: next,
      progress: Math.max(0, Math.min(1, progress)),
      toNext: next ? next.min - xp : 0
    };
  }

  // ---------------------------------------------------------------------------
  // DERIVE EVERYTHING — the one function the UI calls each render.
  // ---------------------------------------------------------------------------
  function deriveStats(completions, asOfKey) {
    asOfKey = asOfKey || todayKey();
    var xp = computeXp(completions);

    var totalCompletions = 0;
    Object.keys(completions).forEach(function (k) {
      totalCompletions += (completions[k] || []).length;
    });

    var bestHabitStreak = 0, bestCurrentStreak = 0;
    var timelines = {}, shields = {};
    HABITS.forEach(function (h) {
      var tl = habitTimeline(completions, h, asOfKey);
      timelines[h.id] = tl;
      shields[h.id] = tl.shields;
      if (tl.best > bestHabitStreak) bestHabitStreak = tl.best;
      if (tl.streak > bestCurrentStreak) bestCurrentStreak = tl.streak;
    });

    // any four-wins day ever?
    var bestFourWinsDay = Object.keys(completions).some(function (k) {
      return isFourWinsDay(completions, k);
    });

    var due = dueHabits(completions, HABITS, asOfKey);

    var perCat = {};
    CATEGORIES.forEach(function (c) {
      var dueInCat = 0;
      due.forEach(function (h) { if (h.cat === c.key) dueInCat++; });
      perCat[c.key] = {
        rank: rankForXp(xp[c.key]),
        xp: xp[c.key],
        todayDone: countTodayInCat(completions, c.key, asOfKey),
        todayTotal: dueInCat                       // CHANGED: due-today, not habit count
      };
    });

    var todayList = completions[asOfKey] || [];

    var stats = {
      xp: xp,
      rank: rankForXp(xp.total),
      perCat: perCat,
      totalCompletions: totalCompletions,
      bestHabitStreak: bestHabitStreak,            // schedule/shield-aware, mixed units
      bestCurrentStreak: bestCurrentStreak,
      bestFourWinsDay: bestFourWinsDay,
      fourWinDayStreak: fourWinsDayStreak(completions, asOfKey),
      todayCount: todayList.filter(function (id) { return !!catOf(id); }).length, // known ids only
      scheduledToday: due.length,                  // NEW — Today gauge denominator
      timelines: timelines,                        // NEW — id -> timeline obj
      shields: shields,                            // NEW — id -> banked shields
      todayFourWins: isFourWinsDay(completions, asOfKey),
      activeDays: Object.keys(completions).filter(function (k) {
        return (completions[k] || []).length > 0;
      }).length
    };

    stats.badges = BADGES.filter(function (b) { return b.test(stats); })
                         .map(function (b) { return b.id; });
    return stats;
  }

  function countTodayInCat(completions, catKey, asOfKey) {
    var day = completions[asOfKey] || [];
    return day.filter(function (id) { return catOf(id) === catKey; }).length;
  }

  // ---------------------------------------------------------------------------
  // GOAL TRACKER — daily score series.
  // ---------------------------------------------------------------------------
  function dailyScores(completions, days, asOfKey) {
    completions = completions || {};
    if (days == null) days = 30;   // default only when omitted — keep an explicit 0
    if (days < 1) return [];
    asOfKey = asOfKey || todayKey();
    var series = [];
    var startKey = shiftKey(asOfKey, -(days - 1));
    for (var i = 0; i < days; i++) {
      var key = shiftKey(startKey, i);
      var list = completions[key] || [];
      var per = { physical: 0, mental: 0, spiritual: 0, rest: 0 };
      var score = 0;
      for (var j = 0; j < list.length; j++) {
        var cat = catOf(list[j]);
        if (cat && per.hasOwnProperty(cat)) { per[cat]++; score++; }
      }
      var due = 0;
      for (var hh = 0; hh < HABITS.length; hh++) {
        if (isDueOn(completions, HABITS[hh], key)) due++;
      }
      series.push({ key: key, score: score, perCat: per, scheduled: due,
                    fourWins: isFourWinsDay(completions, key) });
    }
    return series;
  }

  // Trailing rolling average over a numeric series. Same length as input.
  function rollingAverage(scores, window) {
    scores = scores || [];
    window = window || 7;
    if (window < 1) window = 1;
    var out = [], sum = 0;
    for (var i = 0; i < scores.length; i++) {
      sum += scores[i];
      if (i >= window) sum -= scores[i - window];
      out.push(sum / Math.min(i + 1, window));
    }
    return out;
  }

  // Sum of daily scores over a rolling 7-day window ending asOfKey.
  function weekScore(completions, asOfKey) {
    asOfKey = asOfKey || todayKey();
    var week = dailyScores(completions, 7, asOfKey), total = 0;
    for (var i = 0; i < week.length; i++) total += week[i].score;
    return total;
  }

  // Static honest capacity (decision D)
  function weeklyConsistency(completions, asOfKey) {
    asOfKey = asOfKey || todayKey();
    var maxPerWeek = weekCapacity(HABITS);                  // CHANGED: was 7 * HABITS.length
    var thisWeek = weekScore(completions, asOfKey);
    var prevWeek = weekScore(completions, shiftKey(asOfKey, -7));
    var thisRate = maxPerWeek ? Math.min(1, thisWeek / maxPerWeek) : 0;
    var prevRate = maxPerWeek ? Math.min(1, prevWeek / maxPerWeek) : 0;
    return {
      thisWeek: thisWeek, prevWeek: prevWeek, maxPerWeek: maxPerWeek,
      rate: thisRate, ratePct: Math.round(thisRate * 100),
      prevRate: prevRate, deltaPct: Math.round((thisRate - prevRate) * 100)
    };
  }

  // GOAL LINE — default daily target. 4 = one habit per Win (a Four-Wins floor).
  var DEFAULT_GOAL = 4;
  function clampGoal(goal) {
    if (typeof goal !== 'number' || isNaN(goal)) return DEFAULT_GOAL;
    goal = Math.round(goal);
    if (goal < 1) return 1;
    if (goal > HABITS.length) return HABITS.length;
    return goal;
  }
  // Annotate a dailyScores() series with goal state.
  function withGoal(series, goal) {
    goal = clampGoal(goal);
    var metCount = 0, activeDays = 0;
    var points = series.map(function (d) {
      var sched = (d.scheduled == null) ? HABITS.length : d.scheduled; // legacy series safety
      var rest = (sched === 0);
      var goalEff = rest ? 0 : Math.min(goal, sched);
      if (!rest && goalEff < 1) goalEff = 1;
      var met = !rest && d.score >= goalEff;
      if (!rest) activeDays++;
      if (met) metCount++;
      return { key: d.key, score: d.score, perCat: d.perCat, fourWins: d.fourWins,
               scheduled: sched, rest: rest, goal: goalEff, met: met };
    });
    return { goal: goal, points: points, metCount: metCount, activeDays: activeDays,
             metRate: activeDays ? metCount / activeDays : 0 };
  }

  // ---------------------------------------------------------------------------
  // CELLS, HEAT, JOURNEY
  // ---------------------------------------------------------------------------
  function dayCellState(completions, habit, key, asOfKey, tl) {
    asOfKey = asOfKey || todayKey();
    var done = (completions[key] || []).indexOf(habit.id) !== -1;
    var s = schedOf(habit);
    if (s.type === 'perWeek') {
      if (done) return 'done';
      return key >= asOfKey ? 'pending' : 'free';   // flexible day — never a red miss
    }
    var sched = isScheduled(habit, key);
    if (done) return sched ? 'done' : 'bonus';
    if (!sched) return 'rest';
    if (key >= asOfKey) return 'pending';
    tl = tl || habitTimeline(completions, habit, asOfKey);
    return tl.covered[key] ? 'shielded' : 'missed';
  }

  function heatLevel(done, due) {
    if (done === 0) return 0;
    if (due === 0) return 4;                        // bonus work on a clear day
    var r = done / due;
    return r >= 1 ? 4 : r >= 0.67 ? 3 : r >= 0.34 ? 2 : 1;
  }

  function journeyProgress(completions, habitId) {
    var reps = 0;
    Object.keys(completions).forEach(function (k) {
      if ((completions[k] || []).indexOf(habitId) !== -1) reps++;
    });
    var day = Math.min(reps, JOURNEY_DAYS);
    return { reps: reps, day: day, total: JOURNEY_DAYS,
             pct: Math.round((day / JOURNEY_DAYS) * 100),
             automatic: reps >= JOURNEY_DAYS };
  }

  // ---------------------------------------------------------------------------
  // WIT SCORE
  // ---------------------------------------------------------------------------
  function witScore(completions, asOfKey) {
    asOfKey = asOfKey || todayKey();
    var y = shiftKey(asOfKey, -1);
    var yDue = dueHabits(completions, HABITS, y).length;
    var yDone = (completions[y] || []).filter(function (id) { return !!catOf(id); }).length;
    var exec = yDue ? Math.min(1, yDone / yDue) : 1;
    var live = 0;
    HABITS.forEach(function (h) { if (habitStreak(completions, h.id, asOfKey) > 0) live++; });
    var health = HABITS.length ? live / HABITS.length : 0;
    var wk = weeklyConsistency(completions, asOfKey).rate;
    var score = Math.round(exec * 50 + health * 30 + wk * 20);
    var brief =
      score >= 85 ? 'Primed. Hit the hardest thing on the board first.' :
      score >= 60 ? 'Solid base. Protect the streaks before starting anything new.' :
      score >= 35 ? 'Wobbling. Win the next hour, not the whole day.' :
                    'Cold start. One check. That is the entire mission right now.';
    var band = score >= 70 ? 'primed' : score >= 40 ? 'steady' : 'rebuild';
    return { score: score, band: band, brief: brief,
             parts: { exec: exec, health: health, week: wk } };
  }

  // ---------------------------------------------------------------------------
  // MOTIVATION CONTEXT
  // ---------------------------------------------------------------------------
  function motivationContext(completions, asOfKey, hour) {
    asOfKey = asOfKey || todayKey();
    if (hour == null) hour = 12;
    var today = completions[asOfKey] || [];

    var milestone = false;
    HABITS.forEach(function (h) {
      if (today.indexOf(h.id) === -1) return;                    // must have hit it TODAY
      var tl = habitTimeline(completions, h, asOfKey);
      if (tl.streak === 7 || tl.streak === 30) milestone = true;
      if (journeyProgress(completions, h.id).reps === JOURNEY_DAYS) milestone = true;
    });
    if (milestone) return 'milestone';

    if (isFourWinsDay(completions, asOfKey)) return 'four-wins';

    if (hour >= 18) {
      var risk = false;
      HABITS.forEach(function (h) {
        if (today.indexOf(h.id) !== -1) return;
        if (!isDueOn(completions, h, asOfKey)) return;
        if (habitStreak(completions, h.id, asOfKey) >= 3) risk = true;
      });
      if (risk) return 'streak-risk';
    }

    var cold = 0;
    for (var i = 0; i < 3; i++) {
      if (((completions[shiftKey(asOfKey, -i)]) || []).length === 0) cold++;
    }
    if (cold === 3) return 'cold-lapse';

    if (hour < 12 && today.length === 0) return 'fresh-morning';
    return 'grind';
  }

  // ---------------------------------------------------------------------------
  // QUOTES — verbatim, 28 entries. Never invent attribution.
  // ---------------------------------------------------------------------------
  var QUOTES = [
    // ---- fresh-morning ----
    { voice: 'classic',   ctx: ['fresh-morning'], by: 'Marcus Aurelius',
      text: 'In the morning when thou risest unwillingly, let this thought be present: I am rising to the work of a human being.' },
    { voice: 'scripture', ctx: ['fresh-morning'], by: 'Psalm 118:24 (KJV)',
      text: 'This is the day which the LORD hath made; we will rejoice and be glad in it.' },
    { voice: 'scripture', ctx: ['fresh-morning'], by: 'Lamentations 3:22–23 (KJV)',
      text: 'It is of the LORD\'s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.' },
    { voice: 'wit',       ctx: ['fresh-morning'], by: 'WIT',
      text: 'Fresh sheet. Zero owed. The first check is the cheapest one all day — take it.' },
    { voice: 'wit',       ctx: ['fresh-morning'], by: 'WIT',
      text: 'Motivation slept in. You didn\'t. That\'s the whole trick.' },
    // ---- streak-risk ----
    { voice: 'classic',   ctx: ['streak-risk'],   by: 'Epictetus',
      text: 'First say to yourself what you would be; and then do what you have to do.' },
    { voice: 'scripture', ctx: ['streak-risk'],   by: 'Ecclesiastes 9:10 (KJV)',
      text: 'Whatsoever thy hand findeth to do, do it with thy might.' },
    { voice: 'wit',       ctx: ['streak-risk'],   by: 'WIT',
      text: 'The streak does not die at midnight. It dies right now, if you pick the couch. Pick the rep.' },
    { voice: 'wit',       ctx: ['streak-risk'],   by: 'WIT',
      text: 'The shield exists so one bad Tuesday doesn\'t get to write your story.' },
    { voice: 'wit',       ctx: ['streak-risk'],   by: 'WIT',
      text: 'That streak took 23 days to build and takes one lazy evening to lose. Your call.' },
    // ---- milestone ----
    { voice: 'classic',   ctx: ['milestone'],     by: 'Epictetus',
      text: 'No great thing is created suddenly, any more than a bunch of grapes or a fig.' },
    { voice: 'scripture', ctx: ['milestone'],     by: 'Galatians 6:9 (KJV)',
      text: 'And let us not be weary in well doing: for in due season we shall reap, if we faint not.' },
    { voice: 'wit',       ctx: ['milestone'],     by: 'WIT',
      text: 'Logged. The number is real now. Nobody can un-earn it. You can still quit, though — do not.' },
    // ---- four-wins ----
    { voice: 'classic',   ctx: ['four-wins'],     by: 'Marcus Aurelius',
      text: 'Confine thyself to the present.' },
    { voice: 'scripture', ctx: ['four-wins'],     by: 'Proverbs 16:32 (KJV)',
      text: 'He that is slow to anger is better than the mighty; and he that ruleth his spirit than he that taketh a city.' },
    { voice: 'wit',       ctx: ['four-wins'],     by: 'WIT',
      text: 'Four fronts, four wins. That was the whole assignment. Same war tomorrow, 6 a.m.' },
    // ---- cold-lapse ----
    { voice: 'classic',   ctx: ['cold-lapse'],    by: 'Seneca',
      text: 'While we are postponing, life speeds by.' },
    { voice: 'scripture', ctx: ['cold-lapse'],    by: 'Proverbs 24:16 (KJV)',
      text: 'For a just man falleth seven times, and riseth up again.' },
    { voice: 'wit',       ctx: ['cold-lapse'],    by: 'WIT',
      text: 'Three cold days is a data point, not a verdict. One check flips the trend line. Just one.' },
    { voice: 'wit',       ctx: ['cold-lapse'],    by: 'WIT',
      text: 'Day 1 again? Fine. Day 1 with better intel.' },
    // ---- grind (default) ----
    { voice: 'classic',   ctx: ['grind'],         by: 'Marcus Aurelius',
      text: 'Do every act of thy life as if it were the last.' },
    { voice: 'classic',   ctx: ['grind'],         by: 'Marcus Aurelius',
      text: 'Waste no more time arguing what a good man should be. Be one.' },
    { voice: 'classic',   ctx: ['grind'],         by: 'Seneca',
      text: 'No man is crushed by misfortune unless he has first been deceived by prosperity.' },
    { voice: 'scripture', ctx: ['grind'],         by: 'Isaiah 40:31 (KJV)',
      text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles.' },
    { voice: 'scripture', ctx: ['grind'],         by: '1 Corinthians 9:25 (KJV)',
      text: 'And every man that striveth for the mastery is temperate in all things.' },
    { voice: 'wit',       ctx: ['grind'],         by: 'WIT',
      text: 'Nobody is watching. That is the point. The ledger sees everything anyway.' },
    { voice: 'wit',       ctx: ['grind'],         by: 'WIT',
      text: 'The habit doesn\'t care how you feel about it. Neither does the streak.' },
    { voice: 'wit',       ctx: ['grind'],         by: 'WIT',
      text: 'Nobody\'s coming. Good — less traffic on the way up.' }
  ];

  function hashStr(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return h >>> 0;
  }
  function pickQuote(context, dayK, voice) {
    var pool = [];
    for (var i = 0; i < QUOTES.length; i++) {
      var q = QUOTES[i];
      if (q.ctx.indexOf(context) === -1) continue;
      if (voice && q.voice !== voice) continue;
      pool.push(q);
    }
    if (!pool.length) pool = QUOTES;
    return pool[hashStr(context + '|' + dayK + '|' + (voice || '')) % pool.length];
  }

  // ---------------------------------------------------------------------------
  // WEEKLY DEBRIEF
  // ---------------------------------------------------------------------------
  function weeklyDebrief(completions, asOfKey) {
    asOfKey = asOfKey || todayKey();
    var ws = shiftKey(weekStartKey(asOfKey), -7), we = shiftKey(ws, 6);
    var perHabit = HABITS.map(function (h) {
      var s = schedOf(h);
      var target = s.type === 'perWeek' ? s.n : (s.type === 'days' ? s.days.length : 7);
      var done = weekTally(completions, h.id, ws);
      return { id: h.id, name: h.name, done: done, target: target, hit: done >= target };
    });
    var hits = 0, slots = 0;
    perHabit.forEach(function (p) { if (p.hit) hits++; slots += p.target; });
    var fourWins = 0, total = 0, bestKey = ws, bestScore = -1, pTotal = 0;
    for (var i = 0; i < 7; i++) {
      var k = shiftKey(ws, i);
      var sc = (completions[k] || []).filter(function (id) { return !!catOf(id); }).length;
      total += sc;
      if (isFourWinsDay(completions, k)) fourWins++;
      if (sc > bestScore) { bestScore = sc; bestKey = k; }
      pTotal += (completions[shiftKey(ws, i - 7)] || [])
        .filter(function (id) { return !!catOf(id); }).length;
    }
    return { weekStart: ws, weekEnd: we, perHabit: perHabit,
             habitsHit: hits, habitsTotal: HABITS.length,
             scheduledSlots: slots,
             rate: slots ? Math.min(1, total / slots) : 0,
             fourWinsDays: fourWins,
             bestDay: { key: bestKey, score: bestScore < 0 ? 0 : bestScore },
             totalChecks: total, deltaChecks: total - pTotal };
  }

  // ---------------------------------------------------------------------------
  // CELEBRATIONS
  // ---------------------------------------------------------------------------
  function celebrationFor(prevStats, nextStats) {
    if (!prevStats || !nextStats) return null;
    if (nextStats.rank.index > prevStats.rank.index) {
      return { tier: 3, kind: 'rank-up', detail: nextStats.rank.current.name };
    }
    for (var i = 0; i < nextStats.badges.length; i++) {
      if (prevStats.badges.indexOf(nextStats.badges[i]) === -1) {
        return { tier: 2, kind: 'badge', detail: nextStats.badges[i] };
      }
    }
    if (nextStats.todayFourWins && !prevStats.todayFourWins) {
      return { tier: 2, kind: 'four-wins', detail: 'Four Wins' };
    }
    if (nextStats.bestCurrentStreak > prevStats.bestCurrentStreak &&
        (nextStats.bestCurrentStreak === 7 || nextStats.bestCurrentStreak === 30 ||
         nextStats.bestCurrentStreak === 66)) {
      return { tier: 2, kind: 'streak', detail: nextStats.bestCurrentStreak };
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // MUTATION — toggle a habit on a given day.
  // ---------------------------------------------------------------------------
  function toggle(completions, habitId, key) {
    key = key || todayKey();
    var next = {};
    Object.keys(completions).forEach(function (k) { next[k] = completions[k].slice(); });
    var day = next[key] || (next[key] = []);
    var i = day.indexOf(habitId);
    if (i === -1) day.push(habitId); else day.splice(i, 1);
    if (!day.length) delete next[key];
    return next;
  }

  // ---------------------------------------------------------------------------
  // SEED — schedule-honest, deterministic demo history.
  // ---------------------------------------------------------------------------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seedDemo(days) {
    days = days || 84;                                  // 12 weeks
    var rndC = mulberry32(0x57495420);                  // "WIT " — completions stream (seed unchanged)
    var rndV = mulberry32(0x57495421);                  // values stream — independent by design
    var completions = {}, logs = {};
    var today = new Date();
    var weekDone = {};                                  // habitId -> hits so far this Mon-week

    for (var d = days; d >= 1; d--) {                   // oldest -> newest, skip today
      var date = new Date(today);
      date.setDate(date.getDate() - d);
      var key = dayKey(date);
      var dow = date.getDay();
      var mondayIdx = (dow - WEEK_START + 7) % 7;       // 0=Mon .. 6=Sun
      if (mondayIdx === 0) weekDone = {};               // new training week

      var ramp = 0.35 + (1 - d / days) * 0.55;          // shaky -> consistent (unchanged narrative)
      var sabbath = (dow === 0);
      var list = [], vals = {};

      HABITS.forEach(function (h) {
        var s = schedOf(h), p;
        if (s.type === 'days') {
          // appointments get kept; off-days stay honest zeros (matrix shows rest, not misses)
          p = (s.days.indexOf(dow) !== -1) ? Math.min(0.96, ramp + 0.18) : 0;
        } else if (s.type === 'perWeek') {
          var need = s.n - (weekDone[h.id] || 0);
          var daysLeft = 7 - mondayIdx;
          p = need <= 0 ? 0.05                          // rare bonus session
            : Math.min(0.95, ramp * 1.15 * (need / daysLeft) + 0.15);  // urgency rises late-week
        } else {
          p = ramp;
          if (sabbath && h.cat === 'physical')  p *= 0.4;
          if (sabbath && h.cat === 'rest')      p = Math.min(0.97, p + 0.25);
          if (sabbath && h.cat === 'spiritual') p = Math.min(0.97, p + 0.2);
        }
        if (rndC() < p) {                               // exactly one rndC() per habit per day
          list.push(h.id);
          weekDone[h.id] = (weekDone[h.id] || 0) + 1;
          if (h.target) {                               // believable value: floor days exist, most at/above target
            var span = h.target.amount - h.target.min;
            vals[h.id] = Math.round((h.target.min + span * (0.4 + rndV() * 0.9)) * 10) / 10;
          }
        }
      });

      if (list.length) completions[key] = list;
      if (Object.keys(vals).length) logs[key] = vals;
    }
    return { completions: completions, logs: logs };
  }
  function seedHistory(days) { return seedDemo(days).completions; }   // back-compat shim

  // ---------------------------------------------------------------------------
  // SELF-TESTS
  // ---------------------------------------------------------------------------
  function runSelfTestsInner() {
    var results = [];
    function check(name, got, want) {
      var ok = JSON.stringify(got) === JSON.stringify(want);
      results.push({ name: name, ok: ok, got: got, want: want });
    }

    // Build a tiny, known history ending "today" for deterministic asserts.
    var t = todayKey();
    function ago(n) { return shiftKey(t, -n); }

    // --- XP calculation ---
    var c1 = {}; c1[t] = ['p-train'];
    check('xp: one completion = 10', computeXp(c1).total, 10);
    check('xp: category credited', computeXp(c1).physical, 10);

    var c2 = {}; c2[t] = ['p-train', 'm-read', 's-pray', 'r-sleep'];
    check('xp: four-wins day = 40 + 25 bonus', computeXp(c2).total, 65);

    // --- Streak computation ---
    // NOTE: fixture changed from p-run (perWeek) to p-fuel (daily) per spec §4.1
    var cs = {};
    for (var i = 0; i < 7; i++) cs[ago(i)] = ['p-fuel'];
    check('streak: 7 consecutive days', habitStreak(cs, 'p-fuel'), 7);
    check('streak: XP includes 7-day bonus', computeXp(cs).physical, 7 * 10 + 50);

    var cgap = {};
    cgap[ago(0)] = ['p-fuel']; cgap[ago(1)] = ['p-fuel']; cgap[ago(3)] = ['p-fuel'];
    check('streak: gap breaks it (=2)', habitStreak(cgap, 'p-fuel'), 2);

    // alive-yesterday-not-today still counts
    var cy = {}; cy[ago(1)] = ['p-fuel']; cy[ago(2)] = ['p-fuel'];
    check('streak: yesterday alive (=2)', habitStreak(cy, 'p-fuel'), 2);

    // --- Rank thresholds ---
    check('rank: 0 xp = Recruit', rankForXp(0).current.name, 'Recruit');
    check('rank: 2000 xp = Consistent', rankForXp(2000).current.name, 'Consistent');
    check('rank: 4999 = still Consistent', rankForXp(4999).current.name, 'Consistent');
    check('rank: 50000 = Legend, no next', rankForXp(50000).next, null);
    check('rank: progress midway Grinder->Consistent',
          Math.round(rankForXp(1250).progress * 100), 50);

    // --- Badge award conditions ---
    var sFour = deriveStats(c2);
    check('badge: four-wins unlocks', sFour.badges.indexOf('four-wins') !== -1, true);
    check('badge: first-blood unlocks', sFour.badges.indexOf('first-blood') !== -1, true);
    var sEmpty = deriveStats({});
    check('badge: none on empty', sEmpty.badges.length, 0);

    // --- Toggle immutability ---
    var base = {}; base[t] = ['p-train'];
    var after = toggle(base, 'm-read', t);
    check('toggle: original untouched', base[t].length, 1);
    check('toggle: new has both', after[t].length, 2);
    var off = toggle(after, 'm-read', t);
    check('toggle: removes again', off[t].length, 1);

    // ==================== GOAL TRACKER ASSERTIONS (v2) ====================
    check('dailyScores: length === days', dailyScores({}, 7, t).length, 7);
    check('dailyScores: days=1 is today only', dailyScores({}, 1, t)[0].key, t);
    check('dailyScores: last point is today', dailyScores({}, 30, t)[29].key, t);
    check('dailyScores: first point is days-1 ago', dailyScores({}, 30, t)[0].key, ago(29));
    check('dailyScores: chronological oldest->newest',
          dailyScores({}, 3, t).map(function (d) { return d.key; }), [ago(2), ago(1), ago(0)]);

    var cg1 = {};
    cg1[t] = ['p-train', 'm-read', 's-pray', 'r-sleep'];
    cg1[ago(1)] = ['p-train', 'p-run'];
    var ds = dailyScores(cg1, 3, t);
    check('dailyScores: today score = 4', ds[2].score, 4);
    check('dailyScores: today perCat physical=1', ds[2].perCat.physical, 1);
    check('dailyScores: today fourWins true', ds[2].fourWins, true);
    check('dailyScores: yesterday score = 2', ds[1].score, 2);
    check('dailyScores: yesterday perCat physical=2', ds[1].perCat.physical, 2);
    check('dailyScores: yesterday fourWins false', ds[1].fourWins, false);
    check('dailyScores: empty day (2 ago) score = 0', ds[0].score, 0);

    var cbad = {}; cbad[t] = ['p-train', 'NOT-A-HABIT', 'm-read'];
    check('dailyScores: unknown id ignored (score=2)', dailyScores(cbad, 1, t)[0].score, 2);
    var cfull = {}; cfull[t] = HABITS.map(function (h) { return h.id; });
    check('dailyScores: full day caps at 12', dailyScores(cfull, 1, t)[0].score, 12);
    check('dailyScores: no history -> all score 0',
          dailyScores({}, 5, t).every(function (d) { return d.score === 0; }), true);
    check('dailyScores: days<=0 -> []', dailyScores({}, 0, t).length, 0);

    check('rollingAverage: aligned length', rollingAverage([1, 2, 3, 4], 2).length, 4);
    check('rollingAverage: trailing avg', rollingAverage([2, 4, 6], 2), [2, 3, 5]);
    check('rollingAverage: partial early window (no NaN)', rollingAverage([4, 8], 7), [4, 6]);
    check('rollingAverage: empty -> []', rollingAverage([], 7).length, 0);

    var cw = {};
    for (var wi = 0; wi < 7; wi++) cw[ago(wi)] = ['p-train', 'm-read'];
    check('weekScore: 7 days * 2 = 14', weekScore(cw, t), 14);
    var wc = weeklyConsistency(cw, t);
    check('weeklyConsistency: rate = 14/72 -> 19%', wc.ratePct, 19);
    check('weeklyConsistency: deltaPct vs empty prev = +19', wc.deltaPct, 19);
    check('weeklyConsistency: no history -> 0% / 0 delta',
          [weeklyConsistency({}, t).ratePct, weeklyConsistency({}, t).deltaPct], [0, 0]);

    check('goal: default is 4', DEFAULT_GOAL, 4);
    check('goal: clamp below 1 -> 1', clampGoal(0), 1);
    check('goal: clamp above 12 -> 12', clampGoal(99), 12);
    check('goal: clamp NaN -> default', clampGoal(NaN), 4);
    var wg = withGoal(dailyScores(cg1, 2, t), 4);
    check('withGoal: today met (score4>=4)', wg.points[1].met, true);
    check('withGoal: yesterday miss (score2<4)', wg.points[0].met, false);
    check('withGoal: metCount = 1', wg.metCount, 1);

    check('shiftKey: across leap day', shiftKey('2024-02-28', 1), '2024-02-29');
    check('shiftKey: leap -> March', shiftKey('2024-02-29', 1), '2024-03-01');
    check('shiftKey: year boundary', shiftKey('2025-12-31', 1), '2026-01-01');
    check('dailyScores: window spans leap boundary',
          dailyScores({}, 3, '2024-03-01').map(function (d) { return d.key; }),
          ['2024-02-28', '2024-02-29', '2024-03-01']);

    // ==================== v3: HABITS + GOAL VALIDATION ====================
    check('validateHabits: empty list fails', validateHabits([]).ok, false);
    check('validateHabits: missing name fails',
          validateHabits([{ id: 'x', cat: 'physical' }]).ok, false);
    check('validateHabits: bad cat fails',
          validateHabits([{ id: 'x', cat: 'nope', name: 'X' }]).ok, false);
    check('validateHabits: dup id fails',
          validateHabits([{ id: 'a', cat: 'physical', name: 'A' },
                          { id: 'a', cat: 'mental', name: 'B' }]).ok, false);
    check('validateHabits: good list ok',
          validateHabits([{ id: 'a', cat: 'physical', name: 'A' }]).ok, true);
    check('validateHabits: auto-id when missing',
          !!validateHabits([{ cat: 'mental', name: 'Read Books' }]).habits[0].id, true);
    check('slugifyId: spaces -> dashes', slugifyId('Read Books'), 'read-books');
    check('uniqueId: avoids collision', uniqueId('a', { a: true }), 'a-2');
    check('shortOf: prefers shortLabel', shortOf({ name: 'Run / Cardio', shortLabel: 'Cardio' }), 'Cardio');
    check('shortOf: falls back to first word', shortOf({ name: 'Run / Cardio', shortLabel: '' }), 'Run');
    check('DEFAULT_HABITS: still 12', DEFAULT_HABITS.length, 12);
    check('setHabits: in-place keeps reference', (function () {
      var ref = HABITS;
      setHabits([{ id: 'solo', cat: 'rest', name: 'Solo' }]);
      var same = (HABITS === ref) && HABITS.length === 1 && HABIT_BY_ID.solo && HABIT_BY_ID.solo.name === 'Solo';
      setHabits(DEFAULT_HABITS.map(copyHabit));          // restore for following asserts
      return !!same;
    })(), true);

    // ==================== v3-FULL: SCHEDULE MODEL (F1-F10) ====================
    var HD = { id: 'hd', cat: 'physical',  name: 'HD', sched: { type: 'daily' } };
    var HW = { id: 'hw', cat: 'mental',    name: 'HW', sched: { type: 'days', days: [1, 3, 5] } }; // Mon Wed Fri
    var H3 = { id: 'h3', cat: 'mental',    name: 'H3', sched: { type: 'perWeek', n: 3 } };
    function restoreDefaults() { setHabits(DEFAULT_HABITS.map(copyHabit)); }

    check('sched: null -> daily', normalizeSched(null).type, 'daily');                          // F1
    check('sched: days dedup+sort', normalizeSched({ type: 'days', days: [5, 1, 3, 1] }).days, [1, 3, 5]); // F2
    check('sched: 7 days IS daily / empty days -> daily',
          [normalizeSched({ type: 'days', days: [0,1,2,3,4,5,6] }).type,
           normalizeSched({ type: 'days', days: [] }).type], ['daily', 'daily']);               // F3
    check('sched: perWeek n>=7 collapses to daily, n<1 clamps to 1',
          [normalizeSched({ type: 'perWeek', n: 99 }).type,
           normalizeSched({ type: 'perWeek', n: 0 }).n], ['daily', 1]);                         // F4
    check('isScheduled: daily always', isScheduled(HD, '2026-06-07'), true);                    // F5
    check('isScheduled: days Mon yes / Sun no',
          [isScheduled(HW, '2026-06-01'), isScheduled(HW, '2026-06-07')], [true, false]);       // F6
    check('isScheduled: perWeek never hard-schedules', isScheduled(H3, '2026-06-01'), false);   // F7
    check('scheduledHabits: Sun filters to daily only',
          scheduledHabits([HD, HW, H3], '2026-06-07').map(function (h) { return h.id; }), ['hd']); // F8
    check('weekStartKey: Thu/Mon/Sun -> Monday',
          [weekStartKey('2026-06-04'), weekStartKey('2026-06-01'), weekStartKey('2026-06-07')],
          ['2026-06-01', '2026-06-01', '2026-06-01']);                                          // F9
    var cwt = { '2026-06-01': ['h3'], '2026-06-03': ['h3'], '2026-06-05': ['h3'] };
    check('weekTally: full vs upto', [weekTally(cwt, 'h3', '2026-06-01'),
          weekTally(cwt, 'h3', '2026-06-01', '2026-06-03')], [3, 2]);                           // F10

    // ==================== isDueOn — urgency model (F11-F14) ====================
    check('isDueOn: perWeek not urgent Monday', isDueOn({}, H3, '2026-06-01'), false);          // F11
    check('isDueOn: perWeek urgent Friday (3 needed, 3 left)', isDueOn({}, H3, '2026-06-05'), true); // F12
    check('isDueOn: perWeek 2/3 done, Sat not due',
          isDueOn({ '2026-06-01': ['h3'], '2026-06-03': ['h3'] }, H3, '2026-06-06'), false);    // F13
    check('isDueOn: done today always due (bonus day too)',
          [isDueOn({ '2026-06-02': ['h3'] }, H3, '2026-06-02'),
           isDueOn({ '2026-06-07': ['hw'] }, HW, '2026-06-07')], [true, true]);                 // F14

    // ==================== days-schedule streaks (F15-F17) ====================
    var cdw = { '2026-06-01': ['hw'], '2026-06-03': ['hw'], '2026-06-05': ['hw'] };
    check('days streak: unscheduled days transparent',
          [habitTimeline(cdw, HW, '2026-06-06').streak,          // Sat
           habitTimeline(cdw, HW, '2026-06-08').streak], [3, 3]); // next Mon, open             // F15
    check('days streak: scheduled miss breaks',
          habitTimeline({ '2026-06-01': ['hw'], '2026-06-05': ['hw'] }, HW, '2026-06-05').streak, 1); // F16
    check('days streak: bonus day does not extend',
          habitTimeline({ '2026-06-01': ['hw'], '2026-06-02': ['hw'] }, HW, '2026-06-02').streak, 1); // F17

    // ==================== shields, daily (F18-F25) ====================
    function runDays(startKey, n, id) {  // helper: n consecutive done days
      var c = {}; for (var ii = 0; ii < n; ii++) c[shiftKey(startKey, ii)] = [id]; return c;
    }
    var cs7 = runDays('2026-06-01', 7, 'hd');
    check('shield: earned at rep 7, today open unjudged',
          [habitTimeline(cs7, HD, '2026-06-08').streak,
           habitTimeline(cs7, HD, '2026-06-08').shields], [7, 1]);                              // F18
    var cs7m = runDays('2026-06-01', 7, 'hd');           // miss 06-08, done 09-10
    cs7m['2026-06-09'] = ['hd']; cs7m['2026-06-10'] = ['hd'];
    var tlA = habitTimeline(cs7m, HD, '2026-06-10');
    check('shield: auto-covers a miss, streak survives',
          [tlA.streak, tlA.shields, tlA.spent, !!tlA.covered['2026-06-08']], [9, 0, 1, true]);  // F19
    var cs14 = runDays('2026-06-01', 14, 'hd');
    cs14['2026-06-17'] = ['hd'];                          // miss 15,16 -> both covered
    check('shield: two stacked cover two misses',
          [habitTimeline(cs14, HD, '2026-06-17').streak,
           habitTimeline(cs14, HD, '2026-06-17').shields], [15, 0]);                            // F20
    var cs14b = runDays('2026-06-01', 14, 'hd');
    cs14b['2026-06-18'] = ['hd'];                         // miss 15,16,17 -> third breaks
    check('shield: third consecutive miss breaks',
          habitTimeline(cs14b, HD, '2026-06-18').streak, 1);                                    // F21
    var cs21 = runDays('2026-06-01', 21, 'hd');
    check('shield: cap 2, overflow forfeited',
          [habitTimeline(cs21, HD, '2026-06-21').shields,
           habitTimeline(cs21, HD, '2026-06-21').earned], [2, 3]);                              // F22
    var cyj = runDays('2026-06-01', 7, 'hd');             // 08 missed (judged), 09 = today open
    check('shield: yesterday judged + consumed, today open',
          [habitTimeline(cyj, HD, '2026-06-09').streak,
           habitTimeline(cyj, HD, '2026-06-09').shields], [7, 0]);                              // F23
    cyj['2026-06-08'] = ['hd'];                           // back-fill the miss
    check('shield: back-fill refunds the shield (derived truth)',
          [habitTimeline(cyj, HD, '2026-06-09').streak,
           habitTimeline(cyj, HD, '2026-06-09').shields,
           habitTimeline(cyj, HD, '2026-06-09').spent], [8, 1, 0]);                             // F24
    check('shield: dead run spends nothing',
          habitTimeline({ '2026-06-01': ['hd'] }, HD, '2026-06-10').spent, 0);                  // F25

    // ==================== grace: 'none' (F26) ====================
    var HG = { id: 'hg', cat: 'physical', name: 'HG', sched: { type: 'daily' }, grace: 'none' };
    var cgr = runDays('2026-06-01', 7, 'hg');             // 7 reps, miss 08, done 09-10
    cgr['2026-06-09'] = ['hg']; cgr['2026-06-10'] = ['hg'];
    check('grace none: no shield economy, miss breaks',
          [habitTimeline(cgr, HG, '2026-06-10').streak,
           habitTimeline(cgr, HG, '2026-06-10').shields], [2, 0]);                              // F26

    // ==================== perWeek streaks + shields (F27-F33) ====================
    check('perWeek: live week counts when hit',
          habitTimeline({ '2026-06-01': ['h3'], '2026-06-02': ['h3'], '2026-06-03': ['h3'] },
                        H3, '2026-06-03').streak, 1);                                           // F27
    check('perWeek: open week under target does not break',
          habitTimeline(cwt, H3, '2026-06-09').streak, 1);                                      // F28
    var cpw = { '2026-06-01': ['h3'], '2026-06-03': ['h3'], '2026-06-05': ['h3'], '2026-06-08': ['h3'] };
    check('perWeek: closed short week (deficit 2, no shields) breaks',
          habitTimeline(cpw, H3, '2026-06-15').streak, 0);                                      // F29
    function runWeeks(mondays, offsets, id) {
      var c = {};
      mondays.forEach(function (m) {
        offsets.forEach(function (o) { c[shiftKey(m, o)] = [id]; });
      });
      return c;
    }
    var c3w = runWeeks(['2026-06-01', '2026-06-08', '2026-06-15'], [0, 1, 2], 'h3');
    check('perWeek: shield earned per 3 target weeks',
          [habitTimeline(c3w, H3, '2026-06-21').streak,
           habitTimeline(c3w, H3, '2026-06-21').shields], [3, 1]);                              // F30
    var c3wCov = runWeeks(['2026-06-01', '2026-06-08', '2026-06-15'], [0, 1, 2], 'h3');
    c3wCov['2026-06-22'] = ['h3']; c3wCov['2026-06-23'] = ['h3'];   // week 4 = 2/3
    var tlB = habitTimeline(c3wCov, H3, '2026-06-29');
    check('perWeek: shield covers a deficit-1 week',
          [tlB.streak, tlB.shields, tlB.covered['2026-06-22']], [3, 0, 1]);                     // F31
    var c3wBrk = runWeeks(['2026-06-01', '2026-06-08', '2026-06-15'], [0, 1, 2], 'h3');
    c3wBrk['2026-06-22'] = ['h3'];                                   // week 4 = 1/3, deficit 2 > bank 1
    check('perWeek: unaffordable deficit breaks, shield NOT wasted',
          [habitTimeline(c3wBrk, H3, '2026-06-29').streak,
           habitTimeline(c3wBrk, H3, '2026-06-29').shields], [0, 1]);                           // F32
    check('streakUnit: perWeek is weeks', [streakUnit(H3), streakUnit(HD)], ['wk', 'day']);     // F33

    // ==================== registry-scoped block — setHabits swap (F34-F39) ====================
    var HS  = { id: 'hs',  cat: 'spiritual', name: 'HS',  sched: { type: 'daily' } };
    var HR3 = { id: 'hr3', cat: 'rest',      name: 'HR3', sched: { type: 'perWeek', n: 2 } };
    setHabits([HD, HW, HS, HR3]);

    check('fourWins: sabbath -- unscheduled Wins count',
          isFourWinsDay({ '2026-06-07': ['hd', 'hs'] }, '2026-06-07'), true);                   // F34
    check('fourWins: scheduled-but-unmet Win blocks',
          isFourWinsDay({ '2026-06-07': ['hd'] }, '2026-06-07'), false);                        // F35
    check('fourWins: empty / stale-only day never wins',
          [isFourWinsDay({}, '2026-06-07'),
           isFourWinsDay({ '2026-06-07': ['ghost'] }, '2026-06-07')], [false, false]);          // F36
    check('dailyScores: scheduled = due count (Sun: hd, hs, hr3-urgent)',
          dailyScores({}, 1, '2026-06-07')[0].scheduled, 3);                                    // F37
    var sSun = deriveStats({ '2026-06-07': ['hd', 'hs'] }, '2026-06-07');
    check('deriveStats: scheduledToday + per-cat due totals',
          [sSun.scheduledToday, sSun.perCat.mental.todayTotal, sSun.perCat.physical.todayTotal],
          [3, 0, 1]);                                                                           // F38
    var sSh = deriveStats(runDays('2026-06-01', 7, 'hd'), '2026-06-08');
    check('deriveStats: shields + timelines exposed',
          [sSh.shields.hd, sSh.timelines.hd.streak], [1, 7]);                                   // F39

    // ==================== XP in schedule units (F40-F41) ====================
    setHabits([HD, HW]);   // hd never done -> blocks fourWins; hw carries the XP
    var cxw = { '2026-06-01': ['hw'], '2026-06-03': ['hw'], '2026-06-05': ['hw'],
                '2026-06-08': ['hw'], '2026-06-10': ['hw'], '2026-06-12': ['hw'], '2026-06-15': ['hw'] };
    check('xp: streak7 fires across calendar gaps on a days schedule',
          [computeXp(cxw).total, computeXp(cxw).mental], [120, 120]);                           // F40
    setHabits([HD, H3]);
    var cx3 = runWeeks(['2026-06-01','2026-06-08','2026-06-15','2026-06-22','2026-06-29','2026-07-06','2026-07-13'],
                       [0, 1, 2], 'h3');
    check('xp: perWeek streak7 = 7 target weeks (21x10 + 50)', computeXp(cx3).total, 260);      // F41

    // ==================== weekly debrief (F42) ====================
    var dbc = { '2026-06-01': ['hd', 'h3'], '2026-06-02': ['hd', 'h3'], '2026-06-03': ['hd', 'h3'],
                '2026-06-04': ['hd'], '2026-06-05': ['hd'] };
    var db = weeklyDebrief(dbc, '2026-06-10');
    check('weeklyDebrief: last closed week, hits, totals',
          [db.weekStart, db.habitsHit, db.totalChecks, db.bestDay.key],
          ['2026-06-01', 1, 8, '2026-06-01']);                                                  // F42

    // ==================== WIT Score + context (F43-F46) ====================
    setHabits([HD]);
    var cwit = runDays('2026-06-03', 7, 'hd');           // done 03..09, asOf 10
    check('witScore: 50 exec + 30 health + 17.1 week = 97',
          witScore(cwit, '2026-06-10').score, 97);                                              // F43
    check('witScore: empty history = 0', witScore({}, '2026-06-10').score, 0);                  // F44
    check('motivationContext: priorities',
          [motivationContext({ '2026-06-09': ['hd'] }, '2026-06-10', 8),        // fresh-morning
           motivationContext({ '2026-06-07': ['hd'], '2026-06-08': ['hd'], '2026-06-09': ['hd'] },
                             '2026-06-10', 20),                                 // streak-risk
           motivationContext(runDays('2026-06-04', 7, 'hd'), '2026-06-10', 20), // milestone (7 today)
           motivationContext({ '2026-06-01': ['hd'] }, '2026-06-10', 14)],      // cold-lapse
          ['fresh-morning', 'streak-risk', 'milestone', 'cold-lapse']);                         // F46

    setHabits([HW]);
    var wgS = withGoal(dailyScores({ '2026-06-01': ['hw'] }, 2, '2026-06-02'), 4);
    check('withGoal: goal capped to plan; rest day exempt',
          [wgS.points[0].goal, wgS.points[0].met, wgS.points[1].rest, wgS.metRate],
          [1, true, true, 1]);                                                                  // F47
    check('witScore: rest-day yesterday = full exec marks',
          witScore({}, '2026-06-07').score, 50);                                                // F45
    restoreDefaults();

    // ==================== cells / heat / journey / target / logs / quotes / celebrations (F48-F54) ====================
    check('dayCellState: done/bonus/rest/missed/pending/shielded/free',
          [dayCellState({ '2026-06-01': ['hw'] }, HW, '2026-06-01', '2026-06-10'),
           dayCellState({ '2026-06-02': ['hw'] }, HW, '2026-06-02', '2026-06-10'),
           dayCellState({}, HW, '2026-06-02', '2026-06-10'),
           dayCellState({ '2026-06-01': ['hw'] }, HW, '2026-06-03', '2026-06-10'),
           dayCellState({}, HW, '2026-06-01', '2026-06-01'),
           dayCellState(runDays('2026-06-01', 7, 'hd'), HD, '2026-06-08', '2026-06-09'),
           dayCellState({}, H3, '2026-06-02', '2026-06-10')],
          ['done', 'bonus', 'rest', 'missed', 'pending', 'shielded', 'free']);                  // F48
    check('heatLevel: ratio bands + bonus day',
          [heatLevel(0, 5), heatLevel(1, 5), heatLevel(3, 5), heatLevel(4, 5), heatLevel(5, 5), heatLevel(2, 0)],
          [0, 1, 2, 3, 4, 4]);                                                                  // F49
    var cj = runDays('2026-01-01', 70, 'hd');
    check('journey: reps-based, capped, automatic at 66',
          [journeyProgress({ '2026-06-01': ['hd'], '2026-06-02': ['hd'], '2026-06-03': ['hd'] }, 'hd').day,
           journeyProgress({ '2026-06-01': ['hd'], '2026-06-02': ['hd'], '2026-06-03': ['hd'] }, 'hd').pct,
           journeyProgress(cj, 'hd').day, journeyProgress(cj, 'hd').automatic],
          [3, 5, 66, true]);                                                                    // F50
    check('target: normalize accepts/clamps/rejects',
          [normalizeTarget({ amount: 20, unit: 'min', min: 10 }).min,
           normalizeTarget({ amount: 3, unit: 'mi', min: 5 }).min,
           normalizeTarget({ amount: -5, unit: 'x' }), normalizeTarget({ amount: 20 })],
          [10, 3, null, null]);                                                                 // F51
    var lg = setLog({}, 'hd', '2026-06-01', 20);
    var lg2 = setLog(lg, 'hd', '2026-06-01', 35);
    check('logs: immutable set/read/clear',
          [amountOn(lg, '2026-06-01', 'hd'), amountOn(lg2, '2026-06-01', 'hd'),
           amountOn(setLog(lg2, 'hd', '2026-06-01', 0), '2026-06-01', 'hd'),
           !lg['2026-06-01'] ? 'x' : lg['2026-06-01'].hd],
          [20, 35, null, 20]);                                                                  // F52
    check('pickQuote: deterministic per day + context-matched',
          [pickQuote('grind', '2026-06-10').text === pickQuote('grind', '2026-06-10').text,
           pickQuote('grind', '2026-06-10').ctx.indexOf('grind') !== -1], [true, true]);        // F53
    check('celebrationFor: rank-up outranks badge; null when quiet',
          [celebrationFor({ rank: { index: 0 }, badges: [], todayFourWins: false, bestCurrentStreak: 3 },
                          { rank: { index: 1, current: { name: 'Grinder' } }, badges: ['on-fire'],
                            todayFourWins: false, bestCurrentStreak: 7 }).tier,
           celebrationFor({ rank: { index: 1 }, badges: ['on-fire'], todayFourWins: false, bestCurrentStreak: 8 },
                          { rank: { index: 1 }, badges: ['on-fire'], todayFourWins: false, bestCurrentStreak: 8 })],
          [3, null]);                                                                           // F54

    // ==================== cleanLogs — the sidecar can never lie or orphan (F55-F57) ====================
    var lgKnown = { 'p-run': true };
    var lgComp  = { '2026-06-15': ['p-run'] };
    check('cleanLogs: valid entry kept',
          cleanLogs({ '2026-06-15': { 'p-run': 3.1 } }, lgComp, lgKnown), { '2026-06-15': { 'p-run': 3.1 } }); // F55
    check('cleanLogs: orphan (no completion) dropped',
          cleanLogs({ '2026-06-16': { 'p-run': 3 } }, lgComp, lgKnown), {});                    // F56
    check('cleanLogs: bad day / unknown id / bad value dropped',
          cleanLogs({ '2026-13-40': { 'p-run': 3 }, '2026-06-15': { 'zzz': 3, 'p-run': -1 } },
                    lgComp, lgKnown), {});                                                      // F57

    // ==================== validateHabits v4 fields (F58-F59) ====================
    check('validateHabits: v3-shaped habit gains v4 defaults', (function () {
      var h = validateHabits([{ id: 'a', cat: 'mental', name: 'A' }]).habits[0];
      return h.sched.type === 'daily' && h.cue === '' && h.grace === 'shield' && h.target === null;
    })(), true);                                                                                // F58
    check('validateHabits: grace enum falls back to shield',
          validateHabits([{ id: 'a', cat: 'rest', name: 'A', grace: 'lol' }]).habits[0].grace, 'shield'); // F59

    // ==================== capacity + seed honesty + display (F60-F65) ====================
    check('weekCapacity: shipped defaults = 72', weekCapacity(DEFAULT_HABITS), 72);             // F60
    check('weekCapacity: daily7 + perWeek3 + 2 days = 12', weekCapacity([
          { sched: { type: 'daily' } }, { sched: { type: 'perWeek', n: 3 } },
          { sched: { type: 'days', days: [2, 4] } }]), 12);                                     // F61
    check('seed: days-habit never fires off-schedule', (function () {
      var c = seedDemo(84).completions;
      return Object.keys(c).every(function (k) {
        if (c[k].indexOf('r-recharge') === -1) return true;
        var dw = parseKey(k).getDay();
        return dw === 0 || dw === 3;
      });
    })(), true);                                                                                // F62
    check('seed: logs only annotate completions', (function () {
      var s = seedDemo(84);
      return Object.keys(s.logs).every(function (k) {
        return Object.keys(s.logs[k]).every(function (id) {
          return (s.completions[k] || []).indexOf(id) !== -1;
        });
      });
    })(), true);                                                                                // F63
    check('cueLine: cue wins over hint',
          cueLine({ cue: 'the coffee is poured', hint: 'x' }), 'After the coffee is poured');   // F64
    check('targetLabel: floor shown', targetLabel({ amount: 3, unit: 'mi', min: 1 }), '3 mi · 1 counts'); // F65

    var passed = results.filter(function (r) { return r.ok; }).length;
    var failed = results.length - passed;
    return { passed: passed, failed: failed, results: results };
  }

  function runSelfTests() {
    var saved = getHabits();                 // snapshot the user's active set
    try {
      setHabits(DEFAULT_HABITS.map(copyHabit));
      return runSelfTestsInner();
    } finally {
      setHabits(saved);                      // restore even if an assertion throws
    }
  }

  // ---------------------------------------------------------------------------
  // EXPORT
  // ---------------------------------------------------------------------------
  global.WIT = {
    CATEGORIES: CATEGORIES,
    HABITS: HABITS,
    HABIT_BY_ID: HABIT_BY_ID,
    DEFAULT_HABITS: DEFAULT_HABITS,
    XP: XP,
    RANKS: RANKS,
    BADGES: BADGES,
    // dates
    dayKey: dayKey,
    todayKey: todayKey,
    shiftKey: shiftKey,
    parseKey: parseKey,
    WEEKDAYS: WEEKDAYS,
    // lookups
    catOf: catOf,
    habitsIn: habitsIn,
    // habits management
    setHabits: setHabits,
    getHabits: getHabits,
    validateHabits: validateHabits,
    resetHabitsToDefault: resetHabitsToDefault,
    uniqueId: uniqueId,
    slugifyId: slugifyId,
    shortOf: shortOf,
    copyHabit: copyHabit,
    // schedules
    normalizeSched: normalizeSched, schedOf: schedOf, normalizeTarget: normalizeTarget,
    isScheduled: isScheduled, scheduledHabits: scheduledHabits,
    isDueOn: isDueOn, dueHabits: dueHabits, weekCapacity: weekCapacity,
    WEEK_START: WEEK_START, weekStartKey: weekStartKey, weekTally: weekTally,
    isDayKey: isDayKey,
    // streak engine
    habitStreak: habitStreak,
    bestHabitStreakEver: bestHabitStreakEver,
    habitTimeline: habitTimeline, habitShields: habitShields,
    streakUnit: streakUnit, SHIELD_RULES: SHIELD_RULES,
    // cells / heat / journey
    dayCellState: dayCellState, heatLevel: heatLevel,
    journeyProgress: journeyProgress, JOURNEY_DAYS: JOURNEY_DAYS,
    // four wins
    isFourWinsDay: isFourWinsDay,
    fourWinsDayStreak: fourWinsDayStreak,
    // xp / rank / stats
    computeXp: computeXp,
    rankForXp: rankForXp,
    deriveStats: deriveStats,
    // goal tracker
    dailyScores: dailyScores,
    rollingAverage: rollingAverage,
    weekScore: weekScore,
    weeklyConsistency: weeklyConsistency,
    withGoal: withGoal,
    clampGoal: clampGoal,
    DEFAULT_GOAL: DEFAULT_GOAL,
    // mutation
    toggle: toggle,
    // logs (R2) + display (R2/R3)
    setLog: setLog, amountOn: amountOn, cleanLogs: cleanLogs,
    cueLine: cueLine, targetLabel: targetLabel,
    // motivation layer (R4)
    witScore: witScore, motivationContext: motivationContext,
    QUOTES: QUOTES, pickQuote: pickQuote,
    weeklyDebrief: weeklyDebrief, celebrationFor: celebrationFor,
    // seed
    seedDemo: seedDemo,
    seedHistory: seedHistory,
    // tests
    runSelfTests: runSelfTests
  };
})(window);
