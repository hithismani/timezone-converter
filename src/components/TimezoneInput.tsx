import { formatForZone } from '../lib/utils';

interface TimezoneInputProps {
  label: string;
  icon: string;
  value: string | null;
  query: string | null;
  results: string[];
  focused: boolean;
  onValueChange: (value: string | null) => void;
  onQueryChange: (query: string | null) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSettingsClick: () => void;
  tabIndex: number;
  colorClass?: string;
}

export function TimezoneInput({
  label,
  icon,
  value,
  query,
  results,
  focused,
  onValueChange,
  onQueryChange,
  onFocus,
  onBlur,
  onSettingsClick,
  tabIndex,
  colorClass = 'gray'
}: TimezoneInputProps) {
  return (
    <div className="md:col-span-5">
      <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
        <span className={`text-${colorClass}-500`}>{icon}</span>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            value={query !== null ? query : value || ''}
            onChange={e => onQueryChange(e.target.value)}
            onFocus={onFocus}
            onBlur={(e) => {
              if (!e.target.value) {
                onQueryChange(null);
                onValueChange(null);
              }
              onBlur();
            }}
            className={`w-full rounded-xl border-2 border-slate-200 px-4 py-3 pr-10 bg-slate-50 focus:ring-2 focus:ring-${colorClass}-500 focus:border-${colorClass}-500 transition-all text-slate-700`}
            placeholder="Search timezone..."
            tabIndex={tabIndex}
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none text-xs">▼</span>
          {focused && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl max-h-60 overflow-auto z-20">
              {results.slice(0, 10).map(tz => (
                <div
                  key={tz}
                  onMouseDown={() => {
                    onValueChange(tz);
                    onQueryChange(null);
                    onBlur();
                  }}
                  className={`px-4 py-3 cursor-pointer hover:bg-${colorClass}-50 transition-colors border-b border-slate-100 last:border-b-0`}
                >
                  <div className="font-medium text-slate-700">{tz}</div>
                  <div className="text-xs text-slate-500 mt-1">{formatForZone(new Date(), tz)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          title="Working hours settings"
          onClick={onSettingsClick}
          className={`p-3 rounded-xl bg-${colorClass}-100 hover:bg-${colorClass}-200 text-${colorClass}-700 transition-all hover:scale-105 shadow-sm`}
          tabIndex={tabIndex + 1}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

