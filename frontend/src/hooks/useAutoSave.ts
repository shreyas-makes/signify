import { useState, useEffect, useRef, useCallback } from 'react';
import type { SaveStatus, SaveDraftRequest, SaveDraftResponse, KeystrokeEvent } from '@shared/types';

interface UseAutoSaveOptions {
  content: string;
  title?: string;
  keystrokes: KeystrokeEvent[];
  draftId?: string;
  intervalMs?: number;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  saveStatus: SaveStatus;
  saveDraft: () => Promise<void>;
  clearDraft: () => void;
  draftId?: string;
}

const STORAGE_KEY = 'signify_draft_id';
const MAX_RETRIES = 5;
const BASE_RETRY_DELAY = 1000; // 1 second

export function useAutoSave({
  content,
  title,
  keystrokes,
  draftId: externalDraftId,
  intervalMs = 30000, // 30 seconds
  enabled = true
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ state: 'idle' });
  const [internalDraftId, setInternalDraftId] = useState<string | undefined>(
    externalDraftId || localStorage.getItem(STORAGE_KEY) || undefined
  );
  
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);
  const lastSaveRef = useRef<string>('');
  const isUnloadingRef = useRef(false);

  const draftId = externalDraftId || internalDraftId;

  const transformKeystrokesForAPI = useCallback((events: KeystrokeEvent[]) => {
    return events.map(event => ({
      timestamp: event.timestamp,
      character: event.character,
      event_type: event.eventType as 'keydown' | 'keyup' | 'input' | 'delete' | 'backspace'
    }));
  }, []);

  const saveDraft = useCallback(async (): Promise<void> => {
    if (!enabled || isUnloadingRef.current) return;

    const currentContent = content.trim();
    if (!currentContent) return;

    // Skip if content hasn't changed since last save
    if (currentContent === lastSaveRef.current) return;

    try {
      setSaveStatus({ state: 'saving' });

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const payload: SaveDraftRequest = {
        title,
        content: currentContent,
        keystrokes: transformKeystrokesForAPI(keystrokes),
        draftId
      };

      const response = await fetch('/api/posts/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      const data: SaveDraftResponse = result.data;

      // Update draft ID if this was a new draft
      if (!internalDraftId && data.draftId) {
        setInternalDraftId(data.draftId);
        localStorage.setItem(STORAGE_KEY, data.draftId);
      }

      setSaveStatus({ 
        state: 'saved', 
        lastSaved: new Date(data.savedAt) 
      });

      lastSaveRef.current = currentContent;
      retryCountRef.current = 0;

    } catch (error) {
      console.error('Auto-save failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Save failed';
      setSaveStatus({ 
        state: 'error', 
        error: errorMessage 
      });

      // Retry with exponential backoff
      if (retryCountRef.current < MAX_RETRIES) {
        const delay = BASE_RETRY_DELAY * Math.pow(2, retryCountRef.current);
        retryCountRef.current++;
        
        setTimeout(() => {
          if (enabled && !isUnloadingRef.current) {
            saveDraft();
          }
        }, delay);
      }
    }
  }, [content, title, keystrokes, draftId, enabled, transformKeystrokesForAPI, internalDraftId]);

  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDraft();
    }, intervalMs);
  }, [saveDraft, intervalMs]);

  const clearDraft = useCallback(() => {
    if (internalDraftId) {
      localStorage.removeItem(STORAGE_KEY);
      setInternalDraftId(undefined);
    }
    setSaveStatus({ state: 'idle' });
    lastSaveRef.current = '';
  }, [internalDraftId]);

  // Auto-save when content changes
  useEffect(() => {
    if (!enabled) return;

    const currentContent = content.trim();
    if (currentContent && currentContent !== lastSaveRef.current) {
      debouncedSave();
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, enabled, debouncedSave]);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!enabled) return;

      const currentContent = content.trim();
      if (currentContent && currentContent !== lastSaveRef.current) {
        isUnloadingRef.current = true;
        
        // Attempt synchronous save using sendBeacon
        const token = localStorage.getItem('auth_token');
        if (token) {
          const payload: SaveDraftRequest = {
            title,
            content: currentContent,
            keystrokes: transformKeystrokesForAPI(keystrokes),
            draftId
          };

          const blob = new Blob([JSON.stringify(payload)], { 
            type: 'application/json' 
          });

          navigator.sendBeacon('/api/posts/draft', blob);
        }

        // Show warning to user
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [content, title, keystrokes, draftId, enabled, transformKeystrokesForAPI]);

  // Handle page visibility change (save when tab becomes hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && enabled) {
        const currentContent = content.trim();
        if (currentContent && currentContent !== lastSaveRef.current) {
          saveDraft();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [content, enabled, saveDraft]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    saveStatus,
    saveDraft,
    clearDraft,
    draftId
  };
}