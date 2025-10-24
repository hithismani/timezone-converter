import { useEffect, useMemo, useState } from "react";

// Timezone Converter — Settings popup, presets (Morning/Evening), humanized sentence format
export default function TimezoneConverter() {
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const [fromZone, setFromZone] = useState<string | null>(browserTz);
  const [toZone, setToZone] = useState<string | null>("UTC");
  const [dtLocalISO, setDtLocalISO] = useState("");

  const [fromQuery, setFromQuery] = useState<string | null>(null);
  const [toQuery, setToQuery] = useState<string | null>(null);
  const [fromResults, setFromResults] = useState<string[]>([]);
  const [toResults, setToResults] = useState<string[]>([]);
  const [fromFocused, setFromFocused] = useState(false);
  const [toFocused, setToFocused] = useState(false);

  const [nlInput, setNlInput] = useState("");
  const [hasBuiltInAI, setHasBuiltInAI] = useState(false);

  // working windows
  const [fromWorkStart, setFromWorkStart] = useState(9);
  const [fromWorkEnd, setFromWorkEnd] = useState(17);
  const [toWorkStart, setToWorkStart] = useState(9);
  const [toWorkEnd, setToWorkEnd] = useState(17);

  const [showFromSettings, setShowFromSettings] = useState(false);
  const [showToSettings, setShowToSettings] = useState(false);

  const [sliderIndex, setSliderIndex] = useState<number | null>(null);

  useEffect(() => {
    const ok = (() => {
      try { if ((navigator && (navigator as any).ai) || (window as any).ai || ((window as any).chrome && (window as any).chrome.ai)) return true; } catch(e){}
      return false;
    })();
    setHasBuiltInAI(ok);
  }, []);

  const timezones = useMemo(() => {
    try { // prefer full Intl list when available
      // @ts-ignore
      const t = Intl.supportedValuesOf ? Intl.supportedValuesOf("timeZone") : null;
      if (Array.isArray(t) && t.length) return t;
    } catch {}
    // fallback shortlist
    return ["UTC","Europe/London","Europe/Paris","Asia/Kolkata","America/New_York","America/Los_Angeles"];
  }, []);

  // Initialize from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    const to = params.get('to');
    const datetime = params.get('datetime');
    
    if (from && timezones.includes(from)) setFromZone(from);
    if (to && timezones.includes(to)) setToZone(to);
    if (datetime) setDtLocalISO(datetime);
  }, [timezones]);

  // Update URL parameters when form values change
  useEffect(() => {
    const params = new URLSearchParams();
    if (fromZone) params.set('from', fromZone);
    if (toZone) params.set('to', toZone);
    if (dtLocalISO) params.set('datetime', dtLocalISO);
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [fromZone, toZone, dtLocalISO]);

  const presets = {
    "Morning": [9, 12],
    "Workday": [9, 17],
    "Evening": [17, 21],
    "All day": [0, 24]
  };

  const aliasMap = useMemo(() => ({ 
    CET: ["Europe/Paris"], 
    CEST: ["Europe/Paris"], 
    PST: ["America/Los_Angeles"], 
    PDT: ["America/Los_Angeles"], 
    IST: ["Asia/Kolkata"], 
    INDIA: ["Asia/Kolkata"], 
    LONDON: ["Europe/London"], 
    UK: ["Europe/London"], 
    PARIS: ["Europe/Paris"] 
  }), []);


  useEffect(() => {
    if (!dtLocalISO) {
      const d = new Date();
      const pad = (n: number)=>String(n).padStart(2,'0');
      setDtLocalISO(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    }
  }, [dtLocalISO]);

  function norm(s: any){ return (s||"").toString().toLowerCase().replace(/[^a-z0-9]+/g,''); }
  function fuzzySearch(q: any){
    if(!q) return timezones;
    const nq = norm(q);
    const set = new Set<string>();
    Object.keys(aliasMap).forEach(k => { 
      if(norm(k).includes(nq)) (aliasMap as any)[k].forEach((tz: string) => set.add(tz)); 
    });
    timezones.forEach(tz => { 
      if(norm(tz).includes(nq) || norm(tz.replace(/\//g,' ')).includes(nq)) set.add(tz); 
    });
    return Array.from(set);
  }

  useEffect(() => {
    if (fromFocused) {
      setFromResults(fromQuery === '' ? timezones : fuzzySearch(fromQuery));
    } else {
      setFromResults([]);
    }
  }, [fromQuery, fromFocused]);
  
  useEffect(() => {
    if (toFocused) {
      setToResults(toQuery === '' ? timezones : fuzzySearch(toQuery));
    } else {
      setToResults([]);
    }
  }, [toQuery, toFocused]);

  // parse a user wall-clock (datetime-local) in a given IANA tz into an instant using Intl only
  function parseLocalInputToDate(localValue: any, fromTz: any){
    if(!localValue) return null;
    const [datePart, timePart] = localValue.split('T');
    if(!datePart) return null;
    const [y,m,d] = datePart.split('-').map(Number);
    const [hh,mm] = (timePart||'00:00').split(':').map(Number);
    try{
      // Create a UTC date with the input values
      const utcDate = new Date(Date.UTC(y, m-1, d, hh, mm));
      
      // Get the timezone offset for fromTz at this UTC time
      const utcTime = utcDate.getTime();
      const localTimeInTz = new Date(utcDate.toLocaleString("en-US", {timeZone: fromTz}));
      const offset = utcTime - localTimeInTz.getTime();
      
      // Return the UTC time that represents the local time in fromTz
      return new Date(utcTime + offset);
    }catch(e){
      console.error('Error parsing date:', e);
      return null;
    }
  }

  function formatForZone(date: any, tz: any){ 
    if(!date) return '—'; 
    try{ 
      return new Intl.DateTimeFormat(undefined, { timeZone: tz, dateStyle:'medium', timeStyle:'short' }).format(date); 
    } catch { 
      return date.toString(); 
    } 
  }

  function instantToLocalISO(instant: any, tz: any){
    if(!instant) return '';
    try{
      const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour12:false, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
      const parts: any = fmt.formatToParts(instant).reduce((a: any, p: any)=>{ 
        if(p.type!=='literal') a[p.type]=p.value; 
        return a; 
      }, {});
      if(!parts.year) return '';
      return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
    } catch { return ''; }
  }

  function getLocalHourDecimal(instant: any, tz: any){
    try {
      const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour12:false, hour:'2-digit', minute:'2-digit' });
      const parts: any = fmt.formatToParts(instant).reduce((a: any, p: any)=>{ 
        if(p.type!=='literal') a[p.type]=p.value; 
        return a; 
      }, {});
      if(!parts.hour) return null;
      return Number(parts.hour) + Number(parts.minute)/60;
    } catch { return null; }
  }

  const inputInstant = useMemo(()=>fromZone ? parseLocalInputToDate(dtLocalISO, fromZone) : null, [dtLocalISO, fromZone]);
  const convertedStr = useMemo(()=>inputInstant && toZone ? formatForZone(inputInstant, toZone) : null, [inputInstant, toZone]);

  // timezone offsets in minutes for an instant (via Intl)
  function tzOffsetMinutes(tz: any, instant: any){
    try {
      const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12:false, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' });
      const parts: any = fmt.formatToParts(instant).reduce((a: any, p: any)=>{ 
        if(p.type!=='literal') a[p.type]=p.value; 
        return a; 
      }, {});
      if(!parts.year) return null;
      const epochLocal = Date.UTC(Number(parts.year), Number(parts.month)-1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
      return (epochLocal - instant.getTime())/60000;
    } catch { return null; }
  }

  const tzDiffHours = useMemo(() => {
    if(!inputInstant || !fromZone || !toZone) return null;
    const offFrom = tzOffsetMinutes(fromZone, inputInstant);
    const offTo = tzOffsetMinutes(toZone, inputInstant);
    if(offFrom == null || offTo == null) return null;
    return (offTo - offFrom) / 60;
  }, [inputInstant, fromZone, toZone]);

  function localYMD(tz: any, instant: any){
    try {
      const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12:false, year:'numeric', month:'2-digit', day:'2-digit' });
      const parts: any = fmt.formatToParts(instant).reduce((a: any, p: any)=>{ 
        if(p.type!=='literal') a[p.type]=p.value; 
        return a; 
      }, {});
      if(!parts.year) return null;
      return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
    } catch { return null; }
  }

  const inputFormatted = useMemo(()=>formatForZone(inputInstant, fromZone), [inputInstant, fromZone]);

  const dayRelation = useMemo(() => {
    if(!inputInstant || !fromZone || !toZone) return null;
    const a = localYMD(fromZone, inputInstant);
    const b = localYMD(toZone, inputInstant);
    if(!a || !b) return null;
    const anum = a.year*10000 + a.month*100 + a.day;
    const bnum = b.year*10000 + b.month*100 + b.day;
    if(bnum > anum) return 'NEXT DAY';
    if(bnum < anum) return 'PREVIOUS DAY';
    return 'SAME DAY';
  }, [inputInstant, fromZone, toZone]);

  function diffLabel(val: any){
    if(val == null) return '±?? hrs';
    const sign = val >= 0 ? '+' : '-';
    const abs = Math.abs(val);
    const h = Math.floor(abs);
    const m = Math.round((abs - h) * 60);
    return `${sign}${h}${m ? `:${String(m).padStart(2,'0')}` : ''} hrs`;
  }

  // compute availability segments (48 half-hour segments) representing the selected date in fromZone
  function buildSegments(){
    const segs: any[] = [];
    if(!dtLocalISO) return segs;
    for(let i=0;i<48;i++){
      const hh = Math.floor(i/2);
      const mm = (i%2)*30;
      const datePart = dtLocalISO.split('T')[0];
      const localISO = `${datePart}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
      const instant = parseLocalInputToDate(localISO, fromZone);
      const fromLocal = getLocalHourDecimal(instant, fromZone);
      const toLocal = getLocalHourDecimal(instant, toZone);
      
      // Check if time is within working hours for from timezone
      let inFrom = false;
      if (fromLocal !== null) {
        if (fromWorkStart <= fromWorkEnd) {
          // Normal range (e.g., 9-17)
          inFrom = fromLocal >= fromWorkStart && fromLocal < fromWorkEnd;
        } else {
          // Overnight range (e.g., 22-6)
          inFrom = fromLocal >= fromWorkStart || fromLocal < fromWorkEnd;
        }
      }
      
      // Check if time is within working hours for to timezone
      let inTo = false;
      if (toLocal !== null) {
        if (toWorkStart <= toWorkEnd) {
          // Normal range (e.g., 9-17)
          inTo = toLocal >= toWorkStart && toLocal < toWorkEnd;
        } else {
          // Overnight range (e.g., 22-6)
          inTo = toLocal >= toWorkStart || toLocal < toWorkEnd;
        }
      }
      
      let status = 'none';
      if(inFrom && inTo) status = 'both';
      else if(inFrom || inTo) status = 'partial';
      segs.push({ i, hh, mm, instant, status });
    }
    return segs;
  }

  const segments = useMemo(()=>buildSegments(), [dtLocalISO, fromZone, toZone, fromWorkStart, fromWorkEnd, toWorkStart, toWorkEnd]);

  // find first contiguous overlap window of 'both'
  const overlapWindow = useMemo(()=>{
    let start = -1, end = -1;
    for(let i=0;i<segments.length;i++){ if(segments[i].status === 'both'){ start = i; break; } }
    if(start === -1) return null;
    end = start;
    for(let i=start+1;i<segments.length;i++){ if(segments[i].status === 'both') end = i; else break; }
    const segToISO = (idx: number) => { 
      const hh=Math.floor(idx/2); 
      const mm=(idx%2)*30; 
      const datePart = dtLocalISO.split('T')[0]; 
      return `${datePart}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`; 
    };
    return { startIdx: start, endIdx: end, startISO: segToISO(start), endISO: segToISO(end) };
  }, [segments, dtLocalISO]);

  // slider init
  useEffect(()=>{
    if(!dtLocalISO || !fromZone) return;
    
    // Parse the input datetime as if it's in the from timezone
    const instant = parseLocalInputToDate(dtLocalISO, fromZone);
    if (!instant) return;
    
    // Get the local hour in the from timezone
    const localHourDecimal = getLocalHourDecimal(instant, fromZone);
    if (localHourDecimal === null) return;
    
    // Convert to slider index (48 half-hour segments)
    const hh = Math.floor(localHourDecimal);
    const mm = (localHourDecimal % 1) * 60;
    const idx = hh*2 + (mm>=30?1:0);
    
    setSliderIndex(idx);
  }, [dtLocalISO, fromZone]);

  function onSliderChange(idx: number){ 
    setSliderIndex(idx); 
    const datePart = dtLocalISO.split('T')[0] || new Date().toISOString().slice(0,10); 
    const hh = Math.floor(idx/2); 
    const mm = (idx%2)*30; 
    const newISO = `${datePart}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`; 
    setDtLocalISO(newISO); 
  }

  function handleSwap(){
    const tmp = fromZone;
    setFromZone(toZone);
    setToZone(tmp);
    // Swap work settings too
    const tmpStart = fromWorkStart;
    const tmpEnd = fromWorkEnd;
    setFromWorkStart(toWorkStart);
    setFromWorkEnd(toWorkEnd);
    setToWorkStart(tmpStart);
    setToWorkEnd(tmpEnd);
  }

  // natural language parsing (built-in browser AI only)
  async function parseNaturalWithBuiltIn(text: any){
    if(!hasBuiltInAI) return false;
    const instruction = `Parse the following natural language time expression and return JSON with two fields:
- \"iso\": local datetime in YYYY-MM-DDTHH:MM,
- \"iana\": IANA timezone if mentioned or empty string.
Return only JSON.
Text: \"${text}\"`;
    try {
      if(typeof (navigator as any).ai?.prompt === 'function'){ 
        const r = await (navigator as any).ai.prompt(instruction, { temperature: 0.0 }); 
        const txt = (r?.text || '').trim(); 
        return handleAI(txt); 
      }
      if(typeof (window as any).chrome?.ai?.sendPrompt === 'function'){ 
        const r = await (window as any).chrome.ai.sendPrompt(instruction, { temperature: 0.0 }); 
        const txt = (r?.result || '').trim(); 
        return handleAI(txt); 
      }
    } catch(e){ 
      console.warn('AI parse failed', e); 
      return false; 
    }

    function handleAI(resp: any){
      if(!resp) return false;
      const start = resp.indexOf('{'), end = resp.lastIndexOf('}');
      if(start === -1 || end === -1) return false;
      try {
        const j = JSON.parse(resp.slice(start, end+1));
        if(j.iso){
          setDtLocalISO((j.iso || '').replace(' ', 'T').slice(0,16));
          if(j.iana && timezones.includes(j.iana)) setFromZone(j.iana);
          return true;
        }
      } catch(e){ 
        console.warn('bad JSON', e); 
      }
      return false;
    }
  }

  async function onParseNL(){ 
    if(!hasBuiltInAI) return alert('Built-in browser AI not available'); 
    const ok = await parseNaturalWithBuiltIn(nlInput); 
    if(!ok) alert('AI could not parse the phrase.'); 
  }

  function shortTimeForZone(date: any, tz: any){ 
    if(!date) return '—'; 
    try{ 
      const fmt = new Intl.DateTimeFormat(undefined, { timeZone: tz, timeStyle: 'short' }); 
      return fmt.format(date); 
    } catch { 
      return formatForZone(date,tz); 
    } 
  }

  function humanSentence(){
    if(!inputInstant || !convertedStr) return '';
    const diff = tzDiffHours;
    const diffText = diff == null ? '±?? hrs' : diffLabel(diff);
    const convertedShort = shortTimeForZone(inputInstant, toZone);
    let dayPrefix = '';
    if(dayRelation === 'PREVIOUS DAY') dayPrefix = '(previous day) ';
    else if(dayRelation === 'NEXT DAY') dayPrefix = '(next day) ';
    return `${inputFormatted} (${fromZone}) is ${dayPrefix}${convertedShort} (${diffText}) in ${toZone}.`;
  }

  const sentence = humanSentence();

  // apply preset helper
  function applyPresetFor(which: string, name: string){
    const p = (presets as any)[name];
    if(!p) return;
    if(which === 'from'){ 
      setFromWorkStart(p[0]); 
      setFromWorkEnd(p[1]); 
    } else { 
      setToWorkStart(p[0]); 
      setToWorkEnd(p[1]); 
    }
  }

  // Generate time options for select elements
  const timeOptions = Array.from({length:48}).map((_,i)=>{
    const hh=Math.floor(i/2);
    const mm=i%2?':30':'';
    const v=hh+(i%2?0.5:0);
    return { 
      i, 
      value: v, 
      label: `${String(hh).padStart(2,'0')}${mm}`
    };
  });

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl p-6 rounded-2xl bg-white/95 backdrop-blur-md border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Timezone Converter</h1>

        {/* row 1: inputs with vertical separator */}
        <div className="flex flex-col md:flex-row gap-4 mb-4 items-end">
          <div className="flex-1">
            <label className="text-sm text-slate-600">Date & time</label>
            <input type="datetime-local" value={dtLocalISO} onChange={e=>setDtLocalISO(e.target.value)} className="w-full mt-2 rounded-lg border px-3 py-2 bg-white" />
          </div>

          <div className="hidden md:block w-px bg-gray-200 h-12" />

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-600">From</label>
              <div className="mt-2 flex items-center gap-2 relative">
                <div className="flex-1 relative">
                  <input value={fromQuery !== null ? fromQuery : fromZone || ''} onChange={e=>setFromQuery(e.target.value)} onFocus={()=>{setFromFocused(true); setFromQuery('');}} onBlur={(e) => { if (!e.target.value) { setFromQuery(null); setFromZone(null); } setFromFocused(false); }} className="w-full rounded-lg border px-3 py-2 pr-10 bg-white" placeholder="Type or pick timezone" />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
                  {fromFocused && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow max-h-40 overflow-auto z-10">
                      {fromResults.map(tz => <div key={tz} onMouseDown={()=>{ setFromZone(tz); setFromQuery(null); setFromFocused(false); }} className="px-3 py-2 cursor-pointer hover:bg-gray-100">{tz} <span className="text-xs text-slate-400 ml-2">{formatForZone(new Date(),tz)}</span></div>)}
                    </div>
                  )}
                </div>
                <button title="Working hours" onClick={()=>setShowFromSettings(true)} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200">⚙️</button>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-600">To</label>
              <div className="mt-2 flex items-center gap-2 relative">
                <div className="flex-1 relative">
                  <input value={toQuery !== null ? toQuery : toZone || ''} onChange={e=>setToQuery(e.target.value)} onFocus={()=>{setToFocused(true); setToQuery('');}} onBlur={(e) => { if (!e.target.value) { setToQuery(null); setToZone(null); } setToFocused(false); }} className="w-full rounded-lg border px-3 py-2 pr-10 bg-white" placeholder="Type or pick timezone" />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
                  {toFocused && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow max-h-40 overflow-auto z-10">
                      {toResults.map(tz => <div key={tz} onMouseDown={()=>{ setToZone(tz); setToQuery(null); setToFocused(false); }} className="px-3 py-2 cursor-pointer hover:bg-gray-100">{tz} <span className="text-xs text-slate-400 ml-2">{formatForZone(new Date(),tz)}</span></div>)}
                    </div>
                  )}
                </div>
                <button aria-label="Swap" onClick={handleSwap} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200">⇄</button>
                <button title="Working hours" onClick={()=>setShowToSettings(true)} className="p-2 rounded-md bg-gray-100 hover:bg-gray-200">⚙️</button>
              </div>
            </div>
          </div>
        </div>

        {/* settings popups */}
        {showFromSettings && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md bg-white rounded-lg p-4 shadow-lg">
              <h3 className="font-semibold mb-2">From — Working hours (half-hour steps)</h3>
              <div className="flex gap-2 mb-3">
                <select value={fromWorkStart} onChange={e=>setFromWorkStart(Number(e.target.value))} className="flex-1 rounded border px-2 py-1">
                  {timeOptions.map(opt => (
                    <option key={opt.i} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <select value={fromWorkEnd} onChange={e=>setFromWorkEnd(Number(e.target.value))} className="flex-1 rounded border px-2 py-1">
                  {timeOptions.map(opt => (
                    <option key={opt.i} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 mb-4">
                {Object.keys(presets).map(p => <button key={p} onClick={()=>applyPresetFor('from',p)} className="px-3 py-1 rounded border">{p}</button>)}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={()=>setShowFromSettings(false)} className="px-3 py-1 rounded bg-gray-100">Close</button>
              </div>
            </div>
          </div>
        )}

        {showToSettings && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md bg-white rounded-lg p-4 shadow-lg">
              <h3 className="font-semibold mb-2">To — Working hours (half-hour steps)</h3>
              <div className="flex gap-2 mb-3">
                <select value={toWorkStart} onChange={e=>setToWorkStart(Number(e.target.value))} className="flex-1 rounded border px-2 py-1">
                  {timeOptions.map(opt => (
                    <option key={opt.i} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <select value={toWorkEnd} onChange={e=>setToWorkEnd(Number(e.target.value))} className="flex-1 rounded border px-2 py-1">
                  {timeOptions.map(opt => (
                    <option key={opt.i} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 mb-4">
                {Object.keys(presets).map(p => <button key={p} onClick={()=>applyPresetFor('to',p)} className="px-3 py-1 rounded border">{p}</button>)}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={()=>setShowToSettings(false)} className="px-3 py-1 rounded bg-gray-100">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* natural language */}
        {hasBuiltInAI && (
          <div className="mb-4 p-3 rounded-md bg-white/50 border">
            <div className="flex gap-3 items-center">
              <input value={nlInput} onChange={e=>setNlInput(e.target.value)} className="flex-1 rounded-lg px-3 py-2 border bg-white" placeholder="Enter natural language time expression" />
              <button onClick={onParseNL} className="px-4 py-2 rounded-lg bg-slate-800 text-white">Parse</button>
              <a className="text-sm text-slate-600 underline" href="https://developer.chrome.com/docs/ai/built-in/" target="_blank" rel="noreferrer">Chrome AI guide</a>
            </div>
          </div>
        )}

        {/* slider + overlap */}
        <div className="mb-4">
          <label className="text-sm text-slate-600">Quick hour slider (half-hour steps)</label>
          <input type="range" min={0} max={47} value={sliderIndex ?? 0} onChange={e=>onSliderChange(Number(e.target.value))} className="w-full mt-2" />
          <div className="mt-2 flex gap-1 items-center">
            {segments.map(s => <div key={s.i} title={`${String(s.hh).padStart(2,'0')}:${s.mm===0?'00':'30'}`} style={{flex:1,height:14,borderRadius:3,background:s.status==='both'?'#4ade80':s.status==='partial'?'#fde68a':'#fecaca'}} />)}
          </div>
          <div className="mt-2 text-sm text-slate-700">
            {overlapWindow ? (<div>Overlap window (both working): <strong>{instantToLocalISO(parseLocalInputToDate(overlapWindow.startISO, fromZone), fromZone).slice(0,16).replace('T',' ')} — {instantToLocalISO(parseLocalInputToDate(overlapWindow.endISO, fromZone), fromZone).slice(0,16).replace('T',' ')}</strong> (in {fromZone} local)</div>) : (<div>No full overlap on this date.</div>)}
          </div>
          <div className="mt-3 text-xs text-slate-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{background: '#4ade80'}}></div>
                <span>Both timezones working</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{background: '#fde68a'}}></div>
                <span>One timezone working</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{background: '#fecaca'}}></div>
                <span>Neither timezone working</span>
              </div>
            </div>
          </div>
        </div>

        {/* result */}
        <div className="p-4 rounded-xl bg-white/80 border border-gray-100 shadow-sm">
          <div className="text-xs text-slate-500 mb-1">Converted time</div>
          <div className="text-2xl font-semibold text-slate-900">{convertedStr ? `${convertedStr} ${toZone}` : '—'}</div>

          {convertedStr && sentence && (
            <div className="mt-3 text-slate-700 text-sm">
              <strong>{sentence}</strong>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
