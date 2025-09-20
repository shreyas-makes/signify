import { useState, useEffect, useCallback } from 'react';
import type { Draft, ApiResponse } from '@shared/types';

interface UseDraftRecoveryReturn {
  drafts: Draft[];
  loading: boolean;
  error: string | null;
  loadDraft: (draftId: string) => Promise<Draft | null>;
  deleteDraft: (draftId: string) => Promise<void>;
  refreshDrafts: () => Promise<void>;
}

export function useDraftRecovery(): UseDraftRecoveryReturn {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDrafts = useCallback(async (): Promise<Draft[]> => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch('/api/posts/drafts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result: ApiResponse<Draft[]> = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch drafts');
    }

    return result.data || [];
  }, []);

  const refreshDrafts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedDrafts = await fetchDrafts();
      setDrafts(fetchedDrafts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load drafts';
      setError(errorMessage);
      console.error('Error fetching drafts:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchDrafts]);

  const loadDraft = useCallback(async (draftId: string): Promise<Draft | null> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/posts/draft/${draftId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result: ApiResponse<Draft & { keystrokes: any[] }> = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to load draft');
      }

      return result.data || null;
    } catch (err) {
      console.error('Error loading draft:', err);
      throw err;
    }
  }, []);

  const deleteDraft = useCallback(async (draftId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/posts/draft/${draftId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Remove from local state
      setDrafts(prev => prev.filter(draft => draft.id !== draftId));
      
      // Clear from localStorage if it was the current draft
      const currentDraftId = localStorage.getItem('signify_draft_id');
      if (currentDraftId === draftId) {
        localStorage.removeItem('signify_draft_id');
      }
    } catch (err) {
      console.error('Error deleting draft:', err);
      throw err;
    }
  }, []);

  // Load drafts on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      refreshDrafts();
    }
  }, [refreshDrafts]);

  return {
    drafts,
    loading,
    error,
    loadDraft,
    deleteDraft,
    refreshDrafts
  };
}