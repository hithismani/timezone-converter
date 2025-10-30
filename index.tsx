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
  const [isSliderDragging, setIsSliderDragging] = useState(false);

  useEffect(() => {
    const ok = (() => {
      try { if ((navigator && (navigator as any).ai) || (window as any).ai || ((window as any).chrome && (window as any).chrome.ai)) return true; } catch(e){}
      return false;
    })();
    setHasBuiltInAI(ok);
  }, []);

  // Load add-to-calendar-button script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/add-to-calendar-button@2';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    return () => {
      // Cleanup: remove script if component unmounts
      const existingScript = document.querySelector('script[src="https://cdn.jsdelivr.net/npm/add-to-calendar-button@2"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
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

  // Save working hours to localStorage
  useEffect(() => {
    const workingHours = {
      fromWorkStart,
      fromWorkEnd,
      toWorkStart,
      toWorkEnd
    };
    localStorage.setItem('timezoneHelper_workingHours', JSON.stringify(workingHours));
  }, [fromWorkStart, fromWorkEnd, toWorkStart, toWorkEnd]);

  // Save timezone selections to localStorage
  useEffect(() => {
    const timezoneSettings = {
      fromZone,
      toZone
    };
    localStorage.setItem('timezoneHelper_timezones', JSON.stringify(timezoneSettings));
  }, [fromZone, toZone]);

  // Load working hours from localStorage on component mount
  useEffect(() => {
    const savedWorkingHours = localStorage.getItem('timezoneHelper_workingHours');
    if (savedWorkingHours) {
      try {
        const parsed = JSON.parse(savedWorkingHours);
        if (parsed.fromWorkStart !== undefined) setFromWorkStart(parsed.fromWorkStart);
        if (parsed.fromWorkEnd !== undefined) setFromWorkEnd(parsed.fromWorkEnd);
        if (parsed.toWorkStart !== undefined) setToWorkStart(parsed.toWorkStart);
        if (parsed.toWorkEnd !== undefined) setToWorkEnd(parsed.toWorkEnd);
      } catch (e) {
        console.warn('Failed to parse saved working hours:', e);
      }
    }
  }, []);

  // Load timezone selections from localStorage on component mount (after URL params)
  useEffect(() => {
    const savedTimezones = localStorage.getItem('timezoneHelper_timezones');
    if (savedTimezones) {
      try {
        const parsed = JSON.parse(savedTimezones);
        // Only set if not already set by URL parameters
        if (parsed.fromZone && timezones.includes(parsed.fromZone) && !fromZone) {
          setFromZone(parsed.fromZone);
        }
        if (parsed.toZone && timezones.includes(parsed.toZone) && !toZone) {
          setToZone(parsed.toZone);
        }
      } catch (e) {
        console.warn('Failed to parse saved timezones:', e);
      }
    }
  }, [timezones, fromZone, toZone]);

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

  // Parse timezone from datetime input and update fromZone if needed
  useEffect(() => {
    if (!dtLocalISO) return;
    
    // Check if the input contains timezone information
    const timezonePatterns = [
      /\b(UTC|GMT)\b/i,
      /\b(EST|EDT|CST|CDT|MST|MDT|PST|PDT)\b/i,
      /\b(Asia\/[A-Za-z_]+)\b/i,
      /\b(Europe\/[A-Za-z_]+)\b/i,
      /\b(America\/[A-Za-z_]+)\b/i,
      /\b(Africa\/[A-Za-z_]+)\b/i,
      /\b(Australia\/[A-Za-z_]+)\b/i,
      /\b(Pacific\/[A-Za-z_]+)\b/i,
      /\b(Atlantic\/[A-Za-z_]+)\b/i,
      /\b(Indian\/[A-Za-z_]+)\b/i
    ];
    
    for (const pattern of timezonePatterns) {
      const match = dtLocalISO.match(pattern);
      if (match) {
        let detectedTz = match[0];
        
        // Handle common timezone abbreviations
        const tzMap: { [key: string]: string } = {
          'UTC': 'UTC',
          'GMT': 'UTC',
          'EST': 'America/New_York',
          'EDT': 'America/New_York',
          'CST': 'America/Chicago',
          'CDT': 'America/Chicago',
          'MST': 'America/Denver',
          'MDT': 'America/Denver',
          'PST': 'America/Los_Angeles',
          'PDT': 'America/Los_Angeles'
        };
        
        if (tzMap[detectedTz.toUpperCase()]) {
          detectedTz = tzMap[detectedTz.toUpperCase()];
        }
        
        // Check if this timezone is valid and update fromZone
        if (timezones.includes(detectedTz)) {
          setFromZone(detectedTz);
        }
        break;
      }
    }
  }, [dtLocalISO, timezones]);

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
    if(!localValue || !fromTz) return null;
    
    // Check if the input contains timezone information
    const timezonePatterns = [
      /\b(UTC|GMT)\b/i,
      /\b(EST|EDT|CST|CDT|MST|MDT|PST|PDT)\b/i,
      /\b(Asia\/[A-Za-z_]+)\b/i,
      /\b(Europe\/[A-Za-z_]+)\b/i,
      /\b(America\/[A-Za-z_]+)\b/i,
      /\b(Africa\/[A-Za-z_]+)\b/i,
      /\b(Australia\/[A-Za-z_]+)\b/i,
      /\b(Pacific\/[A-Za-z_]+)\b/i,
      /\b(Atlantic\/[A-Za-z_]+)\b/i,
      /\b(Indian\/[A-Za-z_]+)\b/i
    ];
    
    let inputTz = fromTz; // Default to fromTz
    let cleanValue = localValue;
    
    // Check if input contains timezone info
    for (const pattern of timezonePatterns) {
      const match = localValue.match(pattern);
      if (match) {
        let detectedTz = match[0];
        
        // Handle common timezone abbreviations
        const tzMap: { [key: string]: string } = {
          'UTC': 'UTC',
          'GMT': 'UTC',
          'EST': 'America/New_York',
          'EDT': 'America/New_York',
          'CST': 'America/Chicago',
          'CDT': 'America/Chicago',
          'MST': 'America/Denver',
          'MDT': 'America/Denver',
          'PST': 'America/Los_Angeles',
          'PDT': 'America/Los_Angeles'
        };
        
        if (tzMap[detectedTz.toUpperCase()]) {
          detectedTz = tzMap[detectedTz.toUpperCase()];
        }
        
        if (timezones.includes(detectedTz)) {
          inputTz = detectedTz;
          // Remove timezone from the value for parsing
          cleanValue = localValue.replace(pattern, '').trim();
        }
        break;
      }
    }
    
    try{
      // Try to parse as ISO format first (YYYY-MM-DDTHH:MM)
      if (cleanValue.includes('T') && cleanValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)) {
        const [datePart, timePart] = cleanValue.split('T');
        const [y,m,d] = datePart.split('-').map(Number);
        const [hh,mm] = (timePart||'00:00').split(':').map(Number);
        
        // Create a date string in the format we need: YYYY-MM-DDTHH:MM
        const targetLocal = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
        
        // Use a more reliable approach: create a date around noon UTC on that day,
        // then adjust based on the timezone offset
        const noonUTC = new Date(Date.UTC(y, m-1, d, 12, 0, 0));
        
        // Get the offset for this timezone at this date
        const formatter = new Intl.DateTimeFormat('en-CA', { 
          timeZone: inputTz, 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
        
        // Find the UTC time that when formatted in inputTz gives us our target local time
        // Use binary search with wider bounds to handle all timezones
        let low = new Date(noonUTC.getTime() - 18 * 60 * 60 * 1000); // 18 hours before (covers UTC-12)
        let high = new Date(noonUTC.getTime() + 18 * 60 * 60 * 1000); // 18 hours after (covers UTC+12)
        
        for (let i = 0; i < 50; i++) { // Increased iterations for better accuracy
          const mid = new Date((low.getTime() + high.getTime()) / 2);
          const parts: any = {};
          formatter.formatToParts(mid).forEach((p: any) => {
            if(p.type !== 'literal') parts[p.type] = p.value;
          });
          
          if (!parts.year || !parts.month || !parts.day || !parts.hour || !parts.minute) {
            break;
          }
          
          const formattedISO = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
          
          if (formattedISO === targetLocal) {
            return mid;
          } else if (formattedISO < targetLocal) {
            low = mid;
          } else {
            high = mid;
          }
          
          // Check if we're close enough (within 1 minute)
          if (Math.abs(low.getTime() - high.getTime()) < 60000) {
            return mid;
          }
        }
        
        // Fallback: calculate using timezone offset
        // Create a test UTC date and find the offset
        const testDateUTC = new Date(Date.UTC(y, m-1, d, 12, 0, 0)); // Use noon to avoid DST issues
        const testFormatted = formatter.formatToParts(testDateUTC).reduce((acc: any, p: any) => {
          if(p.type !== 'literal') acc[p.type] = p.value;
          return acc;
        }, {});
        
        if (testFormatted.year && testFormatted.month && testFormatted.day && testFormatted.hour && testFormatted.minute) {
          // Calculate what time it is in the timezone for noon UTC
          const tzHour = Number(testFormatted.hour);
          const tzMinute = Number(testFormatted.minute);
          
          // Calculate the offset (difference between UTC noon and timezone time)
          const tzTimeMinutes = tzHour * 60 + tzMinute;
          const utcTimeMinutes = 12 * 60; // noon UTC
          let offsetMinutes = tzTimeMinutes - utcTimeMinutes;
          
          // Normalize offset to -12 to +12 hours range
          if (offsetMinutes > 12 * 60) offsetMinutes -= 24 * 60;
          if (offsetMinutes < -12 * 60) offsetMinutes += 24 * 60;
          
          // Now calculate what UTC time corresponds to our target local time
          const targetMinutes = hh * 60 + mm;
          const utcTargetMinutes = targetMinutes - offsetMinutes;
          
          // Convert back to UTC date
          let utcHours = Math.floor(utcTargetMinutes / 60);
          let utcMins = utcTargetMinutes % 60;
          
          // Handle day boundaries
          if (utcMins < 0) {
            utcMins += 60;
            utcHours -= 1;
          }
          if (utcHours < 0) {
            utcHours += 24;
          }
          if (utcHours >= 24) {
            utcHours -= 24;
          }
          
          return new Date(Date.UTC(y, m-1, d, utcHours, utcMins, 0));
        }
        
        return testDateUTC;
      }
      
      // Try to parse as natural language date (e.g., "Oct 24, 2025, 8:30")
      const naturalDate = new Date(cleanValue);
      if (!isNaN(naturalDate.getTime())) {
        // For natural language dates, treat as UTC and convert
        const y = naturalDate.getUTCFullYear();
        const m = naturalDate.getUTCMonth() + 1;
        const d = naturalDate.getUTCDate();
        const hh = naturalDate.getUTCHours();
        const mm = naturalDate.getUTCMinutes();
        
        const targetLocal = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
        const noonUTC = new Date(Date.UTC(y, m-1, d, 12, 0, 0));
        
        const formatter = new Intl.DateTimeFormat('en-CA', { 
          timeZone: inputTz, 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
        
        let low = new Date(noonUTC.getTime() - 12 * 60 * 60 * 1000);
        let high = new Date(noonUTC.getTime() + 12 * 60 * 60 * 1000);
        
        for (let i = 0; i < 30; i++) {
          const mid = new Date((low.getTime() + high.getTime()) / 2);
          const parts: any = {};
          formatter.formatToParts(mid).forEach((p: any) => {
            if(p.type !== 'literal') parts[p.type] = p.value;
          });
          
          if (!parts.year || !parts.month || !parts.day || !parts.hour || !parts.minute) {
            break;
          }
          
          const formattedISO = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
          
          if (formattedISO === targetLocal) {
            return mid;
          } else if (formattedISO < targetLocal) {
            low = mid;
          } else {
            high = mid;
          }
          
          if (Math.abs(low.getTime() - high.getTime()) < 60000) {
            return mid;
          }
        }
        
        return naturalDate;
      }
      
      return null;
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

  // Helper function to format time in 12-hour format with AM/PM
  function formatTime12Hour(hh: number, mm: number): string {
    const hour12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
    const ampm = hh >= 12 ? 'PM' : 'AM';
    return `${hour12}:${String(mm).padStart(2,'0')} ${ampm}`;
  }

  const inputInstant = useMemo(()=>fromZone ? parseLocalInputToDate(dtLocalISO, fromZone) : null, [dtLocalISO, fromZone]);
  const convertedStr = useMemo(()=>inputInstant && toZone ? formatForZone(inputInstant, toZone) : null, [inputInstant, toZone]);

  // Calculate position indicator data - FROM timezone (purple indicator)
  // Extract time directly from dtLocalISO since it's already in fromZone format
  const positionIndicator = useMemo(() => {
    if (!dtLocalISO || !fromZone) return null;
    const timePart = dtLocalISO.split('T')[1];
    if (!timePart) return null;
    const [hhStr, mmStr] = timePart.split(':');
    const hh = parseInt(hhStr, 10);
    const mm = parseInt(mmStr || '0', 10);
    if (isNaN(hh) || isNaN(mm)) return null;
    const totalMinutes = hh * 60 + mm;
    const positionPercent = (totalMinutes / (24 * 60)) * 100;
    return { hh, mm, positionPercent };
  }, [dtLocalISO, fromZone]);

  // Calculate position indicator data - TO timezone (grey indicator)
  // Uses inputInstant as the single source of truth
  const positionIndicatorTo = useMemo(() => {
    if (!inputInstant || !toZone) return null;
    
    // If timezones are the same, use the same time as positionIndicator
    if (fromZone === toZone && positionIndicator) {
      return positionIndicator;
    }
    
    // Get the time in the toZone for this instant
    const localHourDecimal = getLocalHourDecimal(inputInstant, toZone);
    if (localHourDecimal === null) return null;
    
    // Normalize to 0-24 range for display
    let normalizedHour = localHourDecimal;
    if (normalizedHour < 0) normalizedHour += 24;
    if (normalizedHour >= 24) normalizedHour -= 24;
    
    const hh = Math.floor(normalizedHour);
    const mm = Math.round((normalizedHour % 1) * 60);
    const totalMinutes = hh * 60 + mm;
    const positionPercent = (totalMinutes / (24 * 60)) * 100;
    
    // Ensure positionPercent is within valid range
    if (positionPercent < 0 || positionPercent > 100) return null;
    
    return { hh, mm, positionPercent };
  }, [inputInstant, toZone, fromZone, positionIndicator]);

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

  function formatLocalISOForDisplay(localISO: string, tz: string){
    if(!localISO || !tz) return '—';
    try {
      // Use inputInstant if available, otherwise parse
      const instant = parseLocalInputToDate(localISO, tz);
      if(!instant) return '—';
      
      // Format it nicely
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      return formatter.format(instant);
    } catch {
      return localISO;
    }
  }

  const inputFormatted = useMemo(()=>{
    if(!dtLocalISO || !fromZone) return null;
    // Format directly from dtLocalISO to ensure accuracy
    // Parse it fresh to get the correct instant for display
    const instant = parseLocalInputToDate(dtLocalISO, fromZone);
    if(!instant) return null;
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: fromZone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return formatter.format(instant);
  }, [dtLocalISO, fromZone]);

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

  // Format date/time for add-to-calendar-button
  const calendarEventData = useMemo(() => {
    if (!inputInstant || !fromZone || !toZone || !dtLocalISO) return null;
    
    try {
      // Format start date/time from fromZone
      const fromFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: fromZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      const fromParts = fromFormatter.formatToParts(inputInstant).reduce((acc: any, p: any) => {
        if (p.type !== 'literal') acc[p.type] = p.value;
        return acc;
      }, {});
      
      const startDate = `${fromParts.year}-${fromParts.month}-${fromParts.day}`;
      const startTime = `${fromParts.hour}:${fromParts.minute}`;
      
      // Format end time (default to 1 hour later, same day)
      const endInstant = new Date(inputInstant.getTime() + 60 * 60 * 1000);
      const endParts = fromFormatter.formatToParts(endInstant).reduce((acc: any, p: any) => {
        if (p.type !== 'literal') acc[p.type] = p.value;
        return acc;
      }, {});
      
      const endDate = `${endParts.year}-${endParts.month}-${endParts.day}`;
      const endTime = `${endParts.hour}:${endParts.minute}`;
      
      // Create description with timezone conversion summary
      const diff = tzDiffHours;
      const diffText = diff == null ? '±?? hrs' : diffLabel(diff);
      const convertedShort = shortTimeForZone(inputInstant, toZone);
      let dayPrefix = '';
      if(dayRelation === 'PREVIOUS DAY') dayPrefix = '(previous day) ';
      else if(dayRelation === 'NEXT DAY') dayPrefix = '(next day) ';
      
      const description = `Timezone Conversion: ${inputFormatted || 'N/A'} (${fromZone}) ${dayPrefix}is ${convertedShort} (${diffText}) in ${toZone}.`;
      
      return {
        name: `Meeting/Event (${fromZone} → ${toZone})`,
        description,
        startDate,
        startTime,
        endDate,
        endTime,
        timeZone: fromZone
      };
    } catch {
      return null;
    }
  }, [inputInstant, fromZone, toZone, dtLocalISO, tzDiffHours, dayRelation, inputFormatted]);

  // compute availability segments (96 15-minute segments) representing the selected date in fromZone
  function buildSegments(){
    const segs: any[] = [];
    if(!dtLocalISO) return segs;
    for(let i=0;i<96;i++){
      const hh = Math.floor(i/4);
      const mm = (i%4)*15;
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
      else if(inFrom) status = 'from';
      else if(inTo) status = 'to';
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
    
    // Use the actual instant from segments to get correct times in both timezones
    const startInstant = segments[start]?.instant;
    // The end segment's instant represents the start of that segment (e.g., 6:45)
    // For display purposes, we show the start of the last overlapping segment as the end time
    const endInstant = segments[end]?.instant;
    
    if (!startInstant || !endInstant) return null;
    
    // Get the local ISO strings for the start and end times in the from timezone
    const startISOFrom = instantToLocalISO(startInstant, fromZone);
    const endISOFrom = instantToLocalISO(endInstant, fromZone);
    
    return { 
      startIdx: start, 
      endIdx: end, 
      startISO: startISOFrom, 
      endISO: endISOFrom,
      startInstant,
      endInstant
    };
  }, [segments, fromZone]);

  // sliderIndex is derived from positionIndicator - no need for separate useEffect
  // Removed redundant calculation that was recalculating parseLocalInputToDate

  function onSliderChange(idx: number){ 
    // Update dtLocalISO directly - all other values will derive from it
    const datePart = dtLocalISO.split('T')[0] || new Date().toISOString().slice(0,10); 
    const hh = Math.floor(idx/4); 
    const mm = (idx%4)*15; 
    const newISO = `${datePart}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`; 
    setDtLocalISO(newISO); 
  }

  function onSliderMouseDown() {
    setIsSliderDragging(true);
  }

  function onSliderMouseUp() {
    setIsSliderDragging(false);
  }

  function handleSwap(){
    // Get the current instant (point in time) before swapping
    if (!inputInstant || !fromZone || !toZone) {
      // Just swap timezones if we don't have a valid instant
      const tmp = fromZone;
      setFromZone(toZone);
      setToZone(tmp);
      const tmpStart = fromWorkStart;
      const tmpEnd = fromWorkEnd;
      setFromWorkStart(toWorkStart);
      setFromWorkEnd(toWorkEnd);
      setToWorkStart(tmpStart);
      setToWorkEnd(tmpEnd);
      return;
    }
    
    // Convert the current time to what it will be in the new "from" timezone
    // When swapping: old "to" becomes new "from"
    // So show what time it currently is in the old "to" timezone
    const newLocalISO = instantToLocalISO(inputInstant, toZone);
    
    // Swap timezones
    const tmpZone = fromZone;
    
    // Swap work settings
    const tmpStart = fromWorkStart;
    const tmpEnd = fromWorkEnd;
    
    // Update all states together - React will batch these
    setFromZone(toZone);
    setToZone(tmpZone);
    setFromWorkStart(toWorkStart);
    setFromWorkEnd(toWorkEnd);
    setToWorkStart(tmpStart);
    setToWorkEnd(tmpEnd);
    
    // Update the datetime input to show the time in the new "from" timezone
    if (newLocalISO) {
      setDtLocalISO(newLocalISO);
    }
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

  function formatTimeWithDateIfDifferent(instant: Date, tz: string, baseInstant: Date, baseTz: string){
    if(!instant) return '—';
    try {
      // Get date in target timezone
      const tzDateParts = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(instant);
      // Get date in base timezone (fromZone)
      const baseDateParts = new Intl.DateTimeFormat('en-US', { timeZone: baseTz, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(baseInstant);
      
      const tzDateStr = `${tzDateParts.find(p => p.type === 'year')?.value}-${tzDateParts.find(p => p.type === 'month')?.value}-${tzDateParts.find(p => p.type === 'day')?.value}`;
      const baseDateStr = `${baseDateParts.find(p => p.type === 'year')?.value}-${baseDateParts.find(p => p.type === 'month')?.value}-${baseDateParts.find(p => p.type === 'day')?.value}`;
      
      const timeStr = shortTimeForZone(instant, tz);
      const dateDiffers = tzDateStr !== baseDateStr;
      
      if(dateDiffers) {
        const dateStr = new Intl.DateTimeFormat('en-US', { timeZone: tz, month: 'short', day: 'numeric', year: 'numeric' }).format(instant);
        return `${dateStr} ${timeStr}`;
      }
      return timeStr;
    } catch {
      return shortTimeForZone(instant, tz);
    }
  }

  function getShortTimezoneName(tz: string){
    if(!tz) return '';
    const parts = tz.split('/');
    return parts[parts.length - 1].replace(/_/g, ' ');
  }

  function humanSentence(){
    if(!inputInstant || !convertedStr) return null;
    const diff = tzDiffHours;
    const diffText = diff == null ? '±?? hrs' : diffLabel(diff);
    const convertedShort = shortTimeForZone(inputInstant, toZone);
    let dayPrefix = '';
    if(dayRelation === 'PREVIOUS DAY') dayPrefix = '(previous day) ';
    else if(dayRelation === 'NEXT DAY') dayPrefix = '(next day) ';
    
    return (
      <>
        <span className="font-semibold">{inputFormatted}</span> ({fromZone}) <span className="font-semibold">is</span> {dayPrefix}
        <span className="font-semibold">{convertedShort}</span> ({diffText}) <span className="font-semibold">in</span> {toZone}.
      </>
    );
  }

  const sentence = humanSentence();

  // Clock component for displaying time visually
  function ClockDisplay({ time, timezone, label }: { time: Date | null, timezone: string | null, label: string }) {
    if (!time || !timezone) return null;
    
    // Format the time in the specific timezone
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const parts = formatter.formatToParts(time).reduce((acc: any, part: any) => {
      if (part.type !== 'literal') acc[part.type] = part.value;
      return acc;
    }, {});
    
    const hours = parseInt(parts.hour);
    const minutes = parseInt(parts.minute);
    
    // Calculate angles for clock hands
    const hourAngle = (hours % 12) * 30 + (minutes / 60) * 30;
    const minuteAngle = minutes * 6;
    
    return (
      <div className="flex flex-col items-center">
        <div className="text-sm font-medium text-slate-700 mb-3">{label}</div>
        <div className="relative w-20 h-20 rounded-full border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-md">
          {/* Clock face */}
          <div className="absolute inset-0 rounded-full">
            {/* Hour markers */}
            {Array.from({length: 12}, (_, i) => (
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
            
            {/* Hour hand */}
            <div
              className="absolute w-1 h-5 bg-gray-800 origin-bottom rounded-full"
              style={{
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -100%) rotate(${hourAngle}deg)`
              }}
            />
            
            {/* Minute hand */}
            <div
              className="absolute w-1 h-7 bg-gray-600 origin-bottom rounded-full"
              style={{
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)`
              }}
            />
            
            {/* Center dot */}
            <div className="absolute w-2 h-2 bg-gray-800 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-sm" />
          </div>
        </div>
        <div className="text-sm font-semibold text-slate-800 mt-2 font-mono">
          {String(hours).padStart(2,'0')}:{String(minutes).padStart(2,'0')}
        </div>
        <div className="text-xs font-medium text-slate-600 mt-1">{timezone}</div>
      </div>
    );
  }

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

  // Generate time options for select elements (15-minute intervals)
  const timeOptions = Array.from({length:96}).map((_,i)=>{
    const hh=Math.floor(i/4);
    const mm=(i%4)*15;
    const v=hh+(mm/60);
    return { 
      i, 
      value: v, 
      label: `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-gray-50 flex items-start justify-center py-8 px-4">
      <div className="w-full max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-600 to-gray-500 bg-clip-text text-transparent mb-2">
            Timezone Converter
          </h1>
          <p className="text-slate-600 text-sm">Convert times between timezones and find optimal meeting windows</p>
        </div>

        {/* Natural Language Input - Moved to top */}
        {hasBuiltInAI && (
          <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-gray-500 via-gray-600 to-gray-500 shadow-lg backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="flex-1 relative">
                <input 
                  value={nlInput} 
                  onChange={e=>setNlInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && onParseNL()}
                  className="w-full rounded-xl px-4 py-3 bg-white/95 border border-white/40 placeholder-slate-400 focus:ring-2 focus:ring-white focus:border-transparent shadow-sm text-slate-700" 
                  placeholder="Try: 'Next Monday 2pm in New York' or 'Tomorrow morning in London'" 
                  tabIndex={8} 
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-400">Press Enter</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={onParseNL} 
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
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">

          {/* Left Column - Input Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-500 to-gray-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm text-white font-bold text-lg shadow-md">1</div>
                    <h2 className="text-xl font-semibold text-white">Input Settings</h2>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Date & Time */}
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <span className="text-gray-500">📅</span>
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={dtLocalISO}
                    onChange={e=>setDtLocalISO(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 bg-slate-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all text-slate-700 font-medium"
                    tabIndex={1}
                  />
                </div>

                {/* Timezone Selection Row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  {/* From Timezone - 5 cols on desktop, full width on mobile */}
                  <div className="md:col-span-5">
                    <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <span className="text-gray-500">🌍</span>
                      From Timezone
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <input 
                          value={fromQuery !== null ? fromQuery : fromZone || ''} 
                          onChange={e=>setFromQuery(e.target.value)} 
                          onFocus={()=>{setFromFocused(true); setFromQuery('');}} 
                          onBlur={(e) => { if (!e.target.value) { setFromQuery(null); setFromZone(null); } setFromFocused(false); }} 
                          className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 pr-10 bg-slate-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all text-slate-700" 
                          placeholder="Search timezone..." 
                          tabIndex={2} 
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none text-xs">▼</span>
                        {fromFocused && fromResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl max-h-60 overflow-auto z-20">
                            {fromResults.slice(0, 10).map(tz => (
                              <div 
                                key={tz} 
                                onMouseDown={()=>{ setFromZone(tz); setFromQuery(null); setFromFocused(false); }} 
                                className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-slate-100 last:border-b-0"
                              >
                                <div className="font-medium text-slate-700">{tz}</div>
                                <div className="text-xs text-slate-500 mt-1">{formatForZone(new Date(),tz)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button 
                        title="Working hours settings" 
                        onClick={()=>setShowFromSettings(true)} 
                        className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all hover:scale-105 shadow-sm" 
                        tabIndex={3}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Swap Button - 2 cols on desktop, full width on mobile, rotated 90deg on mobile */}
                  <div className="flex justify-center items-center md:col-span-2 my-2 md:my-0">
                    <button
                      aria-label="Swap timezones"
                      onClick={handleSwap}
                      className="p-3 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg transition-all transform hover:scale-110 hover:rotate-180 duration-300 md:rotate-0 rotate-90"
                      tabIndex={6}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </button>
                  </div>

                  {/* To Timezone - 5 cols on desktop, full width on mobile */}
                  <div className="md:col-span-5">
                    <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <span className="text-gray-500">🎯</span>
                      To Timezone
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <input 
                          value={toQuery !== null ? toQuery : toZone || ''} 
                          onChange={e=>setToQuery(e.target.value)} 
                          onFocus={()=>{setToFocused(true); setToQuery('');}} 
                          onBlur={(e) => { if (!e.target.value) { setToQuery(null); setToZone(null); } setToFocused(false); }} 
                          className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 pr-10 bg-slate-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all text-slate-700" 
                          placeholder="Search timezone..." 
                          tabIndex={4} 
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none text-xs">▼</span>
                        {toFocused && toResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl max-h-60 overflow-auto z-20">
                            {toResults.slice(0, 10).map(tz => (
                              <div 
                                key={tz} 
                                onMouseDown={()=>{ setToZone(tz); setToQuery(null); setToFocused(false); }} 
                                className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-slate-100 last:border-b-0"
                              >
                                <div className="font-medium text-slate-700">{tz}</div>
                                <div className="text-xs text-slate-500 mt-1">{formatForZone(new Date(),tz)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button 
                        title="Working hours settings" 
                        onClick={()=>setShowToSettings(true)} 
                        className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all hover:scale-105 shadow-sm" 
                        tabIndex={5}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Human-readable sentence */}
                {sentence && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-50 rounded-xl p-4 border-l-4 border-gray-500">
                    <div className="text-sm font-medium text-slate-600 mb-1">Summary</div>
                    <div className="text-slate-800">{sentence}</div>
                  </div>
                )}

                {/* Working Hours Visualization */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border border-slate-200">
                  <div className="flex items-center mb-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500 text-white font-bold mr-3 shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">Working Hours & Availability</h3>
                  </div>

                  <div className="mb-4">
                    <div className="relative pb-8">
                      {/* Timeline with time labels */}
                      <div 
                        className="flex gap-0.5 items-end mb-1 segment-container bg-slate-100 rounded-lg p-1 relative select-none"
                      >
                        {segments.length > 0 ? (
                          <>
                            {segments.map(s => {
                              const hour24 = s.hh;
                              const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                              const ampm = hour24 >= 12 ? 'PM' : 'AM';
                              const timeStr = `${hour12}:${String(s.mm).padStart(2,'0')} ${ampm}`;
                              const time24Str = `${String(hour24).padStart(2,'0')}:${String(s.mm).padStart(2,'0')}`;
                              
                              // Show time label every 4 hours (every 16 segments)
                              const showTimeLabel = s.i % 16 === 0 || s.i === 0 || s.i === 95;
                              
                              const statusColors: Record<string, string> = {
                                'both': 'bg-emerald-400 hover:bg-emerald-500',
                                'from': 'bg-amber-300 hover:bg-amber-400',
                                'to': 'bg-orange-300 hover:bg-orange-400',
                                'none': 'bg-slate-200 hover:bg-slate-300'
                              };
                              
                              return (
                                <div
                                  key={s.i}
                                  className={`relative flex-1 cursor-pointer transition-all ${statusColors[s.status] || statusColors['none']}`}
                                  title={timeStr}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // Update time when clicking a segment
                                    // Use the date from dtLocalISO, or if empty, use today's date
                                    const datePart = dtLocalISO ? dtLocalISO.split('T')[0] : new Date().toISOString().slice(0,10);
                                    const hh = Math.floor(s.i / 4);
                                    const mm = (s.i % 4) * 15;
                                    const newISO = `${datePart}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
                                    setDtLocalISO(newISO);
                                    // positionIndicator will automatically update from dtLocalISO
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                >
                                  {/* Time segment bar */}
                                  <div className="h-10 rounded-sm transition-all hover:brightness-110" />
                                  
                                  {/* Time labels every 4 hours */}
                                  {showTimeLabel && (
                                    <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-slate-600 font-medium whitespace-nowrap">
                                      {time24Str}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </>
                        ) : (
                          <div className="w-full text-center text-sm text-slate-500 italic py-2">Enter a date and time to see availability visualization</div>
                        )}
                      </div>
                      
                      {/* Current time indicator - From timezone (purple) */}
                      {positionIndicator && fromZone && (
                        <div 
                          className="absolute -top-3 z-10 transform -translate-x-1/2"
                          style={{ left: `${positionIndicator.positionPercent}%` }}
                        >
                          <div className="bg-gray-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap">
                            <div>{formatTime12Hour(positionIndicator.hh, positionIndicator.mm)}</div>
                            <div className="text-[10px] font-normal opacity-90">{fromZone.split('/').pop() || fromZone}</div>
                          </div>
                          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-600 mx-auto"></div>
                        </div>
                      )}
                      
                      {/* Current time indicator - To timezone (greyed out) */}
                      {positionIndicatorTo && toZone && (
                        <div 
                          className="absolute -top-3 z-20 transform -translate-x-1/2 opacity-60"
                          style={{ left: `${positionIndicatorTo.positionPercent}%` }}
                        >
                          <div className="bg-slate-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap">
                            <div>{formatTime12Hour(positionIndicatorTo.hh, positionIndicatorTo.mm)}</div>
                            <div className="text-[10px] font-normal opacity-90">
                              {toZone.split('/').pop() || toZone}
                              {dayRelation && dayRelation !== 'SAME DAY' && (
                                <span className="ml-1 opacity-75">
                                  ({dayRelation === 'PREVIOUS DAY' ? 'prev day' : 'next day'})
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-500 mx-auto"></div>
                        </div>
                      )}
                      
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-600 mb-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-emerald-400"></div>
                        <span>Both timezones working</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-amber-300"></div>
                        <span>{fromZone ? `${fromZone.split('/').pop()?.replace(/_/g, ' ') || fromZone} Working/No Overlap` : 'From only'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-orange-300"></div>
                        <span>{toZone ? `${toZone.split('/').pop()?.replace(/_/g, ' ') || toZone} Working, No Overlap` : 'To only'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-slate-200"></div>
                        <span>Neither timezone working</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <div className="text-sm font-semibold text-slate-700 mb-2">Overlap Window</div>
                    <div className="text-sm text-slate-600">
                      {overlapWindow && overlapWindow.startInstant && overlapWindow.endInstant && fromZone && toZone ? (
                        <div>
                          Both timezones are working between{' '}
                          <span className="font-semibold text-emerald-600">
                            {shortTimeForZone(overlapWindow.startInstant, fromZone)} {getShortTimezoneName(fromZone)}
                          </span>
                          {' '}({formatTimeWithDateIfDifferent(overlapWindow.startInstant, toZone, overlapWindow.startInstant, fromZone)}{' '}{getShortTimezoneName(toZone)}){' '}
                          to{' '}
                          <span className="font-semibold text-emerald-600">
                            {shortTimeForZone(overlapWindow.endInstant, fromZone)} {getShortTimezoneName(fromZone)}
                          </span>
                          {' '}({formatTimeWithDateIfDifferent(overlapWindow.endInstant, toZone, overlapWindow.startInstant, fromZone)}{' '}{getShortTimezoneName(toZone)})
                        </div>
                      ) : (
                        <div className="text-slate-500">No full overlap available on this date.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Conversion Result */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden sticky top-6">
              <div className="bg-gradient-to-r from-gray-500 to-gray-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm text-white font-bold text-lg shadow-md">2</div>
                  <h2 className="text-xl font-semibold text-white">Result</h2>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-8">
                  {/* From Time Display */}
                  <div className="text-center">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Original Time</div>
                    {inputInstant && inputFormatted && (
                      <>
                        {/* Time - MOST PROMINENT with timezone */}
                        <div className="mb-3">
                          <div className="text-6xl font-bold text-gray-700 mb-1">
                            {inputFormatted.split(', ').slice(-1)[0]}
                          </div>
                          <div className="text-xs text-gray-400">{fromZone}</div>
                        </div>
                        
                        {/* Date with Year merged - Secondary */}
                        <div className="text-sm text-slate-500 mb-6">
                          {dayRelation && dayRelation !== 'SAME DAY' ? (
                            <>
                              <span className="text-orange-600 font-medium">{inputFormatted.split(', ').slice(0, -1).join(', ')}</span>
                            </>
                          ) : (
                            inputFormatted.split(', ').slice(0, -1).join(', ')
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* To Time Display */}
                  <div className="text-center">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Converted Time</div>
                    {convertedStr && (
                      <>
                        {/* Time - MOST PROMINENT with timezone */}
                        <div className="mb-3">
                          <div className="text-6xl font-bold text-gray-700 mb-1">
                            {convertedStr.split(', ').slice(-1)[0]}
                          </div>
                          <div className="text-xs text-gray-400">{toZone}</div>
                        </div>
                        
                        {/* Date with Year merged - Secondary */}
                        <div className="text-sm text-slate-500 mb-2">
                          {dayRelation && dayRelation !== 'SAME DAY' ? (
                            <>
                              <span className="text-orange-600 font-medium">{convertedStr.split(', ').slice(0, -1).join(', ')}</span>
                            </>
                          ) : (
                            convertedStr.split(', ').slice(0, -1).join(', ')
                          )}
                        </div>
                        
                        {dayRelation && dayRelation !== 'SAME DAY' && (
                          <div className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold mb-6">
                            {dayRelation.toLowerCase().replace('_', ' ')}
                          </div>
                        )}
                        
                        {!dayRelation || dayRelation === 'SAME DAY' ? (
                          <div className="mb-6"></div>
                        ) : null}
                      </>
                    )}
                  </div>
                  
                  {/* Clock Displays */}
                  <div className="flex justify-center items-center gap-8">
                    {inputInstant && inputFormatted && (
                      <ClockDisplay
                        time={inputInstant}
                        timezone={fromZone}
                        label=""
                      />
                    )}
                    {convertedStr && (
                      <ClockDisplay
                        time={inputInstant}
                        timezone={toZone}
                        label=""
                      />
                    )}
                  </div>
                  
                  {/* Time Difference */}
                  {tzDiffHours !== null && (
                    <div className="pt-6 border-t border-slate-200">
                      <div className="text-center">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Time Difference</div>
                        <div className="text-2xl font-bold text-slate-800">
                          {diffLabel(tzDiffHours)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add to Calendar Button */}
                  {calendarEventData && (
                    <div className="pt-6 border-t border-slate-200">
                      <div className="text-center">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Add to Calendar</div>
                        <div className="flex justify-center items-center">
                          {/* @ts-ignore - Web component */}
                          <add-to-calendar-button
                            name={calendarEventData.name}
                            description={calendarEventData.description}
                            startDate={calendarEventData.startDate}
                            startTime={calendarEventData.startTime}
                            endDate={calendarEventData.endDate}
                            endTime={calendarEventData.endTime}
                            timeZone={calendarEventData.timeZone}
                            options="['Apple','Google','iCal','Microsoft365','Outlook.com','Yahoo']"
                            trigger="click"
                            listStyle="modal"
                            lightMode="bodyScheme"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <footer className="mt-12 pb-8 text-center">
          <div className="max-w-4xl mx-auto px-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong>Disclaimer:</strong> This timezone converter tool is provided for informational purposes only. 
              Time conversions are based on standard timezone data and may not account for all local variations, 
              daylight saving time changes, or regional timezone rules. Results may be incorrect or outdated. 
              Always verify critical times independently. We assume no liability for any errors, omissions, 
              or damages resulting from the use of this tool.
            </p>
          </div>
        </footer>

        {/* Settings Popups */}
        {showFromSettings && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4 backdrop-blur-sm animate-fadeIn" onClick={()=>setShowFromSettings(false)}>
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 animate-slideUp" onClick={(e)=>e.stopPropagation()}>
              <div className="bg-gradient-to-r from-gray-500 to-gray-600 px-6 py-4 rounded-t-2xl">
                <h3 className="font-bold text-xl text-white">From Timezone — Working Hours</h3>
              </div>
              <div className="p-6">
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Start Time</label>
                    <select value={fromWorkStart} onChange={e=>setFromWorkStart(Number(e.target.value))} className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 bg-slate-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-slate-700">
                      {timeOptions.map(opt => (
                        <option key={opt.i} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">End Time</label>
                    <select value={fromWorkEnd} onChange={e=>setFromWorkEnd(Number(e.target.value))} className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 bg-slate-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-slate-700">
                      {timeOptions.map(opt => (
                        <option key={opt.i} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="text-sm font-semibold text-slate-700 mb-3">Quick Presets</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(presets).map(p => (
                      <button 
                        key={p} 
                        onClick={()=>applyPresetFor('from',p)} 
                        className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-all hover:scale-105 shadow-sm"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={()=>setShowFromSettings(false)} 
                    className="px-6 py-3 rounded-xl bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showToSettings && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4 backdrop-blur-sm animate-fadeIn" onClick={()=>setShowToSettings(false)}>
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 animate-slideUp" onClick={(e)=>e.stopPropagation()}>
              <div className="bg-gradient-to-r from-gray-500 to-gray-600 px-6 py-4 rounded-t-2xl">
                <h3 className="font-bold text-xl text-white">To Timezone — Working Hours</h3>
              </div>
              <div className="p-6">
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Start Time</label>
                    <select value={toWorkStart} onChange={e=>setToWorkStart(Number(e.target.value))} className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 bg-slate-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-slate-700">
                      {timeOptions.map(opt => (
                        <option key={opt.i} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">End Time</label>
                    <select value={toWorkEnd} onChange={e=>setToWorkEnd(Number(e.target.value))} className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 bg-slate-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-slate-700">
                      {timeOptions.map(opt => (
                        <option key={opt.i} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="text-sm font-semibold text-slate-700 mb-3">Quick Presets</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(presets).map(p => (
                      <button 
                        key={p} 
                        onClick={()=>applyPresetFor('to',p)} 
                        className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-all hover:scale-105 shadow-sm"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={()=>setShowToSettings(false)} 
                    className="px-6 py-3 rounded-xl bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgb(99, 102, 241);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgb(99, 102, 241);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
