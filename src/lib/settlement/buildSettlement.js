/**
 * Build canonical settlement JSON from existing group data.
 * Data source: getGroup() → group with members, expenses, expense_shares;
 * computeBalances(group) and minimizeTransactions(balances) from lib/balances.js.
 * All amounts in canonical JSON are integer cents (spec).
 */
import { computeBalances, minimizeTransactions } from "../balances";
import { stableStringify } from "./stableStringify";
import { hashSettlement } from "./hashSettlement";

const SCHEMA = "settlement.v1";
const DEFAULT_CURRENCY = "CAD";
// Deterministic timestamp so the same settlement data always hashes to the same value (for verify to match)
const CANONICAL_CREATED_AT = "1970-01-01T00:00:00.000Z";

/**
 * Normalize address to lowercase for consistent sorting and hashing.
 * @param {string} addr
 * @returns {string}
 */
function normalizeAddress(addr) {
  if (!addr || typeof addr !== "string") return "";
  const a = addr.trim();
  if (a.startsWith("0x")) return a.toLowerCase();
  return "0x" + a.toLowerCase();
}

/**
 * Build settlement JSON (canonical shape) from a loaded group.
 * Members must have wallet_address set; otherwise they are excluded from participants
 * and transfers involving them will be skipped (caller should ensure all have addresses for finalize).
 *
 * @param {object} group - result of getGroup() (groups.js)
 * @returns {{ json: object, canonicalString: string, settlementHash: `0x${string}`, totalCents: number, participantAddresses: string[] }}
 */
export function buildSettlement(group) {
  const balances = computeBalances(group);
  const transactions = minimizeTransactions(balances);

  const membersWithAddress = group.members.filter((m) => m.wallet_address && /^0x[a-fA-F0-9]{40}$/.test(String(m.wallet_address).trim()));
  const memberIdToAddress = Object.fromEntries(
    membersWithAddress.map((m) => [m.id, normalizeAddress(m.wallet_address)])
  );

  const participants = [...membersWithAddress]
    .map((m) => ({
      userId: m.id,
      address: normalizeAddress(m.wallet_address),
      displayName: m.name,
    }))
    .sort((a, b) => (a.address < b.address ? -1 : a.address > b.address ? 1 : 0));

  const transfers = transactions
    .filter((t) => memberIdToAddress[t.from] && memberIdToAddress[t.to])
    .map((t) => ({
      from: memberIdToAddress[t.from],
      to: memberIdToAddress[t.to],
      amountCents: Math.round(Number(t.amount) * 100),
    }))
    .filter((t) => t.amountCents > 0)
    .sort((a, b) => {
      const fromCmp = a.from.localeCompare(b.from);
      if (fromCmp !== 0) return fromCmp;
      return a.to.localeCompare(b.to);
    });

  const totalCents = transfers.reduce((sum, t) => sum + t.amountCents, 0);

  const settlementJson = {
    schema: SCHEMA,
    group: {
      id: String(group.id),
      name: String(group.name),
    },
    currency: group.currency || DEFAULT_CURRENCY,
    participants,
    transfers,
    totals: { totalCents },
    createdAt: CANONICAL_CREATED_AT,
  };

  const canonicalString = stableStringify(settlementJson);
  const settlementHash = hashSettlement(canonicalString);
  const participantAddresses = participants.map((p) => p.address);

  return {
    json: settlementJson,
    canonicalString,
    settlementHash,
    totalCents,
    participantAddresses,
  };
}
