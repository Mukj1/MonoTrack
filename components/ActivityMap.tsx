import React, { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { GeoJSONSource, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Activity } from '../types';
import { DEFAULT_MAP_PROVIDER, SPORT_COLORS, SPORT_DISPLAY_NAMES, TRANSLATIONS } from '../constants';
import { formatDistance, formatDuration } from '../utils/geoUtils';

interface ActivityMapProps {
  activities: Activity[];
  selectedId: string | null;
  onActivityClick: (id: string | null) => void;
  onActivityHover: (id: string | null) => void;
  language: 'en' | 'zh';
}

interface TooltipInfo {
  x: number;
  y: number;
  name: string;
  typeLabel: string;
  distance: string;
  duration: string;
  color: string;
}

const SOURCE_ID = 'activity-tracks';
const OUTLINE_LAYER_ID = 'activity-track-outline';
const LINE_LAYER_ID = 'activity-track-line';
const EMPTY_FEATURE_COLLECTION = {
  type: 'FeatureCollection',
  features: [],
};

const createTileUrls = () => {
  const subdomains = DEFAULT_MAP_PROVIDER.url.includes('{s}') ? ['a', 'b', 'c', 'd'] : [''];
  return subdomains.map(subdomain =>
    DEFAULT_MAP_PROVIDER.url
      .replace('{s}', subdomain)
      .replace('{r}', '')
  );
};

const createMapStyle = (): StyleSpecification => ({
  version: 8,
  sources: {
    basemap: {
      type: 'raster',
      tiles: createTileUrls(),
      tileSize: 256,
      attribution: DEFAULT_MAP_PROVIDER.attribution,
    },
  },
  layers: [
    {
      id: 'basemap',
      type: 'raster',
      source: 'basemap',
      paint: {
        'raster-opacity': 1,
      },
    },
  ],
});

const buildFeatureCollection = (activities: Activity[], language: 'en' | 'zh') => ({
  type: 'FeatureCollection',
  features: activities
    .filter(activity => activity.path.length > 1)
    .map(activity => ({
      type: 'Feature',
      properties: {
        id: activity.id,
        name: activity.name,
        typeLabel: SPORT_DISPLAY_NAMES[language][activity.type],
        distance: formatDistance(activity.stats.distance),
        duration: formatDuration(activity.stats.duration),
        color: activity.color,
      },
      geometry: {
        type: 'LineString',
        coordinates: activity.path.map(point => [point.lon, point.lat]),
      },
    })),
});

const buildBounds = (activities: Activity[]) => {
  const bounds = new maplibregl.LngLatBounds();
  let hasPoint = false;

  activities.forEach(activity => {
    activity.path.forEach(point => {
      bounds.extend([point.lon, point.lat]);
      hasPoint = true;
    });
  });

  return hasPoint ? bounds : null;
};

const ensureTrackLayers = (map: maplibregl.Map) => {
  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: EMPTY_FEATURE_COLLECTION,
    });
  }

  if (!map.getLayer(OUTLINE_LAYER_ID)) {
    map.addLayer({
      id: OUTLINE_LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#fffaf0',
        'line-width': 0,
        'line-opacity': 0,
      },
    });
  }

  if (!map.getLayer(LINE_LAYER_ID)) {
    map.addLayer({
      id: LINE_LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 3,
        'line-opacity': 0.62,
      },
    });
  }
};

const updateTrackPaint = (map: maplibregl.Map, selectedId: string | null, hoveredId: string | null) => {
  if (!map.getLayer(LINE_LAYER_ID) || !map.getLayer(OUTLINE_LAYER_ID)) return;

  const selected = selectedId || '__none__';
  const hovered = hoveredId || '__none__';

  map.setPaintProperty(OUTLINE_LAYER_ID, 'line-width', [
    'case',
    ['==', ['get', 'id'], selected],
    12,
    0,
  ]);
  map.setPaintProperty(OUTLINE_LAYER_ID, 'line-opacity', [
    'case',
    ['==', ['get', 'id'], selected],
    0.9,
    0,
  ]);
  map.setPaintProperty(LINE_LAYER_ID, 'line-width', [
    'case',
    ['==', ['get', 'id'], selected],
    ['case', ['==', ['get', 'id'], hovered], 7, 6],
    ['==', ['get', 'id'], hovered],
    5,
    3,
  ]);
  map.setPaintProperty(LINE_LAYER_ID, 'line-opacity', [
    'case',
    ['==', ['get', 'id'], selected],
    0.98,
    ['==', ['get', 'id'], hovered],
    0.92,
    selectedId ? 0.22 : 0.62,
  ]);
  map.setLayoutProperty(LINE_LAYER_ID, 'line-sort-key', [
    'case',
    ['==', ['get', 'id'], selected],
    2,
    ['==', ['get', 'id'], hovered],
    1,
    0,
  ]);
};

const MapLegend: React.FC<{ activities: Activity[]; language: 'en' | 'zh' }> = ({ activities, language }) => {
  const uniqueTypes = useMemo(() => Array.from(new Set(activities.map(a => a.type))), [activities]);

  if (uniqueTypes.length === 0) return null;

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-[360] max-h-56 overflow-y-auto rounded-lg border border-white/70 bg-white/85 p-3 text-xs shadow-[0_14px_40px_rgba(41,37,36,0.16)] backdrop-blur">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">{TRANSLATIONS[language].legend}</div>
      <div className={`gap-x-4 gap-y-1.5 ${uniqueTypes.length > 8 ? 'grid grid-cols-2' : 'space-y-1.5'}`}>
        {uniqueTypes.map(type => (
          <div key={type} className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full shadow-sm ring-1 ring-white/80"
              style={{ backgroundColor: SPORT_COLORS[type] }}
            />
            <span className="whitespace-nowrap font-medium text-stone-600">{SPORT_DISPLAY_NAMES[language][type]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ActivityMap: React.FC<ActivityMapProps> = ({
  activities,
  selectedId,
  onActivityClick,
  onActivityHover,
  language
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onActivityClickRef = useRef(onActivityClick);
  const onActivityHoverRef = useRef(onActivityHover);
  const tooltipActivityRef = useRef<TooltipInfo | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    onActivityClickRef.current = onActivityClick;
    onActivityHoverRef.current = onActivityHover;
  }, [onActivityClick, onActivityHover]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: createMapStyle(),
      center: [0, 20],
      zoom: 1.5,
      attributionControl: false,
    });

    map.doubleClickZoom.disable();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      mapRef.current = map;
      ensureTrackLayers(map);
      setIsMapReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    ensureTrackLayers(map);
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(buildFeatureCollection(activities, language) as any);
  }, [activities, language, isMapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    const handleClick = (event: maplibregl.MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const id = feature?.properties?.id;
      if (id) onActivityClickRef.current(String(id));
    };

    const handleMapClick = (event: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(event.point, { layers: [LINE_LAYER_ID] });
      if (features.length === 0) onActivityClickRef.current(null);
    };

    const handleMouseMove = (event: maplibregl.MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature?.properties) return;

      const id = String(feature.properties.id);
      map.getCanvas().style.cursor = 'pointer';
      setHoveredId(id);
      onActivityHoverRef.current(id);

      const nextTooltip: TooltipInfo = {
        x: event.point.x,
        y: event.point.y,
        name: String(feature.properties.name),
        typeLabel: String(feature.properties.typeLabel),
        distance: String(feature.properties.distance),
        duration: String(feature.properties.duration),
        color: String(feature.properties.color),
      };

      tooltipActivityRef.current = nextTooltip;
      setTooltip(nextTooltip);
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
      setHoveredId(null);
      setTooltip(null);
      tooltipActivityRef.current = null;
      onActivityHoverRef.current(null);
    };

    map.on('click', handleMapClick);
    map.on('click', LINE_LAYER_ID, handleClick);
    map.on('mousemove', LINE_LAYER_ID, handleMouseMove);
    map.on('mouseleave', LINE_LAYER_ID, handleMouseLeave);

    return () => {
      map.off('click', handleMapClick);
      map.off('click', LINE_LAYER_ID, handleClick);
      map.off('mousemove', LINE_LAYER_ID, handleMouseMove);
      map.off('mouseleave', LINE_LAYER_ID, handleMouseLeave);
    };
  }, [isMapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;
    updateTrackPaint(map, selectedId, hoveredId);
  }, [selectedId, hoveredId, isMapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || activities.length === 0) return;

    const bounds = buildBounds(activities);
    if (bounds) {
      map.fitBounds(bounds, { padding: 70, maxZoom: 13, duration: 900 });
    }
  }, [activities, isMapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || !selectedId) return;

    const selectedActivity = activities.find(activity => activity.id === selectedId);
    if (!selectedActivity) return;

    const bounds = buildBounds([selectedActivity]);
    if (bounds) {
      map.fitBounds(bounds, { padding: 90, maxZoom: 15, duration: 900 });
    }
  }, [activities, selectedId, isMapReady]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full bg-stone-100" />

      {activities.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[350] flex items-center justify-center p-6">
          <div className="max-w-sm rounded-lg border border-white/70 bg-white/82 p-5 text-center shadow-[0_18px_50px_rgba(41,37,36,0.16)] backdrop-blur">
            <div className="text-sm font-semibold text-stone-950">{t.mapEmptyTitle}</div>
            <div className="mt-2 text-xs leading-relaxed text-stone-500">{t.mapEmptyBody}</div>
          </div>
        </div>
      )}

      {tooltip && (
        <div
          className="pointer-events-none absolute z-[370] max-w-64 rounded-lg border border-white/10 bg-stone-950/90 p-3 text-xs text-white shadow-xl backdrop-blur"
          style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
        >
          <div className="mb-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tooltip.color }} />
            <span className="font-semibold">{tooltip.typeLabel}</span>
          </div>
          <div className="truncate text-sm font-semibold">{tooltip.name}</div>
          <div className="mt-1.5 flex items-center gap-3 font-mono text-stone-300">
            <span>{tooltip.distance}</span>
            <span className="h-1 w-1 rounded-full bg-stone-500" />
            <span>{tooltip.duration}</span>
          </div>
        </div>
      )}

      <MapLegend activities={activities} language={language} />
    </div>
  );
};

export default ActivityMap;
