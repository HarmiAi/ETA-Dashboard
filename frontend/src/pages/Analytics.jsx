const API_URL = 'http://localhost:5000/api';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getHeaders } from '../store/authSlice';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Download, 
  TrendingUp, 
  Award, 
  Activity, 
  AlertTriangle, 
  Calendar, 
  BarChart3,
  Loader2 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function Analytics() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = useSelector((state) => state.auth.token);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/analytics/performance`, {
        headers: getHeaders(),
      });
      const analyticsData = await res.json();
      if (!res.ok) throw new Error(analyticsData.message || 'Failed to fetch analytics');
      setData(analyticsData);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Server error');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  }, [token]);

  const exportPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    doc.setFillColor(11, 15, 25); // #0B0F19
    doc.rect(0, 0, 297, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Employee ETA Follow-Up System', 14, 15);
    
    doc.setFontSize(11);
    doc.setTextColor(59, 130, 246); // Blue
    doc.text('Daily & Monthly Performance Analytics Report', 14, 23);
    
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    // Summary stats
    let total = 0, comp = 0, pend = 0, over = 0;
    data.forEach(item => {
      total += item.stats.total;
      comp += item.stats.completed;
      pend += item.stats.pending;
      over += item.stats.overdue;
    });

    doc.setFillColor(17, 24, 39); // Surface #111827
    doc.rect(14, 45, 269, 15, 'F');
    doc.setTextColor(229, 231, 235);
    doc.text(`Total Tasks: ${total}   |   Completed: ${comp}   |   Pending: ${pend}   |   Overdue: ${over}`, 20, 54);

    const headers = [
      ['Employee Name', 'Department', 'Total Tasks', 'Completed', 'Pending', 'Overdue', 'Completion Rate (%)', 'On-Time Rate (%)']
    ];

    const rows = data.map(item => [
      item.employeeName,
      item.department || 'N/A',
      item.stats.total,
      item.stats.completed,
      item.stats.pending,
      item.stats.overdue,
      `${item.stats.completionRate}%`,
      `${item.stats.onTimeRate}%`,
    ]);

    doc.autoTable({
      head: headers,
      body: rows,
      startY: 68,
      theme: 'grid',
      styles: { fontSize: 8.5 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`ETA_Performance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const chartData = data.map((item) => ({
    name: item.employeeName,
    Completed: item.stats.completed,
    Pending: item.stats.pending,
    Overdue: item.stats.overdue,
  }));

  let totalComp = 0, totalPend = 0, totalOver = 0;
  data.forEach((item) => {
    totalComp += item.stats.completed;
    totalPend += item.stats.pending;
    totalOver += item.stats.overdue;
  });

  const pieData = [
    { name: 'Completed', value: totalComp, color: '#10b981' },
    { name: 'Pending', value: totalPend, color: '#3b82f6' },
    { name: 'Overdue', value: totalOver, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const bestPerformer = [...data].sort((a, b) => b.stats.completionRate - a.stats.completionRate)[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-left"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Performance Analytics</h2>
          <p className="text-xs text-slate-400 mt-1">Audit team performance and completed milestones ratios</p>
        </div>
        <button
          onClick={exportPDF}
          disabled={loading || data.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-blue-500/10 active:scale-95"
        >
          <Download className="h-4 w-4" />
          Export PDF
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-40">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl">
          <p>{error}</p>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-2xl glass-card">
          <BarChart3 className="h-12 w-12 mx-auto text-slate-700 mb-3" />
          <p className="font-semibold text-slate-400">No Analytics Data</p>
          <p className="text-xs text-slate-500 mt-1">Add tasks and complete them to generate reports.</p>
        </div>
      ) : (
        <>
          {/* Top Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Top Performer */}
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 glass-card flex items-center gap-4">
              <span className="p-2.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl">
                <Award className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Top Performer</span>
                <span className="text-sm font-bold text-white block mt-0.5">{bestPerformer?.employeeName || 'N/A'}</span>
                <span className="text-xs text-purple-400 font-bold">{bestPerformer?.stats.completionRate || 0}% Completion Rate</span>
              </div>
            </div>

            {/* Overall Rate */}
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 glass-card flex items-center gap-4">
              <span className="p-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
                <TrendingUp className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Overall Task Completion</span>
                <span className="text-sm font-bold text-white block mt-0.5">
                  {Math.round((totalComp / (totalComp + totalPend + totalOver || 1)) * 100)}%
                </span>
                <span className="text-xs text-slate-400">Completed vs total milestones</span>
              </div>
            </div>

            {/* Overdue Alarms */}
            <div className="p-5 rounded-2xl bg-red-950/5 border border-red-500/15 glass-card flex items-center gap-4">
              <span className="p-2.5 bg-red-500/10 text-red-500 border border-red-500/25 rounded-xl">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Active Overdue Alarms</span>
                <span className="text-sm font-bold text-red-400 block mt-0.5">{totalOver}</span>
                <span className="text-xs text-slate-400">Milestones past deadline</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar chart */}
            <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-800/80 bg-slate-900/40 glass-card text-left">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-400" />
                Task Distribution by Employee
              </h3>
              
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Pending" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Overdue" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/40 glass-card text-left flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-400" />
                Overall Task Ratio
              </h3>

              <div className="flex-1 flex flex-col justify-center items-center">
                {pieData.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No task data</p>
                ) : (
                  <>
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center mt-4 w-full">
                      {pieData.map((item) => (
                        <div key={item.name} className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 block uppercase">{item.name}</span>
                          <span className="text-base font-extrabold block" style={{ color: item.color }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Table summary logs */}
          <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/40 glass-card text-left">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-400" />
              Employee Performance Metrics Table
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">Total Tasks</th>
                    <th className="py-3 px-4 text-center">Completed</th>
                    <th className="py-3 px-4 text-center">Completion Rate</th>
                    <th className="py-3 px-4 text-center">On-Time Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-xs">
                  {data.map((item) => (
                    <tr key={item.employeeId} className="hover:bg-slate-900/20">
                      <td className="py-3 px-4 font-bold text-white">{item.employeeName}</td>
                      <td className="py-3 px-4 text-slate-400">{item.department || 'N/A'}</td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-300">{item.stats.total}</td>
                      <td className="py-3 px-4 text-center text-emerald-400 font-bold">{item.stats.completed}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-extrabold text-white">{item.stats.completionRate}%</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-extrabold text-blue-400">{item.stats.onTimeRate}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
