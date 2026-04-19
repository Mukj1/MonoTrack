import { SportType } from './types';

export type SportCategory = 'foot' | 'cycle' | 'water' | 'winter' | 'racket' | 'team' | 'fitness' | 'other';

export interface SportMetadata {
  category: SportCategory;
  color: string;
  label: {
    en: string;
    zh: string;
  };
  aliases: string[];
}

export interface MapProvider {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

const baseAliases = (value: SportType, labelEn: string) => [
  value,
  labelEn,
  labelEn.replace(/\s+/g, '_'),
  labelEn.replace(/\s+/g, '-'),
];

const sport = (
  category: SportCategory,
  color: string,
  en: string,
  zh: string,
  aliases: string[] = []
): SportMetadata => ({
  category,
  color,
  label: { en, zh },
  aliases,
});

export const SPORT_METADATA: Record<SportType, SportMetadata> = {
  [SportType.Run]: sport('foot', '#C66A3D', 'Run', '跑步', ['running']),
  [SportType.TrailRun]: sport('foot', '#D05A45', 'Trail Run', '越野跑', ['trail_run', 'trail running']),
  [SportType.Walk]: sport('foot', '#6BAA72', 'Walk', '步行', ['walking']),
  [SportType.Hike]: sport('foot', '#3F9A68', 'Hike', '徒步', ['hiking']),
  [SportType.Wheelchair]: sport('foot', '#6C9E66', 'Wheelchair', '轮椅运动'),

  [SportType.Ride]: sport('cycle', '#21899A', 'Ride', '骑行', ['bike', 'biking', 'cycling', 'cycle']),
  [SportType.GravelRide]: sport('cycle', '#8A63B1', 'Gravel Ride', '砾石骑行', ['gravel', 'gravel ride', 'gravel_biking']),
  [SportType.MountainBikeRide]: sport('cycle', '#7656A8', 'Mountain Bike Ride', '山地骑行', ['mtb', 'mountain_biking', 'mountain bike']),
  [SportType.EBikeRide]: sport('cycle', '#2A9B9D', 'E-Bike Ride', '电助力骑行', ['ebike', 'e_bike', 'electric bike']),
  [SportType.EMountainBikeRide]: sport('cycle', '#865AB2', 'E-Mountain Bike Ride', '电助力山地骑行', ['e_mountain_bike', 'electric mountain bike']),
  [SportType.Handcycle]: sport('cycle', '#519A82', 'Handcycle', '手摇车'),
  [SportType.Velomobile]: sport('cycle', '#2F8F96', 'Velomobile', '躺车'),
  [SportType.VirtualRide]: sport('cycle', '#528C9D', 'Virtual Ride', '虚拟骑行', ['indoor cycling', 'trainer']),

  [SportType.Canoeing]: sport('water', '#549DB5', 'Canoe', '独木舟', ['canoe']),
  [SportType.Kayaking]: sport('water', '#2997B4', 'Kayak', '皮划艇', ['kayak']),
  [SportType.Kitesurf]: sport('water', '#5AA7B5', 'Kitesurf', '风筝冲浪'),
  [SportType.Rowing]: sport('water', '#367EB2', 'Rowing', '划船'),
  [SportType.Sail]: sport('water', '#5D9FB5', 'Sailing', '帆船', ['sailing']),
  [SportType.StandUpPaddling]: sport('water', '#4D95AD', 'Stand Up Paddling', '桨板', ['sup', 'stand_up_paddle']),
  [SportType.Surfing]: sport('water', '#287FA8', 'Surf', '冲浪', ['surf']),
  [SportType.Swim]: sport('water', '#2574B8', 'Swim', '游泳', ['swimming']),
  [SportType.VirtualRow]: sport('water', '#5C8FB1', 'Virtual Row', '虚拟划船'),
  [SportType.Windsurf]: sport('water', '#5794BC', 'Windsurf', '帆板', ['windsurfing']),

  [SportType.AlpineSki]: sport('winter', '#6E8FB2', 'Alpine Ski', '高山滑雪', ['downhill_skiing', 'ski']),
  [SportType.BackcountrySki]: sport('winter', '#7A94B4', 'Backcountry Ski', '野雪滑雪'),
  [SportType.IceSkate]: sport('winter', '#789AB0', 'Ice Skate', '滑冰'),
  [SportType.NordicSki]: sport('winter', '#6684AA', 'Nordic Ski', '越野滑雪', ['cross_country_skiing']),
  [SportType.RollerSki]: sport('winter', '#7E8EA7', 'Roller Ski', '轮滑雪'),
  [SportType.Snowboard]: sport('winter', '#5F80A7', 'Snowboard', '单板滑雪', ['snowboarding']),
  [SportType.Snowshoe]: sport('winter', '#8499B0', 'Snowshoe', '雪鞋健走'),

  [SportType.Badminton]: sport('racket', '#82866A', 'Badminton', '羽毛球'),
  [SportType.Padel]: sport('racket', '#8D8568', 'Padel', '板式网球'),
  [SportType.Pickleball]: sport('racket', '#7F8B6A', 'Pickleball', '匹克球'),
  [SportType.Racquetball]: sport('racket', '#8A8068', 'Racquetball', '墙网球'),
  [SportType.Squash]: sport('racket', '#787F66', 'Squash', '壁球'),
  [SportType.TableTennis]: sport('racket', '#8C846D', 'Table Tennis', '乒乓球'),
  [SportType.Tennis]: sport('racket', '#75886D', 'Tennis', '网球'),

  [SportType.Basketball]: sport('team', '#9B725F', 'Basketball', '篮球'),
  [SportType.Cricket]: sport('team', '#8D7762', 'Cricket', '板球'),
  [SportType.Golf]: sport('team', '#7F8664', 'Golf', '高尔夫'),
  [SportType.Soccer]: sport('team', '#8F735D', 'Football (Soccer)', '足球', ['football', 'soccer']),
  [SportType.Volleyball]: sport('team', '#987C65', 'Volleyball', '排球'),

  [SportType.Crossfit]: sport('fitness', '#8A8178', 'CrossFit', '综合体能', ['crossfit']),
  [SportType.Dance]: sport('fitness', '#9A7E78', 'Dance', '舞蹈'),
  [SportType.Elliptical]: sport('fitness', '#7F8278', 'Elliptical', '椭圆机'),
  [SportType.HighIntensityIntervalTraining]: sport('fitness', '#9A746C', 'HIIT', '高强度间歇训练', ['hiit', 'high intensity interval training']),
  [SportType.InlineSkate]: sport('fitness', '#858075', 'Inline Skate', '轮滑'),
  [SportType.Pilates]: sport('fitness', '#8E817A', 'Pilates', '普拉提'),
  [SportType.RockClimbing]: sport('fitness', '#897967', 'Rock Climb', '攀岩', ['climb', 'climbing', 'rock climbing']),
  [SportType.Skateboard]: sport('fitness', '#7D7F76', 'Skateboard', '滑板', ['skateboarding']),
  [SportType.StairStepper]: sport('fitness', '#817B72', 'Stair Stepper', '踏步机'),
  [SportType.WeightTraining]: sport('fitness', '#8A7B73', 'Weight Training', '力量训练'),
  [SportType.Workout]: sport('fitness', '#8A8178', 'Workout', '训练'),
  [SportType.Yoga]: sport('fitness', '#837C86', 'Yoga', '瑜伽'),
  [SportType.VirtualRun]: sport('fitness', '#A17262', 'Virtual Run', '虚拟跑步', ['treadmill']),

  [SportType.Other]: sport('other', '#9A8274', 'Other', '其他'),
};

export const SPORT_CATEGORY_LABELS: Record<'en' | 'zh', Record<SportCategory, string>> = {
  en: {
    foot: 'Foot',
    cycle: 'Cycle',
    water: 'Water',
    winter: 'Winter',
    racket: 'Racket',
    team: 'Team',
    fitness: 'Fitness',
    other: 'Other',
  },
  zh: {
    foot: '步行/跑步',
    cycle: '骑行',
    water: '水上',
    winter: '冬季',
    racket: '球拍',
    team: '团队',
    fitness: '健身',
    other: '其他',
  },
};

const sportEntries = Object.entries(SPORT_METADATA) as [SportType, SportMetadata][];

export const SPORT_COLORS = Object.fromEntries(
  sportEntries.map(([type, meta]) => [type, meta.color])
) as Record<SportType, string>;

export const SPORT_DISPLAY_NAMES: Record<'en' | 'zh', Record<SportType, string>> = {
  en: Object.fromEntries(sportEntries.map(([type, meta]) => [type, meta.label.en])) as Record<SportType, string>,
  zh: Object.fromEntries(sportEntries.map(([type, meta]) => [type, meta.label.zh])) as Record<SportType, string>,
};

export const TRANSLATIONS = {
  en: {
    description: 'Upload GPX, FIT, TCX, GZ, or Strava ZIP files.',
    totalDistance: 'TOTAL DISTANCE',
    totalTime: 'TOTAL TIME',
    totalTracks: 'TRACKS',
    importFiles: 'Import Files',
    supportedFiles: 'GPX / FIT / TCX / GZ / ZIP',
    dateRange: 'DATE RANGE',
    reset: 'Reset',
    start: 'Start',
    end: 'End',
    filterBySport: 'FILTER BY SPORT',
    filters: 'Filters',
    all: 'All',
    noTracks: 'Drop exported Strava files to begin.',
    noTrackSelected: 'No track found.',
    clearSelection: 'CLEAR SELECTION',
    legend: 'VISIBLE TYPES',
    parsing: 'Parsing trajectories...',
    preparingImport: 'Preparing selected files...',
    saving: 'Saving tracks...',
    savingLocal: 'Writing imported tracks to local storage.',
    selectedTrack: 'SELECTED TRACK',
    datePlaceholder: 'YYYY/MM/DD',
    searchPlaceholder: 'Search tracks...',
    clearAll: 'Clear All',
    delete: 'Delete',
    multiSelect: 'Multi-select',
    exitMultiSelect: 'Exit multi-select',
    deleteSelected: 'Delete selected',
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
    showAll: 'Show all',
    showTrack: 'Show track',
    hideTrack: 'Hide track',
    distance: 'Distance',
    duration: 'Duration',
    avgSpeed: 'Avg speed',
    maxEle: 'Max ele.',
    minEle: 'Min ele.',
    elevationGain: 'Gain',
    importSummary: 'Import summary',
    imported: 'imported',
    skipped: 'skipped',
    failed: 'failed',
    mapEmptyTitle: 'Import tracks to build your map',
    mapEmptyBody: 'GPX, FIT, TCX, compressed files, and Strava bulk exports are supported.',
  },
  zh: {
    description: '上传 GPX、FIT、TCX、GZ 或 Strava ZIP 文件。',
    totalDistance: '总距离',
    totalTime: '总时间',
    totalTracks: '轨迹数',
    importFiles: '导入文件',
    supportedFiles: 'GPX / FIT / TCX / GZ / ZIP',
    dateRange: '日期范围',
    reset: '重置',
    start: '开始',
    end: '结束',
    filterBySport: '按运动类型筛选',
    filters: '筛选',
    all: '全部',
    noTracks: '导入 Strava 导出文件以开始。',
    noTrackSelected: '未找到轨迹。',
    clearSelection: '清除选择',
    legend: '当前类型',
    parsing: '正在解析轨迹...',
    preparingImport: '正在准备所选文件...',
    saving: '正在保存轨迹...',
    savingLocal: '正在写入本地存储。',
    selectedTrack: '已选轨迹',
    datePlaceholder: '年/月/日',
    searchPlaceholder: '搜索轨迹...',
    clearAll: '清空所有',
    delete: '删除',
    multiSelect: '多选轨迹',
    exitMultiSelect: '退出多选',
    deleteSelected: '删除所选',
    selectAll: '全选',
    deselectAll: '全不选',
    showAll: '显示全部',
    showTrack: '显示轨迹',
    hideTrack: '隐藏轨迹',
    distance: '距离',
    duration: '时长',
    avgSpeed: '均速',
    maxEle: '最高海拔',
    minEle: '最低海拔',
    elevationGain: '累计爬升',
    importSummary: '导入结果',
    imported: '成功',
    skipped: '跳过',
    failed: '失败',
    mapEmptyTitle: '导入轨迹，生成你的运动地图',
    mapEmptyBody: '支持 GPX、FIT、TCX、压缩文件和 Strava 批量导出。',
  }
};

export const MAP_PROVIDERS: Record<string, MapProvider> = {
  cartoLight: {
    id: 'cartoLight',
    name: 'CARTO Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  osmStandard: {
    id: 'osmStandard',
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
};

export const DEFAULT_MAP_PROVIDER_ID = 'cartoLight';
export const DEFAULT_MAP_PROVIDER = MAP_PROVIDERS[DEFAULT_MAP_PROVIDER_ID];

export const normalizeSportKey = (value: string): string =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '');

export const STRING_TO_SPORT: Record<string, SportType> = sportEntries.reduce((acc, [type, meta]) => {
  const keys = [...baseAliases(type, meta.label.en), meta.label.zh, ...meta.aliases];
  keys.forEach(key => {
    acc[normalizeSportKey(key)] = type;
  });
  return acc;
}, {} as Record<string, SportType>);
