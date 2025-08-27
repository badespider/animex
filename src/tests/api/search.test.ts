import { describe, it, expect } from "vitest";
import { GET as SearchGET } from "@/app/api/v1/search/route";

function makeReq(url: string) {
  return new Request(url);
}

describe("api/v1/search", () => {
  it("returns results for a basic query", async () => {
    const res = await SearchGET(makeReq("http://localhost/api/v1/search?q=naruto&page=1&limit=3"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.items)).toBe(true);
  }, 20000);
});

