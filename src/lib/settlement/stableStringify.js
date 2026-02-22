/**
 * Recursively sort object keys and stringify so the same data yields the same string.
 * Used for canonical settlement JSON before hashing.
 * Data source: built from group (getGroup), balances (computeBalances), minimizeTransactions (lib/balances.js).
 */
export function stableStringify(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : JSON.stringify(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    const items = value.map((v) => stableStringify(v));
    return "[" + items.join(",") + "]";
  }
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    const pairs = keys.map((k) => JSON.stringify(k) + ":" + stableStringify(value[k]));
    return "{" + pairs.join(",") + "}";
  }
  return JSON.stringify(value);
}
