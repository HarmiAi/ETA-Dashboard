import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchTasks } from '../store/taskSlice';
import { fetchEmployees } from '../store/employeeSlice';
import { FileText, Download, Calendar, Search, User, SlidersHorizontal } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function Reports() {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.list);
  const employees = useSelector((state) => state.employees.list);

  // Filters
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchEmployees());
  }, [dispatch]);

  const handleApply = () => {
    dispatch(fetchTasks({
      employeeId: employeeFilter,
      status: statusFilter,
      startDate,
      endDate
    }));
  };

  const handleReset = () => {
    setEmployeeFilter('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    dispatch(fetchTasks());
  };

  const exportPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Report Header
    doc.setFillColor(11, 15, 25); // #0B0F19
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('ETA Follow-Up System Task Report', 14, 15);
    
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
    doc.text(`Filters applied: ${employeeFilter ? 'Employee specific' : 'All employees'} | ${statusFilter ? `Status: ${statusFilter}` : 'All statuses'}`, 14, 27);

    // Columns
    const headers = [['Task Title', 'Assigned Employee', 'ETA Deadline', 'Priority', 'Status']];
    const rows = tasks.map(t => [
      t.title,
      t.employeeId?.name || 'N/A',
      new Date(t.eta).toLocaleString(),
      t.priority,
      t.status
    ]);

    doc.autoTable({
      head: headers,
      body: rows,
      startY: 45,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [59, 130, 246] }, // Indigo Accent
    });

    doc.save(`ETA_Task_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-left"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Daily & Historical Reports</h2>
          <p className="text-xs text-slate-400 mt-1">Export task milestone audit sheets directly to PDF documents</p>
        </div>
        <button
          onClick={exportPDF}
          disabled={tasks.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-blue-500/10 active:scale-95"
        >
          <Download className="h-4 w-4" />
          Export PDF
        </button>
      </div>

      {/* Filter panel */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 glass-card space-y-4">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <SlidersHorizontal className="h-4 w-4 text-purple-400" />
          <span>Report Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Employee</label>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="">All Employees</option>
              {employees.map(e => (
                <option key={e._id} value={e._id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-955 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end text-xs">
          <button onClick={handleReset} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition">Reset</button>
          <button onClick={handleApply} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition">Query Logs</button>
        </div>
      </div>

      {/* Reports Grid table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 glass-card overflow-hidden">
        {tasks.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <FileText className="h-10 w-10 mx-auto text-slate-700 mb-3" />
            <p className="font-semibold text-slate-400">No logs found</p>
            <p className="text-xs text-slate-550 mt-1">Try resetting filters or query other date ranges.</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-850 bg-slate-900/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6">Task Title</th>
                <th className="py-3.5 px-6">Assigned Employee</th>
                <th className="py-3.5 px-6">ETA Deadline</th>
                <th className="py-3.5 px-6">Priority</th>
                <th className="py-3.5 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
              {tasks.map((task) => (
                <tr key={task._id} className="hover:bg-slate-900/20">
                  <td className="py-4 px-6 font-semibold text-white">{task.title}</td>
                  <td className="py-4 px-6 text-slate-400">{task.employeeId?.name || 'N/A'}</td>
                  <td className="py-4 px-6 font-medium text-purple-300">{new Date(task.eta).toLocaleString()}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-0.5 rounded-full border font-bold text-[9px] ${
                      task.priority === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-0.5 rounded-full border font-bold text-[9px] ${
                      task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      task.status === 'Overdue' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
