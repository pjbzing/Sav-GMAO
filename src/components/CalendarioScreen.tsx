import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import type { User } from '../App';
import { projectId } from '../utils/supabase/info';

interface CalendarioScreenProps {
  user: User;
  onBack: () => void;
}

interface DayEvent {
  centroName: string;
  equipmentName: string;
  actionType: string;
  nextDate: string;
  status: string;
}

export function CalendarioScreen({ user, onBack }: CalendarioScreenProps) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [events, setEvents] = useState<Record<string, DayEvent[]>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendarEvents();
  }, [currentYear, currentMonth]);

  const fetchCalendarEvents = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-718703c6/calendar?year=${currentYear}&month=${currentMonth + 1}`,
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Error al cargar calendario');

      const data = await response.json();
      setEvents(data.events || {});
    } catch (error) {
      console.error('Error fetching calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday = 0 to Monday = 0
  };

  const isWeekend = (year: number, month: number, day: number) => {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const isToday = (year: number, month: number, day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  const getDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const hasEvents = (year: number, month: number, day: number) => {
    const key = getDateKey(year, month, day);
    return events[key] && events[key].length > 0;
  };

  const handleDateClick = (year: number, month: number, day: number) => {
    const key = getDateKey(year, month, day);
    if (events[key] && events[key].length > 0) {
      setSelectedDate(key);
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const weekend = isWeekend(currentYear, currentMonth, day);
      const today = isToday(currentYear, currentMonth, day);
      const hasEvent = hasEvents(currentYear, currentMonth, day);

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(currentYear, currentMonth, day)}
          className={`
            aspect-square p-1 text-sm border rounded-lg transition-colors
            ${weekend ? 'bg-red-50 text-red-700' : 'bg-white'}
            ${today ? 'border-[#002A54] border-2' : 'border-gray-200'}
            ${hasEvent ? 'bg-yellow-100 hover:bg-yellow-200' : 'hover:bg-gray-50'}
            ${hasEvent ? 'cursor-pointer' : ''}
          `}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <span>{day}</span>
            {hasEvent && (
              <div className="h-1.5 w-1.5 rounded-full bg-[#FFCC00] mt-0.5"></div>
            )}
          </div>
        </button>
      );
    }

    return days;
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const previousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const selectedEvents = selectedDate ? events[selectedDate] || [] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#002A54] text-white sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-white hover:bg-white/10 -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl">Calendario</h1>
              <p className="text-sm text-white/80">Mantenimientos programados</p>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={previousMonth}
              className="text-white hover:bg-white/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextMonth}
              className="text-white hover:bg-white/10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#002A54]" />
          </div>
        ) : (
          <>
            {/* Legend */}
            <div className="bg-white rounded-lg shadow-sm p-3 mb-4 text-xs">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 border-2 border-[#002A54] rounded"></div>
                  <span>Hoy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 bg-yellow-100 rounded"></div>
                  <span>Con mantenimiento</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 bg-red-50 rounded"></div>
                  <span>Fin de semana</span>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs text-gray-600">
                <div>L</div>
                <div>M</div>
                <div>X</div>
                <div>J</div>
                <div>V</div>
                <div>S</div>
                <div>D</div>
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Events Dialog */}
      <Dialog open={selectedDate !== null} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mantenimientos</DialogTitle>
            <DialogDescription>
              {selectedDate && formatDate(selectedDate)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {selectedEvents.map((event, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm">{event.centroName}</h4>
                  <Badge variant="outline" className="text-xs">
                    {event.status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">{event.equipmentName}</p>
                <p className="text-xs text-gray-500">{event.actionType}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
