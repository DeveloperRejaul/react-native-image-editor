import { clamp, containRect, coverScale, fitAspect } from '../dimensions';

describe('containRect', () => {
  it('fits a landscape image without stretching and centres it', () => {
    const r = containRect({ width: 400, height: 200 }, { width: 300, height: 300 });
    expect(r.width).toBe(300);
    expect(r.height).toBe(150);
    expect(r.x).toBe(0);
    expect(r.y).toBe(75);
    expect(r.width / r.height).toBeCloseTo(2); // aspect preserved
  });

  it('fits a portrait image inside a square', () => {
    const r = containRect({ width: 200, height: 400 }, { width: 300, height: 300 });
    expect(r.height).toBe(300);
    expect(r.width).toBe(150);
    expect(r.x).toBe(75);
  });

  it('falls back to the container for a degenerate size', () => {
    const r = containRect({ width: 0, height: 0 }, { width: 120, height: 90 });
    expect(r).toEqual({ x: 0, y: 0, width: 120, height: 90 });
  });
});

describe('coverScale', () => {
  it('returns the factor that fully covers the container', () => {
    expect(coverScale({ width: 100, height: 100 }, { width: 200, height: 400 })).toBe(4);
  });
});

describe('fitAspect', () => {
  it('returns a square inside a tall area, centred vertically', () => {
    const r = fitAspect({ width: 200, height: 500 }, 1);
    expect(r.width).toBe(200);
    expect(r.height).toBe(200);
    expect(r.y).toBe(150);
  });
});

describe('clamp', () => {
  it('bounds a value', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });
});
