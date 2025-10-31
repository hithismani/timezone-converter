interface ClockDisplayProps {
  time: Date | null;
  timezone: string | null;
  label: string;
}

export function ClockDisplay({ time, timezone, label }: ClockDisplayProps) {
  if (!time || !timezone) return null;

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });

  const parts = formatter.formatToParts(time).reduce((acc: Record<string, string>, part: Intl.DateTimeFormatPart) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  const hours = parseInt(parts.hour);
  const minutes = parseInt(parts.minute);

  const hourAngle = (hours % 12) * 30 + (minutes / 60) * 30;
  const minuteAngle = minutes * 6;

  return (
    <div className="flex flex-col items-center">
      <div className="text-sm font-medium text-slate-700 mb-3">{label}</div>
      <div className="relative w-20 h-20 rounded-full border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-md">
        <div className="absolute inset-0 rounded-full">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1.5 bg-gray-400"
              style={{
                top: '3px',
                left: '50%',
                transformOrigin: '50% 37px',
                transform: `rotate(${i * 30}deg) translateX(-50%)`
              }}
            />
          ))}

          <div
            className="absolute w-1 h-5 bg-gray-800 origin-bottom rounded-full"
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -100%) rotate(${hourAngle}deg)`
            }}
          />

          <div
            className="absolute w-1 h-7 bg-gray-600 origin-bottom rounded-full"
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)`
            }}
          />

          <div className="absolute w-2 h-2 bg-gray-800 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-sm" />
        </div>
      </div>
      <div className="text-sm font-semibold text-slate-800 mt-2 font-mono">
        {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
      </div>
      <div className="text-xs font-medium text-slate-600 mt-1">{timezone}</div>
    </div>
  );
}

