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

    doc.setFillColor(94, 173, 147); // #5EAD93 - Brand Sage Green
    doc.rect(0, 0, 297, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Employee ETA Follow-Up System', 14, 15);
    
    doc.setFontSize(11);
    doc.setTextColor(240, 240, 250);
    doc.text('Daily & Monthly Performance Analytics Report', 14, 23);
    
    doc.setFontSize(9);
    doc.setTextColor(230, 230, 250);
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

    doc.setFillColor(244, 240, 250); // Light lavender surface
    doc.rect(14, 45, 269, 15, 'F');
    doc.setTextColor(130, 117, 247);
    doc.setFont('Helvetica', 'bold');
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
      headStyles: { fillColor: [130, 117, 247] }
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
    { name: 'Pending', value: totalPend, color: '#5EAD93' },
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
          <h2 className="text-xl font-bold text-slate-800">Performance Analytics</h2>
          <p className="text-xs text-slate-500 font-bold mt-1">Audit team performance and completed milestones ratios</p>
        </div>
        <button
          onClick={exportPDF}
          disabled={loading || data.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#5EAD93] hover:bg-[#4D967D] disabled:bg-slate-300 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-500/10 active:scale-95 clay-btn"
        >
          <Download className="h-4 w-4" />
          Export PDF
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-40">
          <Loader2 className="h-10 w-10 text-[#5EAD93] animate-spin" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-650 border border-red-200 rounded-xl">
          <p>{error}</p>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#D1DFDA] rounded-[28px] clay-card">
          <BarChart3 className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">No Analytics Data</p>
          <p className="text-xs text-slate-500 mt-1">Add tasks and complete them to generate reports.</p>
        </div>
      ) : (
        <>
          {/* Top Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Top Performer */}
            <div className="p-5 rounded-[28px] bg-white border border-[#D1DFDA] clay-card flex items-center gap-4">
              <span className="p-2.5 bg-[#E2ECE8] text-[#5EAD93] border border-[#D1DFDA]/60 rounded-xl">
                <Award className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Top Performer</span>
                <span className="text-sm font-bold text-slate-800 block mt-0.5">{bestPerformer?.employeeName || 'N/A'}</span>
                <span className="text-xs text-[#5EAD93] font-bold">{bestPerformer?.stats.completionRate || 0}% Completion Rate</span>
              </div>
            </div>

            {/* Overall Rate */}
            <div className="p-5 rounded-[28px] bg-white border border-[#D1DFDA] clay-card flex items-center gap-4">
              <span className="p-2.5 bg-[#E1F2FF] text-blue-600 border border-blue-200/50 rounded-xl">
                <TrendingUp className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Overall Task Completion</span>
                <span className="text-sm font-bold text-slate-800 block mt-0.5">
                  {Math.round((totalComp / (totalComp + totalPend + totalOver || 1)) * 100)}%
                </span>
                <span className="text-xs text-slate-500 font-semibold">Completed vs total milestones</span>
              </div>
            </div>

            {/* Overdue Alarms */}
            <div className="p-5 rounded-[28px] bg-[#FFF8F8] border border-red-200/60 shadow-sm flex items-center gap-4">
              <span className="p-2.5 bg-[#FFE2E2] text-red-500 border border-red-200 rounded-xl">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Active Overdue Alarms</span>
                <span className="text-sm font-bold text-red-500 block mt-0.5">{totalOver}</span>
                <span className="text-xs text-slate-500 font-semibold">Milestones past deadline</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar chart */}
            <div className="lg:col-span-2 p-5 rounded-[28px] border border-[#D1DFDA] bg-white clay-card text-left">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-6 flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#5EAD93]" />
                Task Distribution by Employee
              </h3>
              
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D1DFDA" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#D1DFDA', borderRadius: '16px', color: '#1D2C28' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Pending" fill="#5EAD93" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Overdue" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="p-5 rounded-[28px] border border-[#D1DFDA] bg-white clay-card text-left flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-6 flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#5EAD93]" />
                Overall Task Ratio
              </h3>

              <div className="flex-1 flex flex-col justify-center items-center">
                {pieData.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No task data</p>
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
                          <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#D1DFDA', borderRadius: '16px' }} />
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
          <div className="p-5 rounded-[28px] border border-[#D1DFDA] bg-white clay-card text-left">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#5EAD93]" />
              Employee Performance Metrics Table
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead>
                  <tr className="border-b border-[#D1DFDA] bg-slate-50/70 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">Total Tasks</th>
                    <th className="py-3 px-4 text-center">Completed</th>
                    <th className="py-3 px-4 text-center">Completion Rate</th>
                    <th className="py-3 px-4 text-center">On-Time Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1DFDA] text-xs font-bold text-slate-650">
                  {data.map((item) => (
                    <tr key={item.employeeId} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-extrabold text-slate-800">{item.employeeName}</td>
                      <td className="py-3 px-4 text-slate-500">{item.department || 'N/A'}</td>
                      <td className="py-3 px-4 text-center text-slate-700">{item.stats.total}</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">{item.stats.completed}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-extrabold text-slate-800">{item.stats.completionRate}%</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-extrabold text-[#5EAD93]">{item.stats.onTimeRate}%</span>
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
