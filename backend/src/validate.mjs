// Server-side validation. The limits match the form on the site (maxlength 40/60/500),
// but the browser is never trusted: this is the real check.
const LIMITS = { name: [1, 40], role: [0, 60], comment: [5, 500] };
// eslint-disable-next-line no-control-regex -- matching control characters is the purpose
const CONTROL_MULTILINE = /[\u0000-\u0008\u000B-\u001F\u007F]/; // everything except tab and newline
// eslint-disable-next-line no-control-regex -- matching control characters is the purpose
const CONTROL_SINGLE = /[\u0000-\u001F\u007F]/;

function text(value, field, multiline = false) {
  if (typeof value !== "string") return { error: "must be text" };
  const s = value.normalize("NFC").replace(/\r\n?/g, "\n").trim();
  if ((multiline ? CONTROL_MULTILINE : CONTROL_SINGLE).test(s)) return { error: "contains control characters" };
  const [min, max] = LIMITS[field];
  const length = [...s].length; // count characters, not UTF-16 units, so emoji count as one
  if (length < min) return { error: min === 1 ? "is required" : `needs at least ${min} characters` };
  if (length > max) return { error: `needs at most ${max} characters` };
  return { value: s };
}

// Returns { ok: true, value } with only the whitelisted fields, or { ok: false, errors }.
// HTML is not stripped here: the site escapes on output, and stored text stays what the person typed.
export function validateReview(input) {
  const errors = {};
  const value = {};

  const rating = typeof input.rating === "string" && /^[1-5]$/.test(input.rating) ? Number(input.rating) : input.rating;
  if (Number.isInteger(rating) && rating >= 1 && rating <= 5) value.rating = rating;
  else errors.rating = "must be a whole number from 1 to 5";

  const name = text(input.name, "name");
  if (name.error) errors.name = name.error; else value.name = name.value;

  const comment = text(input.comment, "comment", true);
  if (comment.error) errors.comment = comment.error; else value.comment = comment.value;

  if (input.role !== undefined && input.role !== null) {
    const role = text(input.role, "role");
    if (role.error) errors.role = role.error;
    else if (role.value) value.role = role.value;
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}
