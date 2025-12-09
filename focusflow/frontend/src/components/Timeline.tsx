import { useMemo } from 'react';
import { format, addDays, isToday } from 'date-fns';
import { useAppStore } from '../store';
import DayColumn from './DayColumn';

export default function Timeline() {
  const { startDate, visibleDays, tasks } = useAppStore();

  // Generate visible dates
  const visibleDates = useMemo(() => {
    return Array.from({ length: visibleDays }, (_, i) =>
      format(addDays(startDate, i), 'yyyy-MM-dd')
    );
  }, [startDate, visibleDays]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, typeof tasks> = {};
    visibleDates.forEach((date) => {
      grouped[date] = tasks.filter((t) => t.date === date);
    });
    return grouped;
  }, [tasks, visibleDates]);

  return (
    <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
      {visibleDates.map((date) => (
        <DayColumn
          key={date}
          date={date}
          tasks={tasksByDate[date] || []}
          isToday={isToday(new Date(date + 'T00:00:00'))}
        />
      ))}
    </div>
  );
}
