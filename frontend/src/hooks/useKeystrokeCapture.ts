import { useCallback, useRef, useEffect, useState } from 'react';
import { KeystrokeEvent, KeystrokeBatch } from '@shared/types';

export interface UseKeystrokeCaptureOptions {
  batchInterval?: number;
  onBatch?: (batch: KeystrokeBatch) => void;
  onEvent?: (event: KeystrokeEvent) => void;
  enabled?: boolean;
}

export interface UseKeystrokeCaptureReturn {
  events: KeystrokeEvent[];
  clearEvents: () => void;
  isCapturing: boolean;
  lastEvent: KeystrokeEvent | null;
  eventCount: number;
}

export function useKeystrokeCapture(
  targetRef: React.RefObject<HTMLElement>,
  options: UseKeystrokeCaptureOptions = {}
): UseKeystrokeCaptureReturn {
  const {
    batchInterval = 100,
    onBatch,
    onEvent,
    enabled = true
  } = options;

  const [events, setEvents] = useState<KeystrokeEvent[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastEvent, setLastEvent] = useState<KeystrokeEvent | null>(null);
  
  const batchRef = useRef<KeystrokeEvent[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventIdCounter = useRef(0);

  const generateEventId = useCallback(() => {
    return `keystroke_${Date.now()}_${eventIdCounter.current++}`;
  }, []);

  const getCursorPosition = useCallback((element: HTMLElement): number => {
    // Skip cursor position calculation for performance
    // Can be re-enabled if needed for specific features
    return 0;
  }, []);

  const isSpecialKey = useCallback((key: string): boolean => {
    const specialKeys = [
      'Backspace', 'Delete', 'Enter', 'Tab', 'Escape', 'ArrowLeft', 
      'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 
      'PageDown', 'Insert', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 
      'F7', 'F8', 'F9', 'F10', 'F11', 'F12'
    ];
    return specialKeys.includes(key) || key.startsWith('Control') || 
           key.startsWith('Alt') || key.startsWith('Shift') || key.startsWith('Meta');
  }, []);

  const createKeystrokeEvent = useCallback((
    eventType: KeystrokeEvent['eventType'],
    character: string,
    element: HTMLElement
  ): KeystrokeEvent => {
    const cursorPosition = getCursorPosition(element);
    
    return {
      id: generateEventId(),
      timestamp: performance.now(),
      character,
      eventType,
      cursorPosition,
      isSpecialKey: isSpecialKey(character)
    };
  }, [generateEventId, getCursorPosition, isSpecialKey]);

  const addEvent = useCallback((event: KeystrokeEvent) => {
    // Use requestAnimationFrame to defer state updates
    requestAnimationFrame(() => {
      setEvents(prev => [...prev, event]);
      setLastEvent(event);
    });
    
    // Add to batch
    batchRef.current.push(event);
    
    // Trigger onEvent callback immediately
    if (onEvent) {
      onEvent(event);
    }

    // Set up batch timeout if not already set
    if (batchTimeoutRef.current === null) {
      batchTimeoutRef.current = setTimeout(() => {
        if (batchRef.current.length > 0 && onBatch) {
          const batch: KeystrokeBatch = {
            events: [...batchRef.current],
            batchTimestamp: performance.now()
          };
          onBatch(batch);
          batchRef.current = [];
        }
        batchTimeoutRef.current = null;
      }, batchInterval);
    }
  }, [onEvent, onBatch, batchInterval]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled || !targetRef.current) return;

    const element = targetRef.current;
    let character = e.key;
    let eventType: KeystrokeEvent['eventType'] = 'keydown';

    // Handle special keys
    if (e.key === 'Backspace') {
      eventType = 'backspace';
      character = 'Backspace';
    } else if (e.key === 'Delete') {
      eventType = 'delete';
      character = 'Delete';
    } else if (e.key === 'Enter') {
      character = '\n';
    } else if (e.key === 'Tab') {
      character = '\t';
    } else if (e.key === ' ') {
      character = ' ';
    }

    // Skip modifier keys alone (but allow combinations)
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
      return;
    }

    const keystrokeEvent = createKeystrokeEvent(eventType, character, element);
    addEvent(keystrokeEvent);
  }, [enabled, targetRef, createKeystrokeEvent, addEvent]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    // Skip keyup events to reduce processing overhead
    // We capture everything we need in keydown and input events
    return;
  }, []);

  const handleInput = useCallback((e: InputEvent) => {
    if (!enabled || !targetRef.current) return;

    const element = targetRef.current;
    const inputData = e.data || '';
    
    // Skip input events that duplicate keydown events
    // Only capture composition and special input types
    if (inputData && e.inputType === 'insertCompositionText') {
      const keystrokeEvent = createKeystrokeEvent('input', inputData, element);
      addEvent(keystrokeEvent);
    }
  }, [enabled, targetRef, createKeystrokeEvent, addEvent]);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setLastEvent(null);
    batchRef.current = [];
    
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    const element = targetRef.current;
    if (!element || !enabled) return;

    setIsCapturing(true);

    element.addEventListener('keydown', handleKeyDown);
    element.addEventListener('keyup', handleKeyUp);
    element.addEventListener('input', handleInput as EventListener);

    return () => {
      setIsCapturing(false);
      element.removeEventListener('keydown', handleKeyDown);
      element.removeEventListener('keyup', handleKeyUp);
      element.removeEventListener('input', handleInput as EventListener);
      
      // Clear any pending batch timeout
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
        batchTimeoutRef.current = null;
      }
    };
  }, [enabled, targetRef, handleKeyDown, handleKeyUp, handleInput]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  return {
    events,
    clearEvents,
    isCapturing,
    lastEvent,
    eventCount: events.length
  };
}