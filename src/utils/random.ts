import seedRandom from 'seedrandom';

let currentRandom: () => number;

export function setSeed(seed?: string) {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.randomSeed = seed;
  }

  currentRandom = seedRandom(seed);
}

export function value(): number {
  if (!currentRandom) {
    setSeed();
  }

  return currentRandom();
}

export function chance(chance = 0.5) {
  return value() < chance;
}

export function range(min: number, max: number) {
  return min + value() * (max - min);
}

export function floorRange(min: number, max: number) {
  return Math.floor(range(min, max));
}

export function roundRange(min: number, max: number) {
  return Math.round(range(min, max));
}

export function pick(ary: any[]) {
  return ary[floorRange(0, ary.length)];
}

export function shuffle(ary: any[], inPlace = true) {
  if (!inPlace) {
    ary = ary.slice();
  }

  for (let i = ary.length - 1; i > 0; i--) {
    const swap = floorRange(0, i + 1);
    // @TODO apparently destructuring this causes performance problems?
    const tmp = ary[i];
    ary[i] = ary[swap];
    ary[swap] = tmp;
  }

  return ary;
}

// Lazy guassian approximation
export function irwinHall(n = 12) {
  let total = 0;

  for (let i = 0; i < n; i++) {
    total += range(-0.5, 0.5);
  }

  return total;
}

export function string(len = 8) {
  let randString = '';
  do {
    randString += (value() * 1e16).toString(36);
  } while (randString.length < len);

  return randString.slice(len);
}
