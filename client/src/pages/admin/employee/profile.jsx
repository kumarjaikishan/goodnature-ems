import React, { useEffect, useState } from 'react';
import {
  Phone, Mail, Cake, MapPin, User, Building, Building2,
  Calendar, Droplets, Award, IndianRupee, Key, Settings, Briefcase, PhoneCall, ShieldCheck, CreditCard, GraduationCap, FileText
} from 'lucide-react';
import { apiClient } from '../../../utils/apiClient';
import dayjs from 'dayjs';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';
import Button from '../../../components/ui/Button';

const EmployeeProfile = ({ viewEmployee, onClose }) => {
  const [isload, setisload] = useState(false);
  const [employee, setemployee] = useState(null);
  const [submenu, setsubmenu] = useState(1);

  useEffect(() => {
    const fetchEmployee = async () => {
      setisload(true);
      try {
        const data = await apiClient({
          url: `getemployee?empid=${viewEmployee}`
        });
        setemployee(data);
      } catch (error) {
        console.error('Error fetching employee profile:', error);
      } finally {
        setisload(false);
      }
    };
    if (viewEmployee) {
      fetchEmployee();
    }
  }, [viewEmployee]);

  if (isload) {
    return (
      <div className="w-full py-16 flex flex-col justify-center items-center gap-3">
        <div className="relative">
          <Settings className="animate-spin text-teal-600" style={{ animationDuration: '2.5s' }} size={40} />
          <Settings className="absolute -bottom-2 -left-1 animate-spin text-teal-700" style={{ animationDuration: '3s' }} size={18} />
        </div>
        <p className="text-xs font-semibold text-teal-800">Loading employee details...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-5 text-slate-800">
      {/* Top Hero Card */}
      <div className="p-4 rounded-xl border border-teal-100 bg-teal-50/40 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div className="w-20 h-20 bg-white rounded-full border-2 border-teal-500/80 p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
          {employee?.profileimage ? (
            <img
              src={cloudinaryUrl(employee.profileimage, {
                format: "webp",
                width: 160,
                height: 160,
              })}
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-teal-100 text-teal-800 font-bold text-xl flex items-center justify-center">
              {employee?.userid?.name ? employee.userid.name.charAt(0).toUpperCase() : <User size={28} className="text-teal-700" />}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-slate-900 capitalize truncate">
                {employee?.userid?.name || employee?.name || 'Employee'}
              </h3>
              <p className="text-xs font-medium text-slate-500 capitalize">
                {employee?.designation || employee?.userid?.role || 'Staff Member'}
              </p>
            </div>
            <div className="flex items-center justify-center sm:justify-end gap-1.5 shrink-0">
              <span className="px-2.5 py-0.5 bg-white text-slate-700 text-xs font-semibold rounded-md border border-slate-200 shadow-2xs">
                {employee?.department?.department || 'General'}
              </span>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border shadow-2xs ${
                employee?.status
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {employee?.status ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
            <div className="flex items-center gap-2 min-w-0">
              <Mail size={14} className="text-slate-400 shrink-0" />
              <span className="truncate">{employee?.userid?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Phone size={14} className="text-slate-400 shrink-0" />
              <span className="truncate">{employee?.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Calendar size={14} className="text-slate-400 shrink-0" />
              <span className="truncate">Joined: {employee?.userid?.createdAt ? dayjs(employee?.userid?.createdAt).format('DD MMM, YYYY') : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <CreditCard size={14} className="text-slate-400 shrink-0" />
              <span className="font-mono font-semibold text-slate-800 truncate">
                ID: {employee?.empId || employee?.deviceUserId || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pill Navigation Tabs */}
      <div className="bg-slate-100 p-1 rounded-xl flex gap-1 text-xs font-semibold select-none">
        <button
          type="button"
          onClick={() => setsubmenu(1)}
          className={`flex-1 py-1.5 px-2 text-center rounded-lg transition-all cursor-pointer ${
            submenu === 1
              ? 'bg-teal-700 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          Personal Info
        </button>
        <button
          type="button"
          onClick={() => setsubmenu(2)}
          className={`flex-1 py-1.5 px-2 text-center rounded-lg transition-all cursor-pointer ${
            submenu === 2
              ? 'bg-teal-700 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          Employment
        </button>
        <button
          type="button"
          onClick={() => setsubmenu(3)}
          className={`flex-1 py-1.5 px-2 text-center rounded-lg transition-all cursor-pointer ${
            submenu === 3
              ? 'bg-teal-700 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          Documents & Skills
        </button>
      </div>

      {/* Tab 1: Personal Info */}
      {submenu === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5">
            <Cake size={16} className="text-teal-700 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Date of Birth</span>
              <span className="font-semibold text-slate-800 text-sm">
                {employee?.dob ? dayjs(employee?.dob).format('DD MMMM, YYYY') : 'N/A'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5">
            <MapPin size={16} className="text-teal-700 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Address</span>
              <span className="font-semibold text-slate-800 text-sm">
                {employee?.address || 'N/A'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5">
            <PhoneCall size={16} className="text-teal-700 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Emergency Contact</span>
              <span className="font-semibold text-slate-800 text-sm">
                {employee?.Emergencyphone || 'N/A'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5">
            <Droplets size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Blood Group</span>
              <span className="font-semibold text-slate-800 text-sm">
                {employee?.bloodGroup || 'N/A'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5">
            <ShieldCheck size={16} className="text-teal-700 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Aadhaar No.</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {employee?.adhaar || 'N/A'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5">
            <CreditCard size={16} className="text-teal-700 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">PAN No.</span>
              <span className="font-mono font-bold text-slate-800 text-sm uppercase">
                {employee?.pan || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Employment & Banking */}
      {submenu === 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5">
            <Briefcase size={16} className="text-teal-700 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Designation</span>
              <span className="font-semibold text-slate-800 text-sm">
                {employee?.designation || 'Staff'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5">
            <Building2 size={16} className="text-teal-700 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Department</span>
              <span className="font-semibold text-slate-800 text-sm">
                {employee?.department?.department || 'General'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-start gap-2.5">
            <IndianRupee size={16} className="text-teal-800 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-teal-800 uppercase block">Monthly Base Salary</span>
              <span className="font-bold text-teal-900 text-sm">
                ₹{Number(employee?.salary || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5">
            <Building size={16} className="text-teal-700 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Bank Name</span>
              <span className="font-semibold text-slate-800 text-sm">
                {employee?.bankName || 'N/A'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5">
            <User size={16} className="text-teal-700 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Account Holder</span>
              <span className="font-semibold text-slate-800 text-sm">
                {employee?.acHolderName || employee?.userid?.name || 'N/A'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5">
            <Building2 size={16} className="text-teal-700 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Bank Branch</span>
              <span className="font-semibold text-slate-800 text-sm">
                {employee?.bankbranch || 'N/A'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5">
            <CreditCard size={16} className="text-teal-700 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">A/C Number</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {employee?.acnumber || 'N/A'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5">
            <Key size={16} className="text-teal-700 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">IFSC Code</span>
              <span className="font-mono font-bold text-slate-800 text-sm uppercase">
                {employee?.ifscCode || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Documents & Achievements */}
      {submenu === 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Education Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-800 pb-2 border-b border-slate-200/70">
              <GraduationCap size={16} className="text-teal-700" />
              <span>Education</span>
            </div>
            <div className="space-y-2.5">
              {Array.isArray(employee?.education) && employee.education.length > 0 ? (
                employee.education.map((edu, idx) => (
                  <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-0.5 shadow-2xs">
                    <p className="font-bold text-slate-800 text-xs">{edu.degree || 'Degree'}</p>
                    <p className="text-[11px] text-slate-600">{edu.institution || 'Institution'}</p>
                    {edu.date && <p className="text-[10px] text-slate-400 font-medium">{edu.date}</p>}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs py-3 text-center">No education records added</p>
              )}
            </div>
          </div>

          {/* Achievements Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-800 pb-2 border-b border-slate-200/70">
              <Award size={16} className="text-amber-600" />
              <span>Achievements & Certifications</span>
            </div>
            <div className="space-y-2.5">
              {Array.isArray(employee?.achievements) && employee.achievements.length > 0 ? (
                employee.achievements.map((ach, idx) => (
                  <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-0.5 shadow-2xs">
                    <p className="font-bold text-slate-800 text-xs">{ach.title || 'Achievement'}</p>
                    <p className="text-[11px] text-slate-600">{ach.description || 'Description'}</p>
                    {ach.date && <p className="text-[10px] text-slate-400 font-medium">{ach.date}</p>}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs py-3 text-center">No achievements recorded</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {onClose && (
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile;
