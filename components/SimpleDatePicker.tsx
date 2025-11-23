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
        className="relative flex items-center w-full bg-neutral-800 border border-neutral-700 rounded cursor-pointer hover:border-neutral-500 transition-colors group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <input 
            type="text" 
            readOnly 
            className="w-full bg-transparent text-xs text-white px-2 py-1.5 focus:outline-none cursor-pointer placeholder:text-neutral-600"
            placeholder={placeholder}
            value={displayValue}
        />
        <div className="pr-2 text-neutral-500 group-hover:text-neutral-300">
            <CalendarIcon className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Calendar Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-neutral-800 border border-neutral-600 rounded-lg shadow-2xl z-50 p-3 select-none">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button 
                onClick={(e) => { e.stopPropagation(); handlePrevMonth(); }} 
                className="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="font-bold text-white text-sm">
                {language === 'zh' 
                    ? `${year}年 ${MONTHS.zh[month]}`
                    : `${MONTHS.en[month]} ${year}`
                }
            </div>
            <button 
                onClick={(e) => { e.stopPropagation(); handleNextMonth(); }} 
                className="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white transition-colors"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS[language].map(d => (
                <div key={d} className="text-center text-[10px] text-neutral-500 font-medium py-1">
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
                            h-7 w-7 rounded-full flex items-center justify-center text-xs transition-colors
                            ${isSelected 
                                ? 'bg-blue-600 text-white font-bold' 
                                : isToday 
                                    ? 'bg-neutral-700 text-blue-400 font-bold hover:bg-neutral-600'
                                    : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'
                            }
                        `}
                    >
                        {d}
                    </button>
                )
            })}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-700 px-1">
            <button 
                onClick={(e) => { e.stopPropagation(); handleClear(); }} 
                className="text-xs text-neutral-400 hover:text-white transition-colors"
            >
                {LABELS[language].clear}
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); handleToday(); }} 
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
                {LABELS[language].today}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
