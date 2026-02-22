/**
 * Web3 config for Polygon Amoy testnet.
 * After deploy: set VITE_SETTLEMENT_LEDGER_ADDRESS in .env (see README).
 */
import ledgerAbi from "../abi/SettlementLedger.json";

const AMOY_CHAIN_ID = 80002;
const AMOY_EXPLORER = "https://amoy.polygonscan.com";

export const chainId = AMOY_CHAIN_ID;
export const explorerUrl = AMOY_EXPLORER;
export const settlementLedgerAddress =
  import.meta.env?.VITE_SETTLEMENT_LEDGER_ADDRESS || "";
export const settlementLedgerAbi = ledgerAbi?.abi ?? ledgerAbi ?? [];
