import { afterEach, beforeEach, vi } from "vitest";

beforeEach(() => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.NANOBANANA_API_KEY;
  delete process.env.NANOBANANA_API_URL;
});

afterEach(() => {
  vi.restoreAllMocks();
});
