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
  const searchQuery = useSelector((state) => state.tasks.searchQuery);

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.employeeId?.name && task.employeeId.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
    doc.setFillColor(94, 173, 147); // #5EAD93 - Brand Sage Green
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('ETA Follow-Up System Task Report', 14, 15);
    
    doc.setFontSize(9);
    doc.setTextColor(230, 230, 250);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
    doc.text(`Filters: ${employeeFilter ? 'Employee specific' : 'All employees'} | ${statusFilter ? `Status: ${statusFilter}` : 'All statuses'}`, 14, 27);

    // Columns
    const headers = [['Task Title', 'Assigned Employee', 'ETA Deadline', 'Priority', 'Status']];
    const rows = filteredTasks.map(t => [
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
      headStyles: { fillColor: [94, 173, 147] }, // Brand color
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
          <h2 className="text-xl font-bold text-slate-800">Daily & Historical Reports</h2>
          <p className="text-xs text-slate-500 font-bold mt-1">Export task milestone audit sheets directly to PDF documents</p>
        </div>
        <button
          onClick={exportPDF}
          disabled={filteredTasks.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#5EAD93] hover:bg-[#4D967D] disabled:bg-slate-300 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-500/10 active:scale-95 clay-btn"
        >
          <Download className="h-4 w-4" />
          Export PDF
        </button>
      </div>

      {/* Filter panel */}
      <div className="p-5 rounded-3xl bg-white border border-[#D1DFDA] clay-card space-y-4">
        <div className="flex items-center gap-2 text-slate-650 text-xs font-bold uppercase tracking-wider">
          <SlidersHorizontal className="h-4 w-4 text-[#5EAD93]" />
          <span>Report Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1.5">Employee</label>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#D1DFDA] text-slate-800 text-xs focus:outline-none focus:border-[#5EAD93]"
            >
              <option value="">All Employees</option>
              {employees.map(e => (
                <option key={e._id} value={e._id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1.5">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#D1DFDA] text-slate-800 text-xs focus:outline-none focus:border-[#5EAD93]"
            >
              <option value="">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1.5">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#D1DFDA] text-slate-800 text-xs focus:outline-none focus:border-[#5EAD93]"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1.5">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-[#D1DFDA] text-slate-800 text-xs focus:outline-none focus:border-[#5EAD93]"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end text-xs pt-2">
          <button onClick={handleReset} className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition font-bold">Reset</button>
          <button onClick={handleApply} className="px-4 py-1.5 bg-[#5EAD93] hover:bg-[#4D967D] text-white font-bold rounded-lg transition clay-btn">Query Logs</button>
        </div>
      </div>

      {/* Reports Grid table */}
      <div className="rounded-3xl border border-[#D1DFDA] bg-white clay-card overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="py-20 text-center text-slate-550">
            <FileText className="h-10 w-10 mx-auto text-slate-400 mb-3" />
            <p className="font-semibold text-slate-700">No logs found</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting filters or query other date ranges.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-[#D1DFDA] bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Task Title</th>
                  <th className="py-3.5 px-6">Assigned Employee</th>
                  <th className="py-3.5 px-6">ETA Deadline</th>
                  <th className="py-3.5 px-6">Priority</th>
                  <th className="py-3.5 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1DFDA] text-xs font-bold text-slate-650">
                {filteredTasks.map((task) => (
                  <tr key={task._id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-extrabold text-slate-800">{task.title}</td>
                    <td className="py-4 px-6 text-slate-500">{task.employeeId?.name || 'N/A'}</td>
                    <td className="py-4 px-6 font-bold text-[#5EAD93]">{new Date(task.eta).toLocaleString()}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded-full border font-bold text-[9px] ${
                        task.priority === 'High' ? 'bg-red-50 text-red-650 border-red-200' :
                        task.priority === 'Medium' ? 'bg-amber-50 text-amber-650 border-amber-200' :
                        'bg-emerald-50 text-emerald-650 border-emerald-200'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded-full border font-bold text-[9px] ${
                        task.status === 'Completed' ? 'bg-emerald-50 text-emerald-650 border-emerald-200' :
                        task.status === 'Overdue' ? 'bg-red-50 text-red-650 border-red-200 animate-pulse' :
                        'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
