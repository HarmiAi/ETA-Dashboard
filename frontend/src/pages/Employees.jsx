const API_URL = 'https://eta-dashboard-backend.onrender.com/api';
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
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  const openAddModal = () => {
    setSelectedEmployee(null);
    setName('');
    setEmail('');
    setDepartment('');
    setDesignation('');
    setAvatar('');
    dispatch(clearEmployeeError());
    setShowModal(true);
  };

  const openEditModal = (employee) => {
    setSelectedEmployee(employee);
    setName(employee.name);
    setEmail(employee.email);
    setDepartment(employee.department || '');
    setDesignation(employee.designation || '');
    setAvatar(employee.avatar || '');
    dispatch(clearEmployeeError());
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { name, email, department, designation, avatar };
    
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
      <div className="flex justify-between items-center text-left">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-wide">Employee Directory</h2>
          <p className="text-sm text-slate-500 font-bold mt-1">Manage employee records and assign roles</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-sm transition shadow-md shadow-indigo-500/15 clay-btn"
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md text-left">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          placeholder="Search by name, email, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#D1DFDA] text-slate-850 placeholder-slate-400 text-xs focus:outline-none focus:border-[#5EAD93] transition shadow-sm"
        />
      </div>

      {/* Directory Table */}
      <div className="overflow-hidden rounded-3xl border border-[#D1DFDA] bg-white clay-card text-left">
        {loading && employees.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <User className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="text-lg font-bold text-slate-700">No employees found</p>
            <p className="text-sm text-slate-500 mt-1 font-semibold">Try refining your search terms or add a new employee.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-[#D1DFDA] bg-slate-50/70 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Designation</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1DFDA] text-xs font-bold text-slate-650">
                {filteredEmployees.map((employee) => (
                  <tr key={employee._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 font-extrabold text-slate-800 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full overflow-hidden border border-[#D1DFDA] bg-slate-50 shrink-0">
                        {employee.avatar ? (
                          <img src={employee.avatar} alt={employee.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-[#5EAD93]/10 text-[#5EAD93] flex items-center justify-center font-bold text-[10px]">
                            {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span>{employee.name}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">{employee.email}</td>
                    <td className="py-4 px-6 text-slate-700">{employee.department || 'N/A'}</td>
                    <td className="py-4 px-6 text-slate-700">{employee.designation || 'N/A'}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        employee.active 
                          ? 'bg-emerald-50 text-emerald-650 border-emerald-250' 
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {employee.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(employee)}
                        className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-800 transition"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-550 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-white border border-[#D1DFDA] shadow-2xl overflow-hidden text-left">
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-base font-extrabold text-slate-800 tracking-wide">
                  {selectedEmployee ? 'Edit Employee Details' : 'Add New Employee'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 hover:bg-slate-150 rounded-lg text-slate-400 hover:text-slate-700 transition"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 text-red-650 border border-red-200 rounded-xl flex items-center gap-3 text-xs font-semibold">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Profile Picture Uploader */}
                <div className="flex flex-col items-center justify-center mb-4 pb-2 border-b border-[#D1DFDA]">
                  <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider text-center">Profile Picture</label>
                  <div className="relative group cursor-pointer">
                    <div className="h-16 w-16 rounded-full border border-[#D1DFDA] bg-slate-50 flex items-center justify-center overflow-hidden transition hover:border-[#5EAD93] shadow-inner">
                      {avatar ? (
                        <img src={avatar} alt="Avatar Preview" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-slate-400" />
                      )}
                    </div>
                    <label htmlFor="avatar-file" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full text-white text-[9px] font-bold transition cursor-pointer">
                      Upload
                    </label>
                    <input 
                      type="file" 
                      id="avatar-file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </div>
                  {avatar && (
                    <button 
                      type="button" 
                      onClick={() => setAvatar('')}
                      className="text-[9px] text-red-500 hover:text-red-650 font-bold mt-1.5"
                    >
                      Remove Picture
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-[#D1DFDA] text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-[#5EAD93] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="john.doe@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-[#D1DFDA] text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-[#5EAD93] transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Department</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Briefcase className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Engineering"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-[#D1DFDA] text-slate-800 placeholder-slate-450 text-xs focus:outline-none focus:border-[#5EAD93] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Designation</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Briefcase className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Developer"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-[#D1DFDA] text-slate-800 placeholder-slate-450 text-xs focus:outline-none focus:border-[#5EAD93] transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 text-xs font-semibold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-[#4D967D] disabled:bg-primary/50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-500/15 clay-btn"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] bg-white border border-red-200 shadow-2xl p-6 text-left">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-base font-extrabold text-slate-800">Delete Employee?</h3>
            </div>
            
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-800">{selectedEmployee?.name}</span>?
              <span className="block mt-2 text-[10px] font-bold text-red-500 uppercase tracking-wider">
                Warning: This will permanently remove all daily tasks assigned to this employee.
              </span>
            </p>

            <div className="flex justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedEmployee(null);
                }}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white font-bold rounded-xl transition shadow-lg shadow-red-500/10 clay-btn"
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
