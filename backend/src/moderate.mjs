import { defaultStore } from "./store.mjs";

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ACTIONS = ["list", "approve", "reject", "delete"];

// Owner-only moderation. This function has NO HTTP route and no function URL: the only way to run
// it is the Lambda Invoke API, which AWS checks against the caller's IAM permissions
// (for example: aws lambda invoke ...). Events look like {"action":"approve","id":"<uuid>"}.
export function makeModerate({ store = defaultStore, now = () => new Date() } = {}) {
  return async (event) => {
    const { action, id } = event ?? {};
    if (!ACTIONS.includes(action)) return { ok: false, error: "unknown action", actions: ACTIONS };
    try {
      const db = await store();
      if (action === "list") {
        const pending = await db.listByStatus("pending", 100);
        return { ok: true, pending: pending.map(({ id, createdAt, rating, name, role, comment }) => ({ id, createdAt, rating, name, role, comment })) };
      }
      if (typeof id !== "string" || !ID.test(id)) return { ok: false, error: "id must be a review id (uuid)" };
      if (action === "approve") return { ok: await db.approve(id, now().toISOString()) };
      if (action === "reject") return { ok: await db.reject(id) }; // pending reviews only
      return { ok: await db.remove(id) }; // "delete": removes any review, e.g. a reviewer asked to be removed
    } catch (err) {
      console.error(JSON.stringify({ evt: "moderate_error", error: err?.name }));
      return { ok: false, error: "server_error" };
    }
  };
}

export const handler = makeModerate();
