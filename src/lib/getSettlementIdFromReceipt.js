import { decodeEventLog } from "viem";
import { settlementLedgerAbi } from "../config/web3";

/**
 * Parse SettlementCommitted event from tx receipt to get settlementId.
 * @param {import('viem').TransactionReceipt} receipt
 * @returns {`0x${string}`|null}
 */
export function getSettlementIdFromReceipt(receipt) {
  if (!receipt?.logs) return null;
  for (const log of receipt.logs) {
    try {
      const d = decodeEventLog({
        abi: settlementLedgerAbi,
        data: log.data,
        topics: log.topics,
      });
      if (d.eventName === "SettlementCommitted" && d.args?.settlementId) {
        return d.args.settlementId;
      }
    } catch {
      // not our event
    }
  }
  return null;
}
