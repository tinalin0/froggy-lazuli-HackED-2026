import { useState, useEffect, useCallback } from 'react';
import { getGroups, createGroup, deleteGroup } from '../lib/groups';

export function useGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false); // Track if a deletion is in progress

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGroups();
      setGroups(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async (name, memberNames) => {
    const group = await createGroup(name, memberNames);
    await load();
    return group;
  }, [load]);

  const remove = useCallback(async (groupId) => {
    setDeleting(true); // Set deleting state to true
    try {
      await deleteGroup(groupId);  // Call the delete function from group.js
      setGroups((prev) => prev.filter((g) => g.id !== groupId));  // Update the local state
    } catch (err) {
      setError('Failed to delete group');
    } finally {
      setDeleting(false); // Set deleting state back to false
    }
  }, []);

  return { groups, loading, error, reload: load, createGroup: create, deleteGroup: remove, deleting };
}