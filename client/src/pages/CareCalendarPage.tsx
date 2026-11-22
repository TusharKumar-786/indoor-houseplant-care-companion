import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Droplets, Calendar as CalendarIcon, CheckCircle2, Sprout } from 'lucide-react';
import api from '../api/client';
import { Button } from '../components/ui/Button';
import { localDateString } from '../utils/date';

interface ScheduledPlant {
  id: number;
  nickname: string;
  species: string;
  water_frequency_days: number;
  last_watered?: string | null;
  next_watering_date?: string | null;
  room?: string | null;
}

interface CareLog {
  id: number;
  plant_id: number;
  plant_nickname?: string;
  action: string;
  date: string;
}

export const CareCalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [plants, setPlants] = useState<ScheduledPlant[]>([]);
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch all plants and logs for the visible month using from and to query params
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const firstDateStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    Promise.all([
      api.get('/plants?limit=1000').catch(() => ({ data: { data: [] } })),
      api.get(`/logs?from=${firstDateStr}&to=${lastDateStr}`).catch(() => ({ data: { data: [] } })),
    ])
      .then(([plantsRes, logsRes]) => {
        if (!isMounted) return;
        setPlants(plantsRes.data?.data || []);
        setLogs(logsRes.data?.data || []);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [year, month, daysInMonth]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Helper to check what is scheduled or logged for a given calendar day
  const getDayActivities = (dayNumber: number) => {
    const targetDate = new Date(year, month, dayNumber);
    const dateStr = localDateString(targetDate);

    // Filter past logged activities on this date
    const pastLogs = logs.filter((l) => l.date === dateStr);

    // Calculate projected scheduled waterings using next_watering_date
    const scheduledDue = plants.filter((p) => {
      if (!p.water_frequency_days || p.water_frequency_days <= 0) return false;

      // Direct match on next_watering_date
      if (p.next_watering_date === dateStr) return true;

      // Projected recurrences if targetDate is on or after next_watering_date
      if (p.next_watering_date) {
        const nextParts = p.next_watering_date.split('-').map(Number);
        const nextD = new Date(nextParts[0], nextParts[1] - 1, nextParts[2]);
        const diffDays = Math.round((targetDate.getTime() - nextD.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays % p.water_frequency_days === 0;
      }

      // Fallback projection using last_watered
      if (p.last_watered) {
        const lastParts = p.last_watered.split('-').map(Number);
        const lastD = new Date(lastParts[0], lastParts[1] - 1, lastParts[2]);
        const diffDays = Math.round((targetDate.getTime() - lastD.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays % p.water_frequency_days === 0;
      }

      return false;
    });

    return { pastLogs, scheduledDue };
  };

  const selectedDayActivities = selectedDay
    ? getDayActivities(selectedDay.getDate())
    : null;

  const todayStr = localDateString();

  return (
    <div className="space-y-8 animate-in max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#C9D8C5]">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#3E7B52]">
            Care Schedule
          </span>
          <h1 className="text-3xl font-serif font-bold text-[#1F3D2B] mt-1">
            Care Calendar
          </h1>
          <p className="text-xs sm:text-sm text-[#736159] mt-1">
            Visual month planner of hydration intervals and historic care activity.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="quiet"
            size="sm"
            onClick={prevMonth}
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Prev
          </Button>
          <span className="font-serif font-bold text-sm text-[#1F3D2B] px-3">
            {monthNames[month]} {year}
          </span>
          <Button
            variant="quiet"
            size="sm"
            onClick={nextMonth}
            icon={<ChevronRight className="w-4 h-4" />}
            iconPosition="right"
          >
            Next
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid Card */}
        <div className="lg:col-span-2 card p-6 bg-white border border-[#C9D8C5] shadow-soft space-y-4">
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-[#736159] pb-2 border-b border-[#C9D8C5]/60">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Empty prefix cells */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-14 sm:h-18 rounded-xl bg-transparent" />
            ))}

            {/* Month Day Cells */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateObj = new Date(year, month, day);
              const dateStr = localDateString(dateObj);
              const { pastLogs, scheduledDue } = getDayActivities(day);
              const isToday = todayStr === dateStr;
              const isSelected = selectedDay && localDateString(selectedDay) === dateStr;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(dateObj)}
                  className={`h-14 sm:h-18 p-1.5 sm:p-2 rounded-xl text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-[#1F3D2B] text-white ring-2 ring-[#1F3D2B] ring-offset-2'
                      : isToday
                      ? 'bg-[#E4EDB8]/60 text-[#1F3D2B] border border-[#1F3D2B]/30'
                      : 'bg-[#F5F1E6]/40 hover:bg-[#F5F1E6] text-[#3B2F2A] border border-[#C9D8C5]/40'
                  }`}
                >
                  <span className="text-xs font-bold leading-none">{day}</span>

                  {/* Indicator Dots */}
                  <div className="flex items-center gap-1 overflow-hidden">
                    {pastLogs.length > 0 && (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isSelected ? 'bg-[#E4EDB8]' : 'bg-[#3E7B52]'
                        }`}
                        title={`${pastLogs.length} care activities`}
                      />
                    )}
                    {scheduledDue.length > 0 && (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isSelected ? 'bg-[#FBECE6]' : 'bg-[#C8693F]'
                        }`}
                        title={`${scheduledDue.length} due waterings`}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-[#736159] pt-4 border-t border-[#C9D8C5]/60">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3E7B52]" />
              Recorded Activity
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C8693F]" />
              Projected Due
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E4EDB8] border border-[#1F3D2B]/20" />
              Today
            </span>
          </div>
        </div>

        {/* Day Detail Sidebar Panel */}
        <div className="card p-6 bg-white border border-[#C9D8C5] shadow-soft space-y-5">
          <div className="pb-3 border-b border-[#C9D8C5]/60">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#3E7B52]">
              Day Inspector
            </span>
            <h3 className="font-serif font-bold text-lg text-[#1F3D2B] mt-0.5">
              {selectedDay
                ? selectedDay.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Select a day'}
            </h3>
          </div>

          {selectedDayActivities && (
            <div className="space-y-4">
              {/* Projected Due */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#C8693F] flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5" />
                  Scheduled Hydration ({selectedDayActivities.scheduledDue.length})
                </h4>
                {selectedDayActivities.scheduledDue.length === 0 ? (
                  <p className="text-xs text-[#736159] italic">
                    No plants scheduled for watering on this day.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedDayActivities.scheduledDue.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl bg-[#FBECE6]/60 border border-[#C8693F]/20 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-semibold text-[#1F3D2B]">{p.nickname}</p>
                          <p className="text-[10px] text-[#736159]">{p.species}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C8693F] text-white">
                          Due
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Historic Care Logs */}
              <div className="space-y-2 pt-2 border-t border-[#C9D8C5]/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#3E7B52] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Logged Activities ({selectedDayActivities.pastLogs.length})
                </h4>
                {selectedDayActivities.pastLogs.length === 0 ? (
                  <p className="text-xs text-[#736159] italic">
                    No care activities logged for this day.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedDayActivities.pastLogs.map((l) => (
                      <div
                        key={l.id}
                        className="p-2.5 rounded-xl bg-[#E4EDB8]/40 border border-[#3E7B52]/20 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-semibold text-[#1F3D2B]">
                            {l.plant_nickname || 'Plant'}
                          </p>
                          <p className="text-[10px] text-[#736159]">{l.action}</p>
                        </div>
                        <span className="text-[10px] font-semibold text-[#3E7B52]">
                          Completed
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareCalendarPage;
