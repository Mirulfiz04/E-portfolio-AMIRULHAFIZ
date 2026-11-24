import { json, originOk } from "./http.mjs";
import { defaultStore } from "./store.mjs";

// POST /visits: count one visit and return the total. The site calls it once per browser session.
export function makeHit({ store = defaultStore, env = process.env } = {}) {
  return async (event) => {
    if (!originOk(event, env.ALLOWED_ORIGIN)) return json(403, { error: "forbidden_origin" });
    try {
      return json(200, { visits: await (await store()).incrementVisits() });
    } catch (err) {
      console.error(JSON.stringify({ evt: "visit_error", error: err?.name }));
      return json(500, { error: "server_error" });
    }
  };
}

// GET /visits: the total, without counting.
export function makeGet({ store = defaultStore } = {}) {
  return async () => {
    try {
      return json(200, { visits: await (await store()).getVisits() }, { "cache-control": "public, max-age=30" });
    } catch (err) {
      console.error(JSON.stringify({ evt: "visit_error", error: err?.name }));
      return json(500, { error: "server_error" });
    }
  };
}

export const hit = makeHit();
export const get = makeGet();
