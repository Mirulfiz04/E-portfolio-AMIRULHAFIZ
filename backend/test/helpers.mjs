// In-memory stand-in for the DynamoDB store, same interface as src/store.mjs.
export function memStore() {
  const items = new Map();
  let visits = 0;
  const withStatus = (s) => [...items.values()].filter((i) => i.status === s);
  return {
    items,
    async putReview(item) { items.set(item.id, { ...item }); },
    async countByStatus(status, limit) { return Math.min(withStatus(status).length, limit); },
    async listByStatus(status, limit) { return withStatus(status).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit); },
    async approve(id) {
      const i = items.get(id);
      if (!i || i.status !== "pending") return false;
      i.status = "approved"; delete i.expiresAt; return true;
    },
    async reject(id) {
      const i = items.get(id);
      if (!i || i.status !== "pending") return false;
      return items.delete(id);
    },
    async remove(id) { return items.delete(id); },
    async incrementVisits() { return ++visits; },
    async getVisits() { return visits; },
  };
}

export const ORIGIN = "https://mirulfiz04.github.io";
export const env = { ALLOWED_ORIGIN: ORIGIN, MAX_PENDING: "3" };
export const GOOD = { rating: 5, name: "Aina", role: "Recruiter", comment: "Clear, tidy projects." };

export function post(body, { origin = ORIGIN, type = "application/json", raw } = {}) {
  const headers = { "content-type": type };
  if (origin) headers.origin = origin;
  return { headers, body: raw ?? JSON.stringify(body), isBase64Encoded: false };
}

// Silence and capture console output so tests can check what would be logged.
export function captureLogs(fn) {
  const lines = [];
  const { log, error } = console;
  console.log = console.error = (...a) => lines.push(a.join(" "));
  return Promise.resolve(fn()).finally(() => { console.log = log; console.error = error; }).then((r) => ({ result: r, logs: lines.join("\n") }));
}
