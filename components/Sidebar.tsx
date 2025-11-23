import React, { useRef, useMemo, useState } from 'react';
import { Activity, SportType } from '../types';
import { SPORT_COLORS, SPORT_DISPLAY_NAMES, TRANSLATIONS } from '../constants';
import { Upload, Filter, X, ChevronRight, Calendar, Clock, Map as MapIcon, Activity as ActivityIcon, Search, Trash2 } from 'lucide-react';
import { formatDistance, formatDuration, formatDate } from '../utils/geoUtils';
import { SimpleDatePicker } from './SimpleDatePicker';

interface SidebarProps {
  activities: Activity[];
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFilterChange: (type: SportType | null) => void;
  onActivitySelect: (id: string | null) => void;
  onDeleteActivity: (id: string) => void;
  onClearAll: () => void;
  selectedId: string | null;
  currentFilter: SportType | null;
  dateRange: { start: string; end: string };
  onDateRangeChange: (start: string, end: string) => void;
  language: 'en' | 'zh';
  onLanguageChange: (lang: 'en' | 'zh') => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activities,
  onFileUpload,
  onFilterChange,
  onActivitySelect,
  onDeleteActivity,
  onClearAll,
  selectedId,
  currentFilter,
  dateRange,
  onDateRangeChange,
  language,
  onLanguageChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const t = TRANSLATIONS[language];

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Explicitly cast to SportType[] to avoid 'unknown' type inference error
  const uniqueTypes = useMemo(() => 
    Array.from(new Set(activities.map(a => a.type))) as SportType[]
  , [activities]);

  // Calculate totals (based on all activities in current filter view)
  const totalDistance = activities.reduce((acc, curr) => acc + curr.stats.distance, 0);
  const totalDuration = activities.reduce((acc, curr) => acc + curr.stats.duration, 0);

  // Filter activities based on selection AND search query
  const displayActivities = useMemo(() => {
      let filtered = activities;

      // Apply search filter
      if (searchQuery.trim()) {
          const lowerQuery = searchQuery.toLowerCase();
          filtered = filtered.filter(a => a.name.toLowerCase().includes(lowerQuery));
      }

      // If an activity is selected, we usually want to show it.
      // However, if the user is searching, they are likely looking for something specific in the list.
      // So we keep the list filtered by search.
      // But if there is a selected ID that IS NOT in the search results, we might want to still show it?
      // Standard behavior: List shows what matches search.
      
      // Override: If selectedId is present, we often just want to see THAT one details.
      // But the previous logic was: if selectedId, ONLY show that one.
      if (selectedId) {
          return activities.filter(a => a.id === selectedId);
      }
      
      return filtered;
  }, [activities, selectedId, searchQuery]);

  const hasActiveFilters = currentFilter !== null || dateRange.start !== '' || dateRange.end !== '' || searchQuery !== '';
  const showFilters = activities.length > 0 || hasActiveFilters;

  return (
    <div className="h-full flex flex-col bg-neutral-900 border-r border-neutral-800 w-80 shrink-0 z-20 shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-neutral-800">
        <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <ActivityIcon className="w-6 h-6 text-white" />
                MonoTrack
            </h1>
            <div className="flex border border-neutral-700 rounded overflow-hidden">
                <button 
                    onClick={() => onLanguageChange('zh')} 
                    className={`px-2 py-0.5 text-[10px] font-bold transition-colors ${language === 'zh' ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    CN
                </button>
                <button 
                    onClick={() => onLanguageChange('en')} 
                    className={`px-2 py-0.5 text-[10px] font-bold transition-colors ${language === 'en' ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                    EN
                </button>
            </div>
        </div>
        <p className="text-xs text-neutral-500 leading-relaxed">
          {t.description}
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-px bg-neutral-800 border-b border-neutral-800">
        <div className="bg-neutral-900 p-4">
          <div className="text-neutral-500 text-[10px] uppercase tracking-wider mb-1">{t.totalDistance}</div>
          <div className="text-lg font-mono text-white">{formatDistance(totalDistance)}</div>
        </div>
        <div className="bg-neutral-900 p-4">
          <div className="text-neutral-500 text-[10px] uppercase tracking-wider mb-1">{t.totalTime}</div>
          <div className="text-lg font-mono text-white">{formatDuration(totalDuration)}</div>
        </div>
      </div>

      {/* Controls */}
      <div className={`p-4 space-y-4 transition-opacity duration-300 ${selectedId ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex gap-2">
            <button
                onClick={handleUploadClick}
                className="flex-1 flex items-center justify-center gap-2 bg-white text-black py-3 px-4 rounded hover:bg-neutral-200 transition font-medium text-sm"
            >
                <Upload className="w-4 h-4" />
                {t.importFiles}
            </button>
            {activities.length > 0 && (
                <button
                    onClick={onClearAll}
                    className="flex items-center justify-center bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/40 hover:text-red-300 py-3 px-3 rounded transition"
                    title={t.clearAll}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileUpload}
          multiple
          accept=".gpx,.fit"
          className="hidden"
        />

        {/* Search Bar */}
        <div className="relative">
            <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs rounded py-2 pl-9 pr-3 focus:outline-none focus:border-neutral-500 transition-colors placeholder:text-neutral-600"
            />
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            {searchQuery && (
                 <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                 >
                     <X className="w-3 h-3" />
                 </button>
            )}
        </div>

        {showFilters && (
            <>
                 <div className="space-y-2 border-t border-neutral-800 pt-4">
                     <div className="flex items-center justify-between text-neutral-400 text-xs uppercase font-bold tracking-wider">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> {t.dateRange}
                        </div>
                        {(dateRange.start || dateRange.end) && (
                            <button 
                                onClick={() => onDateRangeChange('', '')}
                                className="text-[10px] text-neutral-500 hover:text-white transition flex items-center gap-1"
                            >
                                <X className="w-3 h-3" /> {t.reset}
                            </button>
                        )}
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[10px] text-neutral-500 font-medium">{t.start}</label>
                            <SimpleDatePicker
                                value={dateRange.start}
                                onChange={(val) => onDateRangeChange(val, dateRange.end)}
                                placeholder={t.datePlaceholder}
                                language={language}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-neutral-500 font-medium">{t.end}</label>
                            <SimpleDatePicker
                                value={dateRange.end}
                                onChange={(val) => onDateRangeChange(dateRange.start, val)}
                                placeholder={t.datePlaceholder}
                                language={language}
                            />
                        </div>
                     </div>
                 </div>

                {/* Filter Chips */}
                {uniqueTypes.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-neutral-400 text-xs uppercase font-bold tracking-wider">
                    <Filter className="w-3 h-3" /> {t.filterBySport}
                    </div>
                    <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => onFilterChange(null)}
                        className={`text-xs px-3 py-1 rounded-full border transition ${
                            currentFilter === null 
                            ? 'bg-white text-black border-white' 
                            : 'bg-transparent text-neutral-500 border-neutral-700 hover:border-neutral-500'
                        }`}
                    >
                        {t.all}
                    </button>
                    {uniqueTypes.map(type => (
                        <button
                        key={type}
                        onClick={() => onFilterChange(type)}
                        className={`text-xs px-3 py-1 rounded-full border transition flex items-center gap-1.5`}
                        style={{
                            borderColor: currentFilter === type ? SPORT_COLORS[type] : '#404040',
                            color: currentFilter === type ? SPORT_COLORS[type] : '#737373',
                            backgroundColor: currentFilter === type ? `${SPORT_COLORS[type]}10` : 'transparent'
                        }}
                        >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {SPORT_DISPLAY_NAMES[language][type]}
                        </button>
                    ))}
                    </div>
                </div>
                )}
            </>
        )}
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {displayActivities.length === 0 ? (
            <div className="text-center py-10 text-neutral-600 text-sm">
              {selectedId ? t.noTrackSelected : t.noTracks}
            </div>
          ) : (
            displayActivities.map(activity => (
              <div
                key={activity.id}
                onClick={() => onActivitySelect(activity.id === selectedId ? null : activity.id)}
                className={`
                  group relative p-3 rounded cursor-pointer transition border border-transparent
                  ${selectedId === activity.id ? 'bg-neutral-800 border-neutral-700' : 'hover:bg-neutral-900'}
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div 
                      className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] shrink-0" 
                      style={{ backgroundColor: activity.color }}
                    />
                    <span className={`text-sm font-medium truncate ${selectedId === activity.id ? 'text-white' : 'text-neutral-300'}`}>
                      {activity.name}
                    </span>
                  </div>
                  
                  {/* Action Icons */}
                  <div className="flex items-center">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteActivity(activity.id);
                        }}
                        className={`p-1 mr-1 text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200 ${selectedId === activity.id ? 'hidden' : ''}`}
                        title={t.delete}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className={`w-4 h-4 text-neutral-600 transition shrink-0 ${selectedId === activity.id ? 'rotate-90 text-white' : ''}`} />
                  </div>
                </div>
                
                <div className="flex items-center gap-3 pl-4 text-xs text-neutral-500 font-mono mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(activity.startTime, language)}
                  </span>
                  <span className="flex items-center gap-1">
                     <MapIcon className="w-3 h-3" />
                    {formatDistance(activity.stats.distance)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(activity.stats.duration)}
                  </span>
                </div>
                
                {/* Active indicator bar */}
                {selectedId === activity.id && (
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
                    style={{ backgroundColor: activity.color }}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      {selectedId && (
        <div className="p-4 border-t border-neutral-800 bg-neutral-900">
            <button 
                onClick={() => onActivitySelect(null)}
                className="w-full flex items-center justify-center gap-2 bg-neutral-800 text-neutral-300 hover:text-white text-xs uppercase tracking-wider py-3 rounded hover:bg-neutral-700 transition font-bold"
            >
                <X className="w-3 h-3" /> {t.clearSelection}
            </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;