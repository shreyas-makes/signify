import React, { useEffect, useState } from 'react';
import { useEditor } from '../../hooks/useEditor';
import { useKeystrokeCapture } from '../../hooks/useKeystrokeCapture';
import { usePastePrevention } from '../../hooks/usePastePrevention';
import { EditorStats } from './EditorStats';
import { KeystrokeDebugger } from './KeystrokeDebugger';
import { KeystrokeEvent, KeystrokeBatch } from '@shared/types';

interface EditorProps {
  onContentChange?: (content: string, htmlContent: string) => void;
  onKeystrokeCapture?: (events: KeystrokeEvent[]) => void;
  onKeystrokeBatch?: (batch: KeystrokeBatch) => void;
  initialContent?: string;
  placeholder?: string;
  className?: string;
  showKeystrokeDebugger?: boolean;
  showSecurityStats?: boolean;
}

export function Editor({ 
  onContentChange, 
  onKeystrokeCapture,
  onKeystrokeBatch,
  initialContent = '', 
  placeholder,
  className = '',
  showKeystrokeDebugger = false,
  showSecurityStats = false
}: EditorProps) {
  const {
    state,
    editorRef,
    handleContentChange,
    handleKeyDown,
    focusEditor,
    setContent,
    formatText,
    placeholder: defaultPlaceholder,
  } = useEditor({ placeholder });

  const [performanceMetrics, setPerformanceMetrics] = useState<{
    totalEvents: number;
    avgLatency: number;
    lastBatchSize: number;
  }>({ totalEvents: 0, avgLatency: 0, lastBatchSize: 0 });

  // Set up keystroke capture
  const {
    events: keystrokeEvents,
    isCapturing,
    lastEvent,
    eventCount
  } = useKeystrokeCapture(editorRef, {
    enabled: true,
    batchInterval: 100,
    onBatch: (batch) => {
      if (onKeystrokeBatch) {
        onKeystrokeBatch(batch);
      }
      
      // Update performance metrics
      setPerformanceMetrics(prev => ({
        totalEvents: prev.totalEvents + batch.events.length,
        avgLatency: batch.events.length > 0 ? 
          batch.events.reduce((sum, event) => sum + (batch.batchTimestamp - event.timestamp), 0) / batch.events.length :
          prev.avgLatency,
        lastBatchSize: batch.events.length
      }));
    },
    onEvent: (event) => {
      // Individual event callback for real-time processing if needed
      console.debug('Keystroke event:', event);
    }
  });

  // Set up comprehensive paste prevention
  const {
    getSecurityStats
  } = usePastePrevention(editorRef, {
    onSecurityEvent: (event) => {
      console.warn('Security event blocked:', event);
    },
    bulkInsertionThreshold: 50, // 50 chars per second (allows fast typing up to ~600 WPM)
    enableLogging: true
  });

  const displayPlaceholder = placeholder || defaultPlaceholder;

  // Set initial content
  useEffect(() => {
    if (initialContent && initialContent !== state.htmlContent) {
      setContent(initialContent);
    }
  }, [initialContent, setContent, state.htmlContent]);

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      focusEditor();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [focusEditor]);

  // Call onChange callback when content changes
  useEffect(() => {
    if (onContentChange) {
      onContentChange(state.content, state.htmlContent);
    }
  }, [state.content, state.htmlContent, onContentChange]);

  // Call keystroke capture callback when events change
  useEffect(() => {
    if (onKeystrokeCapture && keystrokeEvents.length > 0) {
      onKeystrokeCapture(keystrokeEvents);
    }
  }, [keystrokeEvents, onKeystrokeCapture]);

  // Handle input events
  const handleInput = () => {
    handleContentChange();
  };

  const handleKeyDownEvent = (event: React.KeyboardEvent<HTMLDivElement>) => {
    handleKeyDown(event.nativeEvent);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
        <button
          type="button"
          onClick={() => formatText('bold')}
          className="flex items-center justify-center w-8 h-8 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
          title="Bold (Ctrl+B)"
        >
          <span className="font-bold text-sm">B</span>
        </button>
        
        <button
          type="button"
          onClick={() => formatText('italic')}
          className="flex items-center justify-center w-8 h-8 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
          title="Italic (Ctrl+I)"
        >
          <span className="italic text-sm">I</span>
        </button>
        
        <div className="flex-1"></div>
        
        <div className="text-xs text-gray-500">
          Type ## for headers • Ctrl+B for bold • Ctrl+I for italic
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDownEvent}
          className={`
            editor-content
            w-full min-h-[400px] px-4 py-6 
            max-w-none
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
            rounded-lg border border-gray-200
            bg-white
            transition-shadow duration-200
            ${state.isEmpty ? 'text-gray-400' : 'text-gray-900'}
          `}
          style={{
            lineHeight: '1.8',
            fontSize: '18px',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
          role="textbox"
          aria-label="Write your content"
          aria-multiline="true"
          data-placeholder={state.isEmpty ? displayPlaceholder : undefined}
        />
        
        {/* Placeholder overlay */}
        {state.isEmpty && (
          <div 
            className="absolute top-6 left-4 text-gray-400 pointer-events-none select-none"
            style={{
              fontSize: '18px',
              lineHeight: '1.8',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          >
            {displayPlaceholder}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <EditorStats state={state} />
      </div>

      {/* Paste Prevention Notice */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">ℹ</span>
            </div>
          </div>
          <div className="text-sm text-blue-800">
            <strong>Human Verification Active:</strong> Copy/paste is disabled to ensure 100% manual typing. 
            Every keystroke is recorded with timestamps for verification.
            {isCapturing && (
              <div className="mt-1 text-xs">
                Captured {eventCount} keystrokes • Avg latency: {performanceMetrics.avgLatency.toFixed(2)}ms
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Statistics */}
      {showSecurityStats && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">🛡️</span>
              </div>
            </div>
            <div className="text-sm text-red-800">
              <strong>Security Events Blocked:</strong>
              {(() => {
                const stats = getSecurityStats();
                return (
                  <div className="mt-1 text-xs space-y-1">
                    <div>Total attempts: {stats.totalAttempts}</div>
                    <div>Paste attempts: {stats.pasteAttempts}</div>
                    <div>Drop attempts: {stats.dropAttempts}</div>
                    <div>Bulk insertion attempts: {stats.bulkInsertionAttempts}</div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Keystroke Debugger */}
      {showKeystrokeDebugger && (
        <div className="mt-4">
          <KeystrokeDebugger
            events={keystrokeEvents}
            isCapturing={isCapturing}
            lastEvent={lastEvent}
            eventCount={eventCount}
          />
        </div>
      )}
    </div>
  );
}