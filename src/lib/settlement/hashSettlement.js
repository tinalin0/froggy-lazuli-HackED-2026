/**
 * Hash canonical settlement JSON with keccak256.
 * settlementHash = keccak256(utf8Bytes(canonicalJsonString))
 */
import { keccak256 } from "viem";

/**
 * @param {string} canonicalJsonString - output of stableStringify(settlementJson)
 * @returns {`0x${string}`} 32-byte hex hash
 */
export function hashSettlement(canonicalJsonString) {
  const bytes = new TextEncoder().encode(canonicalJsonString);
  return keccak256(bytes);
}

/**
 * @param {string} groupId - app group id (e.g. UUID)
 * @returns {`0x${string}`} bytes32 for contract
 */
export function groupIdToBytes32(groupId) {
  const prefixed = "group:" + groupId;
  const bytes = new TextEncoder().encode(prefixed);
  return keccak256(bytes);
}
