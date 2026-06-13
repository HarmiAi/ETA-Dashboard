const API_URL = 'http://localhost:5000/api';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchEmployees, 
  addEmployee, 
  updateEmployee, 
  deleteEmployee,
  clearEmployeeError
} from '../store/employeeSlice';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  X, 
  AlertCircle, 
  Briefcase, 
  Mail, 
  User, 
  ShieldAlert,
  Loader2 
} from 'lucide-react';

export default function Employees() {
  const dispatch = useDispatch();
  const { list: employees, loading, error } = useSelector((state) => state.employees);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  const openAddModal = () => {
    setSelectedEmployee(null);
    setName('');
    setEmail('');
    setDepartment('');
    setDesignation('');
    dispatch(clearEmployeeError());
    setShowModal(true);
  };

  const openEditModal = (employee) => {
    setSelectedEmployee(employee);
    setName(employee.name);
    setEmail(employee.email);
    setDepartment(employee.department || '');
    setDesignation(employee.designation || '');
    dispatch(clearEmployeeError());
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { name, email, department, designation };
    
    let result;
    if (selectedEmployee) {
      result = await dispatch(updateEmployee({ id: selectedEmployee._id, employeeData: data }));
    } else {
      result = await dispatch(addEmployee(data));
    }

    if (!result.error) {
      setShowModal(false);
    }
  };

  const handleDelete = async () => {
    if (selectedEmployee) {
      const result = await dispatch(deleteEmployee(selectedEmployee._id));
      if (!result.error) {
        setShowDeleteConfirm(false);
        setSelectedEmployee(null);
      }
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Employee Directory</h2>
          <p className="text-sm text-slate-400 mt-1">Manage employee records and assign roles</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl text-sm transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          placeholder="Search by name, email, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary transition-all duration-200"
        />
      </div>

      {/* Directory Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 glass-card">
        {loading && employees.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <User className="h-12 w-12 mx-auto text-slate-700 mb-3" />
            <p className="text-lg font-semibold text-slate-300">No employees found</p>
            <p className="text-sm text-slate-500 mt-1">Try refining your search terms or add a new employee.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Email Address</th>
                <th className="py-4 px-6">Department</th>
                <th className="py-4 px-6">Designation</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
              {filteredEmployees.map((employee) => (
                <tr key={employee._id} className="hover:bg-slate-900/40 transition">
                  <td className="py-4 px-6 font-semibold text-white">{employee.name}</td>
                  <td className="py-4 px-6 text-slate-400">{employee.email}</td>
                  <td className="py-4 px-6">{employee.department || 'N/A'}</td>
                  <td className="py-4 px-6">{employee.designation || 'N/A'}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      employee.active 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {employee.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(employee)}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setShowDeleteConfirm(true);
                      }}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl glass-panel shadow-2xl border border-slate-800 bg-slate-900 overflow-hidden text-left">
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-white tracking-wide">
                  {selectedEmployee ? 'Edit Employee Details' : 'Add New Employee'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl flex items-center gap-3 text-sm">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-primary transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="john.doe@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-primary transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Department</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Briefcase className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Engineering"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-primary transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Designation</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Briefcase className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Developer"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-primary transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white text-sm font-semibold rounded-xl transition"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl glass-panel border border-red-500/20 bg-slate-900 shadow-2xl p-6 text-left">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-lg font-bold text-white">Delete Employee?</h3>
            </div>
            
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-white">{selectedEmployee?.name}</span>?
              <span className="block mt-2 text-xs font-semibold text-red-500 uppercase tracking-wider">
                Warning: This will permanently remove all daily tasks assigned to this employee.
              </span>
            </p>

            <div className="flex justify-end gap-3 text-sm">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedEmployee(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export { API_URL };
