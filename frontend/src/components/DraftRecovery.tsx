import React, { useState } from 'react';
import { useDraftRecovery } from '../hooks/useDraftRecovery';
import type { Draft } from '@shared/types';

interface DraftRecoveryProps {
  onDraftSelected: (draft: Draft & { keystrokes: any[] }) => void;
  onClose: () => void;
}

export function DraftRecovery({ onDraftSelected, onClose }: DraftRecoveryProps) {
  const { drafts, loading, error, loadDraft, deleteDraft } = useDraftRecovery();
  const [loadingDraftId, setLoadingDraftId] = useState<string | null>(null);

  const handleLoadDraft = async (draftId: string) => {
    try {
      setLoadingDraftId(draftId);
      const draft = await loadDraft(draftId);
      if (draft) {
        onDraftSelected(draft);
        onClose();
      }
    } catch (err) {
      console.error('Failed to load draft:', err);
      // Could show error toast here
    } finally {
      setLoadingDraftId(null);
    }
  };

  const handleDeleteDraft = async (draftId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDraft(draftId);
    } catch (err) {
      console.error('Failed to delete draft:', err);
      // Could show error toast here
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Less than an hour ago';
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getPreview = (content: string) => {
    const text = content.trim();
    if (text.length <= 100) return text;
    return text.substring(0, 100) + '...';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="ml-3 text-lg">Loading drafts...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recover Draft</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {drafts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">No drafts found</p>
            <p className="text-gray-400 text-sm mt-2">
              Start writing to create your first auto-saved draft
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-3">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleLoadDraft(draft.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {draft.title ? (
                          <h3 className="font-semibold text-gray-900 truncate">
                            {draft.title}
                          </h3>
                        ) : (
                          <h3 className="font-semibold text-gray-500 italic">
                            Untitled Draft
                          </h3>
                        )}
                        <span className="text-sm text-gray-500">
                          ({draft.word_count} words)
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-2">
                        {getPreview(draft.content)}
                      </p>
                      
                      <p className="text-xs text-gray-400">
                        Last saved: {formatDate(draft.last_saved_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {loadingDraftId === draft.id && (
                        <svg className="animate-spin h-4 w-4 text-blue-600" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      )}
                      
                      <button
                        onClick={(e) => handleDeleteDraft(draft.id, e)}
                        className="text-red-400 hover:text-red-600 p-1"
                        title="Delete draft"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2v1a1 1 0 000 2H6a1 1 0 100 2h8a1 1 0 100-2h0a1 1 0 000-2V3a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 112 0v4a1 1 0 11-2 0V9zm4 0a1 1 0 112 0v4a1 1 0 11-2 0V9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}