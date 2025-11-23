import { SportType } from './types';

// Adjusted palette for Light Gray Map (CartoDB Positron)
// Colors are slightly darker/richer to contrast against white/gray
export const SPORT_COLORS: Record<SportType, string> = {
  [SportType.Running]: '#f97316', // Orange-500 (New request)
  [SportType.TrailRunning]: '#0d9488', // Teal-600
  [SportType.Cycling]: '#0891b2', // Cyan-700 (Previously Running color)
  [SportType.GravelCycling]: '#9333ea', // Purple-600
  [SportType.MountainBiking]: '#7e22ce', // Purple-700
  [SportType.Hiking]: '#65a30d', // Lime-600
  [SportType.Skiing]: '#2563eb', // Blue-600
  [SportType.Snowboarding]: '#4f46e5', // Indigo-600
  [SportType.Other]: '#6b7280', // Gray-500
};

export const SPORT_DISPLAY_NAMES: Record<'en' | 'zh', Record<SportType, string>> = {
  en: {
    [SportType.Running]: 'Running',
    [SportType.TrailRunning]: 'Trail Running',
    [SportType.Cycling]: 'Cycling',
    [SportType.GravelCycling]: 'Gravel Cycling',
    [SportType.MountainBiking]: 'Mountain Biking',
    [SportType.Hiking]: 'Hiking',
    [SportType.Skiing]: 'Skiing',
    [SportType.Snowboarding]: 'Snowboarding',
    [SportType.Other]: 'Other',
  },
  zh: {
    [SportType.Running]: '跑步',
    [SportType.TrailRunning]: '越野跑',
    [SportType.Cycling]: '骑行',
    [SportType.GravelCycling]: '砾石车',
    [SportType.MountainBiking]: '山地车',
    [SportType.Hiking]: '徒步',
    [SportType.Skiing]: '滑雪',
    [SportType.Snowboarding]: '单板滑雪',
    [SportType.Other]: '其他',
  }
};

export const TRANSLATIONS = {
  en: {
    description: "Drag & drop or upload .gpx/.fit files to visualize your journeys.",
    totalDistance: "TOTAL DISTANCE",
    totalTime: "TOTAL TIME",
    importFiles: "Import Files",
    dateRange: "DATE RANGE",
    reset: "Reset",
    start: "Start",
    end: "End",
    filterBySport: "FILTER BY SPORT",
    all: "All",
    noTracks: "No tracks found.",
    noTrackSelected: "No track found.",
    clearSelection: "CLEAR SELECTION",
    legend: "LEGEND",
    parsing: "Parsing trajectories...",
    selectedTrack: "SELECTED TRACK",
    datePlaceholder: "YYYY/MM/DD",
    searchPlaceholder: "Search tracks...",
    clearAll: "Clear All",
    delete: "Delete",
  },
  zh: {
    description: "拖放或上传 .gpx/.fit 文件以可视化您的旅程。",
    totalDistance: "总距离",
    totalTime: "总时间",
    importFiles: "导入文件",
    dateRange: "日期范围",
    reset: "重置",
    start: "开始",
    end: "结束",
    filterBySport: "按运动类型筛选",
    all: "全部",
    noTracks: "暂无轨迹。",
    noTrackSelected: "未找到轨迹。",
    clearSelection: "清除选择",
    legend: "图例",
    parsing: "正在解析轨迹...",
    selectedTrack: "已选路线",
    datePlaceholder: "年/月/日",
    searchPlaceholder: "搜索轨迹...",
    clearAll: "清空所有",
    delete: "删除",
  }
};

// CartoDB Positron - Clean Light Gray map
export const MAP_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
export const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Activity Type Mapping from common GPX/FIT strings to our Enum
export const STRING_TO_SPORT: Record<string, SportType> = {
  'run': SportType.Running,
  'running': SportType.Running,
  'ride': SportType.Cycling,
  'cycling': SportType.Cycling,
  'gravel': SportType.GravelCycling,
  'mtb': SportType.MountainBiking,
  'mountain_biking': SportType.MountainBiking,
  'hike': SportType.Hiking,
  'hiking': SportType.Hiking,
  'walk': SportType.Hiking,
  'ski': SportType.Skiing,
  'snowboard': SportType.Snowboarding,
  'trail_run': SportType.TrailRunning,
};