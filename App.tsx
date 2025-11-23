import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import ActivityMap from './components/ActivityMap';
import { Activity, SportType } from './types';
import { parseFiles } from './services/fileParser';
import { formatDate } from './utils/geoUtils';
import { SPORT_DISPLAY_NAMES, TRANSLATIONS } from './constants';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState<SportType | null>(null);
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<{ current: number; total: number; filename: string } | null>(null);
  const [language, setLanguage] = useState<'en' | 'zh'>('zh');

  const t = TRANSLATIONS[language];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    if (target.files && target.files.length > 0) {
      setIsLoading(true);
      const files = Array.from(target.files);
      
      // Clear the input value immediately so the same file can be selected again if needed
      target.value = '';
      
      // Initialize progress
      setLoadingProgress({ current: 0, total: files.length, filename: 'Initializing...' });

      // Use setTimeout to yield to the event loop, allowing React to render the Loading UI 
      // BEFORE the heavy parsing logic freezes the main thread.
      setTimeout(async () => {
        try {
          const parsedActivities = await parseFiles(files, (current, total, filename) => {
              setLoadingProgress({ current, total, filename });
          });
          
          // Sort by date descending
          const sorted = parsedActivities.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
          
          setActivities(prev => [...prev, ...sorted]);
        } catch (error) {
          console.error("File parsing error:", error);
        } finally {
          setIsLoading(false);
          setLoadingProgress(null);
        }
      }, 100);
    }
  };

  const handleActivitySelect = (id: string | null) => {
    setSelectedId(id);
  };

  const handleActivityHover = (id: string | null) => {
    setHoveredId(id);
  };

  const handleDeleteActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const handleClearAll = () => {
    setActivities([]);
    setSelectedId(null);
    setSportFilter(null);
    setDateFilter({ start: '', end: '' });
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

  // Click on Map to deselect
  const handleMapAreaClick = (e: React.MouseEvent) => {
      // Handled by map events mostly, but this is a fallback for the container bg
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-neutral-100">
      <Sidebar 
        activities={filteredActivities} 
        onFileUpload={handleFileUpload}
        onFilterChange={handleFilterChange}
        onActivitySelect={handleActivitySelect}
        onDeleteActivity={handleDeleteActivity}
        onClearAll={handleClearAll}
        selectedId={selectedId}
        currentFilter={sportFilter}
        dateRange={dateFilter}
        onDateRangeChange={handleDateRangeChange}
        language={language}
        onLanguageChange={setLanguage}
      />
      
      <div className="flex-1 relative bg-neutral-100" onClick={handleMapAreaClick}>
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-md transition-all duration-300">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-6 transform scale-100 animate-in fade-in zoom-in-95 duration-200 min-w-[240px]">
                
                {/* Dynamic Loading Spinner */}
                <div className="relative">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-full blur-xl animate-pulse" />
                    </div>
                </div>

                <div className="text-center space-y-2">
                    <h3 className="text-white font-bold tracking-tight text-lg">{t.parsing}</h3>
                    {loadingProgress && (
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-neutral-400 font-mono text-xs max-w-[200px] truncate">
                                {loadingProgress.filename}
                            </span>
                            <span className="text-neutral-600 font-mono text-[10px] uppercase tracking-widest">
                                {loadingProgress.current} / {loadingProgress.total}
                            </span>
                        </div>
                    )}
                </div>

            </div>
          </div>
        )}
        
        <ActivityMap 
          activities={filteredActivities} 
          selectedId={selectedId} 
          onActivityClick={handleActivitySelect}
          onActivityHover={handleActivityHover}
          language={language}
        />

        {/* Floating Info for selected track */}
        {selectedId && (
           <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur border border-neutral-200 p-4 rounded shadow-xl max-w-xs pointer-events-none">
              <div className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest mb-1">{t.selectedTrack}</div>
              {filteredActivities.filter(a => a.id === selectedId).map(a => (
                  <div key={a.id}>
                      <h3 className="text-gray-900 font-bold text-lg mb-1">{a.name}</h3>
                      <div className="flex gap-2 text-xs text-gray-600">
                          <span className="bg-gray-200 px-1.5 py-0.5 rounded">{SPORT_DISPLAY_NAMES[language][a.type]}</span>
                          <span className="bg-gray-200 px-1.5 py-0.5 rounded">{formatDate(a.startTime, language)}</span>
                      </div>
                  </div>
              ))}
           </div>
        )}
      </div>
    </div>
  );
};

export default App;