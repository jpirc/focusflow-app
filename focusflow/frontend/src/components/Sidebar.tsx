import { useMemo } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { FolderKanban, Layers, Plus, Calendar } from 'lucide-react';
import { useAppStore } from '../store';
import { getProjectIcon } from '../utils/icons';

export default function Sidebar() {
  const {
    projects,
    tasks,
    selectedProjectId,
    setSelectedProject,
    startDate,
    setStartDate,
  } = useAppStore();

  // Calculate project stats
  const projectStats = useMemo(() => {
    return projects.map((project) => {
      const projectTasks = tasks.filter((t) => t.projectId === project.id);
      const completed = projectTasks.filter(
        (t) => t.status === 'completed'
      ).length;
      return { ...project, total: projectTasks.length, completed };
    });
  }, [projects, tasks]);

  // Week mini-map data
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(startDate);
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTasks = tasks.filter((t) => t.date === dateStr);
      const completed = dayTasks.filter((t) => t.status === 'completed').length;

      return {
        date: dateStr,
        day: format(date, 'EEE'),
        dayNum: format(date, 'd'),
        tasks: dayTasks.length,
        completed,
        isToday: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
        isSelected:
          format(date, 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd'),
      };
    });
  }, [startDate, tasks]);

  return (
    <>
      {/* Projects Panel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-3 border-b flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-gray-600" />
          <span className="font-semibold text-gray-800">Projects</span>
        </div>

        <div className="p-2 space-y-1">
          {/* All Projects */}
          <button
            onClick={() => setSelectedProject(null)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              selectedProjectId === null
                ? 'bg-purple-100 text-purple-700'
                : 'hover:bg-gray-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-sm font-medium">All Projects</span>
            <span className="ml-auto text-xs text-gray-500">{tasks.length}</span>
          </button>

          {/* Individual Projects */}
          {projectStats.map((project) => (
            <button
              key={project.id}
              onClick={() => setSelectedProject(project.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                selectedProjectId === project.id
                  ? 'ring-2 ring-offset-1'
                  : 'hover:bg-gray-50'
              }`}
              style={
                selectedProjectId === project.id
                  ? {
                      backgroundColor: project.bgColor,
                      // @ts-ignore
                      '--tw-ring-color': project.color,
                    }
                  : {}
              }
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {project.name}
                </span>
                <span className="ml-auto text-xs text-gray-500">
                  {project.completed}/{project.total}
                </span>
              </div>
              {project.total > 0 && (
                <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(project.completed / project.total) * 100}%`,
                      backgroundColor: project.color,
                    }}
                  />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="p-2 border-t">
          <button className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Project
          </button>
        </div>
      </div>

      {/* Week Overview Mini-map */}
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
          <Calendar className="w-4 h-4" /> Week Overview
        </h4>
        <div className="flex gap-1">
          {weekDays.map((day) => (
            <button
              key={day.date}
              onClick={() => setStartDate(new Date(day.date + 'T00:00:00'))}
              className={`flex-1 p-1.5 rounded-lg text-center transition-colors ${
                day.isToday
                  ? 'bg-blue-500 text-white'
                  : day.isSelected
                  ? 'bg-purple-100 text-purple-700'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div
                className={`text-[10px] ${
                  day.isToday ? 'text-white/80' : 'text-gray-500'
                }`}
              >
                {day.day}
              </div>
              <div
                className={`text-sm font-semibold ${
                  day.isToday ? 'text-white' : 'text-gray-700'
                }`}
              >
                {day.dayNum}
              </div>
              {day.tasks > 0 && (
                <div
                  className={`text-[10px] ${
                    day.isToday ? 'text-white/80' : 'text-gray-500'
                  }`}
                >
                  {day.completed}/{day.tasks}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
