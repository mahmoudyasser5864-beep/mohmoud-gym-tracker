import { useState, useEffect, useMemo, useRef } from 'react';
import {
  DAY_NAMES, MUSCLES, uid, load, save, freshState, demoState, newWeekFrom, nextStart, iso, addDays, parseIso,
  dayIndexOf, weekRange, fmtDate, entryStats, dayStats, weekStats, exerciseSeries, loggedExercises, compareWeeks,
  lastLoggedSets, blankSets, niceScale, normNum, fmt, fmtVol, buildBackup, parseBackup,
} from './logic.js';
import './styles.css';

/* ---------- عناصر صغيرة مشتركة ---------- */

const ICONS = {
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3',
  edit: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4',
  right: 'M9 5l7 7-7 7',
  left: 'M15 5l-7 7 7 7',
  close: 'M6 6l12 12M18 6L6 18',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  week: 'M5 5h14v15H5zM5 10h14M9 3v4M15 3v4',
  chart: 'M4 19V5M4 19h16M8 15l4-5 3 3 5-7',
  gear: 'M6 7v10M3 9.5v5M18 7v10M21 9.5v5M6 12h12',
  clock: 'M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4',
};

function Icon({ name, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={ICONS[name]} />
    </svg>
  );
}

function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="sheet-wrap" role="dialog" aria-modal="true" aria-label={title}>
      <div className="backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="إغلاق"><Icon name="close" /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

// زر حذف بخطوتين: ضغطة أولى للتأكيد وثانية للتنفيذ (لا توجد نوافذ confirm داخل التطبيق).
function ConfirmButton({ label, ariaLabel, confirmLabel = 'تأكيد الحذف', onConfirm, className = '', icon = 'trash', disabled = false }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return undefined;
    const t = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button type="button" disabled={disabled} aria-label={armed ? confirmLabel : ariaLabel || label}
      className={`btn btn-sm ${armed ? 'btn-danger' : 'btn-ghost'} ${className}`}
      onClick={() => { if (armed) { setArmed(false); onConfirm(); } else setArmed(true); }}>
      <Icon name={icon} size={16} />{armed ? confirmLabel : label}
    </button>
  );
}

/* ---------- الرسم البياني ---------- */

function LineChart({ points, label }) {
  const W = 360, H = 220, L = 46, R = 16, T = 24, B = 34;
  const ys = points.map((p) => p.y);
  const sc = niceScale(Math.min(...ys), Math.max(...ys), 4);
  const iw = W - L - R, ih = H - T - B;
  const X = (i) => (points.length === 1 ? L + iw / 2 : L + (iw * i) / (points.length - 1));
  const Y = (v) => T + ih * (1 - (v - sc.lo) / (sc.hi - sc.lo || 1));
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ');
  const last = points.length - 1;
  const area = `${line} L${X(last).toFixed(1)} ${T + ih} L${X(0).toFixed(1)} ${T + ih} Z`;
  const step = Math.ceil(points.length / 7);
  return (
    <div className="chart" dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        <defs>
          <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--accent)', stopOpacity: 0.3 }} />
            <stop offset="1" style={{ stopColor: 'var(--accent)', stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        {sc.ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} className="grid" />
            <text x={L - 8} y={Y(t) + 4} textAnchor="end" className="ax">{fmt(t)}</text>
          </g>
        ))}
        {points.length > 1 && <path d={area} className="area" />}
        {points.length > 1 && <path d={line} className="ln" />}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={X(i)} cy={Y(p.y)} r={i === last ? 5.5 : 3.5} className={i === last ? 'dot dot-last' : 'dot'} />
            {(i % step === 0 || i === last) && (
              <text x={X(i)} y={H - 12} textAnchor="middle" className="ax">{p.x}</text>
            )}
          </g>
        ))}
        <text x={points.length > 1 ? X(last) + 6 : X(last)} y={Y(points[last].y) - 12}
          textAnchor={points.length > 1 ? 'end' : 'middle'} className="val">{fmt(points[last].y)}</text>
      </svg>
    </div>
  );
}

/* ---------- تبويب الأسبوع ---------- */

function ExercisePicker({ exercises, onPick, onClose, onGoGear }) {
  const [q, setQ] = useState('');
  const [m, setM] = useState('الكل');
  const list = exercises.filter(
    (e) => (m === 'الكل' || e.muscle === m) && (e.name + ' ' + e.machine).toLowerCase().includes(q.trim().toLowerCase())
  );
  return (
    <Sheet title="إضافة تمرين لليوم" onClose={onClose}>
      <label className="search" htmlFor="pick-q">
        <Icon name="search" size={18} />
        <input id="pick-q" className="bare" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم التمرين أو الجهاز" />
      </label>
      <div className="chips" role="group" aria-label="تصفية حسب العضلة">
        {['الكل', ...MUSCLES].map((x) => (
          <button key={x} type="button" className={`chip-btn ${m === x ? 'on' : ''}`} onClick={() => setM(x)}>{x}</button>
        ))}
      </div>
      <ul className="plain pick-list">
        {list.map((e) => (
          <li key={e.id}>
            <button type="button" className="pick" onClick={() => onPick(e)}>
              <span className="pick-name">{e.name}</span>
              <span className="muted small">{e.muscle}{e.machine ? ' · ' : ''}<bdi>{e.machine}</bdi></span>
            </button>
          </li>
        ))}
        {list.length === 0 && (
          <li className="empty">
            لا توجد نتائج. <button type="button" className="link" onClick={onGoGear}>أضف تمرينًا جديدًا من تبويب الأجهزة</button>
          </li>
        )}
      </ul>
    </Sheet>
  );
}

function EntryCard({ entry, machine, prevMax, A, di }) {
  const st = entryStats(entry);
  return (
    <article className="card entry">
      <header className="entry-head">
        <div className="min0">
          <h3>{entry.name}</h3>
          <div className="meta">
            <span className="tag">{entry.muscle}</span>
            {machine && <span className="muted small"><bdi>{machine}</bdi></span>}
          </div>
        </div>
        <ConfirmButton label="حذف" onConfirm={() => A.removeEntry(di, entry.id)} />
      </header>

      <div className="set-grid" role="group" aria-label={`مجموعات ${entry.name}`}>
        <div className="set-row set-labels" aria-hidden="true">
          <span>#</span><span>الوزن (كجم)</span><span>التكرار</span><span>تم</span>
        </div>
        {entry.sets.map((s, i) => (
          <div className="set-row" key={i}>
            <span className="set-n">{i + 1}</span>
            <input className="num" inputMode="decimal" value={s.w} placeholder="0"
              aria-label={`الوزن بالكيلوجرام للمجموعة ${i + 1}`}
              onChange={(e) => A.setSet(di, entry.id, i, { w: normNum(e.target.value) })} />
            <input className="num" inputMode="numeric" value={s.r} placeholder="0"
              aria-label={`عدد التكرارات للمجموعة ${i + 1}`}
              onChange={(e) => A.setSet(di, entry.id, i, { r: normNum(e.target.value) })} />
            <button type="button" className="check" role="checkbox" aria-checked={s.done}
              aria-label={`تمت المجموعة ${i + 1}`}
              onClick={() => A.setSet(di, entry.id, i, { done: !s.done })}>
              <Icon name="check" size={20} />
            </button>
          </div>
        ))}
      </div>

      <div className="entry-tools">
        <button type="button" className="btn btn-sm" onClick={() => A.addSet(di, entry.id)}><Icon name="plus" size={16} />مجموعة</button>
        <button type="button" className="btn btn-sm btn-ghost" disabled={entry.sets.length <= 1}
          onClick={() => A.removeSet(di, entry.id)}><Icon name="minus" size={16} />مجموعة</button>
        <span className="muted small grow-end">
          {st.done}/{st.sets} تمت{prevMax ? <> · آخر أسبوع <b className="num-inline">{fmt(prevMax)}</b> كجم</> : null}
        </span>
      </div>

      <input className="inp note" value={entry.note} placeholder="ملاحظات (إحساس، ضبط الجهاز، ألم...)"
        aria-label={`ملاحظات ${entry.name}`} onChange={(e) => A.setNote(di, entry.id, e.target.value)} />
    </article>
  );
}

function WeekTab({ data, weeks, week, dayIdx, setDayIdx, A, goGear, todayIdx, isCurrentCalendarWeek }) {
  const [picker, setPicker] = useState(false);
  const day = week.days[dayIdx];
  const ds = dayStats(day);
  const ws = weekStats(week);
  const pos = weeks.findIndex((w) => w.id === week.id);
  const seriesCache = useMemo(() => {
    const m = {};
    for (const d of week.days) for (const e of d.entries) {
      if (!m[e.exId]) {
        const s = exerciseSeries(data.weeks.filter((w) => w.n < week.n), e.exId);
        m[e.exId] = s.length ? s[s.length - 1].maxW : 0;
      }
    }
    return m;
  }, [data.weeks, week]);

  return (
    <section aria-label="جدول الأسبوع">
      <div className="week-nav card">
        <button type="button" className="icon-btn" disabled={pos <= 0} onClick={() => A.selectWeek(weeks[pos - 1].id)} aria-label="الأسبوع السابق"><Icon name="right" /></button>
        <div className="week-title">
          <b className="disp">الأسبوع {week.n}</b>
          <span className="muted small">{weekRange(week)}</span>
        </div>
        <button type="button" className="icon-btn" disabled={pos >= weeks.length - 1} onClick={() => A.selectWeek(weeks[pos + 1].id)} aria-label="الأسبوع التالي"><Icon name="left" /></button>
      </div>
      <p className="muted small center-text">{ws.done}/{ws.sets} مجموعة منجزة هذا الأسبوع · حجم التمرين {fmtVol(ws.volume)} كجم</p>

      <div className="days" role="tablist" aria-label="أيام الأسبوع">
        {DAY_NAMES.map((n, i) => {
          const s = dayStats(week.days[i]);
          const full = s.sets > 0 && s.done === s.sets;
          const isToday = isCurrentCalendarWeek && i === todayIdx;
          return (
            <button key={n} type="button" role="tab" aria-selected={i === dayIdx}
              className={`day ${i === dayIdx ? 'on' : ''}`} onClick={() => setDayIdx(i)}>
              <span className="day-name">{n}</span>
              <span className="day-foot">
                {full ? <Icon name="check" size={14} /> : isToday ? <i className="today-dot" aria-label="اليوم" /> : <i className="spacer" />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="card day-head">
        <label className="field tight" htmlFor="day-focus">
          <span>{DAY_NAMES[dayIdx]} · تركيز اليوم</span>
          <input id="day-focus" className="inp focus-inp" value={day.focus} placeholder="مثال: صدر + ترايسبس"
            onChange={(e) => A.setFocus(dayIdx, e.target.value)} />
        </label>
        <p className="muted small">{ds.done}/{ds.sets} مجموعة · {fmtVol(ds.volume)} كجم حجم</p>
      </div>

      <div className="stack">
        {day.entries.map((e) => (
          <EntryCard key={e.id} entry={e} di={dayIdx} A={A}
            machine={data.exercises.find((x) => x.id === e.exId)?.machine} prevMax={seriesCache[e.exId]} />
        ))}
        {day.entries.length === 0 && (
          <div className="card empty">
            <p>لا توجد تمارين في هذا اليوم. يمكنك تركه يوم راحة أو إضافة تمارين من قائمة الأجهزة.</p>
          </div>
        )}
        <button type="button" className="btn btn-primary wide" onClick={() => setPicker(true)}><Icon name="plus" />إضافة تمرين</button>
      </div>

      {picker && (
        <ExercisePicker exercises={data.exercises} onClose={() => setPicker(false)}
          onGoGear={() => { setPicker(false); goGear(); }}
          onPick={(ex) => { A.addEntry(dayIdx, ex); setPicker(false); }} />
      )}
    </section>
  );
}

/* ---------- تبويب التقدم ---------- */

function Delta({ v, unit = '' }) {
  if (v === null || v === undefined) return <span className="flat">—</span>;
  if (Math.abs(v) < 0.001) return <span className="flat">0{unit}</span>;
  return <span className={v > 0 ? 'up' : 'down'} dir="ltr">{v > 0 ? '+' : '−'}{fmt(Math.abs(v))}{unit}</span>;
}

function ProgressTab({ data, weeks, week }) {
  const logged = useMemo(() => loggedExercises(data.weeks).sort((a, b) => b.weeks - a.weeks), [data.weeks]);
  const [sel, setSel] = useState(null);
  const [metric, setMetric] = useState('maxW');
  const selId = sel && logged.find((l) => l.exId === sel) ? sel : logged[0]?.exId;
  const cur = logged.find((l) => l.exId === selId);
  const series = useMemo(() => (selId ? exerciseSeries(data.weeks, selId) : []), [data.weeks, selId]);
  const points = series.map((s) => ({ x: String(s.n), y: metric === 'maxW' ? s.maxW : s.volume }));

  const [aId, setAId] = useState(null);
  const [bId, setBId] = useState(null);
  const defB = week.id;
  const defA = (weeks[weeks.findIndex((w) => w.id === week.id) - 1] || weeks[0]).id;
  const A = aId && weeks.find((w) => w.id === aId) ? aId : defA;
  const B = bId && weeks.find((w) => w.id === bId) ? bId : defB;
  const rows = useMemo(() => compareWeeks(data.weeks, A, B), [data.weeks, A, B]);

  const first = series[0], lastS = series[series.length - 1];
  const best = series.reduce((m, s) => Math.max(m, s.maxW), 0);

  return (
    <section aria-label="التقدم">
      <h2 className="sec">تطور تمرين</h2>
      {logged.length === 0 ? (
        <div className="card empty"><p>لا يوجد سجل بعد. علّم المجموعات بعلامة ✓ في تبويب الأسبوع لتظهر هنا.</p></div>
      ) : (
        <>
          <label className="field" htmlFor="prog-ex">
            <span>اختر التمرين</span>
            <select id="prog-ex" className="inp" value={selId} onChange={(e) => setSel(e.target.value)}>
              {MUSCLES.filter((m) => logged.some((l) => l.muscle === m)).map((m) => (
                <optgroup key={m} label={m}>
                  {logged.filter((l) => l.muscle === m).map((l) => <option key={l.exId} value={l.exId}>{l.name}</option>)}
                </optgroup>
              ))}
              {logged.filter((l) => !MUSCLES.includes(l.muscle)).map((l) => <option key={l.exId} value={l.exId}>{l.name}</option>)}
            </select>
          </label>
          <div className="seg" role="group" aria-label="المقياس">
            <button type="button" className={metric === 'maxW' ? 'on' : ''} onClick={() => setMetric('maxW')}>أعلى وزن (كجم)</button>
            <button type="button" className={metric === 'vol' ? 'on' : ''} onClick={() => setMetric('vol')}>الحجم الكلي (كجم)</button>
          </div>
          <div className="card chart-card">
            <div className="chart-head">
              <b className="disp">{cur?.name}</b>
              <span className="muted small">المحور الأفقي: رقم الأسبوع</span>
            </div>
            {points.length > 0 && (
              <LineChart points={points} label={`تطور ${cur?.name} عبر الأسابيع`} />
            )}
          </div>
          <div className="kpis">
            <div className="kpi"><small>أول وزن</small><b>{first ? fmt(first.maxW) : '—'}</b></div>
            <div className="kpi"><small>آخر وزن</small><b>{lastS ? fmt(lastS.maxW) : '—'}</b></div>
            <div className="kpi"><small>أفضل وزن</small><b>{fmt(best)}</b></div>
          </div>
          <div className="card scroll">
            <table className="tbl">
              <thead><tr><th scope="col">الأسبوع</th><th scope="col">أعلى وزن</th><th scope="col">التكرار</th><th scope="col">الحجم</th><th scope="col">التغيّر</th></tr></thead>
              <tbody>
                {series.map((s, i) => (
                  <tr key={s.weekId}>
                    <th scope="row">{s.n}</th>
                    <td className="n">{fmt(s.maxW)}</td>
                    <td className="n">{fmt(s.bestReps)}</td>
                    <td className="n">{fmtVol(s.volume)}</td>
                    <td className="n"><Delta v={i ? s.maxW - series[i - 1].maxW : null} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 className="sec">مقارنة أسبوعين</h2>
      <div className="two">
        <label className="field tight" htmlFor="cmp-a">
          <span>من</span>
          <select id="cmp-a" className="inp" value={A} onChange={(e) => setAId(e.target.value)}>
            {weeks.map((w) => <option key={w.id} value={w.id}>الأسبوع {w.n} ({fmtDate(w.startDate)})</option>)}
          </select>
        </label>
        <label className="field tight" htmlFor="cmp-b">
          <span>إلى</span>
          <select id="cmp-b" className="inp" value={B} onChange={(e) => setBId(e.target.value)}>
            {weeks.map((w) => <option key={w.id} value={w.id}>الأسبوع {w.n} ({fmtDate(w.startDate)})</option>)}
          </select>
        </label>
      </div>
      <div className="card scroll">
        {rows.length === 0 ? (
          <p className="muted small pad">لا توجد مجموعات منجزة في هذين الأسبوعين.</p>
        ) : (
          <table className="tbl">
            <thead><tr><th scope="col">التمرين</th><th scope="col">من</th><th scope="col">إلى</th><th scope="col">الفرق</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.exId}>
                  <th scope="row" className="name-col">{r.name}</th>
                  <td className="n">{r.a ? fmt(r.a.maxW) : '—'}</td>
                  <td className="n">{r.b ? fmt(r.b.maxW) : '—'}</td>
                  <td className="n"><Delta v={r.delta} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

/* ---------- تبويب الأجهزة والتمارين ---------- */

function ExerciseSheet({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '');
  const [muscle, setMuscle] = useState(initial?.muscle || MUSCLES[0]);
  const [machine, setMachine] = useState(initial?.machine || '');
  const ok = name.trim().length > 0;
  return (
    <Sheet title={initial ? 'تعديل التمرين' : 'تمرين أو جهاز جديد'} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); if (ok) onSave({ name: name.trim(), muscle, machine: machine.trim() }); }}>
        <label className="field" htmlFor="ex-name"><span>اسم التمرين</span>
          <input id="ex-name" className="inp" value={name} autoFocus placeholder="مثال: بنش بريس" onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field" htmlFor="ex-muscle"><span>العضلة</span>
          <select id="ex-muscle" className="inp" value={muscle} onChange={(e) => setMuscle(e.target.value)}>
            {MUSCLES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label className="field" htmlFor="ex-machine"><span>الجهاز أو الأداة</span>
          <input id="ex-machine" className="inp" dir="auto" value={machine} placeholder="مثال: Smith Machine" onChange={(e) => setMachine(e.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary wide" disabled={!ok}>حفظ</button>
      </form>
    </Sheet>
  );
}

function GearTab({ data, A }) {
  const [q, setQ] = useState('');
  const [m, setM] = useState('الكل');
  const [form, setForm] = useState(null); // null | {} | exercise
  const list = data.exercises.filter(
    (e) => (m === 'الكل' || e.muscle === m) && (e.name + ' ' + e.machine).toLowerCase().includes(q.trim().toLowerCase())
  );
  const groups = [...MUSCLES, ...new Set(list.map((e) => e.muscle).filter((x) => !MUSCLES.includes(x)))]
    .map((g) => [g, list.filter((e) => e.muscle === g)]).filter(([, l]) => l.length);
  return (
    <section aria-label="الأجهزة والتمارين">
      <div className="row-between">
        <h2 className="sec nomargin">أجهزة الجيم</h2>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setForm({})}><Icon name="plus" size={16} />تمرين جديد</button>
      </div>
      <label className="search" htmlFor="gear-q">
        <Icon name="search" size={18} />
        <input id="gear-q" className="bare" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم التمرين أو الجهاز" />
      </label>
      <div className="chips" role="group" aria-label="تصفية حسب العضلة">
        {['الكل', ...MUSCLES].map((x) => (
          <button key={x} type="button" className={`chip-btn ${m === x ? 'on' : ''}`} onClick={() => setM(x)}>{x}</button>
        ))}
      </div>
      {groups.map(([g, l]) => (
        <div key={g} className="group">
          <h3 className="group-title">{g} <span className="muted small">({l.length})</span></h3>
          <ul className="plain stack">
            {l.map((e) => (
              <li key={e.id} className="card gear">
                <div className="min0">
                  <b>{e.name}</b>
                  <div className="muted small"><bdi>{e.machine || 'بدون جهاز محدد'}</bdi></div>
                </div>
                <div className="gear-actions">
                  <button type="button" className="icon-btn" aria-label={`تعديل ${e.name}`} onClick={() => setForm(e)}><Icon name="edit" /></button>
                  <ConfirmButton label="" ariaLabel={`حذف ${e.name}`} confirmLabel="تأكيد الحذف" onConfirm={() => A.deleteExercise(e.id)} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {groups.length === 0 && <div className="card empty"><p>لا توجد نتائج مطابقة.</p></div>}
      <p className="muted small">حذف تمرين من هذه القائمة لا يمسح سجلاتك السابقة في الأسابيع.</p>
      {form && (
        <ExerciseSheet initial={form.id ? form : null} onClose={() => setForm(null)}
          onSave={(v) => { if (form.id) A.updateExercise(form.id, v); else A.addExercise(v); setForm(null); }} />
      )}
    </section>
  );
}

/* ---------- تبويب السجل والنسخ الاحتياطي ---------- */

function HistoryTab({ data, weeks, A, openWeek }) {
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const copy = async () => {
    const t = buildBackup(data);
    try {
      await navigator.clipboard.writeText(t);
      setMsg('تم نسخ النسخة الاحتياطية. الصقها في ملاحظات أو رسالة لنفسك.');
    } catch (e) {
      setText(t);
      setMsg('تعذّر النسخ التلقائي. النص ظهر في الصندوق أدناه، حدده وانسخه يدويًا.');
    }
  };
  const restore = () => {
    if (A.restore(text)) { setMsg('تمت استعادة البيانات.'); setText(''); } else setMsg('النص غير صالح. تأكد أنك نسخت النسخة الاحتياطية كاملة.');
  };
  return (
    <section aria-label="سجل الأسابيع">
      <button type="button" className="btn btn-primary wide big" onClick={A.newWeek}>
        <Icon name="plus" />أسبوع جديد
      </button>
      <p className="muted small center-text">يبدأ الأسبوع الجديد بنفس التمارين وآخر الأوزان، وتبقى الأسابيع السابقة محفوظة.</p>
      <h2 className="sec">الأسابيع السابقة</h2>
      <ul className="plain stack">
        {[...weeks].reverse().map((w) => {
          const s = weekStats(w);
          const on = w.id === data.activeWeekId;
          return (
            <li key={w.id} className={`card hist ${on ? 'cur' : ''}`}>
              <button type="button" className="hist-main" onClick={() => openWeek(w.id)}>
                <b className="disp">الأسبوع {w.n}</b>
                <span className="muted small">{weekRange(w)}</span>
                <span className="small">{s.done}/{s.sets} مجموعة · {fmtVol(s.volume)} كجم</span>
              </button>
              <ConfirmButton label="" ariaLabel={`حذف الأسبوع ${w.n}`} confirmLabel="تأكيد الحذف" disabled={weeks.length <= 1} onConfirm={() => A.deleteWeek(w.id)} />
            </li>
          );
        })}
      </ul>

      <h2 className="sec">النسخ الاحتياطي</h2>
      <div className="card stack">
        <p className="muted small nomargin">البيانات تُحفظ تلقائيًا على هذا الجهاز. انسخ نسخة احتياطية قبل مسح بيانات المتصفح أو حذف التطبيق.</p>
        <button type="button" className="btn wide" onClick={copy}><Icon name="copy" />نسخ النسخة الاحتياطية</button>
        <label className="field tight" htmlFor="restore-box"><span>استعادة من نسخة احتياطية</span>
          <textarea id="restore-box" className="inp area" dir="ltr" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="الصق النص هنا" />
        </label>
        <button type="button" className="btn wide" disabled={!text.trim()} onClick={restore}>استعادة</button>
        {msg && <p className="notice" role="status">{msg}</p>}
        <ConfirmButton label="مسح كل البيانات والبدء من الصفر" confirmLabel="اضغط للتأكيد: سيتم المسح" className="wide" onConfirm={A.reset} />
      </div>
    </section>
  );
}

/* ---------- التطبيق ---------- */

const TABS = [
  ['week', 'الأسبوع', 'week'],
  ['progress', 'التقدم', 'chart'],
  ['gear', 'الأجهزة', 'gear'],
  ['history', 'السجل', 'clock'],
];

export default function App() {
  const [data, setData] = useState(() => load() || demoState());
  const [tab, setTab] = useState('week');
  const today = useMemo(() => new Date(), []);
  const todayIdx = dayIndexOf(today);
  const [dayIdx, setDayIdx] = useState(todayIdx);
  const [saved, setSaved] = useState(true);
  const [toast, setToast] = useState('');
  const tRef = useRef(null);

  useEffect(() => { setSaved(save(data)); }, [data]);
  useEffect(() => () => clearTimeout(tRef.current), []);

  const say = (m) => {
    setToast(m);
    clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setToast(''), 2400);
  };

  const weeks = useMemo(() => [...data.weeks].sort((a, b) => a.n - b.n), [data.weeks]);
  const week = weeks.find((w) => w.id === data.activeWeekId) || weeks[weeks.length - 1];
  const isCurrentCalendarWeek = iso(addDays(today, -todayIdx)) === week.startDate;

  const mapWeek = (d, id, f) => ({ ...d, weeks: d.weeks.map((w) => (w.id === id ? f(w) : w)) });
  const mapDay = (d, di, f) => mapWeek(d, week.id, (w) => ({ ...w, days: w.days.map((x, i) => (i === di ? f(x) : x)) }));
  const mapEntry = (d, di, eid, f) => mapDay(d, di, (x) => ({ ...x, entries: x.entries.map((e) => (e.id === eid ? f(e) : e)) }));

  const A = {
    selectWeek: (id) => setData((d) => ({ ...d, activeWeekId: id })),
    setSet: (di, eid, si, patch) =>
      setData((d) => mapEntry(d, di, eid, (e) => ({ ...e, sets: e.sets.map((s, i) => (i === si ? { ...s, ...patch } : s)) }))),
    addSet: (di, eid) =>
      setData((d) => mapEntry(d, di, eid, (e) => {
        const l = e.sets[e.sets.length - 1] || { w: '', r: '10' };
        return { ...e, sets: [...e.sets, { w: l.w, r: l.r, done: false }] };
      })),
    removeSet: (di, eid) =>
      setData((d) => mapEntry(d, di, eid, (e) => (e.sets.length > 1 ? { ...e, sets: e.sets.slice(0, -1) } : e))),
    setNote: (di, eid, note) => setData((d) => mapEntry(d, di, eid, (e) => ({ ...e, note }))),
    removeEntry: (di, eid) => setData((d) => mapDay(d, di, (x) => ({ ...x, entries: x.entries.filter((e) => e.id !== eid) }))),
    addEntry: (di, ex) =>
      setData((d) => mapDay(d, di, (x) => ({
        ...x,
        entries: [...x.entries, { id: uid(), exId: ex.id, name: ex.name, muscle: ex.muscle, note: '', sets: lastLoggedSets(d.weeks, ex.id) || blankSets() }],
      }))),
    setFocus: (di, focus) => setData((d) => mapDay(d, di, (x) => ({ ...x, focus }))),
    newWeek: () => {
      const last = weeks[weeks.length - 1];
      const w = newWeekFrom(last, last.n + 1, nextStart(weeks));
      setData((d) => ({ ...d, weeks: [...d.weeks, w], activeWeekId: w.id }));
      setTab('week');
      say(`تم إنشاء الأسبوع ${w.n}`);
    },
    deleteWeek: (id) => {
      if (weeks.length <= 1) return;
      setData((d) => {
        const rest = d.weeks.filter((w) => w.id !== id);
        const active = d.activeWeekId === id ? [...rest].sort((a, b) => a.n - b.n)[rest.length - 1].id : d.activeWeekId;
        return { ...d, weeks: rest, activeWeekId: active };
      });
      say('تم حذف الأسبوع');
    },
    addExercise: (ex) => { setData((d) => ({ ...d, exercises: [...d.exercises, { id: uid(), ...ex }] })); say('تمت إضافة التمرين'); },
    updateExercise: (id, patch) => {
      setData((d) => ({
        ...d,
        exercises: d.exercises.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        weeks: d.weeks.map((w) => ({
          ...w,
          days: w.days.map((dy) => ({
            ...dy,
            entries: dy.entries.map((e) => (e.exId === id ? { ...e, name: patch.name ?? e.name, muscle: patch.muscle ?? e.muscle } : e)),
          })),
        })),
      }));
      say('تم تعديل التمرين');
    },
    deleteExercise: (id) => { setData((d) => ({ ...d, exercises: d.exercises.filter((x) => x.id !== id) })); say('تم حذف التمرين'); },
    reset: () => { setData(freshState()); setDayIdx(todayIdx); setTab('week'); say('بدأت من الصفر'); },
    restore: (text) => {
      const d = parseBackup(text);
      if (!d) return false;
      setData(d);
      return true;
    },
  };

  return (
    <div className="app" dir="rtl" lang="ar">
      <header className="top">
        <div className="brand">
          <span className="logo" aria-hidden="true"><Icon name="gear" size={20} /></span>
          <div>
            <h1 dir="ltr">Mahmoud Gym Tracker</h1>
            <p className="muted small nomargin">متابعة تمارينك أسبوعًا بأسبوع</p>
          </div>
        </div>
        <span className={`save ${saved ? '' : 'bad'}`} role="status">{saved ? 'محفوظ' : 'غير محفوظ'}</span>
      </header>

      {data.demo && (
        <div className="banner" role="note">
          <p className="nomargin">هذه بيانات تجريبية لأربعة أسابيع لتجربة الرسم البياني والمقارنة.</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={A.reset}>ابدأ ببياناتي</button>
        </div>
      )}
      {!saved && (
        <div className="banner warn" role="alert">
          <p className="nomargin">المتصفح يمنع حفظ البيانات هنا. استخدم النسخ الاحتياطي من تبويب السجل.</p>
        </div>
      )}

      <main>
        {tab === 'week' && (
          <WeekTab data={data} weeks={weeks} week={week} dayIdx={dayIdx} setDayIdx={setDayIdx} A={A}
            goGear={() => setTab('gear')} todayIdx={todayIdx} isCurrentCalendarWeek={isCurrentCalendarWeek} />
        )}
        {tab === 'progress' && <ProgressTab data={data} weeks={weeks} week={week} />}
        {tab === 'gear' && <GearTab data={data} A={A} />}
        {tab === 'history' && <HistoryTab data={data} weeks={weeks} A={A} openWeek={(id) => { A.selectWeek(id); setTab('week'); }} />}
      </main>

      {toast && <div className="toast" role="status">{toast}</div>}

      <nav className="nav" aria-label="التنقل الرئيسي">
        <div className="nav-in">
          {TABS.map(([id, label, icon]) => (
            <button key={id} type="button" className={tab === id ? 'on' : ''} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>
              <Icon name={icon} size={22} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
