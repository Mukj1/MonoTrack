import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, useMap, Tooltip, useMapEvents, ZoomControl } from 'react-leaflet';
import { Activity } from '../types';
import { MAP_TILE_URL, MAP_ATTRIBUTION, SPORT_COLORS, SPORT_DISPLAY_NAMES, TRANSLATIONS } from '../constants';
import { formatDistance, formatDuration } from '../utils/geoUtils';
import L from 'leaflet';

interface ActivityMapProps {
  activities: Activity[];
  selectedId: string | null;
  onActivityClick: (id: string | null) => void;
  onActivityHover: (id: string | null) => void;
  language: 'en' | 'zh';
}

// Helper to force map resize update (Fixes gray areas)
const MapInvalidator: React.FC = () => {
    const map = useMap();
    useEffect(() => {
        // Slight delay to ensure container has sized
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 200);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
};

// Handle Map events (Double click to clear selection)
const MapEvents: React.FC<{ onDeselect: () => void }> = ({ onDeselect }) => {
    useMapEvents({
        dblclick: () => {
            onDeselect();
        },
    });
    return null;
};

// Component to handle auto-zoom bounds
const MapBoundsRaw: React.FC<{ activities: Activity[]; selectedId: string | null }> = ({ activities, selectedId }) => {
  const map = useMap();

  // Effect 1: Fit bounds to ALL activities when the data changes (Upload or Filter change)
  // This ensures we see new data, but doesn't trigger on selection changes.
  useEffect(() => {
    if (activities.length === 0) return;

    const bounds = L.latLngBounds([]);
    activities.forEach(act => {
      act.path.forEach(p => bounds.extend([p.lat, p.lon]));
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true, duration: 1.2 });
    }
  }, [activities, map]); 

  // Effect 2: Fit bounds to SELECTED activity only when selection is made.
  // IMPORTANT: We intentionally check if selectedId exists. If it is null (deselect), we DO NOTHING.
  // This preserves the user's zoom level when they cancel a selection.
  useEffect(() => {
    if (!selectedId) return;

    const targetActivity = activities.find(a => a.id === selectedId);
    if (!targetActivity) return;

    const bounds = L.latLngBounds([]);
    targetActivity.path.forEach(p => bounds.extend([p.lat, p.lon]));

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true, duration: 1.2 });
    }
  }, [selectedId, activities, map]);

  return null;
};

const MapBounds = React.memo(MapBoundsRaw);

// Legend Component
const MapLegend: React.FC<{ activities: Activity[]; language: 'en' | 'zh' }> = ({ activities, language }) => {
    const uniqueTypes = useMemo(() => {
        return Array.from(new Set(activities.map(a => a.type)));
    }, [activities]);

    if (uniqueTypes.length === 0) return null;

    return (
        <div className="leaflet-bottom leaflet-left">
            <div className="leaflet-control leaflet-bar m-4 bg-white/95 backdrop-blur p-3 rounded-lg shadow-xl text-xs border border-gray-100">
                <div className="font-bold text-gray-400 mb-2 uppercase tracking-wider text-[10px]">{TRANSLATIONS[language].legend}</div>
                <div className="space-y-1.5">
                    {uniqueTypes.map(type => (
                        <div key={type} className="flex items-center gap-2">
                            <div 
                                className="w-2.5 h-2.5 rounded-full shadow-sm ring-1 ring-gray-100"
                                style={{ backgroundColor: SPORT_COLORS[type] }} 
                            />
                            <span className="text-gray-600 font-medium">{SPORT_DISPLAY_NAMES[language][type]}</span>
                        </div>
                    ))}
                </div>
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
  const visibleActivities = useMemo(() => {
    if (selectedId) {
      return activities.filter(a => a.id === selectedId);
    }
    return activities;
  }, [activities, selectedId]);

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      className="w-full h-full bg-neutral-100"
      zoomSnap={0.5}
      zoomDelta={0.5}
      maxZoom={20} // Enable deeper zoom
      scrollWheelZoom={true}
      doubleClickZoom={false} // Disable default dblclick zoom to allow dblclick deselect
      zoomControl={false} // We add custom position below
    >
      <MapInvalidator />
      <MapEvents onDeselect={() => onActivityClick(null)} />
      <ZoomControl position="bottomright" />

      <TileLayer
        attribution={MAP_ATTRIBUTION}
        url={MAP_TILE_URL}
        maxZoom={20}
        opacity={1}
      />
      
      <MapBounds activities={activities} selectedId={selectedId} />
      <MapLegend activities={activities} language={language} />

      {visibleActivities.map((activity) => {
        const isSelected = selectedId === activity.id;
        return (
            <Polyline
            key={activity.id}
            positions={activity.path.map(p => [p.lat, p.lon])}
            pathOptions={{
                color: activity.color,
                weight: isSelected ? 5 : 3,
                opacity: isSelected ? 1 : 0.8,
                lineCap: 'round',
                lineJoin: 'round'
            }}
            eventHandlers={{
                click: (e) => {
                    L.DomEvent.stopPropagation(e); 
                    onActivityClick(activity.id);
                },
                mouseover: (e) => {
                    const target = e.target;
                    target.setStyle({ weight: 6, opacity: 1 });
                    target.bringToFront();
                    onActivityHover(activity.id);
                },
                mouseout: (e) => {
                    const target = e.target;
                    if (selectedId !== activity.id) {
                        target.setStyle({ weight: 3, opacity: 0.8 });
                    } else {
                        target.setStyle({ weight: 5, opacity: 1 });
                    }
                    onActivityHover(null);
                }
            }}
            >
            {/* Cleaner Tooltip */}
            <Tooltip 
                sticky 
                direction="top" 
                offset={[0, -10]}
                opacity={1}
                className="!bg-transparent !border-0 !shadow-none !p-0"
            >
                <div className="bg-neutral-900/90 backdrop-blur text-white p-2 rounded shadow-xl font-sans text-xs pointer-events-none">
                    <div className="font-bold mb-0.5 text-sm">{activity.name}</div>
                    <div className="flex items-center gap-3 text-neutral-300 font-mono">
                        <span>{formatDistance(activity.stats.distance)}</span>
                        <span className="w-1 h-1 bg-neutral-500 rounded-full"></span>
                        <span>{formatDuration(activity.stats.duration)}</span>
                    </div>
                </div>
            </Tooltip>
            </Polyline>
        );
      })}
    </MapContainer>
  );
};

export default ActivityMap;