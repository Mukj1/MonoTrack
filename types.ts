export enum SportType {
  Running = 'Running',
  Cycling = 'Cycling',
  MountainBiking = 'Mountain Biking',
  GravelCycling = 'Gravel Cycling',
  Hiking = 'Hiking',
  TrailRunning = 'Trail Running',
  Skiing = 'Skiing',
  Snowboarding = 'Snowboarding',
  Other = 'Other'
}

export interface GeoPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: Date;
}

export interface ActivityStats {
  distance: number; // meters
  duration: number; // seconds
  avgSpeed: number; // km/h
  maxEle: number; // meters
  minEle: number; // meters
}

export interface Activity {
  id: string;
  name: string;
  type: SportType;
  startTime: Date;
  stats: ActivityStats;
  path: GeoPoint[];
  color: string;
}

export interface FilterState {
  types: SportType[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}