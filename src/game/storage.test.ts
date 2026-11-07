import { expect, test } from "vitest";
import { readBest, writeBest } from "@/game/storage";

const throwing = {
  getItem: () => { throw new Error("blocked"); },
  setItem: () => { throw new Error("blocked"); },
} as unknown as Storage;

const memory = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) } as unknown as Storage;
};

test("blocked storage reads as 0 and writes without throwing", () => {
  expect(readBest(throwing)).toBe(0);
  expect(() => writeBest(12, throwing)).not.toThrow();
});

test("a non-number stored value reads as 0", () => {
  const s = memory();
  s.setItem("an-game-best", "lots");
  expect(readBest(s)).toBe(0);
});

test("best score round-trips under its key", () => {
  const s = memory();
  writeBest(42, s);
  expect(s.getItem("an-game-best")).toBe("42");
  expect(readBest(s)).toBe(42);
});

test("no storage at all reads as 0", () => {
  expect(readBest(undefined)).toBe(0);
});
