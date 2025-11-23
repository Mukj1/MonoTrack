import { Activity, GeoPoint, SportType, ActivityStats } from '../types';
import { calculateDistance } from '../utils/geoUtils';
import { SPORT_COLORS, STRING_TO_SPORT } from '../constants';
// @ts-ignore
import FitParser from 'fit-file-parser';

const SEMICIRCLES_TO_DEGREES = 180 / 2147483648;

// Helper to map string type to Enum
const detectSportType = (typeStr: string | undefined | null): SportType => {
  if (!typeStr) return SportType.Other;
  const lower = String(typeStr).toLowerCase();
  for (const [key, value] of Object.entries(STRING_TO_SPORT)) {
    if (lower.includes(key)) return value;
  }
  return SportType.Other;
};

// Generate ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Parse GPX content (XML string)
const parseGpx = (content: string, filename: string): Activity => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content, "text/xml");
  
  // Check for parser errors
  const parseError = xmlDoc.getElementsByTagName("parsererror");
  if (parseError.length > 0) {
    throw new Error("XML Parsing Error");
  }

  // Get track
  const trkList = xmlDoc.getElementsByTagName('trk');
  if (trkList.length === 0) throw new Error("No track found in GPX");
  const trk = trkList[0];

  const nameTags = trk.getElementsByTagName('name');
  const name = nameTags.length > 0 ? nameTags[0].textContent || filename : filename;
  
  const typeTags = trk.getElementsByTagName('type');
  const typeStr = typeTags.length > 0 ? typeTags[0].textContent : undefined;
  
  // Get all trackpoints across all segments
  const trkpts = xmlDoc.getElementsByTagName('trkpt');
  const points: GeoPoint[] = [];
  
  for (let i = 0; i < trkpts.length; i++) {
    const pt = trkpts[i];
    const latStr = pt.getAttribute('lat');
    const lonStr = pt.getAttribute('lon');
    
    if (latStr && lonStr) {
        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);
        
        const eleTags = pt.getElementsByTagName('ele');
        const ele = eleTags.length > 0 ? parseFloat(eleTags[0].textContent || '0') : 0;
        
        const timeTags = pt.getElementsByTagName('time');
        const timeStr = timeTags.length > 0 ? timeTags[0].textContent : null;
        
        points.push({
          lat,
          lon,
          ele,
          time: timeStr ? new Date(timeStr) : undefined
        });
    }
  }

  return processPointsToActivity(points, name, detectSportType(typeStr));
};

// Parse FIT content using fit-file-parser
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
            if (data.sessions && data.sessions.length > 0) {
                const session = data.sessions[0];
                if (session.sport) sportType = detectSportType(String(session.sport));
                if (sportType === SportType.Other && session.sub_sport) {
                     sportType = detectSportType(String(session.sub_sport));
                }
            }

            const points: GeoPoint[] = [];
            
            if (data.records && Array.isArray(data.records)) {
                data.records.forEach((record: any) => {
                    // Try multiple field names for coordinates
                    let lat = record.position_lat;
                    let lon = record.position_long;
                    
                    // Fallbacks if explicit position fields aren't found
                    if (lat == null) lat = record.lat;
                    if (lon == null) lon = record.long;

                    if (lat != null && lon != null) {
                        // Convert semicircles to degrees if value is large (standard FIT format)
                        if (Math.abs(lat) > 180) {
                            lat = lat * SEMICIRCLES_TO_DEGREES;
                        }
                        if (Math.abs(lon) > 180) {
                            lon = lon * SEMICIRCLES_TO_DEGREES;
                        }

                        // Basic validity check for Earth coordinates
                        if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                            points.push({
                                lat: lat,
                                lon: lon,
                                ele: record.altitude || record.ele || 0,
                                time: record.timestamp ? new Date(record.timestamp) : undefined
                            });
                        }
                    }
                });
            }

            if (points.length === 0) {
                reject(new Error("No GPS track points found in FIT file."));
                return;
            }

            try {
                const activity = processPointsToActivity(points, filename, sportType);
                resolve(activity);
            } catch (e) {
                reject(e);
            }
        });
    });
};

const processPointsToActivity = (points: GeoPoint[], name: string, type: SportType): Activity => {
  if (points.length === 0) {
    throw new Error("No track points found");
  }

  let totalDist = 0;
  let maxEle = -Infinity;
  let minEle = Infinity;

  // Filter out points with invalid lat/lon just in case
  const validPoints = points.filter(p => !isNaN(p.lat) && !isNaN(p.lon));
  if (validPoints.length === 0) throw new Error("No valid track points");

  for (let i = 0; i < validPoints.length; i++) {
    const p = validPoints[i];
    if (p.ele !== undefined && !isNaN(p.ele)) {
      maxEle = Math.max(maxEle, p.ele);
      minEle = Math.min(minEle, p.ele);
    }
    if (i > 0) {
      const d = calculateDistance(validPoints[i - 1], p);
      if (!isNaN(d)) {
          totalDist += d;
      }
    }
  }

  const startTime = validPoints[0].time || new Date();
  const endTime = validPoints[validPoints.length - 1].time || new Date();
  const duration = (endTime.getTime() - startTime.getTime()) / 1000;

  const stats: ActivityStats = {
    distance: totalDist,
    duration: duration > 0 ? duration : 0,
    avgSpeed: duration > 0 ? (totalDist / 1000) / (duration / 3600) : 0,
    maxEle: maxEle === -Infinity ? 0 : maxEle,
    minEle: minEle === Infinity ? 0 : minEle,
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

export const parseFiles = async (
  files: File[], 
  onProgress?: (current: number, total: number, filename: string) => void
): Promise<Activity[]> => {
  const results: Activity[] = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];

    if (onProgress) {
        onProgress(i + 1, total, file.name);
    }

    // Yield to the event loop to allow UI updates (progress bar) to render
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      if (file.name.toLowerCase().endsWith('.gpx')) {
        const text = await file.text();
        results.push(parseGpx(text, file.name));
      } else if (file.name.toLowerCase().endsWith('.fit')) {
        const buffer = await file.arrayBuffer();
        const activity = await parseFit(buffer, file.name);
        results.push(activity);
      }
    } catch (err) {
      console.error(`Failed to parse ${file.name}`, err);
      // We don't throw here to allow partial success of other files
    }
  }
  return results;
};
