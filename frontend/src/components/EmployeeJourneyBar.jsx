import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Download, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { openAssignModal, setSearchQuery } from '../store/taskSlice';
import { useNavigate } from 'react-router-dom';
import { getAvatarColor, getInitials } from './NotificationManager';

export default function EmployeeJourneyBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const employees = useSelector((state) => state.employees.list);
  const tasks = useSelector((state) => state.tasks.list);
  const searchQuery = useSelector((state) => state.tasks.searchQuery);

  const journeyBarRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [hoveredEmployee, setHoveredEmployee] = useState(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -100, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 100, behavior: 'smooth' });
    }
  };

  const handleAvatarClick = (employeeName) => {
    // Toggle search filter by employee name
    const newQuery = searchQuery === employeeName ? '' : employeeName;
    dispatch(setSearchQuery(newQuery));
  };

  return (
    <div className="space-y-4 select-none">
      {/* Title Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-wide">Employee Journeys</h2>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5 font-bold">Live status and pending daily milestones map</p>
        </div>
      </div>

      {/* Premium Glassmorphic Card Container */}
      <div 
        ref={journeyBarRef} 
        className="relative w-full min-h-[88px] flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-[#182421] border border-[#D1DFDA] dark:border-[#24332F] shadow-md z-10"
      >
        {/* Left Side: Journey Label */}
        <div className="flex flex-col text-left shrink-0 md:pl-2">
          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-wide">Milestone Pipeline</span>
          <span className="text-[10px] text-[#5EAD93] dark:text-[#6CD3B4] font-extrabold mt-0.5 uppercase tracking-wider">Manager Console</span>
        </div>

        {/* Center: Employee Avatars Slider */}
        <div className="flex items-center justify-center flex-1 w-full max-w-full md:max-w-[480px] lg:max-w-[620px] px-1 overflow-hidden relative">
          {employees.length > 5 && (
            <button 
              onClick={scrollLeft}
              className="p-1.5 bg-slate-50 dark:bg-[#1D2C28] hover:bg-slate-100 dark:hover:bg-[#24332F] border border-[#D1DFDA] dark:border-[#24332F] text-slate-650 dark:text-slate-350 hover:text-[#5EAD93] dark:hover:text-[#5EAD93] rounded-full transition shadow-sm z-20 mr-1.5 active:scale-90 shrink-0"
              title="Scroll Left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          <div 
            ref={scrollContainerRef}
            onScroll={() => setHoveredEmployee(null)}
            className={`flex items-center gap-4 py-2 px-2 overflow-x-auto scrollbar-none flex-1 ${
              employees.length > 5 ? 'justify-start' : 'justify-center'
            }`}
          >
            {employees.length === 0 ? (
              <span className="text-xs text-slate-400 italic font-bold">No employees seeded</span>
            ) : (
              employees.map((emp) => {
                // Calculate task statistics for this employee
                const empTasks = tasks.filter((t) => t.employeeId?._id === emp._id);
                const activeTasks = empTasks.filter((t) => t.status !== 'Completed');
                const overdueCount = activeTasks.filter((t) => t.status === 'Overdue').length;
                const pendingCount = activeTasks.filter((t) => t.status === 'In Progress' || t.status === 'Not Started').length;

                const isSelected = searchQuery === emp.name;
                const initials = getInitials(emp.name);
                
                return (
                  <div 
                    key={emp._id} 
                    className="relative flex flex-col items-center group cursor-pointer shrink-0 py-1"
                    onClick={() => handleAvatarClick(emp.name)}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const parentRect = journeyBarRef.current.getBoundingClientRect();
                      const left = rect.left - parentRect.left + (rect.width / 2);
                      const top = rect.bottom - parentRect.top + 8;
                      
                      const doneCount = empTasks.filter(t => t.status === 'Completed').length;
                      
                      setHoveredEmployee({
                        name: emp.name,
                        designation: emp.designation || emp.department || 'Employee',
                        doneCount,
                        overdueCount,
                        pendingCount,
                        left,
                        top
                      });
                    }}
                    onMouseLeave={() => setHoveredEmployee(null)}
                  >
                    {/* Portrait Avatar Image or Initials */}
                    <div 
                      className={`h-10 w-10 rounded-full overflow-hidden border flex items-center justify-center transition-all duration-200 ${
                        isSelected 
                          ? 'border-[#5EAD93] ring-2 ring-[#5EAD93]/40 scale-110 shadow-md shadow-emerald-500/10' 
                          : 'border-[#D1DFDA] dark:border-[#24332F] hover:border-[#5EAD93] hover:scale-105'
                      }`}
                    >
                      {emp.avatar ? (
                        <img 
                          src={emp.avatar} 
                          alt={emp.name} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className={`h-full w-full flex items-center justify-center font-bold text-xs ${getAvatarColor(emp.name)}`}>
                          {initials}
                        </div>
                      )}
                    </div>

                    {/* Dynamic Status Badge below Avatar */}
                    <div className="absolute -bottom-1 flex items-center justify-center">
                      {overdueCount > 0 ? (
                        <span className="h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-[8px] font-extrabold text-white border border-white dark:border-[#182421] shadow-md animate-pulse">
                          {overdueCount}
                        </span>
                      ) : pendingCount > 0 ? (
                        <span className="h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-blue-500 text-[8px] font-extrabold text-white border border-white dark:border-[#182421] shadow-md">
                          {pendingCount}
                        </span>
                      ) : (
                        <span className="h-4 w-4 flex items-center justify-center rounded-full bg-slate-100 dark:bg-[#1D2C28] text-[9px] font-bold text-slate-500 dark:text-slate-350 border border-white dark:border-[#182421] hover:bg-slate-200 shadow-sm">
                          +
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {employees.length > 5 && (
            <button 
              onClick={scrollRight}
              className="p-1.5 bg-slate-50 dark:bg-[#1D2C28] hover:bg-slate-100 dark:hover:bg-[#24332F] border border-[#D1DFDA] dark:border-[#24332F] text-slate-650 dark:text-slate-350 hover:text-[#5EAD93] dark:hover:text-[#5EAD93] rounded-full transition shadow-sm z-20 ml-1.5 active:scale-90 shrink-0"
              title="Scroll Right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Right Side: Quick Action Circular Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 md:pr-2">
          {/* Quick Action: Assign Task circular button */}
          <button
            onClick={() => dispatch(openAssignModal())}
            className="p-2.5 bg-slate-50 dark:bg-[#1D2C28] hover:bg-slate-100 dark:hover:bg-[#24332F] border border-[#D1DFDA] dark:border-[#24332F] text-slate-500 dark:text-slate-350 hover:text-slate-800 dark:hover:text-white rounded-full transition active:scale-95 shadow-sm"
            title="Assign New Task"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* Quick Action: Reports download circular button */}
          <button
            onClick={() => navigate('/reports')}
            className="p-2.5 bg-slate-50 dark:bg-[#1D2C28] hover:bg-slate-100 dark:hover:bg-[#24332F] border border-[#D1DFDA] dark:border-[#24332F] text-slate-500 dark:text-slate-350 hover:text-slate-800 dark:hover:text-white rounded-full transition active:scale-95 shadow-sm"
            title="Export Reports"
          >
            <Download className="h-4 w-4" />
          </button>

          {/* Quick Action: Calendar timeline view circular button */}
          <button
            onClick={() => navigate('/timeline')}
            className="p-2.5 bg-slate-50 dark:bg-[#1D2C28] hover:bg-slate-100 dark:hover:bg-[#24332F] border border-[#D1DFDA] dark:border-[#24332F] text-slate-500 dark:text-slate-350 hover:text-slate-800 dark:hover:text-white rounded-full transition active:scale-95 shadow-sm"
            title="Timeline Map"
          >
            <Calendar className="h-4 w-4" />
          </button>
        </div>

        {/* Tooltip rendered outside scroll container to prevent clipping */}
        {hoveredEmployee && (
          <div 
            style={{ 
              left: `${hoveredEmployee.left}px`, 
              top: `${hoveredEmployee.top}px`,
              transform: 'translateX(-50%)'
            }}
            className="absolute bg-slate-900 dark:bg-[#1D2C28] border border-slate-800/80 dark:border-emerald-900/50 text-white text-[10px] p-2.5 rounded-xl shadow-2xl pointer-events-none whitespace-nowrap leading-normal z-50 transition-all duration-150 origin-top"
          >
            <p className="font-bold text-left">{hoveredEmployee.name}</p>
            <p className="text-slate-400 dark:text-slate-300 text-[9px] font-medium text-left">{hoveredEmployee.designation}</p>
            <div className="flex gap-2 mt-1.5 pt-1.5 border-t border-slate-800/60 dark:border-emerald-900/30 font-semibold text-[8px]">
              <span className="text-emerald-400">Done: {hoveredEmployee.doneCount}</span>
              <span className="text-red-400">Overdue: {hoveredEmployee.overdueCount}</span>
              <span className="text-blue-400">Pending: {hoveredEmployee.pendingCount}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
