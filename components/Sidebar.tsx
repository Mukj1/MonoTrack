import React, { useRef, useMemo, useState } from 'react';
import { Activity, SportType } from '../types';
import { SPORT_COLORS, SPORT_DISPLAY_NAMES, TRANSLATIONS } from '../constants';
import { Upload, Filter, X, ChevronRight, Calendar, Clock, Map as MapIcon, Activity as ActivityIcon, Search, Trash2, Pencil, Check, ListChecks, Square, CheckSquare } from 'lucide-react';
import { formatDistance, formatDuration, formatDate } from '../utils/geoUtils';
import { SimpleDatePicker } from './SimpleDatePicker';
import { ParseSummary } from '../services/fileParser';

interface SidebarProps {
  activities: Activity[];
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFilterChange: (type: SportType | null) => void;
  onActivitySelect: (id: string | null) => void;
  onDeleteActivity: (id: string) => void;
  onDeleteSelectedActivities: () => void;
  onRenameActivity: (id: string, name: string) => void;
  onClearAll: () => void;
  isMultiSelectMode: boolean;
  selectedTrackIds: string[];
  onToggleMultiSelectMode: () => void;
  onToggleTrackSelection: (id: string) => void;
  onSelectAllTracks: (ids?: string[]) => void;
  onDeselectAllTracks: () => void;
  selectedId: string | null;
  currentFilter: SportType | null;
  dateRange: { start: string; end: string };
  onDateRangeChange: (start: string, end: string) => void;
  importSummary: ParseSummary | null;
  language: 'en' | 'zh';
  onLanguageChange: (lang: 'en' | 'zh') => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activities,
  onFileUpload,
  onFilterChange,
  onActivitySelect,
  onDeleteActivity,
  onDeleteSelectedActivities,
  onRenameActivity,
  onClearAll,
  isMultiSelectMode,
  selectedTrackIds,
  onToggleMultiSelectMode,
  onToggleTrackSelection,
  onSelectAllTracks,
  onDeselectAllTracks,
  selectedId,
  currentFilter,
  dateRange,
  onDateRangeChange,
  importSummary,
  language,
  onLanguageChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
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

      return filtered;
  }, [activities, searchQuery]);

  const hasActiveFilters = currentFilter !== null || dateRange.start !== '' || dateRange.end !== '' || searchQuery !== '';
  const showFilters = activities.length > 0 || hasActiveFilters;
  const selectedTrackSet = useMemo(() => new Set(selectedTrackIds), [selectedTrackIds]);
  const allVisibleSelected = displayActivities.length > 0 && displayActivities.every(activity => selectedTrackSet.has(activity.id));

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = sidebarWidth;

    const handleMove = (moveEvent: PointerEvent) => {
      const nextWidth = Math.min(560, Math.max(300, startWidth + moveEvent.clientX - startX));
      setSidebarWidth(nextWidth);
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const startEditing = (activity: Activity) => {
    setEditingId(activity.id);
    setEditingName(activity.name);
  };

  const commitEditing = () => {
    if (!editingId) return;
    const nextName = editingName.trim();
    if (nextName) onRenameActivity(editingId, nextName);
    setEditingId(null);
    setEditingName('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  return (
    <div
      className="relative z-20 flex h-[46vh] w-full shrink-0 flex-col border-b border-stone-800 bg-stone-950 shadow-2xl md:h-full md:w-[var(--sidebar-width)] md:border-b-0 md:border-r"
      style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
    >
      {/* Header */}
      <div className="shrink-0 border-b border-stone-800 px-5 py-4">
        <div className="mb-2 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <ActivityIcon className="h-6 w-6 text-[#C66A3D]" />
                MonoTrack
            </h1>
            <div className="flex overflow-hidden rounded-md border border-stone-700">
                <button 
                    onClick={() => onLanguageChange('zh')} 
                    className={`px-2 py-0.5 text-[10px] font-bold transition-colors ${language === 'zh' ? 'bg-stone-700 text-white' : 'text-stone-500 hover:text-stone-300'}`}
                >
                    CN
                </button>
                <button 
                    onClick={() => onLanguageChange('en')} 
                    className={`px-2 py-0.5 text-[10px] font-bold transition-colors ${language === 'en' ? 'bg-stone-700 text-white' : 'text-stone-500 hover:text-stone-300'}`}
                >
                    EN
                </button>
            </div>
        </div>
        <p className="text-xs leading-relaxed text-stone-500">
          {t.description}
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid shrink-0 grid-cols-3 gap-px border-b border-stone-800 bg-stone-800">
        <div className="bg-stone-950 p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-stone-500">{t.totalDistance}</div>
          <div className="font-mono text-sm text-white">{formatDistance(totalDistance)}</div>
        </div>
        <div className="bg-stone-950 p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-stone-500">{t.totalTime}</div>
          <div className="font-mono text-sm text-white">{formatDuration(totalDuration)}</div>
        </div>
        <div className="bg-stone-950 p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-stone-500">{t.totalTracks}</div>
          <div className="font-mono text-sm text-white">{activities.length}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-h-[42vh] shrink-0 space-y-3 overflow-y-auto border-b border-stone-900 p-4 md:max-h-[44vh]">
        <div className="flex gap-2">
            <button
                onClick={handleUploadClick}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-stone-100 px-4 py-3 text-sm font-medium text-stone-950 transition hover:bg-white"
            >
                <Upload className="h-4 w-4" />
                {t.importFiles}
            </button>
            {activities.length > 0 && (
                <button
                    onClick={onClearAll}
                    className="flex items-center justify-center rounded-md border border-red-900/50 bg-red-950/25 px-3 py-3 text-red-300 transition hover:bg-red-900/40 hover:text-red-200"
                    title={t.clearAll}
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            )}
        </div>
        {activities.length > 0 && (
          <div className={`grid gap-2 ${isMultiSelectMode ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <button
              onClick={onToggleMultiSelectMode}
              className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition ${
                isMultiSelectMode
                  ? 'border-stone-200 bg-stone-100 text-stone-950'
                  : 'border-stone-800 bg-stone-900 text-stone-400 hover:border-stone-600 hover:text-stone-100'
              }`}
            >
              <ListChecks className="h-3.5 w-3.5" />
              {isMultiSelectMode ? t.exitMultiSelect : t.multiSelect}
            </button>
            {isMultiSelectMode && (
            <button
              onClick={onDeleteSelectedActivities}
              disabled={selectedTrackIds.length === 0}
              className="flex items-center justify-center gap-2 rounded-md border border-red-900/50 bg-red-950/25 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t.deleteSelected} ({selectedTrackIds.length})
            </button>
            )}
            {isMultiSelectMode && (
              <button
                onClick={() => {
                  if (allVisibleSelected) {
                    onDeselectAllTracks();
                  } else {
                    onSelectAllTracks(displayActivities.map(activity => activity.id));
                  }
                }}
                className="col-span-2 flex items-center justify-center gap-2 rounded-md border border-stone-800 bg-stone-900 px-3 py-2 text-xs font-semibold text-stone-300 transition hover:border-stone-600 hover:text-white"
              >
                {allVisibleSelected ? <Square className="h-3.5 w-3.5" /> : <CheckSquare className="h-3.5 w-3.5" />}
                {allVisibleSelected ? t.deselectAll : t.selectAll}
              </button>
            )}
          </div>
        )}
        <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone-600">{t.supportedFiles}</div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileUpload}
          multiple
          accept=".gpx,.fit,.tcx,.gz,.zip"
          className="hidden"
        />

        {importSummary && (
          <div className="rounded-md border border-stone-800 bg-stone-900/70 p-2.5">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">{t.importSummary}</div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded bg-stone-950/70 p-2">
                <div className="font-mono text-sm text-stone-100">{importSummary.imported}</div>
                <div className="mt-0.5 text-stone-500">{t.imported}</div>
              </div>
              <div className="rounded bg-stone-950/70 p-2">
                <div className="font-mono text-sm text-stone-100">{importSummary.skipped}</div>
                <div className="mt-0.5 text-stone-500">{t.skipped}</div>
              </div>
              <div className="rounded bg-stone-950/70 p-2">
                <div className="font-mono text-sm text-stone-100">{importSummary.failed}</div>
                <div className="mt-0.5 text-stone-500">{t.failed}</div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
            <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full rounded-md border border-stone-800 bg-stone-900 py-2 pl-9 pr-3 text-xs text-stone-200 transition-colors placeholder:text-stone-600 focus:border-stone-600 focus:outline-none"
            />
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-500" />
            {searchQuery && (
                 <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white"
                 >
                     <X className="w-3 h-3" />
                 </button>
            )}
        </div>

        {showFilters && (
            <details className="rounded-md border border-stone-800 bg-stone-950/50">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-stone-400 marker:hidden">
                    <Filter className="h-3 w-3" /> {t.filters}
                </summary>
                <div className="space-y-3 border-t border-stone-800 p-3">
                 <div className="space-y-2 border-t border-stone-800 pt-3">
                     <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-400">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> {t.dateRange}
                        </div>
                        {(dateRange.start || dateRange.end) && (
                            <button 
                                onClick={() => onDateRangeChange('', '')}
                                className="flex items-center gap-1 text-[10px] text-stone-500 transition hover:text-white"
                            >
                                <X className="w-3 h-3" /> {t.reset}
                            </button>
                        )}
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[10px] font-medium text-stone-500">{t.start}</label>
                            <SimpleDatePicker
                                value={dateRange.start}
                                onChange={(val) => onDateRangeChange(val, dateRange.end)}
                                placeholder={t.datePlaceholder}
                                language={language}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-medium text-stone-500">{t.end}</label>
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
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-400">
                    <Filter className="w-3 h-3" /> {t.filterBySport}
                    </div>
                    <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => onFilterChange(null)}
                        className={`text-xs px-3 py-1 rounded-full border transition ${
                            currentFilter === null 
                            ? 'bg-stone-100 text-stone-950 border-stone-100' 
                            : 'bg-transparent text-stone-500 border-stone-700 hover:border-stone-500'
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
                            borderColor: currentFilter === type ? SPORT_COLORS[type] : '#44403c',
                            color: currentFilter === type ? SPORT_COLORS[type] : '#78716c',
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
                </div>
            </details>
        )}
      </div>

      {/* Activity List */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {displayActivities.length === 0 ? (
            <div className="py-10 text-center text-sm text-stone-600">
              {selectedId ? t.noTrackSelected : t.noTracks}
            </div>
          ) : (
            displayActivities.map(activity => (
              <div
                key={activity.id}
                onClick={() => {
                  if (editingId !== activity.id) {
                    if (isMultiSelectMode) {
                      onToggleTrackSelection(activity.id);
                    } else {
                      onActivitySelect(activity.id === selectedId ? null : activity.id);
                    }
                  }
                }}
                className={`
                  group relative cursor-pointer rounded-md border border-transparent p-3 transition
                  ${selectedId === activity.id ? 'bg-stone-900 border-stone-700' : 'hover:bg-stone-900/75'}
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {isMultiSelectMode ? (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onToggleTrackSelection(activity.id);
                        }}
                        className="shrink-0 text-stone-400 transition hover:text-white"
                        title={selectedTrackSet.has(activity.id) ? t.hideTrack : t.showTrack}
                      >
                        {selectedTrackSet.has(activity.id) ? (
                          <CheckSquare className="h-4 w-4" style={{ color: activity.color }} />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    ) : (
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.4)]"
                        style={{ backgroundColor: activity.color }}
                      />
                    )}
                    {editingId === activity.id ? (
                      <input
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') commitEditing();
                          if (event.key === 'Escape') cancelEditing();
                        }}
                        autoFocus
                        className="min-w-0 flex-1 rounded border border-stone-600 bg-stone-950 px-2 py-1 text-sm text-white outline-none focus:border-stone-400"
                      />
                    ) : (
                      <span className={`truncate text-sm font-medium ${selectedId === activity.id ? 'text-white' : 'text-stone-300'}`}>
                        {activity.name}
                      </span>
                    )}
                  </div>
                  
                  {/* Action Icons */}
                  <div className="flex items-center">
                    {editingId === activity.id ? (
                      <>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            commitEditing();
                          }}
                          className="mr-1 p-1 text-stone-400 transition hover:text-emerald-300"
                          title="Save"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            cancelEditing();
                          }}
                          className="mr-1 p-1 text-stone-500 transition hover:text-white"
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          startEditing(activity);
                        }}
                        className="mr-1 p-1 text-stone-600 opacity-0 transition-all duration-200 hover:text-stone-200 group-hover:opacity-100"
                        title="Rename"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {!isMultiSelectMode && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteActivity(activity.id);
                        }}
                        className={`mr-1 p-1 text-stone-600 opacity-0 transition-all duration-200 hover:text-red-300 group-hover:opacity-100 ${selectedId === activity.id ? 'hidden' : ''}`}
                        title={t.delete}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    )}
                    <ChevronRight className={`h-4 w-4 shrink-0 text-stone-600 transition ${selectedId === activity.id ? 'rotate-90 text-white' : ''}`} />
                  </div>
                </div>
                
                <div className="mt-2 flex items-center gap-3 pl-4 font-mono text-xs text-stone-500">
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
        <div className="shrink-0 border-t border-stone-800 bg-stone-950 p-4">
            <button 
                onClick={() => onActivitySelect(null)}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-stone-900 py-3 text-xs font-bold uppercase tracking-wider text-stone-300 transition hover:bg-stone-800 hover:text-white"
            >
                <X className="w-3 h-3" /> {t.clearSelection}
            </button>
        </div>
      )}
      <div
        onPointerDown={startResize}
        className="absolute right-0 top-0 hidden h-full w-1 cursor-col-resize bg-transparent transition hover:bg-stone-600 md:block"
        title="Resize sidebar"
      />
    </div>
  );
};

export default Sidebar;
