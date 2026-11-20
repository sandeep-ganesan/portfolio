import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { currentLang } from '../store/locale';

/*
 * Clock window: a flat pixel scene of the Osaka riverside that follows the time in Japan.
 *
 * - Four flat colour sets (dawn, day, dusk, night) chosen by the JST hour
 * - The branch and ground follow the season
 * - The character has a prop for what it's probably doing at that hour; click it to poke it
 *
 * The cat is Sandeep's 32x32 drawing as a pixel grid (CAT). Each hour swaps in a set of
 * eyes and a mouth (EYES / MOUTHS) on top of it; the rest of the drawing never changes.
 * Props are small pixel grids too: one character per pixel, '.' is transparent.
 *
 * Dev only: preview other times/seasons with ?clockHour=21.5&clockMonth=4
 */

// ---------- Scene layout (design units; the scene is drawn at 2x) ----------

const W = 128;
const H = 72;
const SKYLINE_Y = 56;
const BANK_Y = 62;
const CHAR_SIZE = 16;          // the 32px drawing takes 16 design units
const CHAR_X = 52;
const CHAR_Y = BANK_Y - CHAR_SIZE;
const PROP_X = CHAR_X + CHAR_SIZE + 2;

// ---------- The cat (Sandeep's drawing, 32x32: # outline, w body, p blush) ----------

const CAT = [
  '................................',
  '......#.........................',
  '.....#w#...................#....',
  '....#ww#..................#w#...',
  '....#www#................#ww#...',
  '....#www#...............#wwww#..',
  '....#www#..............#wwwww#..',
  '...#wwwww#...###......#wwwwww#..',
  '...#wwwwww#..#ww##....#wwwwww#..',
  '...#wwwwwww#.#wwww#..#wwwwwww#..',
  '...#wwwwwwww#w#wwww#.#wwwwwww#..',
  '...#wwwwwww####wwwww#wwwwwwww#..',
  '...#wwwwwww#wwwwwwwwwwwwwwwww#..',
  '...#wwwwwwww####wwwwwwwwwwwww#..',
  '...#wwwwwwwwwwwwwwwwwwwwwwwww#..',
  '...#www#######wwww######wwwww#..',
  '....#ww#ww###wwwwww###w#wwww#...',
  '..####w#ww###wwwwww###w#www#....',
  '..#wwwwwww###wwwwww###wwww####..',
  '...#wwwwww###wwwwww###wwwwwww#..',
  '....#wwwww###wwwwww###wwwwww#...',
  '....#wpwpwwwww###wwwwwwpwpw#....',
  '...#wpwpwwwwwwwwwwwwwwpwpww#....',
  '...#wwwwwwww#ww#ww#wwwwwwwww#...',
  '...#####wwwww##w##wwwwwwwwww#...',
  '.......###wwwwwwwwwwwww######...',
  '.........####wwwwwwww##.........',
  '...........#wwwwwwww#...........',
  '...........#wwwwwwwww#..........',
  '...........#wwwwwwwwww#.........',
  '...........#wwwwwwwwwww#........',
  '...........#wwwwwwwwwww#........',
];

const CAT_PALETTE = { '#': '#2c2626', w: '#ffffff', p: '#e23878' };

// Eyes replace rows 14-20, columns 6-24 of the drawing
const EYES_AT = { row: 14, col: 6 };
const B = 'wwwwwwwwwwwwwwwwwww';
const EYES = {
  lidded: [B, 'w#######wwww######w', 'w#ww###wwwwww###w#w', 'w#ww###wwwwww###w#w', 'wwww###wwwwww###www', 'wwww###wwwwww###www', 'wwww###wwwwww###www'], // the original
  open:   [B, B, 'wwww###wwwwww###www', 'wwww###wwwwww###www', 'wwww###wwwwww###www', 'wwww###wwwwww###www', 'wwww###wwwwww###www'],
  closed: [B, B, B, 'ww######wwww######w', 'w#wwwwwwwwwwwwwww#w', B, B], // the original lids, shut
  happy:  [B, B, 'wwww###wwwwww###www', 'www#www#wwww#www#ww', 'www#www#wwww#www#ww', B, B],
  fired:  ['ww##wwwwwwwwwww##ww', 'wwww##wwwwwww##wwww', 'wwww###wwwwww###www', 'wwww###wwwwww###www', 'wwww###wwwwww###www', 'wwww###wwwwww###www', 'wwww###wwwwww###www'],
  squint: [B, B, 'www#wwwwwwwwwwww#ww', 'wwww#wwwwwwwwww#www', 'wwwww#wwwwwwww#wwww', 'wwww#wwwwwwwwww#www', 'www#wwwwwwwwwwww#ww'],
  shock:  [B, B, 'wwww###wwwwww###www', 'wwww###wwwwww###www', 'wwww###wwwwww###www', B, B],
};

// Mouths replace rows 21-25, columns 12-18 (the nose stays on the first row)
const MOUTH_AT = { row: 21, col: 12 };
const MOUTHS = {
  w:      ['ww###ww', 'wwwwwww', '#ww#ww#', 'w##w##w', 'wwwwwww'], // the original
  open:   ['ww###ww', 'wwwwwww', 'ww###ww', 'w#ppp#w', 'ww###ww'],
  tongue: ['ww###ww', 'wwwwwww', '#ww#ww#', 'w##p##w', 'wwwpwww'],
  smile:  ['ww###ww', 'wwwwwww', 'w#www#w', 'ww###ww', 'wwwwwww'],
};

function catRows(eyes, mouth) {
  const rows = [...CAT];
  const paste = (patch, { row, col }) => patch.forEach((line, i) => {
    rows[row + i] = rows[row + i].slice(0, col) + line + rows[row + i].slice(col + line.length);
  });
  paste(EYES[eyes], EYES_AT);
  paste(MOUTHS[mouth], MOUTH_AT);
  return rows;
}

// ---------- Flat colour sets ----------

const PHASES = {
  dawn:  { sky: '#f2c4a8', mountain: '#b3a3bd', far: '#9c90b0', near: '#6c6889', window: '#8b86a6', water: '#a9a3c6', shimmer: '#d8cfe6', stone: '#9a9098', lit: 0.15 },
  day:   { sky: '#9ccbe8', mountain: '#bdd3e3', far: '#a3b9cd', near: '#7a8ea6', window: '#9fb2c6', water: '#78acd2', shimmer: '#b5d6ec', stone: '#a39a90', lit: 0 },
  dusk:  { sky: '#ee9f7a', mountain: '#c48a8a', far: '#a3727f', near: '#5e4a66', window: '#7a6280', water: '#b27a8c', shimmer: '#e3b090', stone: '#7d6e72', lit: 0.25 },
  night: { sky: '#1f2547', mountain: '#2b3157', far: '#252b4c', near: '#171b33', window: '#171b33', water: '#1a2041', shimmer: '#c9a45f', stone: '#3b3a48', lit: 0.4 },
};

function getPhase(hour) {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'dusk';
  return 'night';
}

const SEASONS = {
  spring: { leaves: ['#f4c2c2', '#e8a5ac'], fall: ['#f4c2c2', '#ffe4e1'], ground: { day: '#9cc98a', night: '#3d5a4a' } },
  summer: { leaves: ['#7bb36b', '#5e9a55'], fall: null, ground: { day: '#7fb36b', night: '#34503f' } },
  autumn: { leaves: ['#e07a4f', '#f2a65a'], fall: ['#e07a4f', '#f2a65a'], ground: { day: '#b8955f', night: '#4a4038' } },
  winter: { leaves: null, fall: ['#ffffff'], ground: { day: '#e6edf2', night: '#59607a' } },
};

function getSeason(month) {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

// ---------- Props ----------

const PROP_PALETTE = {
  k: '#2c2626', w: '#ffffff', p: '#e23878', g: '#8f9ca6', d: '#3e464f', r: '#d97373',
  c: '#6b4f3f', x: '#b85450', o: '#f2a65a', e: '#7bb36b', y: '#f2c14e', z: '#f4ece6', n: '#8fb3d9',
};

const PROPS = {
  sleep: { y: CHAR_Y - 2, rows: ['zzzz..', '..z...', '.z....', 'zzzz..', '....zzz', '.....z.', '....zzz'] },
  coffee: { y: BANK_Y - 6, rows: ['kkkkk..', 'kccck..', 'krrrkkk', 'krrrk.k', 'krrrkkk', 'kkkkk..'] },
  coding: { y: BANK_Y - 8, rows: ['kkkkkkkkkkkk', 'kggggggggggk', 'kgggggpggggk', 'kggggpppgggk', 'kgggggpggggk', 'kggggggggggk', 'kkkkkkkkkkkk', 'kddddddddddk'] },
  lunch: { y: BANK_Y - 5, rows: ['xxxxxxxxxx', 'xwwwwxooex', 'xwwrwxoeex', 'xwwwwxeoox', 'xxxxxxxxxx'] },
  drawing: { y: BANK_Y - 7, rows: ['.k.k.k.k...', 'knnnnnnnk.y', 'knnnnnnnk.y', 'knnnnnnnk.y', 'knnnnnnnk.y', 'knnnnnnnk.o', 'kkkkkkkkk.k'] },
  gaming: { y: BANK_Y - 5, rows: ['.kkkkkk.', 'kdwdddrk', 'kwwwdrdk', 'kdwddddk', '.kk..kk.'] },
};

// face: expression for that hour; poked: expression while the bubble shows; bob: idle bob speed
const ACTIVITIES = {
  sleep:   { face: ['closed', 'w'],      poked: ['lidded', 'w'],  bob: '3s',
             bubble: { en: 'zzz... !?', ja: 'zzz… !?' }, label: { en: 'sleeping', ja: '寝ています' } },
  coffee:  { face: ['lidded', 'w'],      poked: ['lidded', 'w'],  bob: '2.4s',
             bubble: { en: "mornin'~", ja: 'おはよ〜' }, label: { en: 'having morning coffee', ja: '朝のコーヒー中です' } },
  coding:  { face: ['lidded', 'w'],      poked: ['lidded', 'w'],  bob: '1.2s',
             bubble: { en: 'hi!', ja: 'やっほー！' }, label: { en: 'coding', ja: 'コーディング中です' } },
  lunch:   { face: ['happy', 'w'],       poked: ['lidded', 'w'],  bob: '1.6s',
             bubble: { en: 'yum!', ja: 'おいしい〜' }, label: { en: 'eating lunch', ja: 'お昼ごはん中です' } },
  drawing: { face: ['lidded', 'tongue'], poked: ['lidded', 'w'],  bob: '2s',
             bubble: { en: '♪', ja: '♪' }, label: { en: 'drawing', ja: 'お絵描き中です' } },
  gaming:  { face: ['lidded', 'w'],      poked: ['lidded', 'w'],  bob: '0.6s',
             bubble: { en: 'gg!', ja: 'gg!' }, label: { en: 'gaming', ja: 'ゲーム中です' } },
};

const SPAM = { face: ['squint', 'w'], bubble: { en: 'hey~ that tickles!', ja: 'くすぐったい〜' } };

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(query.matches);
    const onChange = (e) => setReduce(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduce;
}

function getActivity(hour) {
  if (hour >= 23 || hour < 7) return 'sleep';
  if (hour < 9) return 'coffee';
  if (hour >= 12 && hour < 13) return 'lunch';
  if (hour < 17) return 'coding';
  if (hour < 19) return 'drawing';
  return 'gaming';
}

// ---------- City ----------

// Osaka Castle (S stone, W walls, G roofs, Y gold, k windows)
const CASTLE = [
  '......Y.Y......',
  '.....GGGGG.....',
  '....GGGGGGG....',
  '......WWW......',
  '....GGGGGGG....',
  '...GGGGGGGGG...',
  '.....WWWWW.....',
  '.....WkWkW.....',
  '...GGGGGGGGG...',
  '..GGGGGGGGGGG..',
  '....WWWWWWW....',
  '....WkWWWkW....',
  '.GGGGGGGGGGGGG.',
  '..SSSSSSSSSSS..',
  '.SSSSSSSSSSSSS.',
  'SSSSSSSSSSSSSSS',
];

// Tsutenkaku tower
const TSUTENKAKU = [
  '....T....', '....T....', '...TTT...', '..TTTTT..', '..TTTTT..', '...TTT...', '...TTT...',
  '...TTT...', '...TTT...', '..TTTTT..', '.TTTTTTT.', '.TTTTTTT.', '.TTTTTTT.', '..TTTTT..',
  '...TTT...', '...TTT...', '...TTT...', '..TTTTT..', '..T...T..', '.TT...TT.', '.T.....T.',
  'TT.....TT', 'T.......T',
];

// Simple seeded random so the city stays the same between renders
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
const hash = (x, y) => (((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000 / 1000;

const rand = seeded(7);
for (let i = 0; i < 44; i++) rand(); // skip the numbers the old stars used, so the city layout stays the same
const MOUNTAINS = Array.from({ length: W }, (_, x) =>
  Math.round(46 - 4 * Math.sin(x / 13) - 2 * Math.sin(x / 5 + 1) - 2 * Math.sin(x / 29 + 2))
);
const FAR_BUILDINGS = [];
for (let x = 0; x < W;) {
  const w = 4 + Math.floor(rand() * 6);
  FAR_BUILDINGS.push({ x, w, top: 40 + Math.floor(rand() * 10) });
  x += w;
}
// Falling petals / leaves / snow
const PARTICLES = Array.from({ length: 12 }, () => ({
  x: Math.floor(rand() * W),
  duration: 18 + rand() * 12,
  delay: -rand() * 30,
}));
const SHIMMER = Array.from({ length: 14 }, () => ({
  x: Math.floor(rand() * (W - 4)),
  y: SKYLINE_Y + 1 + Math.floor(rand() * 4),
  w: 2 + Math.floor(rand() * 3),
}));

// [x, width, top]
const NEAR_BUILDINGS = [
  [21, 6, 47], [36, 4, 42], [40, 4, 34], [46, 4, 34], [51, 5, 44], [56, 7, 48], [63, 6, 42],
  [69, 8, 46], [77, 6, 40], [92, 5, 45], [97, 10, 38], [97, 8, 30], [97, 6, 24],
  [108, 7, 42], [115, 6, 47], [121, 7, 38],
];

// The branch in the top-right corner
const BRANCH_WOOD = [];
for (let i = 0; i <= 23; i++) {
  BRANCH_WOOD.push([127 - i, 3 + Math.round((i * 7) / 23)]);
  if (i < 8) BRANCH_WOOD.push([127 - i, 4 + Math.round((i * 7) / 23)]);
}
for (let j = 0; j <= 7; j++) BRANCH_WOOD.push([115 - j, 6 - Math.round((j * 4) / 7)]);
for (let j = 0; j <= 4; j++) BRANCH_WOOD.push([110 - j, 8 + j]);
const BRANCH_CLUSTERS = [[104, 10], [108, 2], [106, 13], [112, 9], [118, 5], [121, 8], [110, 4], [124, 2]];

// ---------- Time ----------

const formatters = {};

// Hour/minute/month in a time zone (undefined = the visitor's own browser time zone)
function getTimeIn(date, timeZone) {
  const key = timeZone || 'local';
  formatters[key] ||= new Intl.DateTimeFormat('en-US', {
    timeZone, month: 'numeric', hour: 'numeric', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short',
  });
  const parts = Object.fromEntries(formatters[key].formatToParts(date).map((p) => [p.type, p.value]));
  return { month: Number(parts.month), hour: Number(parts.hour) % 24, minute: parts.minute, zone: parts.timeZoneName };
}

function formatTime(jst, lang) {
  const isPM = jst.hour >= 12;
  const hour12 = jst.hour % 12 || 12;
  if (lang === 'ja') return `${isPM ? '午後' : '午前'}${hour12}時${jst.minute}分`;
  return `${String(hour12).padStart(2, '0')}:${jst.minute} ${isPM ? 'PM' : 'AM'}`;
}

// ---------- Pixel helpers ----------

// Turns a text grid into <rect>s, merging horizontal runs of the same colour
function PixelGrid({ rows, x = 0, y = 0, palette }) {
  const rects = [];
  rows.forEach((row, ry) => {
    let start = 0;
    for (let i = 1; i <= row.length; i++) {
      if (i === row.length || row[i] !== row[start]) {
        const ch = row[start];
        if (ch !== '.' && palette[ch]) {
          rects.push(<rect key={`${ry}-${start}`} x={x + start} y={y + ry} width={i - start} height={1} fill={palette[ch]} />);
        }
        start = i;
      }
    }
  });
  return <>{rects}</>;
}

function Building({ x, w, top, colors }) {
  const windows = [];
  for (let wy = top + 2; wy < SKYLINE_Y - 1; wy += 3) {
    for (let wx = x + 1; wx < x + w - 1; wx += 2) {
      const lit = hash(wx, wy) < colors.lit;
      const fill = lit ? '#f2c97a' : colors.window;
      if (fill !== colors.near) windows.push(<rect key={`${wx}-${wy}`} x={wx} y={wy} width={1} height={1} fill={fill} />);
    }
  }
  return (
    <>
      <rect x={x} y={top} width={w} height={SKYLINE_Y - top} fill={colors.near} />
      {windows}
    </>
  );
}

// ---------- Component ----------

export default function ClockWindow() {
  const lang = useStore(currentLang);
  const reduceMotion = usePrefersReducedMotion();
  const [now, setNow] = useState(() => new Date());
  const [bubble, setBubble] = useState(null); // { id, text, face }
  const bubbleTimer = useRef(null);
  const pokes = useRef([]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearInterval(id);
      clearTimeout(bubbleTimer.current);
    };
  }, []);

  // Dev only: shift the clock so JST reads ?clockHour (IST and local time shift with it)
  let shown = now;
  let monthOverride = null;
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.has('clockHour')) {
      const real = getTimeIn(now, 'Asia/Tokyo');
      const target = Math.round((Number(params.get('clockHour')) % 24) * 60);
      const delta = (((target - (real.hour * 60 + Number(real.minute))) % 1440) + 1440) % 1440;
      shown = new Date(now.getTime() + delta * 60000);
    }
    if (params.has('clockMonth')) monthOverride = Number(params.get('clockMonth'));
  }

  const jst = getTimeIn(shown, 'Asia/Tokyo');
  if (monthOverride) jst.month = monthOverride;
  const ist = getTimeIn(shown, 'Asia/Kolkata');
  const local = getTimeIn(shown);

  const phase = getPhase(jst.hour);
  const colors = PHASES[phase];
  const isNight = phase === 'night';
  const season = getSeason(jst.month);
  const { leaves, fall, ground } = SEASONS[season];
  const activityKey = getActivity(jst.hour);
  const activity = ACTIVITIES[activityKey];
  const prop = PROPS[activityKey];
  const timeText = formatTime(jst, lang);
  const anim = (value) => (reduceMotion ? undefined : value);

  const castlePalette = isNight
    ? { S: '#3b3a48', W: '#b8b2c9', G: '#2f4f55', Y: '#f2c14e', k: '#2c2626' }
    : { S: '#8a8580', W: '#f4ece6', G: '#5e9a8a', Y: '#f2c14e', k: '#2c2626' };

  const poke = () => {
    const t = Date.now();
    pokes.current = [...pokes.current.filter((p) => t - p < 3000), t];
    const spam = pokes.current.length >= 5;
    setBubble({
      id: t,
      text: spam ? SPAM.bubble[lang] : activity.bubble[lang],
      face: spam ? SPAM.face : activity.poked,
    });
    clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), 1600);
  };

  const charLabel = lang === 'en'
    ? `Sandeep is ${activity.label.en}. Click to poke!`
    : `サンディープは${activity.label.ja}。クリックしてつついてね！`;

  return (
    <div className="relative w-full pointer-events-auto select-none">
      <svg viewBox={`0 0 ${W * 2} ${H * 2}`} className="block w-full h-auto" shapeRendering="crispEdges" aria-hidden="true">
        <g transform="scale(2)">
          <rect x={0} y={0} width={W} height={SKYLINE_Y} fill={colors.sky} />


          {MOUNTAINS.map((top, x) => (
            <rect key={x} x={x} y={top} width={1} height={SKYLINE_Y - top} fill={colors.mountain} />
          ))}

          {FAR_BUILDINGS.map((b, i) => (
            <rect key={i} x={b.x} y={b.top} width={b.w} height={SKYLINE_Y - b.top} fill={colors.far} />
          ))}

          <PixelGrid rows={CASTLE} x={4} y={SKYLINE_Y - CASTLE.length} palette={castlePalette} />

          {NEAR_BUILDINGS.map(([x, w, top], i) => (
            <Building key={i} x={x} w={w} top={top} colors={colors} />
          ))}
          {/* Umeda Sky Building's top bridge */}
          <rect x={40} y={32} width={10} height={3} fill={colors.near} />
          <rect x={44} y={33} width={2} height={1} fill={colors.sky} />

          <PixelGrid rows={TSUTENKAKU} x={84} y={SKYLINE_Y - TSUTENKAKU.length} palette={{ T: colors.near }} />

          {/* Branch */}
          {BRANCH_WOOD.map(([x, y], i) => (
            <rect key={`w${i}`} x={x} y={y} width={1} height={1} fill={isNight ? '#3b2f2a' : '#6b4f3f'} />
          ))}
          {leaves && BRANCH_CLUSTERS.map(([x, y], i) => (
            <g key={`c${i}`} fill={leaves[i % leaves.length]}>
              <rect x={x} y={y - 1} width={1} height={3} />
              <rect x={x - 1} y={y} width={3} height={1} />
            </g>
          ))}

          {/* River */}
          <rect x={0} y={SKYLINE_Y} width={W} height={BANK_Y - SKYLINE_Y} fill={colors.water} />
          {SHIMMER.map((s, i) => (
            <rect key={i} x={s.x} y={s.y} width={s.w} height={1} fill={colors.shimmer} />
          ))}

          {/* Riverbank */}
          <rect x={0} y={BANK_Y} width={W} height={2} fill={colors.stone} />
          <rect x={0} y={BANK_Y + 2} width={W} height={H - BANK_Y - 2} fill={isNight ? ground.night : ground.day} />

          {/* What the character is up to (the zzz floats while asleep) */}
          <g style={{ animation: anim(activityKey === 'sleep' ? 'clockFloat 3s ease-out infinite' : undefined) }}>
            <PixelGrid rows={prop.rows} x={PROP_X} y={prop.y} palette={PROP_PALETTE} />
          </g>
        </g>

        {/* The cat, at its native 32px (re-keyed on each poke so the hop restarts) */}
        <g key={bubble ? bubble.id : 'idle'}
          style={{ animation: anim(bubble ? 'clockHop 0.5s ease-out' : `clockBob ${activity.bob} ease-in-out infinite`) }}>
          <PixelGrid rows={catRows(...(bubble ? bubble.face : activity.face))} x={CHAR_X * 2} y={CHAR_Y * 2} palette={CAT_PALETTE} />
        </g>

        {/* Falling petals / leaves / snow (none in summer, or with reduce motion on) */}
        {fall && !reduceMotion && (
          <g transform="scale(2)">
            {PARTICLES.map((p, i) => (
              <rect key={i} x={p.x} y={0} width={1} height={1} fill={fall[i % fall.length]}
                style={{ animation: `clockFall ${p.duration}s linear ${p.delay}s infinite` }} />
            ))}
          </g>
        )}
      </svg>

      <style>{`
        @keyframes clockBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1px); } }
        @keyframes clockHop {
          0% { transform: translateY(0); } 35% { transform: translateY(-8px); }
          70% { transform: translateY(0); } 85% { transform: translateY(-2px); } 100% { transform: translateY(0); }
        }
        @keyframes clockFloat {
          0% { transform: translate(0, 0); opacity: 0; } 25% { opacity: 1; }
          100% { transform: translate(2px, -6px); opacity: 0; }
        }
        @keyframes clockFall {
          0% { transform: translate(0, -2px); } 50% { transform: translate(5px, 37px); }
          100% { transform: translate(-6px, 76px); }
        }
      `}</style>

      {/* The time, over the sky: JST big, then IST and the visitor's own time */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-[5%] flex flex-col items-center font-bold text-[#f4ece6] whitespace-nowrap pointer-events-none"
        style={{ textShadow: '3px 3px 0 #2c2626' }}
      >
        <span className="text-3xl md:text-5xl tracking-widest">{timeText}</span>
        <span className="mt-1 text-xs md:text-base tracking-wider" style={{ textShadow: '2px 2px 0 #2c2626' }}>
          IST {formatTime(ist, lang)}
        </span>
        <span className="text-xs md:text-base tracking-wider" style={{ textShadow: '2px 2px 0 #2c2626' }}>
          {local.zone} {formatTime(local, lang)}
        </span>
      </div>

      {/* Invisible button over the character so it can be clicked or reached with Tab */}
      <button
        type="button"
        onClick={poke}
        aria-label={charLabel}
        className="absolute bg-transparent cursor-pointer focus:outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#d97373]"
        style={{
          left: `${(CHAR_X / W) * 100}%`,
          top: `${(CHAR_Y / H) * 100}%`,
          width: `${(CHAR_SIZE / W) * 100}%`,
          height: `${(CHAR_SIZE / H) * 100}%`,
        }}
      />

      {bubble && (
        <div
          className="absolute pointer-events-none bg-white border-2 border-[#2c2626] text-[#2c2626] text-sm md:text-base font-bold px-2 py-0.5 whitespace-nowrap"
          style={{
            left: `${((CHAR_X + CHAR_SIZE / 2) / W) * 100}%`,
            top: `${((CHAR_Y - 1) / H) * 100}%`,
            transform: 'translate(-50%, -100%)',
          }}
          aria-live="polite"
        >
          {bubble.text}
        </div>
      )}
    </div>
  );
}
