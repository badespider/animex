import { describe, it, expect } from "vitest";
import { GET as TrendingGET } from "@/app/api/v1/list/trending/route";

function req(url: string) {
  return new Request(url);
}

describe("api/v1/list/trending", () => {
  it("returns trending items", async () => {
    const res = await TrendingGET(req("http://localhost/api/v1/list/trending?page=1&limit=3"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.items)).toBe(true);
  }, 20000);
});

