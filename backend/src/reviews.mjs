import { randomUUID } from "node:crypto";
import { json, originOk, readJson } from "./http.mjs";
import { validateReview } from "./validate.mjs";
import { defaultStore } from "./store.mjs";

export const PENDING_TTL_DAYS = 30; // retention rule: a review nobody approves is deleted after 30 days

// POST /reviews: store a review as "pending". It is never public until the owner approves it.
export function makeCreate({ store = defaultStore, now = Date.now, uuid = randomUUID, env = process.env } = {}) {
  return async (event) => {
    if (!originOk(event, env.ALLOWED_ORIGIN)) return json(403, { error: "forbidden_origin" });
    const body = readJson(event);
    if (!body.ok) return json(body.status, { error: body.error });
    // Honeypot: the form has a hidden field only bots fill in. Pretend it worked, store nothing.
    if (typeof body.value._gotcha === "string" && body.value._gotcha !== "") return json(202, { status: "pending" });
    const checked = validateReview(body.value);
    if (!checked.ok) return json(400, { error: "invalid", fields: checked.errors });

    try {
      const db = await store();
      const max = Number(env.MAX_PENDING) || 200;
      // Cap on unmoderated reviews, so a spammer cannot grow the table without limit.
      if ((await db.countByStatus("pending", max)) >= max) return json(503, { error: "busy" }, { "retry-after": "3600" });
      const t = now();
      await db.putReview({
        id: uuid(),
        status: "pending",
        createdAt: new Date(t).toISOString(),
        expiresAt: Math.floor(t / 1000) + PENDING_TTL_DAYS * 86400, // DynamoDB TTL attribute (epoch seconds)
        ...checked.value,
      });
      console.log(JSON.stringify({ evt: "review_pending" })); // never log the body: it holds a name and free text
      return json(202, { status: "pending" });
    } catch (err) {
      console.error(JSON.stringify({ evt: "review_error", error: err?.name })); // error name only, messages can echo data
      return json(500, { error: "server_error" });
    }
  };
}

// GET /reviews: approved reviews only, newest first, in the same shape as the site's reviews.json.
export function makeList({ store = defaultStore } = {}) {
  return async () => {
    try {
      const items = await (await store()).listByStatus("approved", 100);
      const reviews = items.map((r) => ({
        name: r.name,
        ...(r.role ? { role: r.role } : {}),
        rating: r.rating,
        comment: r.comment,
        date: String(r.createdAt).slice(0, 10),
      })); // explicit whitelist: id and status never leave the API
      return json(200, reviews, { "cache-control": "public, max-age=60" });
    } catch (err) {
      console.error(JSON.stringify({ evt: "list_error", error: err?.name }));
      return json(500, { error: "server_error" });
    }
  };
}

export const create = makeCreate();
export const list = makeList();
