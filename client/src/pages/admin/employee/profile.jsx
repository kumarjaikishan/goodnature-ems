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
    <div className="w-full max-w-full overflow-x-hidden space-y-4 text-xs text-slate-800">
      {/* Top Profile Card Banner (Clean White Background) */}
      <div className="p-4 bg-white border border-slate-200 text-slate-800 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center shadow-inner">
            {employee?.profileimage ? (
              <img
                src={cloudinaryUrl(employee.profileimage, {
                  format: "webp",
                  width: 140,
                  height: 140,
                  crop: "fill",
                })}
                alt={employee?.userid?.name || employee?.employeeName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={30} className="text-slate-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base tracking-tight capitalize">
                {employee?.userid?.name || employee?.employeeName || 'Staff Member'}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                employee?.status
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {employee?.status ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-slate-600 text-xs font-medium mt-0.5 capitalize">
              {employee?.designation || employee?.userid?.role || 'Staff Member'}
            </p>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 font-mono">
              <span>ID: <strong className="text-slate-700">{employee?.empId || employee?.deviceUserId || 'N/A'}</strong></span>
              <span>•</span>
              <span>Joined: {employee?.userid?.createdAt ? dayjs(employee?.userid?.createdAt).format('DD MMM, YYYY') : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Department & Branch Pill */}
        <div className="sm:text-right bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Department
          </span>
          <span className="font-bold text-xs text-slate-800">
            {employee?.department?.department || 'General Department'}
          </span>
        </div>
      </div>

      {/* Pill Navigation Tabs */}
      <div className="bg-slate-100 p-1 rounded-xl flex gap-1 text-xs font-semibold select-none border border-slate-200/60">
        <button
          type="button"
          onClick={() => setsubmenu(1)}
          className={`flex-1 py-1.5 px-2 text-center rounded-lg transition-all cursor-pointer ${
            submenu === 1
              ? 'bg-white text-teal-800 shadow-xs font-bold border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          Personal Details
        </button>
        <button
          type="button"
          onClick={() => setsubmenu(2)}
          className={`flex-1 py-1.5 px-2 text-center rounded-lg transition-all cursor-pointer ${
            submenu === 2
              ? 'bg-white text-teal-800 shadow-xs font-bold border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          Employment & Bank
        </button>
        <button
          type="button"
          onClick={() => setsubmenu(3)}
          className={`flex-1 py-1.5 px-2 text-center rounded-lg transition-all cursor-pointer ${
            submenu === 3
              ? 'bg-white text-teal-800 shadow-xs font-bold border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          Education & Skills
        </button>
      </div>

      {/* Tab 1: Personal Info */}
      {submenu === 1 && (
        <div className="space-y-3">
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-teal-700" /> Contact & Identification Details
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Primary Phone</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {employee?.phone || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Email Address</span>
                <span className="font-medium text-slate-700 truncate block" title={employee?.userid?.email || '—'}>
                  {employee?.userid?.email || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Emergency Contact</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {employee?.Emergencyphone || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Blood Group</span>
                <span className="font-semibold text-rose-600">
                  {employee?.bloodGroup || '—'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Date of Birth</span>
                <span className="font-medium text-slate-800">
                  {employee?.dob ? dayjs(employee.dob).format('DD MMM, YYYY') : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Gender</span>
                <span className="font-medium text-slate-800 capitalize">
                  {employee?.gender || 'Male'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">PAN Card</span>
                <span className="font-mono font-bold text-slate-800 uppercase text-xs">
                  {employee?.pan || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Aadhaar Card</span>
                <span className="font-mono font-bold text-slate-800 text-xs">
                  {employee?.adhaar
                    ? String(employee.adhaar).replace(/\s+/g, '').replace(/(\d{4})(?=\d)/g, '$1 ')
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Address Box */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <MapPin size={12} className="text-teal-700" /> Residential Address
            </span>
            <p className="font-medium text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 text-xs leading-relaxed">
              {employee?.address || 'No residential address registered'}
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Employment & Banking */}
      {submenu === 2 && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Designation</span>
              <p className="font-bold text-slate-800 text-xs">{employee?.designation || 'Staff Member'}</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Department</span>
              <p className="font-bold text-slate-800 text-xs">{employee?.department?.department || 'General'}</p>
            </div>
            <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">Monthly Base Salary</span>
              <p className="font-bold text-teal-900 text-xs">
                ₹{Number(employee?.salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Bank Details Card */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <CreditCard size={13} className="text-teal-700" /> Bank Account Details
            </span>
            {employee?.acnumber || employee?.bankName ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Account Holder</span>
                  <span className="font-medium text-slate-800">{employee?.acHolderName || employee?.userid?.name || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Bank Name</span>
                  <span className="font-medium text-slate-800">{employee?.bankName || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">A/C Number</span>
                  <span className="font-mono font-medium text-slate-800">{employee?.acnumber || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">IFSC Code</span>
                  <span className="font-mono font-medium text-slate-800">{employee?.ifscCode || '—'}</span>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 italic text-[11px] py-2">No bank account details provided</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Documents & Achievements */}
      {submenu === 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Education Card */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 pb-1.5 border-b border-slate-200/70 text-xs">
              <GraduationCap size={14} className="text-teal-700" />
              <span>Education Records</span>
            </div>
            <div className="space-y-2">
              {Array.isArray(employee?.education) && employee.education.length > 0 ? (
                employee.education.map((edu, idx) => (
                  <div key={idx} className="p-2 bg-white border border-slate-200 rounded-lg space-y-0.5 shadow-2xs">
                    <p className="font-bold text-slate-800 text-xs">{edu.degree || 'Degree'}</p>
                    <p className="text-[11px] text-slate-600">{edu.institution || 'Institution'}</p>
                    {edu.date && <p className="text-[10px] text-slate-400 font-medium">{edu.date}</p>}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs py-3 text-center italic">No education records added</p>
              )}
            </div>
          </div>

          {/* Achievements Card */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 pb-1.5 border-b border-slate-200/70 text-xs">
              <Award size={14} className="text-amber-600" />
              <span>Certifications & Achievements</span>
            </div>
            <div className="space-y-2">
              {Array.isArray(employee?.achievements) && employee.achievements.length > 0 ? (
                employee.achievements.map((ach, idx) => (
                  <div key={idx} className="p-2 bg-white border border-slate-200 rounded-lg space-y-0.5 shadow-2xs">
                    <p className="font-bold text-slate-800 text-xs">{ach.title || 'Achievement'}</p>
                    <p className="text-[11px] text-slate-600">{ach.description || 'Description'}</p>
                    {ach.date && <p className="text-[10px] text-slate-400 font-medium">{ach.date}</p>}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs py-3 text-center italic">No achievements recorded</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {onClose && (
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile;
