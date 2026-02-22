import { supabase } from "./supabase";

/**
 * Save a committed settlement record for the proof page.
 */
export async function saveSettlementRecord({
  groupId,
  settlementId,
  txHash,
  settlementHash,
  committedBy,
}) {
  const { data, error } = await supabase
    .from("group_settlements")
    .insert({
      group_id: groupId,
      settlement_id: settlementId,
      tx_hash: txHash,
      settlement_hash: settlementHash,
      committed_by: committedBy,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * List committed settlements for a group.
 */
export async function getSettlementsByGroup(groupId) {
  const { data, error } = await supabase
    .from("group_settlements")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
