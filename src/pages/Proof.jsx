import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ExternalLink, Download, CheckCircle, XCircle } from "lucide-react";
import { useReadContract } from "wagmi";
import { useGroup } from "../hooks/useGroup";
import { buildSettlement } from "../lib/settlement/buildSettlement";
import { stableStringify } from "../lib/settlement/stableStringify";
import {
  settlementLedgerAddress,
  settlementLedgerAbi,
  explorerUrl,
} from "../config/web3";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

function ProofBySettlementId({ groupId, settlementId }) {
  const { data, isLoading, error } = useReadContract({
    address: settlementLedgerAddress,
    abi: settlementLedgerAbi,
    functionName: "getSettlement",
    args: [settlementId],
  });
  const { group, loading, error: groupError } = useGroup(groupId);
  const [verifyResult, setVerifyResult] = useState(null);

  if (loading || !group) return <LoadingSpinner />;
  if (groupError) return <ErrorMessage message={groupError} />;

  const committedBy = data?.[4];
  const onChain = committedBy && committedBy !== "0x0000000000000000000000000000000000000000";
  const settlementHashOnChain = onChain ? data[1] : null;

  const handleDownload = () => {
    try {
      const built = buildSettlement(group);
      const str = stableStringify(built.json);
      const blob = new Blob([str], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `settlement-${groupId}-${settlementId.slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerify = () => {
    try {
      const built = buildSettlement(group);
      const computedHash = built.settlementHash;
      const match =
        settlementHashOnChain &&
        computedHash.toLowerCase() === settlementHashOnChain.toLowerCase();
      setVerifyResult(match);
    } catch (e) {
      setVerifyResult(false);
    }
  };

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-[#344F52] mb-5">Settlement proof</h1>

      {isLoading && <LoadingSpinner />}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          Could not load on-chain settlement. Is the contract deployed and the ID correct?
        </div>
      )}

      {data && (
        <>
          <div className="space-y-3 mb-6">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 font-medium">Settlement ID</p>
              <p className="text-sm font-mono break-all mt-1">{settlementId}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 font-medium">Settlement hash (on-chain)</p>
              <p className="text-sm font-mono break-all mt-1">{String(settlementHashOnChain)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            <button
              type="button"
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#344F52] bg-white border border-gray-200 rounded-xl"
            >
              <Download size={18} /> Download JSON
            </button>
            <button
              type="button"
              onClick={handleVerify}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-[#588884] rounded-xl"
            >
              Verify hash
            </button>
          </div>

          {verifyResult !== null && (
            <div
              className={`flex items-center gap-2 p-4 rounded-xl mb-6 ${
                verifyResult ? "bg-green-50 border border-green-200" : "bg-rose-50 border border-rose-200"
              }`}
            >
              {verifyResult ? (
                <><CheckCircle className="text-green-600" size={20} /> <span className="text-green-800 font-medium">Hash matches</span></>
              ) : (
                <><XCircle className="text-rose-600" size={20} /> <span className="text-rose-800 font-medium">Hash does not match</span></>
              )}
            </div>
          )}
        </>
      )}

      <Link to={`/groups/${groupId}`} className="text-sm text-[#588884] font-medium">
        ← Back to group
      </Link>
    </div>
  );
}

function ProofByTxHash({ groupId, txHash }) {
  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-[#344F52] mb-5">Transaction submitted</h1>
      <p className="text-sm text-gray-500 mb-4">
        Your commit was sent. View it on the explorer.
      </p>
      <a
        href={`${explorerUrl}/tx/${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 py-3 px-4 bg-[#588884] text-white rounded-xl font-medium"
      >
        <ExternalLink size={18} /> View on Polygonscan
      </a>
      <Link to={`/groups/${groupId}`} className="block mt-5 text-sm text-[#588884]">
        ← Back to group
      </Link>
    </div>
  );
}

export default function Proof() {
  const { id: groupId, settlementId, txHash } = useParams();

  if (txHash) {
    return <ProofByTxHash groupId={groupId} txHash={txHash} />;
  }
  if (settlementId && settlementId !== "tx") {
    return <ProofBySettlementId groupId={groupId} settlementId={settlementId} />;
  }

  return (
    <div className="px-4 py-6">
      <p className="text-gray-500">Invalid proof URL.</p>
      <Link to={`/groups/${groupId}`} className="text-[#588884] mt-2 inline-block">
        Back to group
      </Link>
    </div>
  );
}
