export enum SportType {
  AlpineSki = 'AlpineSki',
  BackcountrySki = 'BackcountrySki',
  Badminton = 'Badminton',
  Basketball = 'Basketball',
  Canoeing = 'Canoeing',
  Cricket = 'Cricket',
  Crossfit = 'Crossfit',
  Dance = 'Dance',
  EBikeRide = 'EBikeRide',
  Elliptical = 'Elliptical',
  EMountainBikeRide = 'EMountainBikeRide',
  Golf = 'Golf',
  GravelRide = 'GravelRide',
  Handcycle = 'Handcycle',
  HighIntensityIntervalTraining = 'HighIntensityIntervalTraining',
  Hike = 'Hike',
  IceSkate = 'IceSkate',
  InlineSkate = 'InlineSkate',
  Kayaking = 'Kayaking',
  Kitesurf = 'Kitesurf',
  MountainBikeRide = 'MountainBikeRide',
  NordicSki = 'NordicSki',
  Padel = 'Padel',
  Pickleball = 'Pickleball',
  Pilates = 'Pilates',
  Racquetball = 'Racquetball',
  Ride = 'Ride',
  RockClimbing = 'RockClimbing',
  RollerSki = 'RollerSki',
  Rowing = 'Rowing',
  Run = 'Run',
  Sail = 'Sail',
  Skateboard = 'Skateboard',
  Snowboard = 'Snowboard',
  Snowshoe = 'Snowshoe',
  Soccer = 'Soccer',
  Squash = 'Squash',
  StairStepper = 'StairStepper',
  StandUpPaddling = 'StandUpPaddling',
  Surfing = 'Surfing',
  Swim = 'Swim',
  TableTennis = 'TableTennis',
  Tennis = 'Tennis',
  TrailRun = 'TrailRun',
  Velomobile = 'Velomobile',
  VirtualRide = 'VirtualRide',
  VirtualRow = 'VirtualRow',
  VirtualRun = 'VirtualRun',
  Volleyball = 'Volleyball',
  Walk = 'Walk',
  WeightTraining = 'WeightTraining',
  Wheelchair = 'Wheelchair',
  Windsurf = 'Windsurf',
  Workout = 'Workout',
  Yoga = 'Yoga',
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
  movingDuration?: number; // seconds
  avgSpeed: number; // km/h
  maxEle: number; // meters
  minEle: number; // meters
  elevationGain?: number; // meters
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
