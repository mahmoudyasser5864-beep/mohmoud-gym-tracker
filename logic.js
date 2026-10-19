// منطق البيانات: بدون React، قابل للاختبار مباشرة.

export const STORAGE_KEY = 'mahmoud-gym-tracker:v1';

// أسبوع التمرين يبدأ السبت (مثل الأسبوع المصري).
export const DAY_NAMES = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

export const MUSCLES = ['صدر', 'ظهر', 'أكتاف', 'باي', 'ترايسبس', 'أرجل', 'سمانة', 'بطن', 'كارديو'];

// [الاسم، العضلة، الجهاز/الأداة]
const SEED = [
  ['بنش بريس بار', 'صدر', 'Flat Bench + Barbell'],
  ['بنش مائل دمبل', 'صدر', 'Incline Bench + Dumbbells'],
  ['جهاز ضغط الصدر', 'صدر', 'Chest Press Machine'],
  ['جهاز الفراشة', 'صدر', 'Pec Deck'],
  ['سحب أمامي واسع', 'ظهر', 'Lat Pulldown'],
  ['تجديف كابل جالس', 'ظهر', 'Seated Cable Row'],
  ['جهاز تجديف', 'ظهر', 'Row Machine'],
  ['رفعة ميتة', 'ظهر', 'Barbell'],
  ['ضغط أكتاف جهاز', 'أكتاف', 'Shoulder Press Machine'],
  ['رفرفة جانبية دمبل', 'أكتاف', 'Dumbbells'],
  ['رفرفة خلفية جهاز', 'أكتاف', 'Rear Delt Machine'],
  ['باي بار', 'باي', 'EZ Bar'],
  ['جهاز Preacher', 'باي', 'Preacher Curl Machine'],
  ['بوش داون كابل', 'ترايسبس', 'Cable Pushdown'],
  ['جهاز ديبس', 'ترايسبس', 'Dip Machine'],
  ['سكوات', 'أرجل', 'Smith Machine / Barbell'],
  ['ليج بريس', 'أرجل', 'Leg Press'],
  ['ليج إكستنشن', 'أرجل', 'Leg Extension'],
  ['ليج كيرل', 'أرجل', 'Leg Curl'],
  ['سمانة واقف', 'سمانة', 'Standing Calf Raise'],
  ['جهاز البطن', 'بطن', 'Ab Crunch Machine'],
  ['رفع أرجل معلق', 'بطن', "Captain's Chair"],
];

const PLAN = [
  { focus: 'صدر + ترايسبس', ex: ['بنش بريس بار', 'بنش مائل دمبل', 'جهاز الفراشة', 'بوش داون كابل'] },
  { focus: 'ظهر + باي', ex: ['سحب أمامي واسع', 'تجديف كابل جالس', 'باي بار', 'جهاز Preacher'] },
  { focus: 'أرجل', ex: ['سكوات', 'ليج بريس', 'ليج إكستنشن', 'ليج كيرل', 'سمانة واقف'] },
  { focus: 'راحة', ex: [] },
  { focus: 'أكتاف + بطن', ex: ['ضغط أكتاف جهاز', 'رفرفة جانبية دمبل', 'رفرفة خلفية جهاز', 'جهاز البطن'] },
  { focus: 'صدر + ظهر', ex: ['جهاز ضغط الصدر', 'جهاز تجديف', 'جهاز ديبس'] },
  { focus: 'راحة', ex: [] },
];

// وزن البداية والزيادة الأسبوعية، تُستخدم للبيانات التجريبية فقط.
const BASE = {
  'بنش بريس بار': [50, 2.5], 'بنش مائل دمبل': [18, 1], 'جهاز الفراشة': [35, 2.5], 'بوش داون كابل': [25, 2.5],
  'سحب أمامي واسع': [45, 2.5], 'تجديف كابل جالس': [40, 2.5], 'باي بار': [25, 2.5], 'جهاز Preacher': [20, 2.5],
  'سكوات': [60, 5], 'ليج بريس': [120, 10], 'ليج إكستنشن': [40, 2.5], 'ليج كيرل': [35, 2.5], 'سمانة واقف': [60, 5],
  'ضغط أكتاف جهاز': [30, 2.5], 'رفرفة جانبية دمبل': [8, 0.5], 'رفرفة خلفية جهاز': [25, 2.5], 'جهاز البطن': [35, 2.5],
  'جهاز ضغط الصدر': [45, 2.5], 'جهاز تجديف': [40, 2.5], 'جهاز ديبس': [40, 2.5],
};

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

/* ---------- التواريخ والأرقام ---------- */

const pad = (n) => String(n).padStart(2, '0');
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseIso = (s) => {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
export const addDays = (d, n) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
};
// فهرس اليوم داخل الأسبوع: السبت = 0 ... الجمعة = 6
export const dayIndexOf = (d) => (d.getDay() + 1) % 7;
export const lastSaturday = (d) => addDays(d, -dayIndexOf(d));

export function fmtDate(s) {
  try {
    return new Intl.DateTimeFormat('ar-EG-u-nu-latn', { day: 'numeric', month: 'short' }).format(parseIso(s));
  } catch (e) {
    return String(s);
  }
}
export const weekRange = (w) => `${fmtDate(w.startDate)} – ${fmtDate(iso(addDays(parseIso(w.startDate), 6)))}`;

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
// يقبل الأرقام العربية والفاصلة العشرية العربية ويُرجع نصًا رقميًا نظيفًا.
export function normNum(s) {
  let t = String(s)
    .replace(/[٠-٩]/g, (d) => AR_DIGITS.indexOf(d))
    .replace(/[٫,،]/g, '.')
    .replace(/[^0-9.]/g, '');
  const i = t.indexOf('.');
  if (i !== -1) t = t.slice(0, i + 1) + t.slice(i + 1).replace(/\./g, '');
  return t.slice(0, 6);
}
export const num = (s) => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};
export const fmt = (n) => String(Math.round(n * 10) / 10);
export const fmtVol = (n) => Math.round(n).toLocaleString('en-US');

/* ---------- بناء البيانات ---------- */

export const blankSets = () => [0, 1, 2].map(() => ({ w: '', r: '10', done: false }));

const mkEntry = (ex, sets) => ({ id: uid(), exId: ex.id, name: ex.name, muscle: ex.muscle, sets, note: '' });

function seedExercises() {
  return SEED.map(([name, muscle, machine], i) => ({ id: 'e' + (i + 1), name, muscle, machine }));
}

function buildWeek(exercises, { id, n, startDate, progress = null, doneUpTo = 7 }) {
  const byName = Object.fromEntries(exercises.map((e) => [e.name, e]));
  return {
    id,
    n,
    startDate,
    days: PLAN.map((p, di) => ({
      focus: p.focus,
      entries: p.ex.map((nm) => {
        let sets = blankSets();
        if (progress !== null) {
          const [base, step] = BASE[nm] || [20, 2.5];
          let w = base + step * progress;
          if (progress === 2 && nm.length % 3 === 0) w -= step;
          w = Math.round(w * 2) / 2;
          sets = ['12', '10', '8'].map((r) => ({ w: String(w), r, done: di < doneUpTo }));
        }
        return mkEntry(byName[nm], sets);
      }),
    })),
  };
}

export function freshState(today = new Date()) {
  const exercises = seedExercises();
  const w = buildWeek(exercises, { id: 'w1', n: 1, startDate: iso(lastSaturday(today)) });
  return { v: 1, demo: false, exercises, weeks: [w], activeWeekId: w.id };
}

export function demoState(today = new Date()) {
  const exercises = seedExercises();
  const start = lastSaturday(today);
  const todayIdx = dayIndexOf(today);
  const weeks = [0, 1, 2, 3].map((i) =>
    buildWeek(exercises, {
      id: 'w' + (i + 1),
      n: i + 1,
      startDate: iso(addDays(start, -7 * (3 - i))),
      progress: i,
      doneUpTo: i === 3 ? todayIdx : 7,
    })
  );
  return { v: 1, demo: true, exercises, weeks, activeWeekId: 'w4' };
}

export function nextStart(weeks) {
  const last = [...weeks].sort((a, b) => a.n - b.n)[weeks.length - 1];
  return iso(addDays(parseIso(last.startDate), 7));
}

// أسبوع جديد يبدأ بنفس التمارين والأوزان الأخيرة كنقطة انطلاق، بدون علامات إنجاز.
export function newWeekFrom(prev, n, startDate) {
  return {
    id: uid(),
    n,
    startDate,
    days: prev.days.map((d) => ({
      focus: d.focus,
      entries: d.entries.map((e) => ({
        ...e,
        id: uid(),
        note: '',
        sets: e.sets.map((s) => ({ w: s.w, r: s.r, done: false })),
      })),
    })),
  };
}

/* ---------- الإحصائيات ---------- */

export function entryStats(e) {
  const p = e.sets.filter((s) => s.done);
  return {
    sets: e.sets.length,
    done: p.length,
    maxW: Math.max(0, ...p.map((s) => num(s.w))),
    volume: p.reduce((a, s) => a + num(s.w) * num(s.r), 0),
  };
}

export function dayStats(day) {
  return day.entries.reduce(
    (a, e) => {
      const s = entryStats(e);
      return { sets: a.sets + s.sets, done: a.done + s.done, volume: a.volume + s.volume };
    },
    { sets: 0, done: 0, volume: 0 }
  );
}

export function weekStats(week) {
  return week.days.reduce(
    (a, d) => {
      const s = dayStats(d);
      return { sets: a.sets + s.sets, done: a.done + s.done, volume: a.volume + s.volume };
    },
    { sets: 0, done: 0, volume: 0 }
  );
}

// سلسلة تطور تمرين عبر الأسابيع: تُحتسب المجموعات المعلّمة "تمت" فقط.
export function exerciseSeries(weeks, exId) {
  return [...weeks]
    .sort((a, b) => a.n - b.n)
    .map((w) => {
      let maxW = 0, volume = 0, sets = 0, bestReps = 0, found = false;
      for (const d of w.days) {
        for (const e of d.entries) {
          if (e.exId !== exId) continue;
          for (const s of e.sets) {
            if (!s.done) continue;
            found = true;
            sets++;
            const wt = num(s.w), r = num(s.r);
            volume += wt * r;
            if (wt > maxW || (wt === maxW && r > bestReps)) { maxW = wt; bestReps = r; }
          }
        }
      }
      return found ? { weekId: w.id, n: w.n, startDate: w.startDate, maxW, volume, sets, bestReps } : null;
    })
    .filter(Boolean);
}

// التمارين التي لها سجل فعلي، مع عدد الأسابيع.
export function loggedExercises(weeks) {
  const map = new Map();
  for (const w of weeks) for (const d of w.days) for (const e of d.entries) {
    if (!e.sets.some((s) => s.done)) continue;
    const cur = map.get(e.exId) || { exId: e.exId, name: e.name, muscle: e.muscle, weekIds: new Set() };
    cur.weekIds.add(w.id);
    map.set(e.exId, cur);
  }
  return [...map.values()].map((x) => ({ exId: x.exId, name: x.name, muscle: x.muscle, weeks: x.weekIds.size }));
}

export function compareWeeks(weeks, idA, idB) {
  const A = weeks.find((w) => w.id === idA);
  const B = weeks.find((w) => w.id === idB);
  if (!A || !B) return [];
  const infos = new Map();
  for (const w of [A, B]) for (const d of w.days) for (const e of d.entries)
    if (!infos.has(e.exId)) infos.set(e.exId, { exId: e.exId, name: e.name, muscle: e.muscle });
  const rows = [];
  for (const info of infos.values()) {
    const a = exerciseSeries([A], info.exId)[0] || null;
    const b = exerciseSeries([B], info.exId)[0] || null;
    if (!a && !b) continue;
    rows.push({ ...info, a, b, delta: a && b ? b.maxW - a.maxW : null });
  }
  return rows;
}

// آخر أوزان مسجلة لتمرين، لتعبئة مجموعات التمرين عند إضافته لأي يوم.
export function lastLoggedSets(weeks, exId) {
  const sorted = [...weeks].sort((a, b) => b.n - a.n);
  for (const w of sorted) {
    for (let di = 6; di >= 0; di--) {
      for (const e of w.days[di].entries) {
        if (e.exId === exId && e.sets.some((s) => s.done)) {
          return e.sets.map((s) => ({ w: s.w, r: s.r, done: false }));
        }
      }
    }
  }
  return null;
}

export function niceScale(min, max, count = 4) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) { min = 0; max = 1; }
  const nonNeg = min >= 0;
  if (min === max) {
    const p = Math.max(1, Math.abs(max) * 0.1);
    min -= p;
    max += p;
  }
  const raw = (max - min) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / mag;
  const step = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * mag;
  let lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  if (nonNeg && lo < 0) lo = 0;
  const ticks = [];
  for (let v = lo; v <= hi + step / 1e6; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return { lo, hi, ticks };
}

/* ---------- الحفظ الدائم ---------- */

export function validate(d) {
  if (!d || typeof d !== 'object' || !Array.isArray(d.exercises) || !Array.isArray(d.weeks) || d.weeks.length === 0) return null;
  for (const w of d.weeks) {
    if (!w || !Array.isArray(w.days) || w.days.length !== 7) return null;
    for (const day of w.days) if (!day || !Array.isArray(day.entries)) return null;
  }
  if (!d.weeks.find((w) => w.id === d.activeWeekId)) d.activeWeekId = d.weeks[d.weeks.length - 1].id;
  return d;
}

export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return validate(JSON.parse(raw));
  } catch (e) {
    return null;
  }
}

export function save(d) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    return true;
  } catch (e) {
    return false;
  }
}

export const buildBackup = (d) => JSON.stringify(d);
export function parseBackup(text) {
  try {
    return validate(JSON.parse(text));
  } catch (e) {
    return null;
  }
}
