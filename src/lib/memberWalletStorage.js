/**
 * Local fallback for member wallet addresses when DB doesn't have wallet_address column yet.
 * Keys: member_wallet_<memberId> => "0x..."
 */
const PREFIX = "member_wallet_";

export function getStoredWallet(memberId) {
  if (!memberId) return null;
  try {
    return localStorage.getItem(PREFIX + memberId) || null;
  } catch {
    return null;
  }
}

export function setStoredWallet(memberId, address) {
  if (!memberId) return;
  try {
    const v = address && address.trim() ? address.trim() : null;
    if (v) localStorage.setItem(PREFIX + memberId, v);
    else localStorage.removeItem(PREFIX + memberId);
  } catch {
    // ignore
  }
}
