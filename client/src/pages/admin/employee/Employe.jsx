import { getEmployeeColumns, addemployee, employeedelette, employeeupdate } from "./employeehelper";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { useEffect, useRef, useState, useMemo } from 'react';
import {
  Search,
  Plus,
  FileSpreadsheet,
  X,
  AlertCircle
} from "lucide-react";
import Modalbox from '../../../components/custommodal/Modalbox';
import { swal } from '../../../utils/confirmDialog';
import DataTable from '@/components/common/DataTable';
import { useNavigate } from "react-router-dom";
import EmployeeProfile from "./profile";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "../../../utils/toast";
import useImageUpload from "../../../utils/imageresizer";
import CheckPermission from "../../../utils/CheckPermission";
import { useCustomStyles } from "../attandence/attandencehelper";
import WeeklyOffLedgerModal from "./WeeklyOffLedgerModal";
import EmployeeFormModal from "./EmployeeFormModal";
import { apiClient } from "../../../utils/apiClient";

const Employe = () => {
  const [openmodal, setopenmodal] = useState(false);
  const [isload, setisload] = useState(false);
  const [employeelist, setemployeelist] = useState([]);
  const [departmentlist, setdepartmentlist] = useState([]);
  const [openviewmodal, setopenviewmodal] = useState(false);
  const [passmodal, setpassmodal] = useState(false);
  const [openWOLedger, setOpenWOLedger] = useState(false);
  const [selectedWOEmployee, setSelectedWOEmployee] = useState(null);
  const [isupdate, setisupdate] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [employeePhoto, setEmployeePhoto] = useState(null);
  const [viewEmployee, setviewEmployee] = useState(null);
  const [openSection, setOpenSection] = useState(null);
  const { handleImage } = useImageUpload();
  const dispatch = useDispatch();
  const { department, branch, employee, profile } = useSelector(e => e.user);
  const [pass, setpass] = useState({
    userid: '',
    pass: ''
  });
  const [filters, setFilters] = useState({
    searchText: '',
    branch: 'all',
    department: 'all'
  });

  const inputref = useRef(null);
  const navigate = useNavigate();

  const init = {
    employeeId: '',
    branchId: '',
    department: "",
    employeeName: "",
    empId: "",
    guardian: {
      relation: 'S/o',
      name: ''
    },
    email: "",
    designation: '',
    phone: '',
    address: '',
    gender: 'male',
    bloodGroup: '',
    status: true,
    dob: '',
    Emergencyphone: '',
    maritalStatus: true,
    salary: 0,
    acHolderName: "",
    bankName: '',
    bankbranch: '',
    acnumber: '',
    ifscCode: '',
    upi: '',
    adhaar: '',
    pan: '',
    deviceUserId: '',
    skills: [],
    achievements: [],
    education: [],
    overridedefaultPolicies: false,
    allowances: [],
    bonuses: [],
    deductions: [],
    allowSeeLedger: false,
    telegramId: ''
  };
  const [inp, setInp] = useState(init);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      department: 'all'
    }));
  }, [filters.branch]);

  useEffect(() => {
    if (department?.length > 0) {
      setdepartmentlist(department.filter((dep) => (dep?.branchId?._id || dep?.branchId) === filters.branch));
    }
  }, [filters.branch, department]);

  const handleNestedChange = (e, type, index, field) => {
    const updated = [...inp[type]];
    updated[index][field] = e.target.value;
    setInp(prev => ({ ...prev, [type]: updated }));
  };

  const addItem = (type) => {
    const emptyItem = type === 'achievements'
      ? { title: '', description: '', date: '' }
      : { degree: '', institution: '', date: '' };

    setInp(prev => ({
      ...prev,
      [type]: [...prev[type], emptyItem],
    }));
  };

  const removeItem = (type, index) => {
    const updated = inp[type].filter((_, i) => i !== index);
    setInp(prev => ({ ...prev, [type]: updated }));
  };

  const canCreate = CheckPermission('employee', 2);
  const canEdit = CheckPermission('employee', 3);
  const canDelete = CheckPermission('employee', 4);

  const handleViewProfile = (id) => {
    setviewEmployee(id);
    setopenviewmodal(true);
  };

  const handleViewAttendance = (userId) => {
    navigate(`/dashboard/performance/${userId}`);
  };

  const handleViewWOLedger = (emp) => {
    setSelectedWOEmployee(emp);
    setOpenWOLedger(true);
  };

  const handleResetPassword = (userId) => {
    setpass(prev => ({ ...prev, userid: userId }));
    setpassmodal(true);
  };

  const handleChange = (e, name) => {
    setInp({
      ...inp, [name]: e.target.value
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setEmployeePhoto(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const resetPhoto = () => {
    setPhotoPreview(null);
    setEmployeePhoto(null);
  };

  const adddepartcall = async (e) => {
    e.preventDefault();

    if (isupdate) {
      const formData = new FormData();
      Object.keys(inp).forEach(key => {
        const value = inp[key];
        if (Array.isArray(value) || typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });

      if (employeePhoto) {
        const resizedfile = await handleImage(350, employeePhoto);
        formData.append('photo', resizedfile);
      }

      await employeeupdate({ formData, dispatch, setisload, setEmployeePhoto, setInp, setopenmodal, init, resetPhoto });
      setPhotoPreview(null);
      setEmployeePhoto(null);
    } else {
      const formData = new FormData();
      Object.keys(inp).forEach(key => {
        const value = inp[key];
        if (Array.isArray(value) || typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });

      if (employeePhoto) {
        const resizedfile = await handleImage(350, employeePhoto);
        formData.append('photo', resizedfile);
      }

      await addemployee({ formData, dispatch, setisload, setInp, setopenmodal, init, resetPhoto });
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    try {
      const data = await apiClient({
        url: "updatepassword",
        method: "POST",
        body: { pass }
      });

      setpass({
        userid: '',
        pass: ''
      });
      setpassmodal(false);
      toast.success(data.message, { autoClose: 1200 });
    } catch (error) {
      console.error('Error updating password:', error);
    }
  };

  const edite = (emp) => {
    setisupdate(true);
    const safeValue = (val) => (val === undefined || val === null || val === 'undefined') ? '' : val;

    setInp({
      employeeId: emp._id,
      branchId: safeValue(emp?.branchId),
      department: safeValue(emp?.department?._id || emp?.department),
      employeeName: safeValue(emp?.userid?.name || emp?.rawname),
      email: safeValue(emp?.userid?.email || emp?.email),
      dob: emp?.dob ? emp.dob.split('T')[0] : '',
      salary: emp?.salary || 0,
      status: emp?.status ?? true,
      empId: emp?.empId ? Number(String(emp.empId).replace('EMP', '')) : '',
      guardian: {
        name: safeValue(emp?.guardian?.name),
        relation: safeValue(emp?.guardian?.relation) || 'S/o'
      },
      acHolderName: safeValue(emp?.acHolderName),
      bankName: safeValue(emp?.bankName),
      bankbranch: safeValue(emp?.bankbranch),
      acnumber: safeValue(emp?.acnumber),
      ifscCode: safeValue(emp?.ifscCode),
      upi: safeValue(emp?.upi),
      adhaar: safeValue(emp?.adhaar),
      pan: safeValue(emp?.pan),
      deviceUserId: safeValue(emp?.deviceUserId),
      designation: safeValue(emp?.designation),
      phone: safeValue(emp?.phone),
      address: safeValue(emp?.address),
      gender: safeValue(emp?.gender) || 'male',
      bloodGroup: safeValue(emp?.bloodGroup),
      Emergencyphone: safeValue(emp?.Emergencyphone),
      skills: emp?.skills || [],
      maritalStatus: emp?.maritalStatus ?? true,
      achievements: (emp?.achievements || []).map(ach => ({
        title: safeValue(ach.title),
        description: safeValue(ach.description),
        date: ach.date ? ach.date.split('T')[0] : ''
      })),
      education: (emp?.education || []).map(edu => ({
        degree: safeValue(edu.degree),
        institution: safeValue(edu.institution),
        date: edu.date ? edu.date.split('T')[0] : ''
      })),
      overridedefaultPolicies: emp?.overridedefaultPolicies || false,
      allowances: emp?.allowances || [],
      bonuses: emp?.bonuses || [],
      deductions: emp?.deductions || [],
      allowSeeLedger: emp?.allowSeeLedger || false,
      telegramId: safeValue(emp?.telegramId)
    });
    if (emp.profileimage) {
      setPhotoPreview(emp.profileimage);
    }
    setopenmodal(true);
  };

  const deletee = (id) => {
    swal({
      title: 'Are you sure?',
      text: 'Once deleted, you will not be able to recover this',
      icon: 'warning',
      buttons: true,
      dangerMode: true,
    }).then(async (willDelete) => {
      if (willDelete) {
        employeedelette({ employeeId: id, setisload, dispatch });
      }
    });
  };

  const exportCSV = () => {
    const headers = ["S.No", "Name", "Email", "Department", "Designation", "Status"];
    const rows = filteredEmployees.map((e, idx) => [
      idx + 1, e.rawname, e.email, e.department, e.designation, e.status ? "Active" : "Inactive"
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Employee_Directory.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!employee || employee.length === 0) {
      setemployeelist([]);
      return;
    }

    const data = employee.map((emp) => {
      const dept = typeof emp?.department === 'object' ? emp?.department?.department : (emp?.department || '—');
      return {
        ...emp,
        id: emp._id,
        rawname: emp?.userid?.name || emp?.employeename || '',
        designation: emp?.designation || '',
        profileimage: emp?.profileimage,
        phone: emp?.phone || '—',
        email: emp?.userid?.email || '—',
        status: emp?.status,
        branch: emp?.branchId,
        department: dept,
        departmentid: emp?.department?._id || emp?.department,
      };
    });

    setemployeelist(data);
  }, [employee]);

  const filteredEmployees = useMemo(() => {
    return employeelist.filter((emp) => {
      const name = emp.rawname?.toLowerCase() || '';
      const deptId = emp.departmentid || '';
      const branchId = emp.branch || '';

      const nameMatch = filters.searchText.trim() === '' || name.includes(filters.searchText.toLowerCase());
      const deptMatch = filters.department === 'all' || deptId === filters.department;
      const branchMatch = filters.branch === 'all' || branchId === filters.branch;

      return nameMatch && deptMatch && branchMatch;
    });
  }, [employeelist, filters]);

  const columns = useMemo(() => getEmployeeColumns({
    canEdit,
    canDelete,
    onViewProfile: handleViewProfile,
    onViewAttendance: handleViewAttendance,
    onViewWOLedger: handleViewWOLedger,
    onEdit: edite,
    onResetPassword: handleResetPassword,
    onDelete: deletee,
  }), [canEdit, canDelete]);

  const customStyles = useCustomStyles();

  const handleResetFilters = () => {
    setFilters({
      searchText: '',
      branch: 'all',
      department: 'all'
    });
  };

  const isFiltered = filters.searchText || filters.branch !== 'all' || filters.department !== 'all';
  const toggleSection = (section) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  return (
    <div className='p-4 md:p-6 max-w-7xl mx-auto space-y-5'>
      
      {/* Controls & Search Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-4 md:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-800 tracking-tight">
              Employee Directory
            </h1>
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline flex items-center gap-1 cursor-pointer ml-2"
              >
                <X size={13} /> Reset Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={exportCSV}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              Export CSV
            </button>

            {canCreate && (
              <button
                type="button"
                onClick={() => setopenmodal(true)}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Add Employee
              </button>
            )}
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          <div className="sm:col-span-1 lg:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Search size={14} />
            </div>
            <input
              type="text"
              placeholder="Search by Employee name..."
              value={filters.searchText}
              onChange={(e) => handleFilterChange("searchText", e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50/50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div>
            <select
              value={filters.branch}
              onChange={(e) => handleFilterChange("branch", e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50/50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-all cursor-pointer"
            >
              <option value="all">All Branches</option>
              {profile?.role === 'manager'
                ? branch?.filter((e) => profile?.branchIds?.includes(e._id))
                  ?.map((list) => (
                    <option key={list._id} value={list._id}>
                      {list.name}
                    </option>
                  ))
                : branch?.map((list) => (
                  <option key={list._id} value={list._id}>{list.name}</option>
                ))}
            </select>
          </div>

          <div>
            <select
              disabled={filters.branch === "all"}
              value={filters.department}
              onChange={(e) => handleFilterChange("department", e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50/50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-all cursor-pointer disabled:opacity-50 disabled:bg-slate-100"
            >
              <option value="all">All Departments</option>
              {departmentlist.length > 0 ? (
                departmentlist.map((list) => (
                  <option key={list._id} value={list._id}>
                    {list.department}
                  </option>
                ))
              ) : (
                <option disabled>No departments found</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredEmployees}
          pagination
          customStyles={customStyles}
          highlightOnHover
          paginationPerPage={20}
          paginationRowsPerPageOptions={[20, 50, 100, 300]}
          noDataComponent={
            <div className="flex items-center justify-center gap-2 py-10 text-center text-slate-500 text-xs font-medium">
              <AlertCircle size={16} className="text-amber-500" /> No Employee records found.
            </div>
          }
        />
      </div>

      {/* Extracted Modular Employee Form Modal */}
      <EmployeeFormModal
        open={openmodal}
        onClose={() => {
          setopenmodal(false);
          setisupdate(false);
          setInp(init);
          resetPhoto();
        }}
        isupdate={isupdate}
        inp={inp}
        setInp={setInp}
        handleChange={handleChange}
        handleNestedChange={handleNestedChange}
        addItem={addItem}
        removeItem={removeItem}
        photoPreview={photoPreview}
        handlePhotoChange={handlePhotoChange}
        inputref={inputref}
        openSection={openSection}
        toggleSection={toggleSection}
        branch={branch}
        department={department}
        profile={profile}
        adddepartcall={adddepartcall}
        isload={isload}
        init={init}
        resetPhoto={resetPhoto}
      />

      {/* View Profile Modal */}
      <Modalbox open={openviewmodal} onClose={() => setopenviewmodal(false)}>
        <div className="w-[92vw] max-w-[690px] max-h-[90vh] overflow-y-auto rounded-xl">
          <EmployeeProfile
            viewEmployee={viewEmployee}
            onClose={() => setopenviewmodal(false)}
          />
        </div>
      </Modalbox>

      {/* Password Reset Modal */}
      <Modalbox open={passmodal} onClose={() => setpassmodal(false)}>
        <div className="w-[360px] max-w-[90vw] p-5 bg-white rounded-2xl">
          <form onSubmit={updatePassword} className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Reset Employee Password</h2>
            <Input
              type="password"
              required
              value={pass.pass}
              onChange={(e) => setpass({ ...pass, pass: e.target.value })}
              label="New Password"
              placeholder="Enter new password"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setpassmodal(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Reset Password</Button>
            </div>
          </form>
        </div>
      </Modalbox>

      <WeeklyOffLedgerModal
        open={openWOLedger}
        onClose={() => setOpenWOLedger(false)}
        employee={selectedWOEmployee}
      />
    </div>
  );
};

export default Employe;

