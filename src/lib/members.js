import { supabase } from './supabase';

/**
 * Add a member to an existing group.
 */
export async function addMember(groupId, name) {
  const { data, error } = await supabase
    .from('members')
    .insert({ group_id: groupId, name: name.trim() })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove a member. Will fail if the member has unsettled expense shares.
 */
export async function removeMember(memberId) {
  const { error } = await supabase.from('members').delete().eq('id', memberId);
  if (error) throw error;
}

/**
 * List all members for a group.
 */
export async function getMembers(groupId) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Update a member's wallet address (EVM, 0x + 40 hex).
 */
export async function updateMemberWallet(memberId, walletAddress) {
  const addr = walletAddress ? String(walletAddress).trim() : null;
  if (addr && !/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    throw new Error("Invalid address: use 0x followed by 40 hex characters.");
  }
  const { data, error } = await supabase
    .from('members')
    .update({ wallet_address: addr || null })
    .eq('id', memberId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
