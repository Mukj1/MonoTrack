import { Activity, GeoPoint, SportType, ActivityStats } from '../types';
import { calculateDistance } from '../utils/geoUtils';
import { SPORT_COLORS, STRING_TO_SPORT, normalizeSportKey } from '../constants';
import { decompressSync, strFromU8, unzipSync } from 'fflate';
// @ts-ignore
import FitParser from 'fit-file-parser';

const SEMICIRCLES_TO_DEGREES = 180 / 2147483648;
const SUPPORTED_ACTIVITY_EXTENSIONS = ['.gpx', '.fit', '.tcx'];
const ELEVATION_NOISE_FLOOR_METERS = 1;
const MOVING_SPEED_THRESHOLD_KMH = 0.5;
const MOVING_DISTANCE_THRESHOLD_METERS = 2;

export interface ParseProgress {
  current: number;
  total: number;
  filename: string;
  imported: number;
  skipped: number;
  failed: number;
}

export interface ParseSummary {
  imported: number;
  skipped: number;
  failed: number;
}

interface ActivityFile {
  name: string;
  bytes: Uint8Array;
}

const sportKeysByLength = Object.keys(STRING_TO_SPORT).sort((a, b) => b.length - a.length);

const detectSportType = (typeStr: string | undefined | null): SportType => {
  if (!typeStr) return SportType.Other;
  const normalized = normalizeSportKey(String(typeStr));
  if (!normalized) return SportType.Other;

  const exact = STRING_TO_SPORT[normalized];
  if (exact) return exact;

  const fuzzyKey = sportKeysByLength.find(key => key.length > 2 && normalized.includes(key));
  return fuzzyKey ? STRING_TO_SPORT[fuzzyKey] : SportType.Other;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const textFromBytes = (bytes: Uint8Array) => strFromU8(bytes);

const arrayBufferFromBytes = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

const getFirstText = (element: Element | Document, tagNames: string[]): string | undefined => {
  for (const tagName of tagNames) {
    const tags = element.getElementsByTagName(tagName);
    if (tags.length > 0) {
      const value = tags[0].textContent?.trim();
      if (value) return value;
    }
  }
  return undefined;
};

const parseXml = (content: string): Document => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content, 'text/xml');
  const parseError = xmlDoc.getElementsByTagName('parsererror');
  if (parseError.length > 0) {
    throw new Error('XML Parsing Error');
  }
  return xmlDoc;
};

const parseGpx = (content: string, filename: string): Activity => {
  const xmlDoc = parseXml(content);
  const trkList = xmlDoc.getElementsByTagName('trk');
  if (trkList.length === 0) throw new Error('No track found in GPX');
  const trk = trkList[0];

  const name = getFirstText(trk, ['name']) || filename;
  const typeStr = getFirstText(trk, ['type']) || filename;
  const trkpts = xmlDoc.getElementsByTagName('trkpt');
  const points: GeoPoint[] = [];

  for (let i = 0; i < trkpts.length; i++) {
    const pt = trkpts[i];
    const latStr = pt.getAttribute('lat');
    const lonStr = pt.getAttribute('lon');

    if (latStr && lonStr) {
      const lat = parseFloat(latStr);
      const lon = parseFloat(lonStr);
      const eleStr = getFirstText(pt, ['ele']);
      const timeStr = getFirstText(pt, ['time']);

      points.push({
        lat,
        lon,
        ele: eleStr ? parseFloat(eleStr) : 0,
        time: timeStr ? new Date(timeStr) : undefined,
      });
    }
  }

  return processPointsToActivity(points, name, detectSportType(typeStr));
};

const parseTcx = (content: string, filename: string): Activity => {
  const xmlDoc = parseXml(content);
  const activities = xmlDoc.getElementsByTagName('Activity');
  if (activities.length === 0) throw new Error('No activity found in TCX');

  const activity = activities[0];
  const sportAttr = activity.getAttribute('Sport') || filename;
  const name = getFirstText(activity, ['Id']) || filename;
  const trackpoints = activity.getElementsByTagName('Trackpoint');
  const points: GeoPoint[] = [];

  for (let i = 0; i < trackpoints.length; i++) {
    const trackpoint = trackpoints[i];
    const latStr = getFirstText(trackpoint, ['LatitudeDegrees']);
    const lonStr = getFirstText(trackpoint, ['LongitudeDegrees']);
    if (!latStr || !lonStr) continue;

    const eleStr = getFirstText(trackpoint, ['AltitudeMeters']);
    const timeStr = getFirstText(trackpoint, ['Time']);

    points.push({
      lat: parseFloat(latStr),
      lon: parseFloat(lonStr),
      ele: eleStr ? parseFloat(eleStr) : 0,
      time: timeStr ? new Date(timeStr) : undefined,
    });
  }

  return processPointsToActivity(points, name, detectSportType(sportAttr));
};

const parseFit = async (buffer: ArrayBuffer, filename: string): Promise<Activity> => {
  return new Promise((resolve, reject) => {
    const parser = new FitParser({
      force: true,
      speedUnit: 'km/h',
      lengthUnit: 'm',
      temperatureUnit: 'celsius',
      elapsedRecordField: true,
      mode: 'list',
    });

    parser.parse(buffer, (error: any, data: any) => {
      if (error) {
        reject(error);
        return;
      }

      let sportType = SportType.Other;
      const session = data.sessions && data.sessions.length > 0 ? data.sessions[0] : undefined;
      const nativeElevationGain = Number(
        session?.total_ascent ?? session?.enhanced_total_ascent ?? session?.totalAscent ?? session?.ascent
      );

      if (session) {
        if (session.sport) sportType = detectSportType(String(session.sport));
        if (sportType === SportType.Other && session.sub_sport) {
          sportType = detectSportType(String(session.sub_sport));
        }
      }
      if (sportType === SportType.Other) sportType = detectSportType(filename);

      const points: GeoPoint[] = [];

      if (data.records && Array.isArray(data.records)) {
        data.records.forEach((record: any) => {
          let lat = record.position_lat;
          let lon = record.position_long;

          if (lat == null) lat = record.lat;
          if (lon == null) lon = record.long;

          if (lat != null && lon != null) {
            if (Math.abs(lat) > 180) lat = lat * SEMICIRCLES_TO_DEGREES;
            if (Math.abs(lon) > 180) lon = lon * SEMICIRCLES_TO_DEGREES;

            if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
              points.push({
                lat,
                lon,
                ele: record.enhanced_altitude ?? record.altitude ?? record.ele ?? 0,
                time: record.timestamp ? new Date(record.timestamp) : undefined,
              });
            }
          }
        });
      }

      if (points.length === 0) {
        reject(new Error('No GPS track points found in FIT file.'));
        return;
      }

      try {
        const activity = processPointsToActivity(points, filename, sportType);
        if (Number.isFinite(nativeElevationGain) && nativeElevationGain > 0) {
          activity.stats.elevationGain = Math.max(activity.stats.elevationGain || 0, nativeElevationGain);
        }
        resolve(activity);
      } catch (e) {
        reject(e);
      }
    });
  });
};

const processPointsToActivity = (points: GeoPoint[], name: string, type: SportType): Activity => {
  if (points.length === 0) {
    throw new Error('No track points found');
  }

  let totalDist = 0;
  let maxEle = -Infinity;
  let minEle = Infinity;

  const validPoints = points.filter(p => !isNaN(p.lat) && !isNaN(p.lon));
  if (validPoints.length === 0) throw new Error('No valid track points');

  for (let i = 0; i < validPoints.length; i++) {
    const point = validPoints[i];
    if (point.ele !== undefined && !isNaN(point.ele)) {
      maxEle = Math.max(maxEle, point.ele);
      minEle = Math.min(minEle, point.ele);
    }
    if (i > 0) {
      const previous = validPoints[i - 1];
      const distance = calculateDistance(previous, point);
      if (!isNaN(distance)) totalDist += distance;
    }
  }

  const startTime = validPoints[0].time || new Date();
  const endTime = validPoints[validPoints.length - 1].time || new Date();
  const duration = (endTime.getTime() - startTime.getTime()) / 1000;
  const elapsedDuration = duration > 0 ? duration : 0;
  const movingStats = calculateMovingStats(validPoints, elapsedDuration, totalDist);

  const stats: ActivityStats = {
    distance: totalDist,
    duration: elapsedDuration,
    movingDuration: movingStats.duration,
    avgSpeed: movingStats.duration > 0 ? (movingStats.distance / 1000) / (movingStats.duration / 3600) : 0,
    maxEle: maxEle === -Infinity ? 0 : maxEle,
    minEle: minEle === Infinity ? 0 : minEle,
    elevationGain: calculateElevationGain(validPoints),
  };

  return {
    id: generateId(),
    name,
    type,
    startTime,
    stats,
    path: validPoints,
    color: SPORT_COLORS[type],
  };
};

const isSupportedActivityFile = (filename: string) => {
  const lower = filename.toLowerCase();
  return SUPPORTED_ACTIVITY_EXTENSIONS.some(ext => lower.endsWith(ext));
};

const expandFile = async (file: File): Promise<{ entries: ActivityFile[]; skipped: number }> => {
  const filename = file.name;
  const lower = filename.toLowerCase();
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (lower.endsWith('.zip')) {
    const entries = unzipSync(bytes);
    const activityEntries: ActivityFile[] = [];
    let skipped = 0;

    Object.entries(entries).forEach(([entryName, entryBytes]) => {
      if (entryName.endsWith('/')) return;
      const lowerEntry = entryName.toLowerCase();

      if (lowerEntry.endsWith('.gz')) {
        const innerName = entryName.replace(/\.gz$/i, '');
        if (isSupportedActivityFile(innerName)) {
          activityEntries.push({ name: innerName, bytes: decompressSync(entryBytes) });
        } else {
          skipped += 1;
        }
        return;
      }

      if (isSupportedActivityFile(entryName)) {
        activityEntries.push({ name: entryName, bytes: entryBytes });
      } else {
        skipped += 1;
      }
    });

    return { entries: activityEntries, skipped };
  }

  if (lower.endsWith('.gz')) {
    const innerName = filename.replace(/\.gz$/i, '');
    if (isSupportedActivityFile(innerName)) {
      return { entries: [{ name: innerName, bytes: decompressSync(bytes) }], skipped: 0 };
    }
    return { entries: [], skipped: 1 };
  }

  if (isSupportedActivityFile(filename)) {
    return { entries: [{ name: filename, bytes }], skipped: 0 };
  }

  return { entries: [], skipped: 1 };
};

const parseActivityFile = async ({ name, bytes }: ActivityFile): Promise<Activity> => {
  const lower = name.toLowerCase();
  if (lower.endsWith('.gpx')) return parseGpx(textFromBytes(bytes), name);
  if (lower.endsWith('.tcx')) return parseTcx(textFromBytes(bytes), name);
  if (lower.endsWith('.fit')) return parseFit(arrayBufferFromBytes(bytes), name);
  throw new Error(`Unsupported file type: ${name}`);
};

const calculateElevationGain = (points: GeoPoint[]) => {
  const elevations = points
    .map(point => point.ele)
    .filter((ele): ele is number => ele !== undefined && Number.isFinite(ele));

  if (elevations.length < 2) return 0;

  let gain = 0;
  let baseline = elevations[0];
  let pendingGain = 0;

  for (let i = 1; i < elevations.length; i++) {
    const delta = elevations[i] - baseline;

    if (delta > 0) {
      pendingGain += delta;
      baseline = elevations[i];
    } else if (Math.abs(delta) >= ELEVATION_NOISE_FLOOR_METERS) {
      gain += pendingGain;
      pendingGain = 0;
      baseline = elevations[i];
    }
  }

  return gain + pendingGain;
};

const calculateMovingStats = (points: GeoPoint[], fallbackDuration: number, fallbackDistance: number) => {
  let movingSeconds = 0;
  let movingDistance = 0;

  for (let i = 1; i < points.length; i++) {
    const previous = points[i - 1];
    const point = points[i];
    if (!previous.time || !point.time) continue;

    const seconds = (point.time.getTime() - previous.time.getTime()) / 1000;
    if (seconds <= 0) continue;

    const distance = calculateDistance(previous, point);
    const speedKmh = (distance / 1000) / (seconds / 3600);
    if (distance >= MOVING_DISTANCE_THRESHOLD_METERS && speedKmh >= MOVING_SPEED_THRESHOLD_KMH) {
      movingSeconds += seconds;
      movingDistance += distance;
    }
  }

  return movingSeconds > 0
    ? { duration: movingSeconds, distance: movingDistance }
    : { duration: fallbackDuration, distance: fallbackDistance };
};

export const parseFiles = async (
  files: File[],
  onProgress?: (progress: ParseProgress) => void,
  onComplete?: (summary: ParseSummary) => void
): Promise<Activity[]> => {
  const results: Activity[] = [];
  const summary: ParseSummary = { imported: 0, skipped: 0, failed: 0 };
  const expanded: ActivityFile[] = [];

  for (const file of files) {
    try {
      const { entries, skipped } = await expandFile(file);
      expanded.push(...entries);
      summary.skipped += skipped;
    } catch (error) {
      summary.failed += 1;
      console.error(`Failed to expand ${file.name}`, error);
    }
  }

  const total = expanded.length;

  for (let i = 0; i < total; i++) {
    const entry = expanded[i];

    onProgress?.({
      current: i + 1,
      total,
      filename: entry.name,
      ...summary,
    });

    await new Promise(resolve => setTimeout(resolve, 30));

    try {
      results.push(await parseActivityFile(entry));
      summary.imported += 1;
    } catch (error) {
      summary.failed += 1;
      console.error(`Failed to parse ${entry.name}`, error);
    }
  }

  onComplete?.(summary);
  return results;
};
