import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowRight, Loader2, Wallet, AlertCircle } from "lucide-react";
import { useAccount, useConnect, useSwitchChain, useWriteContract } from "wagmi";
import { createPublicClient, http } from "viem";
import { polygonAmoy } from "wagmi/chains";
import { useGroup } from "../hooks/useGroup";
import { buildSettlement } from "../lib/settlement/buildSettlement";
import { groupIdToBytes32 } from "../lib/settlement/hashSettlement";
import { settlementLedgerAddress, settlementLedgerAbi, chainId, explorerUrl } from "../config/web3";
import { saveSettlementRecord } from "../lib/settlementsDb";
import { getSettlementIdFromReceipt } from "../lib/getSettlementIdFromReceipt";
import Avatar from "../components/Avatar";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

export default function Finalize() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { group, loading, error, reload, settlements, memberMap } = useGroup(id);
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const [committing, setCommitting] = useState(false);
  const [txError, setTxError] = useState(null);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;
  if (!group) return null;

  const buildResult = (() => {
    try {
      return buildSettlement(group);
    } catch {
      return null;
    }
  })();

  const missingWallet = group.members.filter(
    (m) => !m.wallet_address || !/^0x[a-fA-F0-9]{40}$/.test(String(m.wallet_address).trim())
  );
  const hasAllWallets = missingWallet.length === 0;
  const hasTransfers = buildResult?.json?.transfers?.length > 0;
  const canCommit =
    settlementLedgerAddress &&
    hasAllWallets &&
    buildResult &&
    hasTransfers;

  const handleCommit = async () => {
    if (!canCommit || !buildResult) return;
    setTxError(null);
    if (!isConnected || !address) {
      const connector = connectors[0];
      if (!connector) {
        setTxError("No wallet found. Install MetaMask and refresh.");
        return;
      }
      try {
        await connect({ connector });
        setTxError("Wallet connected. Click the button again to commit.");
      } catch (e) {
        setTxError(e?.message || "Could not connect. Open MetaMask and try again.");
      }
      return;
    }
    setCommitting(true);
    try {
      if (chainId !== 80002) {
        try {
          await switchChainAsync({ chainId: 80002 });
        } catch (e) {
          setTxError("Please switch to Polygon Amoy in MetaMask.");
          setCommitting(false);
          return;
        }
      }

      const groupIdBytes = groupIdToBytes32(group.id);
      const txHash = await writeContractAsync({
        address: settlementLedgerAddress,
        abi: settlementLedgerAbi,
        functionName: "commitSettlement",
        args: [
          groupIdBytes,
          buildResult.settlementHash,
          buildResult.json.currency || "CAD",
          BigInt(buildResult.totalCents),
          buildResult.participantAddresses,
        ],
      });

      const publicClient = createPublicClient({
        chain: polygonAmoy,
        transport: http("https://rpc-amoy.polygon.technology"),
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      const settlementId = getSettlementIdFromReceipt(receipt);

      if (settlementId) {
        try {
          await saveSettlementRecord({
            groupId: group.id,
            settlementId,
            txHash,
            settlementHash: buildResult.settlementHash,
            committedBy: address,
          });
        } catch {
          // DB may not have group_settlements table yet; still go to proof
        }
        navigate(`/groups/${id}/settlements/${settlementId}`, { replace: true });
      } else {
        navigate(`/groups/${id}/settlements/tx/${txHash}`, { replace: true });
      }
    } catch (e) {
      setTxError(e?.shortMessage || e?.message || "Transaction failed.");
    } finally {
      setCommitting(false);
    }
  };

  if (settlements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <h2 className="text-lg font-bold text-[#344F52] mb-1">Nothing to finalize</h2>
        <p className="text-sm text-gray-500">No outstanding balances in this group.</p>
        <Link to={`/groups/${id}`} className="mt-4 text-[#588884] font-medium">
          Back to group
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-[#344F52] mb-1">Finalize settlement</h1>
      <p className="text-sm text-gray-500 mb-5">
        Commit this settlement to Polygon Amoy so anyone can verify it on-chain.
      </p>

      {!hasAllWallets && (
        <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-5">
          <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-medium text-amber-800">Add wallet addresses</p>
            <p className="text-xs text-amber-700 mt-1">
              Each member needs an EVM address (0x...) to commit on-chain.{" "}
              <Link to={`/groups/${id}`} className="underline">
                Set wallets in the group
              </Link>
              . Missing: {missingWallet.map((m) => m.name).join(", ")}
            </p>
          </div>
        </div>
      )}

      {buildResult && (
        <>
          <div className="space-y-3 mb-5">
            {buildResult.json.transfers?.map((t, i) => {
              const fromMember = group.members.find(
                (m) => m.wallet_address && m.wallet_address.toLowerCase() === t.from
              );
              const toMember = group.members.find(
                (m) => m.wallet_address && m.wallet_address.toLowerCase() === t.to
              );
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Avatar name={fromMember?.name ?? t.from} size="md" />
                    <span className="text-sm font-semibold text-[#344F52] truncate">
                      {fromMember?.name ?? t.from.slice(0, 10)}…
                    </span>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 flex-shrink-0" />
                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                    <span className="text-sm font-semibold text-[#344F52] truncate">
                      {toMember?.name ?? t.to.slice(0, 10)}…
                    </span>
                    <Avatar name={toMember?.name ?? t.to} size="md" />
                  </div>
                  <div className="flex-shrink-0 ml-2 text-right min-w-[60px]">
                    <p className="text-lg font-bold text-[#344F52]">
                      ${(t.amountCents / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
            <p className="text-xs text-gray-500 font-medium mb-2">Summary</p>
            <p className="text-sm text-[#344F52]">
              Currency: <span className="font-semibold">{buildResult.json.currency}</span>
            </p>
            <p className="text-sm text-[#344F52] mt-1">
              Total: <span className="font-semibold">${(buildResult.totalCents / 100).toFixed(2)}</span>
            </p>
          </div>
        </>
      )}

      {txError && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          {txError}
        </div>
      )}

      {!canCommit && !committing && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          {!settlementLedgerAddress
            ? "Contract address not set. Add VITE_SETTLEMENT_LEDGER_ADDRESS to .env and restart the dev server."
            : !hasAllWallets
              ? `Add wallet for: ${missingWallet.map((m) => m.name).join(", ")}`
              : !buildResult
                ? "Could not build settlement."
                : !hasTransfers
                  ? "No transfers to commit. Add expenses with outstanding balances, then go to Settle."
                  : null}
        </div>
      )}

      <button
        onClick={handleCommit}
        disabled={!canCommit || committing}
        className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-white bg-[#588884] rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:bg-[#476d6a] transition-colors"
      >
        {!isConnected ? (
          <><Wallet size={18} /> Connect wallet & commit to chain</>
        ) : committing ? (
          <><Loader2 size={18} className="animate-spin" /> Committing…</>
        ) : (
          <>Commit to chain</>
        )}
      </button>

      <Link
        to={`/groups/${id}/settle`}
        className="block text-center text-sm text-gray-500 mt-4"
      >
        Back to Settle up
      </Link>
    </div>
  );
}
