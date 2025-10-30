// TypeScript types and interfaces

export interface Segment {
  i: number;
  hh: number;
  mm: number;
  instant: Date;
  status: 'both' | 'from' | 'to' | 'none';
}

export interface PositionIndicator {
  hh: number;
  mm: number;
  positionPercent: number;
}

export interface OverlapWindow {
  startIdx: number;
  endIdx: number;
  startISO: string;
  endISO: string;
  startInstant: Date;
  endInstant: Date;
}

export interface CalendarEventData {
  name: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  timeZone: string;
}

export interface WorkingHours {
  fromWorkStart: number;
  fromWorkEnd: number;
  toWorkStart: number;
  toWorkEnd: number;
}

export interface TimeOption {
  i: number;
  value: number;
  label: string;
}

export type DayRelation = 'SAME DAY' | 'PREVIOUS DAY' | 'NEXT DAY' | null;

export const PRESETS = {
  "Morning": [9, 12] as [number, number],
  "Workday": [9, 17] as [number, number],
  "Evening": [17, 21] as [number, number],
  "All day": [0, 24] as [number, number]
} as const;

