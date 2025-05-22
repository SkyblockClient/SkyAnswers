import { expect, test } from "bun:test";
import { getMods, getPacks } from "../src/lib/data.ts";

test("getMods", async () => {
  expect(await getMods());
});

test("getPacks", async () => {
  expect(await getPacks());
});
