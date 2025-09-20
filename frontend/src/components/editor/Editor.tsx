import React, { useEffect } from 'react';
import { useEditor } from '../../hooks/useEditor';
import { EditorStats } from './EditorStats';

interface EditorProps {
  onContentChange?: (content: string, htmlContent: string) => void;
  initialContent?: string;
  placeholder?: string;
  className?: string;
}

export function Editor({ 
  onContentChange, 
  initialContent = '', 
  placeholder,
  className = '' 
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

  // Handle input events
  const handleInput = () => {
    handleContentChange();
  };

  const handleKeyDownEvent = (event: React.KeyboardEvent<HTMLDivElement>) => {
    handleKeyDown(event.nativeEvent);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    // Prevent paste to maintain keystroke integrity
    event.preventDefault();
    
    // Show a brief message to the user
    const messageEl = document.createElement('div');
    messageEl.textContent = 'Paste disabled - type manually to verify human authorship';
    messageEl.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow-lg z-50';
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      document.body.removeChild(messageEl);
    }, 3000);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    // Prevent drop to maintain keystroke integrity
    event.preventDefault();
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
          onPaste={handlePaste}
          onDrop={handleDrop}
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
          </div>
        </div>
      </div>
    </div>
  );
}