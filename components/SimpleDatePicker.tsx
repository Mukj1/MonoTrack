import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface SimpleDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  language: 'en' | 'zh';
}

const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
};

const WEEKDAYS = {
  en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  zh: ['日', '一', '二', '三', '四', '五', '六']
};

const LABELS = {
  en: { clear: 'Clear', today: 'Today' },
  zh: { clear: '清除', today: '今天' }
};

const THIS_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: THIS_YEAR - 1969 + 6 }, (_, index) => 1970 + index);

export const SimpleDatePicker: React.FC<SimpleDatePickerProps> = ({ value, onChange, placeholder, language }) => {
  const [isOpen, setIsOpen] = useState(false);
  // viewDate tracks the month currently being viewed in the calendar
  const [viewDate, setViewDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync viewDate with value when opened, or default to now
  useEffect(() => {
    if (isOpen) {
      if (value) {
        const [y, m, d] = value.split('-').map(Number);
        // Note: Month is 0-indexed in JS Date
        const date = new Date(y, m - 1, d);
        if (!isNaN(date.getTime())) {
             setViewDate(date);
        } else {
            setViewDate(new Date());
        }
      } else {
        setViewDate(new Date());
      }
    }
  }, [isOpen, value]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleYearChange = (nextYear: string) => {
    setViewDate(new Date(Number(nextYear), viewDate.getMonth(), 1));
  };

  const handleMonthChange = (nextMonth: string) => {
    setViewDate(new Date(viewDate.getFullYear(), Number(nextMonth), 1));
  };

  const handleDateClick = (day: number) => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth() + 1;
    // Format as YYYY-MM-DD
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  const handleToday = () => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  // Calculations for grid
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Padding for empty cells before first day
  const paddingDays = Array(firstDayOfMonth).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Display text in input
  const displayValue = value ? value.replace(/-/g, '/') : '';

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Input Trigger */}
      <div 
        className="relative flex w-full cursor-pointer items-center rounded border border-stone-700 bg-stone-900 transition-colors hover:border-stone-500 group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <input 
            type="text" 
            readOnly 
            className="w-full cursor-pointer bg-transparent px-2 py-1.5 text-xs text-white placeholder:text-stone-600 focus:outline-none"
            placeholder={placeholder}
            value={displayValue}
        />
        <div className="pr-2 text-stone-500 group-hover:text-stone-300">
            <CalendarIcon className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Calendar Popup */}
      {isOpen && (
        <div className="mt-2 w-full min-w-0 select-none rounded-lg border border-stone-700 bg-stone-900 p-3 shadow-2xl">
          
          {/* Header */}
          <div className="mb-3 grid grid-cols-[auto_1fr_auto] items-center gap-2 px-1">
            <button 
                onClick={(e) => { e.stopPropagation(); handlePrevMonth(); }} 
                className="rounded p-1 text-stone-400 transition-colors hover:bg-stone-800 hover:text-white"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
              <select
                value={year}
                onChange={(event) => handleYearChange(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                className="min-w-0 rounded border border-stone-700 bg-stone-950 px-2 py-1 text-xs font-semibold text-stone-100 outline-none transition focus:border-stone-500"
              >
                {YEAR_OPTIONS.map(option => (
                  <option key={option} value={option}>
                    {language === 'zh' ? `${option}年` : option}
                  </option>
                ))}
              </select>
              <select
                value={month}
                onChange={(event) => handleMonthChange(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                className="min-w-0 rounded border border-stone-700 bg-stone-950 px-2 py-1 text-xs font-semibold text-stone-100 outline-none transition focus:border-stone-500"
              >
                {MONTHS[language].map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <button 
                onClick={(e) => { e.stopPropagation(); handleNextMonth(); }} 
                className="rounded p-1 text-stone-400 transition-colors hover:bg-stone-800 hover:text-white"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS[language].map(d => (
                <div key={d} className="py-1 text-center text-[10px] font-medium text-stone-500">
                    {d}
                </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((_, i) => (
                <div key={`pad-${i}`} />
            ))}
            {days.map(d => {
                // Check if selected
                const mStr = String(month + 1).padStart(2, '0');
                const dStr = String(d).padStart(2, '0');
                const currentStr = `${year}-${mStr}-${dStr}`;
                const isSelected = value === currentStr;
                
                // Check if today
                const now = new Date();
                const isToday = now.getFullYear() === year && now.getMonth() === month && now.getDate() === d;
                
                return (
                    <button
                        key={d}
                        onClick={(e) => { e.stopPropagation(); handleDateClick(d); }}
                        className={`
                            flex aspect-square min-h-7 w-full items-center justify-center rounded-full text-xs transition-colors
                            ${isSelected 
                                ? 'bg-[#C66A3D] text-white font-bold'
                                : isToday 
                                    ? 'bg-stone-800 text-[#D98A62] font-bold hover:bg-stone-700'
                                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                            }
                        `}
                    >
                        {d}
                    </button>
                )
            })}
          </div>

          {/* Footer Actions */}
          <div className="mt-3 flex items-center justify-between border-t border-stone-700 px-1 pt-3">
            <button 
                onClick={(e) => { e.stopPropagation(); handleClear(); }} 
                className="text-xs text-stone-400 transition-colors hover:text-white"
            >
                {LABELS[language].clear}
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); handleToday(); }} 
                className="text-xs font-medium text-[#D98A62] transition-colors hover:text-[#F0A57C]"
            >
                {LABELS[language].today}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
