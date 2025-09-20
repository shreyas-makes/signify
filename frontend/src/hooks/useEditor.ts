import { useState, useEffect, useCallback, useRef } from 'react';

export interface EditorState {
  content: string;
  htmlContent: string;
  wordCount: number;
  charCount: number;
  readingTime: number;
  isEmpty: boolean;
}

export interface UseEditorOptions {
  debounceMs?: number;
  placeholder?: string;
}

export function useEditor(options: UseEditorOptions = {}) {
  const { debounceMs = 300, placeholder = "Start writing your human-verified content..." } = options;
  
  const [state, setState] = useState<EditorState>({
    content: '',
    htmlContent: '',
    wordCount: 0,
    charCount: 0,
    readingTime: 0,
    isEmpty: true,
  });

  const debounceRef = useRef<NodeJS.Timeout>();
  const editorRef = useRef<HTMLDivElement>(null);

  // Extract plain text from HTML content
  const extractPlainText = useCallback((html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  }, []);

  // Calculate word count from text
  const calculateWordCount = useCallback((text: string): number => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }, []);

  // Calculate reading time (200 words per minute)
  const calculateReadingTime = useCallback((wordCount: number): number => {
    return Math.max(1, Math.ceil(wordCount / 200));
  }, []);

  // Clean up HTML content to prevent unwanted formatting
  const cleanHtmlContent = useCallback((html: string): string => {
    // Remove unwanted attributes and tags while preserving basic formatting
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove script tags and other dangerous elements
    const scripts = tempDiv.querySelectorAll('script, link, meta, style');
    scripts.forEach(el => el.remove());
    
    // Clean up attributes but keep basic formatting
    const walkNode = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        
        // Only allow specific tags and attributes
        const allowedTags = ['p', 'div', 'br', 'strong', 'b', 'em', 'i', 'h1', 'h2', 'h3'];
        const allowedAttributes = ['class'];
        
        if (!allowedTags.includes(element.tagName.toLowerCase())) {
          // Replace with div if not allowed
          const newDiv = document.createElement('div');
          newDiv.innerHTML = element.innerHTML;
          element.parentNode?.replaceChild(newDiv, element);
          return;
        }
        
        // Remove disallowed attributes
        const attributesToRemove: string[] = [];
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          if (!allowedAttributes.includes(attr.name)) {
            attributesToRemove.push(attr.name);
          }
        }
        attributesToRemove.forEach(attr => element.removeAttribute(attr));
      }
      
      // Recursively walk child nodes
      const children = Array.from(node.childNodes);
      children.forEach(child => walkNode(child));
    };
    
    walkNode(tempDiv);
    return tempDiv.innerHTML;
  }, []);

  // Update editor state
  const updateState = useCallback((htmlContent: string) => {
    const cleanedHtml = cleanHtmlContent(htmlContent);
    const plainText = extractPlainText(cleanedHtml);
    const wordCount = calculateWordCount(plainText);
    const charCount = plainText.length;
    const readingTime = calculateReadingTime(wordCount);
    const isEmpty = plainText.trim().length === 0;

    setState({
      content: plainText,
      htmlContent: cleanedHtml,
      wordCount,
      charCount,
      readingTime,
      isEmpty,
    });
  }, [extractPlainText, calculateWordCount, calculateReadingTime, cleanHtmlContent]);

  // Handle content change with debouncing
  const handleContentChange = useCallback(() => {
    if (!editorRef.current) return;

    const htmlContent = editorRef.current.innerHTML;
    
    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout
    debounceRef.current = setTimeout(() => {
      updateState(htmlContent);
    }, debounceMs);
  }, [updateState, debounceMs]);

  // Format text (bold, italic)
  const formatText = useCallback((command: 'bold' | 'italic') => {
    document.execCommand(command, false);
    handleContentChange();
  }, [handleContentChange]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifierKey = isMac ? event.metaKey : event.ctrlKey;

    if (modifierKey) {
      switch (event.key.toLowerCase()) {
        case 'b':
          event.preventDefault();
          formatText('bold');
          break;
        case 'i':
          event.preventDefault();
          formatText('italic');
          break;
      }
    }

    // Handle markdown-style headers - simple approach
    if (event.key === ' ') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && editorRef.current) {
        const range = selection.getRangeAt(0);
        
        // Get the current text content of the editor
        const editorContent = editorRef.current.textContent || '';
        const cursorPosition = range.startOffset;
        
        // Find the start of the current line
        const textBeforeCursor = editorContent.substring(0, cursorPosition);
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines[lines.length - 1];
        
        console.log('Current line:', currentLine); // Debug log
        
        // Check if current line is just ### 
        const headerMatch = currentLine.match(/^(#{1,3})$/);
        if (headerMatch) {
          event.preventDefault();
          console.log('Header match found:', headerMatch[1]); // Debug log
          
          const headerLevel = headerMatch[1].length;
          
          // Get current paragraph/div containing cursor
          let currentElement: Node | null = range.startContainer;
          while (currentElement && currentElement.nodeType !== Node.ELEMENT_NODE) {
            currentElement = currentElement.parentNode;
          }
          
          if (currentElement && currentElement.parentNode) {
            // Create new header element
            const headerElement = document.createElement(`h${headerLevel}`);
            headerElement.innerHTML = '&nbsp;'; // Non-breaking space to maintain cursor position
            headerElement.style.outline = 'none';
            
            // Replace current element with header
            currentElement.parentNode.replaceChild(headerElement, currentElement);
            
            // Set cursor in header
            const newRange = document.createRange();
            newRange.selectNodeContents(headerElement);
            newRange.collapse(false); // Move to end
            selection.removeAllRanges();
            selection.addRange(newRange);
            
            // Clear the non-breaking space after a brief moment
            setTimeout(() => {
              headerElement.textContent = '';
              const finalRange = document.createRange();
              finalRange.selectNodeContents(headerElement);
              finalRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(finalRange);
            }, 10);
            
            handleContentChange();
          }
        }
      }
    }
  }, [formatText, handleContentChange]);

  // Focus the editor
  const focusEditor = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.focus();
      
      // If empty, place cursor at start
      if (state.isEmpty) {
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(editorRef.current);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  }, [state.isEmpty]);

  // Set content programmatically
  const setContent = useCallback((html: string) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = html;
      updateState(html);
    }
  }, [updateState]);

  // Clear all content
  const clearContent = useCallback(() => {
    setContent('');
  }, [setContent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    state,
    editorRef,
    handleContentChange,
    handleKeyDown,
    focusEditor,
    setContent,
    clearContent,
    formatText,
    placeholder,
  };
}