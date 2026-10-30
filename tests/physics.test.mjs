// Characterisation tests for the flight model in index.html.
//
// These record what the model computes today (Oct 2026, commit 76c0a53). They are a regression net, not a statement
// that the numbers are right: if you deliberately retune the model, update the expected values in the same commit and
// say so in the message. If one fails and you did not mean to change the physics, something else broke it.
//
// Run: npm run test:physics   (node --test, no browser needed)
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './lib/extract.mjs';

const sim = load(
  ['V3', 'Q', 'D2R', 'KT', 'clamp', 'sstep', 'lerp', 'G', 'TYPES', 'T', 'ac', 'liftCoef', 'engine', 'sos', 'approach', 'hash2', 'vnoise', 'TC_PIVOT', 'sweepState'],
  // the loop right after TYPES that derives each type's gear springs, stall angle and reference dynamic pressure
  { alsoMatch: [/^for \(const t of Object\.values\(TYPES\)\) \{\s*const \[mx, my, mz\] = t\.mainL/] }
);
const IDS = ['j3', 'c180', 'c130', 'f14', 'brick'];
const near = (actual, expected, tol, msg) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${msg}: expected ${expected} ± ${tol}, got ${actual}`);
const use = id => { sim.T = sim.TYPES[id]; sim.ac.onGround = false; sim.ac.rev = 0; return sim.T; };

describe('aircraft table', () => {
  test('all five aircraft are defined', () => {
    assert.deepEqual(Object.keys(sim.TYPES), IDS);
  });

  test('derived stall angle of attack (rad) and reference dynamic pressure (Pa)', () => {
    const want = {
      j3: [0.258333, 551.25], c180: [0.255319, 980], c130: [0.29, 3001.25], f14: [0.340909, 2749.513], brick: [0.388889, 2508.8],
    };
    for (const id of IDS) {
      near(sim.TYPES[id].stallA, want[id][0], 1e-6, `${id} stallA`);
      near(sim.TYPES[id].qRef, want[id][1], 1e-3, `${id} qRef`);
    }
  });

  test('gear: three wheels each, spring rates (N/m) from the static load split', () => {
    const want = {
      j3: [27478, 27478, 10259], c180: [56386, 56386, 23629], c130: [791668, 791668, 277130],
      f14: [315694, 315694, 128445], brick: [188506, 188506, 86559],
    };
    for (const id of IDS) {
      const w = sim.TYPES[id].wheels;
      assert.equal(w.length, 3, `${id} wheel count`);
      assert.deepEqual(Array.from(w, x => Math.round(x.k)), want[id], `${id} spring rates`);
      const total = w.reduce((s, x) => s + x.m, 0);
      near(total, sim.TYPES[id].mass, 1e-6, `${id} wheel masses sum to the aircraft mass`);
    }
  });

  test('taildraggers get a tailwheel from the three-point attitude; nosewheel types do not', () => {
    near(sim.TYPES.j3.tailP[1], -0.149015, 1e-6, 'J-3 tailwheel height');
    near(sim.TYPES.c180.tailP[1], -0.069977, 1e-6, '180 tailwheel height');
    for (const id of ['c130', 'f14', 'brick']) assert.equal(sim.TYPES[id].tailP, undefined, `${id} has no tailwheel`);
  });
});

describe('lift curve', () => {
  test('linear range: CL = cl0 + k·α', () => {
    for (const id of IDS) {
      const t = use(id);
      near(sim.liftCoef(0, t.flaps[0]), t.cl0, 1e-12, `${id} CL at α=0`);
      near(sim.liftCoef(0.1, t.flaps[0]), t.cl0 + t.k * 0.1, 1e-12, `${id} CL at α=0.1`);
    }
  });

  test('peaks at clmax exactly at the stall angle, then falls away', () => {
    const post = { j3: 0.972016, c180: 0.928601, c130: 1.055933, f14: 1.026651, brick: 0.992022 };
    for (const id of IDS) {
      const t = use(id), f = t.flaps[0];
      near(sim.liftCoef(t.stallA, f), t.clmax, 1e-9, `${id} CL at stall`);
      near(sim.liftCoef(t.stallA + 0.1, f), post[id], 1e-6, `${id} CL 0.1 rad past stall`);
      assert.ok(sim.liftCoef(t.stallA + 0.1, f) < t.clmax, `${id} lift drops past the stall`);
    }
  });

  test('continuous across the stall break (no step in CL)', () => {
    for (const id of IDS) {
      const t = use(id), f = t.flaps[0], e = 1e-7;
      near(sim.liftCoef(t.stallA + e, f), sim.liftCoef(t.stallA - e, f), 1e-5, `${id} CL either side of stall`);
      near(sim.liftCoef(-0.2 - e, f), sim.liftCoef(-0.2 + e, f), 1e-5, `${id} CL either side of negative stall`);
    }
  });

  test('deep stall converges to a flat-plate 0.95·sin(2α) for every type', () => {
    for (const id of IDS) near(sim.liftCoef(0.8, use(id).flaps[0]), 0.949595, 1e-6, `${id} CL at α=0.8`);
  });

  test('flaps add lift: Cessna 180 at 40° flap, α=0.1', () => {
    const t = use('c180');
    near(sim.liftCoef(0.1, t.flaps[4]), 1.47, 1e-9, '180 full-flap CL');
  });
});

describe('engines (steady state, dt = 0)', () => {
  // [V m/s, altitude m, throttle] → thrust N
  const cases = [[0, 0, 1], [30, 0, 1], [60, 0, 1], [100, 3000, 1], [60, 0, 0]];
  const want = {
    j3: [1600, 800, 533.3, 264.6, -201.3],
    c180: [4000, 3372.1, 2159.8, 810.4, -462.9],
    c130: [159999.8, 155746.6, 134765.5, 79047.5, -17649.4],
    f14: [186000, 183382.6, 181343.3, 139726, 3667],
    brick: [128000, 126030.3, 124458.5, 95702.6, 2736],
  };
  for (const id of IDS) {
    test(`${id}: thrust at full power and idle`, () => {
      use(id);
      cases.forEach(([V, alt, thr], i) => near(sim.engine(V, alt, thr, 0), want[id][i], 0.1, `${id} thrust V=${V} alt=${alt} thr=${thr}`));
    });
  }

  test('full-power thrust falls with airspeed and with altitude', () => {
    for (const id of IDS) {
      use(id);
      assert.ok(sim.engine(30, 0, 1, 0) < sim.engine(0, 0, 1, 0), `${id} thrust falls with speed`);
      assert.ok(sim.engine(60, 3000, 1, 0) < sim.engine(60, 0, 1, 0), `${id} thrust falls with altitude`);
    }
  });

  test('speed of sound: 340.3 m/s at sea level, constant above 11 km', () => {
    near(sim.sos(0), 340.3, 1e-9, 'sea level');
    near(sim.sos(11000), 297.4, 1e-9, 'tropopause');
    assert.equal(sim.sos(20000), sim.sos(11000));
  });
});

describe('F-14 wing sweep', () => {
  test('sweep schedule sets lift slope, induced drag, max lift and span', () => {
    const t = use('f14');
    const want = { 20: [4.4, 0.055, 1.6, 0.340909, 19.54], 44: [3.65, 0.105, 1.45, 0.369863, 15.595], 68: [2.9, 0.155, 1.3, 0.413793, 11.65] };
    for (const s of [20, 44, 68]) {
      sim.ac.sweep = s; sim.sweepState(t);
      const [k, ki, clmax, stallA, span] = want[s];
      near(t.k, k, 1e-9, `k at ${s}°`); near(t.ki, ki, 1e-9, `ki at ${s}°`); near(t.clmax, clmax, 1e-9, `clmax at ${s}°`);
      near(t.stallA, stallA, 1e-6, `stallA at ${s}°`); near(t.span, span, 1e-9, `span at ${s}°`);
    }
    sim.ac.sweep = 20; sim.sweepState(t);   // leave the table as the page starts it
  });
});

describe('helpers', () => {
  test('approach() moves toward a target at a capped rate and never overshoots', () => {
    assert.equal(sim.approach(0, 10, 2, 1), 2);
    assert.equal(sim.approach(0, 1, 2, 1), 1);
    assert.equal(sim.approach(5, 0, 2, 1), 3);
  });

  test('terrain noise is deterministic (same world every load)', () => {
    near(sim.hash2(1, 2), 0.8830856902059168, 1e-15, 'hash2(1,2)');
    assert.equal(sim.hash2(0, 0), 0);
    near(sim.vnoise(1.5, 2.25), 0.7368101127831324, 1e-15, 'vnoise(1.5,2.25)');
  });
});
