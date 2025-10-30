interface NaturalLanguageInputProps {
  hasBuiltInAI: boolean;
  value: string;
  onChange: (value: string) => void;
  onParse: () => void;
}

export function NaturalLanguageInput({ hasBuiltInAI, value, onChange, onParse }: NaturalLanguageInputProps) {
  if (!hasBuiltInAI) return null;

  return (
    <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-gray-500 via-gray-600 to-gray-500 shadow-lg backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex-1 relative">
          <input
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onParse()}
            className="w-full rounded-xl px-4 py-3 bg-white/95 border border-white/40 placeholder-slate-400 focus:ring-2 focus:ring-white focus:border-transparent shadow-sm text-slate-700"
            placeholder="Try: 'Next Monday 2pm in New York' or 'Tomorrow morning in London'"
            tabIndex={8}
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-400">Press Enter</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onParse}
            className="px-6 py-3 rounded-xl bg-white text-gray-600 hover:bg-gray-50 font-semibold transition-all shadow-md hover:shadow-lg hover:scale-105"
            tabIndex={9}
          >
            Parse
          </button>
          <a
            className="px-4 py-3 rounded-xl bg-white/20 text-white hover:bg-white/30 font-medium transition-all text-sm flex items-center"
            href="https://developer.chrome.com/docs/ai/built-in/"
            target="_blank"
            rel="noreferrer"
          >
            Guide
          </a>
        </div>
      </div>
    </div>
  );
}

