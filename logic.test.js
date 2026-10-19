import { describe, it, expect, beforeEach } from 'vitest';
import {
  freshState, demoState, newWeekFrom, nextStart, exerciseSeries, compareWeeks, normNum, niceScale,
  load, save, parseBackup, buildBackup, lastLoggedSets, weekStats, STORAGE_KEY,
} from '../src/logic.js';

beforeEach(() => localStorage.clear());

describe('بنية البيانات', () => {
  it('الأسبوع يحتوي 7 أيام والمكتبة مصنفة حسب العضلات', () => {
    const s = freshState(new Date(2026, 9, 19));
    expect(s.weeks).toHaveLength(1);
    expect(s.weeks[0].days).toHaveLength(7);
    expect(s.weeks[0].startDate).toBe('2026-10-17'); // آخر سبت قبل الاثنين 19 أكتوبر 2026
    expect(new Set(s.exercises.map((e) => e.muscle)).size).toBeGreaterThanOrEqual(8);
  });

  it('الأسبوع الجديد ينسخ الأوزان ويُصفّر علامات الإنجاز', () => {
    const s = demoState(new Date(2026, 9, 19));
    const last = s.weeks[3];
    const next = newWeekFrom(last, 5, nextStart(s.weeks));
    expect(next.n).toBe(5);
    expect(next.startDate).toBe('2026-10-24');
    const a = last.days[0].entries[0], b = next.days[0].entries[0];
    expect(b.sets.map((x) => x.w)).toEqual(a.sets.map((x) => x.w));
    expect(b.sets.every((x) => x.done === false)).toBe(true);
    expect(b.id).not.toBe(a.id);
    expect(weekStats(next).done).toBe(0);
  });
});

describe('الإحصائيات والمقارنة', () => {
  it('التطور يزيد عبر الأسابيع التجريبية', () => {
    const s = demoState(new Date(2026, 9, 19));
    const series = exerciseSeries(s.weeks, 'e1'); // بنش بريس بار
    // الأسبوع 3 فيه تراجع بسيط مقصود في البيانات التجريبية ليبدو الرسم واقعيًا
    expect(series.map((x) => x.maxW)).toEqual([50, 52.5, 52.5, 57.5]);
    expect(series[3].maxW).toBeGreaterThan(series[0].maxW);
  });

  it('تُحتسب المجموعات المعلّمة فقط', () => {
    const s = freshState(new Date(2026, 9, 19));
    const e = s.weeks[0].days[0].entries[0];
    e.sets[0] = { w: '80', r: '5', done: true };
    e.sets[1] = { w: '100', r: '5', done: false };
    const r = exerciseSeries(s.weeks, e.exId)[0];
    expect(r.maxW).toBe(80);
    expect(r.sets).toBe(1);
    expect(r.volume).toBe(400);
  });

  it('مقارنة أسبوعين تُرجع الفرق', () => {
    const s = demoState(new Date(2026, 9, 19));
    const rows = compareWeeks(s.weeks, 'w1', 'w3');
    const bench = rows.find((r) => r.exId === 'e1');
    expect(bench.delta).toBe(bench.b.maxW - bench.a.maxW);
    expect(bench.delta).toBeGreaterThan(0);
  });

  it('آخر أوزان مسجلة تُستخدم لتعبئة التمرين المضاف', () => {
    const s = demoState(new Date(2026, 9, 19));
    const sets = lastLoggedSets(s.weeks, 'e1');
    expect(sets).toHaveLength(3);
    expect(sets.every((x) => x.done === false && Number(x.w) > 0)).toBe(true);
  });
});

describe('أدوات الأرقام', () => {
  it('تحويل الأرقام العربية والفاصلة', () => {
    expect(normNum('٦٢٫٥')).toBe('62.5');
    expect(normNum('62,5kg')).toBe('62.5');
    expect(normNum('1.2.3')).toBe('1.23');
  });
  it('مقياس الرسم يغطي القيم', () => {
    const sc = niceScale(50, 57.5, 4);
    expect(sc.lo).toBeLessThanOrEqual(50);
    expect(sc.hi).toBeGreaterThanOrEqual(57.5);
    expect(niceScale(60, 60).ticks.length).toBeGreaterThan(1);
  });
});

describe('الحفظ الدائم', () => {
  it('الحفظ ثم التحميل يعيد نفس البيانات', () => {
    const s = demoState(new Date(2026, 9, 19));
    expect(save(s)).toBe(true);
    expect(load()).toEqual(s);
  });
  it('بيانات تالفة تُتجاهل', () => {
    localStorage.setItem(STORAGE_KEY, '{oops');
    expect(load()).toBeNull();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ weeks: [] }));
    expect(load()).toBeNull();
  });
  it('النسخة الاحتياطية تُستعاد', () => {
    const s = demoState(new Date(2026, 9, 19));
    expect(parseBackup(buildBackup(s))).toEqual(s);
    expect(parseBackup('نص عشوائي')).toBeNull();
  });
});
