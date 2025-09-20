import { KeystrokeEvent } from '@shared/types';

interface KeystrokeDebuggerProps {
  events: KeystrokeEvent[];
  isCapturing: boolean;
  lastEvent: KeystrokeEvent | null;
  eventCount: number;
  className?: string;
}

export function KeystrokeDebugger({ 
  events, 
  isCapturing, 
  lastEvent, 
  eventCount,
  className = ''
}: KeystrokeDebuggerProps) {
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatCharacter = (char: string) => {
    const charMap: Record<string, string> = {
      '\n': '↵',
      '\t': '⇥',
      ' ': '⎵',
      'Backspace': '⌫',
      'Delete': '⌦',
      'Enter': '↵',
      'Tab': '⇥'
    };
    return charMap[char] || char;
  };

  const getEventTypeColor = (eventType: KeystrokeEvent['eventType']) => {
    const colors = {
      keydown: 'text-blue-600',
      keyup: 'text-blue-400',
      input: 'text-green-600',
      backspace: 'text-red-600',
      delete: 'text-red-500'
    };
    return colors[eventType] || 'text-gray-600';
  };

  // Show only the last 20 events to prevent UI slowdown
  const recentEvents = events.slice(-20);

  return (
    <div className={`bg-gray-50 border rounded-lg p-4 font-mono text-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Keystroke Debugger</h3>
        <div className="flex items-center gap-4">
          <span className={`px-2 py-1 rounded text-xs ${
            isCapturing ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {isCapturing ? '● Recording' : '○ Stopped'}
          </span>
          <span className="text-gray-600">
            Total: {eventCount}
          </span>
        </div>
      </div>

      {lastEvent && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <div className="text-xs text-yellow-700 mb-1">Last Event:</div>
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${getEventTypeColor(lastEvent.eventType)}`}>
              {lastEvent.eventType}
            </span>
            <span className="bg-white px-1 rounded border">
              {formatCharacter(lastEvent.character)}
            </span>
            <span className="text-gray-500 text-xs">
              pos: {lastEvent.cursorPosition}
            </span>
            {lastEvent.isSpecialKey && (
              <span className="text-orange-600 text-xs">special</span>
            )}
          </div>
        </div>
      )}

      <div className="max-h-60 overflow-y-auto">
        {recentEvents.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            No keystrokes captured yet. Start typing to see events.
          </div>
        ) : (
          <div className="space-y-1">
            {recentEvents.map((event, index) => (
              <div 
                key={event.id} 
                className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 rounded text-xs"
              >
                <span className="text-gray-400 w-8">
                  {events.length - recentEvents.length + index + 1}
                </span>
                <span className="text-gray-500 w-24">
                  {formatTimestamp(event.timestamp)}
                </span>
                <span className={`font-semibold w-16 ${getEventTypeColor(event.eventType)}`}>
                  {event.eventType}
                </span>
                <span className="bg-white px-1 rounded border min-w-[2rem] text-center">
                  {formatCharacter(event.character)}
                </span>
                <span className="text-gray-500 w-12">
                  pos:{event.cursorPosition}
                </span>
                {event.isSpecialKey && (
                  <span className="text-orange-600 text-xs">●</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {events.length > 20 && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          Showing last 20 of {events.length} events
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600 space-y-1">
          <div>Performance: {events.length > 0 ? 
            `${(events[events.length - 1]?.timestamp - events[0]?.timestamp).toFixed(1)}ms total` : 
            'No data'
          }</div>
          <div className="flex gap-4">
            <span>● Special key</span>
            <span className="text-blue-600">keydown/keyup</span>
            <span className="text-green-600">input</span>
            <span className="text-red-600">delete/backspace</span>
          </div>
        </div>
      </div>
    </div>
  );
}