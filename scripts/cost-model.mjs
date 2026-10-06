// 이어봄 월 운영 비용 계산 (원).
// 가격은 2026-10-06 각 회사 공식 페이지 기준이고, 사용량은 아래 ASSUME의 가정이다.
// 가정이나 가격이 바뀌면 이 파일만 고치고 다시 실행해 docs/dev-plan.md의 표를 맞춘다.
//
//   pnpm cost                                  규모별 표 (마크다운)
//   pnpm cost pairs=5000 calls=6 call=agora    한 가지 경우만 (키=값으로 가정 덮어쓰기)

import { fileURLToPath } from 'node:url';

const USD = 1400; // 1달러 = 1,400원 (가정)

const PRICE = {
  agora: { perK: 0.59, free: 10000 }, // 1,000 참가자·분당 달러, 매달 무료 분 (가격 페이지)
  agora_high: { perK: 0.99, free: 10000 }, // 같은 회사 문서에 적힌 값
  livekit_cloud: {
    freeMin: 5000, // Build: 무료
    ship: { base: 50, incl: 150000, perMin: 0.0005, perGB: 0.12 },
    scale: { base: 500, incl: 1500000, perMin: 0.0004, perGB: 0.1 },
  },
  // 같은 공개 서버(LiveKit)를 국내 클라우드에 직접 띄울 때 (가정: 4코어 서버 한 대 월 $140, 트래픽 GB당 $0.12, 한 대에 동시 500명)
  livekit_self: { vm: 140, perGB: 0.12, perNode: 500 },
  cloudflare_sfu: { freeGB: 1000, perGB: 0.05 }, // 직접 구현해야 함
  clova: { unitSec: 15, unitKRW: 4 }, // 단문 인식, 60초까지
  rtzr: [ [1000, 1000], [10000, 500], [25000, 400], [Infinity, 300] ], // [월 시간 상한, 시간당 원]
  gemini: { inPerM: 0.3, outPerM: 2.5, audioTokPerSec: 32 }, // 3.5 Flash-Lite 유료 등급
  supabase: { base: 25, mauIncl: 100000, mauPer: 0.00325, storIncl: 100, storPer: 0.0213, egIncl: 250, egPer: 0.09 },
  appleYear: 99,
};

// 1쌍(자녀 1명 + 부모님 1명)이 한 달에 쓰는 양 (가정)
const ASSUME = {
  pairs: 1000,
  price: 9900, // 1쌍 월 매출 (D8에서 조사하는 가격)
  calls: 8, // 이어진 통화 수
  minPerCall: 15,
  eveningShare: 0.4, // 통화가 저녁 2시간에 몰리는 비율 (자체 서버 대수 계산용)
  mbPerMin: 0.24, // 음성 32kbps, 참가자 1명이 1분 동안 받는 양
  shortN: 8, shortSec: 12, // 짧은 녹음 (메모·근황, 15초 이하)
  longN: 4, longSec: 40, // 긴 녹음 (말로 답하기, 60초 이하)
  fallback: 0.3, // 기기 내장 말→글이 안 되는 휴대폰 비율
  aiCalls: 18, aiIn: 700, aiOut: 200,
  photos: 13, photo: 'small', months: 12, // 사진: 'small'(줄여 올림) | 'original'
  call: 'auto', stt: 'clova',
};

const PHOTO = { small: { storMB: 0.225, egMB: 0.55 }, original: { storMB: 4.0, egMB: 12 } };

export function callUSD(vendor, a) {
  const m = a.pairs * a.calls * a.minPerCall * 2; // 참가자·분
  const gb = (m * a.mbPerMin) / 1024;
  if (vendor === 'agora' || vendor === 'agora_high') {
    const p = PRICE[vendor];
    return (Math.max(0, m - p.free) / 1000) * p.perK;
  }
  if (vendor === 'livekit_cloud') {
    const p = PRICE.livekit_cloud;
    if (m <= p.freeMin) return 0;
    const plan = (q) => q.base + Math.max(0, m - q.incl) * q.perMin + gb * q.perGB;
    return Math.min(plan(p.ship), plan(p.scale));
  }
  if (vendor === 'livekit_self') {
    const p = PRICE.livekit_self;
    const peak = ((a.pairs * a.calls) / 30) * a.eveningShare * (a.minPerCall / 120) * 2;
    return Math.max(1, Math.ceil(peak / p.perNode)) * p.vm + gb * p.perGB;
  }
  if (vendor === 'cloudflare_sfu') return Math.max(0, gb - PRICE.cloudflare_sfu.freeGB) * PRICE.cloudflare_sfu.perGB;
  if (vendor === 'auto') return Math.min(callUSD('livekit_cloud', a), callUSD('livekit_self', a));
  throw new Error(`모르는 통화 방식: ${vendor}`);
}

export function sttKRW(a) {
  const units = (n, s) => n * Math.ceil(s / PRICE.clova.unitSec);
  const clova = a.pairs * (units(a.shortN, a.shortSec) + units(a.longN, a.longSec)) * PRICE.clova.unitKRW;
  const hours = (a.pairs * (a.shortN * a.shortSec + a.longN * a.longSec)) / 3600;
  if (a.stt === 'clova') return clova;
  if (a.stt === 'rtzr') {
    let left = hours, prev = 0, krw = 0;
    for (const [cap, rate] of PRICE.rtzr) { const h = Math.min(left, cap - prev); krw += h * rate; left -= h; prev = cap; if (left <= 0) break; }
    return krw;
  }
  if (a.stt === 'gemini_audio') {
    const tokIn = hours * 3600 * PRICE.gemini.audioTokPerSec;
    const tokOut = a.pairs * (a.shortN + a.longN) * 80;
    return ((tokIn * PRICE.gemini.inPerM + tokOut * PRICE.gemini.outPerM) / 1e6) * USD;
  }
  if (a.stt === 'device') return clova * a.fallback;
  throw new Error(`모르는 말→글 방식: ${a.stt}`);
}

// 서버 성능 단계 (가정): Pro에 포함된 Micro로 시작해 쌍 수에 따라 올림
const computeUSD = (pairs) => (pairs <= 5000 ? 0 : pairs <= 30000 ? 5 : pairs <= 100000 ? 50 : 100);

export function cost(over = {}) {
  const a = { ...ASSUME, ...over };
  const s = PRICE.supabase, ph = PHOTO[a.photo];
  const storGB = (a.pairs * a.photos * ph.storMB * a.months) / 1024;
  const egGB = (a.pairs * a.photos * ph.egMB) / 1024;
  const r = {
    call: callUSD(a.call, a) * USD,
    stt: sttKRW(a),
    ai: ((a.pairs * a.aiCalls * (a.aiIn * PRICE.gemini.inPerM + a.aiOut * PRICE.gemini.outPerM)) / 1e6) * USD,
    server:
      (s.base + computeUSD(a.pairs) + Math.max(0, a.pairs * 2 - s.mauIncl) * s.mauPer +
        Math.max(0, storGB - s.storIncl) * s.storPer + Math.max(0, egGB - s.egIncl) * s.egPer) * USD,
    fixed: (PRICE.appleYear / 12) * USD,
  };
  r.total = r.call + r.stt + r.ai + r.server + r.fixed;
  r.perPair = r.total / a.pairs;
  r.revenuePct = (r.total / (a.pairs * a.price)) * 100;
  return r;
}

// 비교할 두 구성
export const NAIVE = { call: 'agora', stt: 'clova', aiCalls: 45, aiIn: 1500, aiOut: 300, photo: 'original' };
export const PLAN = (pairs) => ({ call: 'auto', stt: pairs >= 10000 ? 'device' : 'clova', aiCalls: 18, aiIn: 700, aiOut: 200, photo: 'small' });

const won = (n) => `${Math.round(n).toLocaleString('ko-KR')}`;
const man = (n) => (n >= 10000 ? `${(n / 10000).toLocaleString('ko-KR', { maximumFractionDigits: n >= 1e6 ? 0 : 1 })}만` : won(n));

function main() {
  const args = Object.fromEntries(process.argv.slice(2).map((kv) => kv.split('=')).map(([k, v]) => [k, isNaN(+v) ? v : +v]));
  if (Object.keys(args).length) {
    const r = cost(args);
    console.log({ ...Object.fromEntries(Object.entries(r).map(([k, v]) => [k, k === 'revenuePct' ? v.toFixed(2) + '%' : won(v)])) });
    return;
  }
  const rows = [];
  rows.push('| 쌍 수 | 구성 | 통화 | 말→글 | AI | 서버·저장 | 고정 | **합계/월** | 1쌍당 | 매출 대비 |');
  rows.push('|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const pairs of [20, 1000, 10000, 100000]) {
    for (const [name, cfg] of [['손대지 않음', NAIVE], ['이 계획대로', PLAN(pairs)]]) {
      const r = cost({ pairs, ...cfg });
      rows.push(`| ${won(pairs)} | ${name} | ${man(r.call)} | ${man(r.stt)} | ${man(r.ai)} | ${man(r.server)} | ${man(r.fixed)} | **${man(r.total)}** | ${won(r.perPair)} | ${r.revenuePct.toFixed(1)}% |`);
    }
  }
  console.log('## 규모별 월 비용 (원)\n\n' + rows.join('\n'));

  const v = ['agora', 'agora_high', 'livekit_cloud', 'livekit_self', 'cloudflare_sfu'];
  console.log('\n## 통화 방식별 월 비용 (원)\n\n| 쌍 수 | ' + v.join(' | ') + ' |\n|---:|' + v.map(() => '---:').join('|') + '|');
  for (const pairs of [20, 1000, 10000, 100000]) console.log(`| ${won(pairs)} | ` + v.map((x) => man(callUSD(x, { ...ASSUME, pairs }) * USD)).join(' | ') + ' |');

  const st = ['clova', 'rtzr', 'gemini_audio', 'device'];
  console.log('\n## 말→글 방식별 1쌍당 월 비용 (원)\n\n| ' + st.join(' | ') + ' |\n|' + st.map(() => '---:').join('|') + '|');
  console.log('| ' + st.map((x) => sttKRW({ ...ASSUME, pairs: 1, stt: x }).toFixed(1)).join(' | ') + ' |');

  const ai = (c, i, o) => ((c * (i * PRICE.gemini.inPerM + o * PRICE.gemini.outPerM)) / 1e6) * USD;
  console.log(`\n## AI 1쌍당 월 비용 (원)\n\n손대지 않음 ${ai(45, 1500, 300).toFixed(1)} / 이 계획대로 ${ai(18, 700, 200).toFixed(1)}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
