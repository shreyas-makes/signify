import { useCallback, useEffect, useRef } from 'react';
import { useToast } from '../components/ui/ToastManager';

export interface SecurityEvent {
  type: 'paste' | 'drop' | 'context_menu' | 'middle_click' | 'bulk_insertion' | 'beforeinput';
  timestamp: number;
  blocked: boolean;
  details?: string;
}

export interface UsePastePreventionOptions {
  onSecurityEvent?: (event: SecurityEvent) => void;
  bulkInsertionThreshold?: number; // Characters per second threshold
  enableLogging?: boolean;
}

export interface UsePastePreventionReturn {
  securityEvents: SecurityEvent[];
  clearSecurityEvents: () => void;
  getSecurityStats: () => {
    totalAttempts: number;
    pasteAttempts: number;
    dropAttempts: number;
    bulkInsertionAttempts: number;
  };
}

export function usePastePrevention(
  targetRef: React.RefObject<HTMLElement>,
  options: UsePastePreventionOptions = {}
): UsePastePreventionReturn {
  const {
    onSecurityEvent,
    bulkInsertionThreshold = 10, // 10 chars per second
    enableLogging = true
  } = options;

  const { showError, showWarning } = useToast();
  const securityEventsRef = useRef<SecurityEvent[]>([]);
  const lastInputTimeRef = useRef<number>(0);
  const inputLengthRef = useRef<number>(0);

  const logSecurityEvent = useCallback((event: SecurityEvent) => {
    if (enableLogging) {
      console.warn('Security event:', event);
      securityEventsRef.current.push(event);
      
      // Keep only last 100 events to prevent memory issues
      if (securityEventsRef.current.length > 100) {
        securityEventsRef.current = securityEventsRef.current.slice(-100);
      }
    }
    
    if (onSecurityEvent) {
      onSecurityEvent(event);
    }
  }, [enableLogging, onSecurityEvent]);

  // Handle paste events
  const handlePaste = useCallback((event: ClipboardEvent) => {
    event.preventDefault();
    
    const securityEvent: SecurityEvent = {
      type: 'paste',
      timestamp: performance.now(),
      blocked: true,
      details: `Clipboard data length: ${event.clipboardData?.getData('text').length || 0}`
    };
    
    logSecurityEvent(securityEvent);
    showError('Paste blocked - All content must be manually typed');
  }, [logSecurityEvent, showError]);

  // Handle beforeinput events for programmatic insertion
  const handleBeforeInput = useCallback((event: InputEvent) => {
    const element = targetRef.current;
    if (!element) return;

    // Block programmatic insertions
    if (event.inputType === 'insertFromPaste' || 
        event.inputType === 'insertFromDrop' ||
        event.inputType === 'insertReplacementText') {
      
      event.preventDefault();
      
      const securityEvent: SecurityEvent = {
        type: 'beforeinput',
        timestamp: performance.now(),
        blocked: true,
        details: `Input type: ${event.inputType}`
      };
      
      logSecurityEvent(securityEvent);
      showError('Programmatic text insertion blocked');
      return;
    }

    // Detect bulk insertion (only for multi-character insertions)
    if (event.inputType === 'insertText' && event.data) {
      // Only check for bulk insertion if more than 1 character is inserted at once
      if (event.data.length > 1) {
        event.preventDefault();
        
        const securityEvent: SecurityEvent = {
          type: 'bulk_insertion',
          timestamp: performance.now(),
          blocked: true,
          details: `Multi-character insertion blocked: ${event.data.length} chars`
        };
        
        logSecurityEvent(securityEvent);
        showWarning('Multi-character insertion prevented - Type character by character');
        return;
      }
      
      lastInputTimeRef.current = performance.now();
      inputLengthRef.current = element.textContent?.length || 0;
    }
  }, [targetRef, logSecurityEvent, showError, showWarning, bulkInsertionThreshold]);

  // Handle drag and drop
  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDragEnter = useCallback((event: DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    
    const securityEvent: SecurityEvent = {
      type: 'drop',
      timestamp: performance.now(),
      blocked: true,
      details: `Items dropped: ${event.dataTransfer?.items.length || 0}`
    };
    
    logSecurityEvent(securityEvent);
    showError('Drag and drop disabled - Please type manually');
  }, [logSecurityEvent, showError]);

  // Handle context menu (right-click)
  const handleContextMenu = useCallback((event: MouseEvent) => {
    event.preventDefault();
    
    const securityEvent: SecurityEvent = {
      type: 'context_menu',
      timestamp: performance.now(),
      blocked: true,
      details: 'Right-click context menu blocked'
    };
    
    logSecurityEvent(securityEvent);
    showWarning('Right-click menu disabled to prevent paste');
  }, [logSecurityEvent, showWarning]);

  // Handle middle-click paste (Linux/Unix)
  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (event.button === 1) { // Middle mouse button
      event.preventDefault();
      
      const securityEvent: SecurityEvent = {
        type: 'middle_click',
        timestamp: performance.now(),
        blocked: true,
        details: 'Middle-click paste attempt'
      };
      
      logSecurityEvent(securityEvent);
      showError('Middle-click paste blocked');
    }
  }, [logSecurityEvent, showError]);

  // Set up event listeners
  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    // Add all event listeners
    element.addEventListener('paste', handlePaste);
    element.addEventListener('beforeinput', handleBeforeInput as EventListener);
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('dragenter', handleDragEnter);
    element.addEventListener('drop', handleDrop);
    element.addEventListener('contextmenu', handleContextMenu);
    element.addEventListener('mousedown', handleMouseDown);

    // Also prevent selection of text for copying (optional)
    element.style.userSelect = 'text'; // Keep text selection for accessibility
    element.style.webkitUserSelect = 'text';

    return () => {
      element.removeEventListener('paste', handlePaste);
      element.removeEventListener('beforeinput', handleBeforeInput as EventListener);
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('dragenter', handleDragEnter);
      element.removeEventListener('drop', handleDrop);
      element.removeEventListener('contextmenu', handleContextMenu);
      element.removeEventListener('mousedown', handleMouseDown);
    };
  }, [
    targetRef,
    handlePaste,
    handleBeforeInput,
    handleDragOver,
    handleDragEnter,
    handleDrop,
    handleContextMenu,
    handleMouseDown
  ]);

  const clearSecurityEvents = useCallback(() => {
    securityEventsRef.current = [];
  }, []);

  const getSecurityStats = useCallback(() => {
    const events = securityEventsRef.current;
    return {
      totalAttempts: events.length,
      pasteAttempts: events.filter(e => e.type === 'paste').length,
      dropAttempts: events.filter(e => e.type === 'drop').length,
      bulkInsertionAttempts: events.filter(e => e.type === 'bulk_insertion').length,
    };
  }, []);

  return {
    securityEvents: securityEventsRef.current,
    clearSecurityEvents,
    getSecurityStats,
  };
}