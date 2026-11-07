import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import api, { onAuthFailure } from "./apiClient";

type Call = { method?: string; url?: string; auth?: string; body?: unknown };

/** Fake API at the HTTP boundary: valid access token = "fresh". */
function fakeApi(
  refresh: (body: { refresh: string }) => number | "network" = () => 200,
) {
  const calls: Call[] = [];
  const respond = (
    config: InternalAxiosRequestConfig,
    status: number,
    data: unknown,
  ) => {
    const response: AxiosResponse = {
      status,
      statusText: String(status),
      data,
      headers: {},
      config,
    };
    if (status >= 400) {
      return Promise.reject(
        new AxiosError("fail", undefined, config, null, response),
      );
    }
    return Promise.resolve(response);
  };
  const adapter: AxiosAdapter = (config) => {
    const auth = AxiosHeaders.from(config.headers).get("Authorization");
    const body = config.data ? JSON.parse(config.data) : undefined;
    calls.push({
      method: config.method,
      url: config.url,
      auth: auth ? String(auth) : undefined,
      body,
    });
    if (config.url === "/auth/refresh/") {
      const status = refresh(body);
      if (status === "network") {
        return Promise.reject(new AxiosError("Network Error", "ERR_NETWORK"));
      }
      return respond(config, status, status === 200 ? { access: "fresh" } : {});
    }
    if (auth === "Bearer fresh") return respond(config, 200, { ok: true });
    return respond(config, 401, { detail: "Token is invalid or expired" });
  };
  api.defaults.adapter = adapter;
  return calls;
}

describe("apiClient", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("access_token", "expired");
    localStorage.setItem("refresh_token", "r1");
  });

  it("refreshes an expired access token and replays the request", async () => {
    const calls = fakeApi();

    const response = await api.get("/restaurants/");

    expect(response.data).toEqual({ ok: true });
    expect(localStorage.getItem("access_token")).toBe("fresh");
    expect(calls).toEqual([
      { method: "get", url: "/restaurants/", auth: "Bearer expired" },
      // No Authorization header: DRF rejects an expired Bearer even on AllowAny.
      { method: "post", url: "/auth/refresh/", body: { refresh: "r1" } },
      { method: "get", url: "/restaurants/", auth: "Bearer fresh" },
    ]);
  });

  it("refreshes once for requests that expire together", async () => {
    const calls = fakeApi();

    const responses = await Promise.all([
      api.get("/restaurants/"),
      api.get("/restaurants/r1/recipes/"),
      api.get("/restaurants/r1/ingredients/"),
    ]);

    expect(responses.map((r) => r.data)).toEqual([
      { ok: true },
      { ok: true },
      { ok: true },
    ]);
    expect(calls.filter((c) => c.url === "/auth/refresh/")).toHaveLength(1);
  });

  it("reports an expired session once and lets the requests fail", async () => {
    const calls = fakeApi(() => 401);
    const failures = vi.fn();
    onAuthFailure(failures);

    const results = await Promise.allSettled([
      api.post("/sync/", { id: "s1" }),
      api.get("/restaurants/"),
    ]);

    expect(results.map((r) => r.status)).toEqual(["rejected", "rejected"]);
    expect(failures).toHaveBeenCalledTimes(1);
    expect(calls.filter((c) => c.url === "/auth/refresh/")).toHaveLength(1);
  });

  it("keeps the session when the refresh fails on the network", async () => {
    fakeApi(() => "network");
    const failures = vi.fn();
    onAuthFailure(failures);

    await expect(api.get("/restaurants/")).rejects.toThrow("Network Error");

    expect(failures).not.toHaveBeenCalled();
    expect(localStorage.getItem("refresh_token")).toBe("r1");
  });
});
