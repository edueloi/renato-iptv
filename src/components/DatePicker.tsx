import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Check, X } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  required?: boolean;
  className?: string;
  label?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  required,
  className = '',
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse YYYY-MM-DD safely
  const parseDate = (isoStr: string) => {
    if (!isoStr) return new Date();
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return new Date();
  };

  const selectedDate = parseDate(value);
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  useEffect(() => {
    const d = parseDate(value);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [value]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplay = (isoStr: string) => {
    if (!isoStr) return 'Selecionar Data';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoStr;
  };

  const formatIso = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const handleSelectDay = (day: number) => {
    const iso = formatIso(viewYear, viewMonth, day);
    onChange(iso);
    setIsOpen(false);
  };

  const handleQuickAddDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const iso = formatIso(d.getFullYear(), d.getMonth(), d.getDate());
    onChange(iso);
    setIsOpen(false);
  };

  const handleSetSpecificDay = (targetDay: number) => {
    const today = new Date();
    let y = today.getFullYear();
    let m = today.getMonth();
    // if targetDay is today or in past this month, move to next month
    if (targetDay <= today.getDate()) {
      m += 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
    }
    const iso = formatIso(y, m, targetDay);
    onChange(iso);
    setIsOpen(false);
  };

  // Calendar Math
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div ref={containerRef} className="relative inline-block w-full text-xs">
      {label && (
        <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 text-xs">
          {label}
        </label>
      )}

      {/* Input Display Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between text-left text-xs font-mono font-medium text-slate-800 dark:text-slate-100 hover:border-indigo-400 dark:hover:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${className}`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">{formatDisplay(value)}</span>
          </div>
          <ChevronRight className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
        </button>

        {/* Native fallback trigger for browser native datepicker */}
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="sr-only"
        />
      </div>

      {/* Popover Calendar Modal */}
      {isOpen && (
        <div className="absolute left-0 mt-1 z-50 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-3 space-y-3 animate-in fade-in zoom-in-95 duration-100">
          {/* Header Controls */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 0) {
                  setViewMonth(11);
                  setViewYear(viewYear - 1);
                } else {
                  setViewMonth(viewMonth - 1);
                }
              }}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
              {monthNames[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={() => {
                if (viewMonth === 11) {
                  setViewMonth(0);
                  setViewYear(viewYear + 1);
                } else {
                  setViewMonth(viewMonth + 1);
                }
              }}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Shortcuts Chips */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Atalhos Rápidos:</span>
            <div className="flex flex-wrap gap-1 text-[10px]">
              <button
                type="button"
                onClick={() => handleQuickAddDays(0)}
                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 rounded-lg font-medium text-slate-700 dark:text-slate-300"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddDays(30)}
                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 rounded-lg font-medium text-slate-700 dark:text-slate-300"
              >
                +30 Dias
              </button>
              <button
                type="button"
                onClick={() => handleSetSpecificDay(5)}
                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 rounded-lg font-medium text-slate-700 dark:text-slate-300"
              >
                Dia 05
              </button>
              <button
                type="button"
                onClick={() => handleSetSpecificDay(10)}
                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 rounded-lg font-medium text-slate-700 dark:text-slate-300"
              >
                Dia 10
              </button>
              <button
                type="button"
                onClick={() => handleSetSpecificDay(15)}
                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 rounded-lg font-medium text-slate-700 dark:text-slate-300"
              >
                Dia 15
              </button>
            </div>
          </div>

          {/* Calendar Grid Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-400">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const iso = formatIso(viewYear, viewMonth, dayNum);
              const isSelected = value === iso;
              const isToday = formatIso(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) === iso;

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`py-1 rounded-lg font-mono text-xs transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold'
                      : isToday
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Footer Action */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-mono">{value}</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
