import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import ActivityMap from './components/ActivityMap';
import { Activity, SportType } from './types';
import { parseFiles, ParseProgress, ParseSummary } from './services/fileParser';
import {
  addStoredActivities,
  clearStoredActivities,
  deleteStoredActivity,
  loadStoredActivities,
  renameStoredActivity,
} from './services/activityStore';
import { formatDate, formatDistance, formatDuration, formatElevation, formatSpeed } from './utils/geoUtils';
import { SPORT_DISPLAY_NAMES, TRANSLATIONS } from './constants';
import { Loader2 } from 'lucide-react';

const DetailStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="min-w-0 rounded-md border border-stone-200/80 bg-white/55 px-3 py-2">
    <div className="text-[10px] uppercase tracking-wider text-stone-500">{label}</div>
    <div className="mt-1 truncate font-mono text-[15px] text-stone-950">{value}</div>
  </div>
);

const App: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState<SportType | null>(null);
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [parseProgress, setParseProgress] = useState<ParseProgress | null>(null);
  const [importSummary, setImportSummary] = useState<ParseSummary | null>(null);
  const [language, setLanguage] = useState<'en' | 'zh'>('zh');
  const [uploadMode, setUploadMode] = useState<'expanding' | 'parsing' | 'saving'>('expanding');

  const t = TRANSLATIONS[language];

  useEffect(() => {
    let isMounted = true;

    loadStoredActivities()
      .then(storedActivities => {
        if (!isMounted) return;
        setActivities(storedActivities.sort((a, b) => b.startTime.getTime() - a.startTime.getTime()));
        setSelectedTrackIds(storedActivities.map(activity => activity.id));
      })
      .catch(error => console.error('Failed to load local activities:', error));

    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    if (target.files && target.files.length > 0) {
      setIsLoading(true);
      setUploadMode('expanding');
      setParseProgress(null);
      setImportSummary(null);
      const files = Array.from(target.files) as File[];
      
      // Clear the input value immediately so the same file can be selected again if needed
      target.value = '';
      
      // Use setTimeout with a slightly longer delay (300ms) to ensure React fully renders 
      // the Loading Modal state to the DOM before the heavy JS parsing blocks the thread.
      setTimeout(async () => {
        try {
          const parsedActivities = await parseFiles(files, progress => {
            setUploadMode('parsing');
            setParseProgress(progress);
          }, setImportSummary);
          
          // Sort by date descending
          const sorted = parsedActivities.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

          setActivities(prev => [...sorted, ...prev].sort((a, b) => b.startTime.getTime() - a.startTime.getTime()));
          setSelectedTrackIds(prev => Array.from(new Set([...prev, ...sorted.map(activity => activity.id)])));

          if (sorted.length > 0) {
            setUploadMode('saving');
            try {
              await addStoredActivities(sorted);
            } catch (saveError) {
              console.error('Failed to save imported activities locally:', saveError);
            }
          }
        } catch (error) {
          console.error("File parsing error:", error);
          setImportSummary(prev => prev || { imported: 0, skipped: 0, failed: files.length });
        } finally {
          setIsLoading(false);
          setParseProgress(null);
        }
      }, 300);
    }
  };

  const handleActivitySelect = (id: string | null) => {
    if (isMultiSelectMode && id) {
      setSelectedTrackIds(prev => (
        prev.includes(id) ? prev.filter(trackId => trackId !== id) : [...prev, id]
      ));
      return;
    }
    setSelectedId(id);
  };

  const handleActivityHover = (id: string | null) => {
    setHoveredId(id);
  };

  const handleDeleteActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
    setSelectedTrackIds(prev => prev.filter(trackId => trackId !== id));
    deleteStoredActivity(id).catch(error => console.error('Failed to delete local activity:', error));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const handleToggleMultiSelectMode = () => {
    setIsMultiSelectMode(prev => {
      const next = !prev;
      if (next) {
        setSelectedId(null);
        setSelectedTrackIds(current => current.length > 0 ? current : filteredActivities.map(activity => activity.id));
      }
      return next;
    });
  };

  const handleToggleTrackSelection = (id: string) => {
    setSelectedTrackIds(prev => (
      prev.includes(id) ? prev.filter(trackId => trackId !== id) : [...prev, id]
    ));
  };

  const handleSelectAllTracks = (ids?: string[]) => {
    setSelectedTrackIds(ids || filteredActivities.map(activity => activity.id));
  };

  const handleDeselectAllTracks = () => {
    setSelectedTrackIds([]);
  };

  const handleDeleteSelectedTracks = () => {
    const selectedSet = new Set(selectedTrackIds);
    setActivities(prev => prev.filter(activity => !selectedSet.has(activity.id)));
    setSelectedTrackIds([]);
    selectedTrackIds.forEach(id => {
      deleteStoredActivity(id).catch(error => console.error('Failed to delete local activity:', error));
    });
  };

  const handleRenameActivity = (id: string, name: string) => {
    setActivities(prev => prev.map(activity => (
      activity.id === id ? { ...activity, name } : activity
    )));
    renameStoredActivity(id, name).catch(error => console.error('Failed to rename local activity:', error));
  };

  const handleClearAll = () => {
    setActivities([]);
    setSelectedId(null);
    setSelectedTrackIds([]);
    setSportFilter(null);
    setDateFilter({ start: '', end: '' });
    clearStoredActivities().catch(error => console.error('Failed to clear local activities:', error));
  };

  const handleFilterChange = (type: SportType | null) => {
    setSportFilter(type);
    setSelectedId(null); // Clear selection when filter changes
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setDateFilter({ start, end });
    setSelectedId(null);
  };

  // Filter activities passed to map and sidebar
  const filteredActivities = useMemo(() => {
    let result = activities;

    // Sport Filter
    if (sportFilter) {
      result = result.filter(a => a.type === sportFilter);
    }

    // Date Filter
    if (dateFilter.start) {
        // Parse YYYY-MM-DD to local midnight
        const [y, m, d] = dateFilter.start.split('-').map(Number);
        const startDate = new Date(y, m - 1, d);
        result = result.filter(a => a.startTime >= startDate);
    }
    if (dateFilter.end) {
        // Parse YYYY-MM-DD to local end of day
        const [y, m, d] = dateFilter.end.split('-').map(Number);
        const endDate = new Date(y, m - 1, d);
        endDate.setHours(23, 59, 59, 999);
        result = result.filter(a => a.startTime <= endDate);
    }

    return result;
  }, [activities, sportFilter, dateFilter]);

  const selectedActivity = useMemo(
    () => filteredActivities.find(a => a.id === selectedId) || null,
    [filteredActivities, selectedId]
  );

  const visibleActivities = useMemo(() => {
    if (isMultiSelectMode) {
      const selectedSet = new Set(selectedTrackIds);
      return filteredActivities.filter(activity => selectedSet.has(activity.id));
    }

    if (selectedId) {
      return filteredActivities.filter(activity => activity.id === selectedId);
    }

    return filteredActivities;
  }, [filteredActivities, isMultiSelectMode, selectedId, selectedTrackIds]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-stone-100 md:flex-row">
      <Sidebar 
        activities={filteredActivities} 
        onFileUpload={handleFileUpload}
        onFilterChange={handleFilterChange}
        onActivitySelect={handleActivitySelect}
        onDeleteActivity={handleDeleteActivity}
        onDeleteSelectedActivities={handleDeleteSelectedTracks}
        onRenameActivity={handleRenameActivity}
        onClearAll={handleClearAll}
        isMultiSelectMode={isMultiSelectMode}
        selectedTrackIds={selectedTrackIds}
        onToggleMultiSelectMode={handleToggleMultiSelectMode}
        onToggleTrackSelection={handleToggleTrackSelection}
        onSelectAllTracks={handleSelectAllTracks}
        onDeselectAllTracks={handleDeselectAllTracks}
        selectedId={selectedId}
        currentFilter={sportFilter}
        dateRange={dateFilter}
        onDateRangeChange={handleDateRangeChange}
        importSummary={importSummary}
        language={language}
        onLanguageChange={setLanguage}
      />
      
      <div className="flex-1 relative bg-stone-100">
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-stone-950/35 backdrop-blur-[2px] transition-all duration-300">
            <div className="absolute left-4 right-4 top-4 z-10 rounded-lg border border-white/10 bg-stone-950/92 p-4 shadow-2xl md:left-6 md:right-auto md:top-6 md:w-[420px]">
              <div className="flex items-center gap-4">
                <Loader2 className="h-9 w-9 shrink-0 animate-spin text-[#C66A3D]" strokeWidth={1.6} />
                <div className="min-w-0">
                  <h3 className="font-medium tracking-wide text-white">
                    {uploadMode === 'saving' ? t.saving : t.parsing}
                  </h3>
                  <p className="mt-1 truncate text-xs text-stone-400">
                    {uploadMode === 'saving'
                      ? t.savingLocal
                      : parseProgress
                      ? `${parseProgress.current}/${parseProgress.total || parseProgress.current} · ${parseProgress.filename}`
                      : t.preparingImport}
                  </p>
                </div>
              </div>
              {parseProgress && (
                <div className="mt-5">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#C66A3D] transition-all duration-300"
                      style={{ width: `${Math.max(8, (parseProgress.current / Math.max(parseProgress.total, 1)) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-3 flex justify-between text-[11px] text-stone-400">
                    <span>{parseProgress.imported} {t.imported}</span>
                    <span>{parseProgress.skipped} {t.skipped}</span>
                    <span>{parseProgress.failed} {t.failed}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        <ActivityMap 
          activities={visibleActivities} 
          selectedId={selectedId} 
          onActivityClick={handleActivitySelect}
          onActivityHover={handleActivityHover}
          language={language}
        />

        {selectedActivity && (
          <div className="pointer-events-none absolute left-4 right-4 top-4 z-[400] rounded-lg border border-white/70 bg-white/88 p-4 shadow-[0_18px_50px_rgba(41,37,36,0.18)] backdrop-blur md:left-auto md:w-[368px]">
            <div className="flex items-start gap-3">
              <div
                className="mt-1 h-10 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: selectedActivity.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">{t.selectedTrack}</div>
                <h3 className="mt-1 truncate text-lg font-semibold text-stone-950">{selectedActivity.name}</h3>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-stone-600">
                  <span className="rounded-md bg-stone-900/5 px-2 py-1">{SPORT_DISPLAY_NAMES[language][selectedActivity.type]}</span>
                  <span className="rounded-md bg-stone-900/5 px-2 py-1">{formatDate(selectedActivity.startTime, language)}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <DetailStat label={t.distance} value={formatDistance(selectedActivity.stats.distance)} />
              <DetailStat label={t.duration} value={formatDuration(selectedActivity.stats.duration)} />
              <DetailStat label={t.avgSpeed} value={formatSpeed(selectedActivity.stats.avgSpeed)} />
              <DetailStat label={t.elevationGain} value={formatElevation(selectedActivity.stats.elevationGain || 0)} />
              <DetailStat label={t.maxEle} value={formatElevation(selectedActivity.stats.maxEle)} />
              <DetailStat label={t.minEle} value={formatElevation(selectedActivity.stats.minEle)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
