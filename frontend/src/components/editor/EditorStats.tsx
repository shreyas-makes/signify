import { EditorState } from '../../hooks/useEditor';

interface EditorStatsProps {
  state: EditorState;
  className?: string;
}

export function EditorStats({ state, className = '' }: EditorStatsProps) {
  const { wordCount, charCount, readingTime, isEmpty } = state;

  if (isEmpty) {
    return null;
  }

  return (
    <div className={`flex items-center gap-6 text-sm text-gray-500 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="font-medium">{wordCount.toLocaleString()}</span>
        <span>{wordCount === 1 ? 'word' : 'words'}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="font-medium">{charCount.toLocaleString()}</span>
        <span>{charCount === 1 ? 'character' : 'characters'}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="font-medium">{readingTime}</span>
        <span>min read</span>
      </div>
      
      <div className="flex items-center gap-2 text-green-600">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>100% Human</span>
      </div>
    </div>
  );
}