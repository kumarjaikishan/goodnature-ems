import React, { useEffect, useState } from 'react';
import {
  MapPin, User, Award, Settings, ShieldCheck, CreditCard, GraduationCap, Sparkles
} from 'lucide-react';
import { apiClient } from '../../../utils/apiClient';
import dayjs from 'dayjs';
import EmployeeAvatar from '../../../components/common/EmployeeAvatar';
import Button from '../../../components/ui/Button';

const TABS = [
  { id: 1, label: 'Personal Details' },
  { id: 2, label: 'Employment & Bank' },
  { id: 3, label: 'Education & Skills' },
];

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
      <div className="w-full py-20 flex flex-col justify-center items-center gap-3">
        <div className="relative">
          <Settings className="animate-spin text-teal-600" style={{ animationDuration: '2.5s' }} size={36} />
          <Settings className="absolute -bottom-1.5 -left-1 animate-spin text-teal-700" style={{ animationDuration: '3s' }} size={16} />
        </div>
        <p className="text-xs font-medium text-slate-500">Loading employee details...</p>
      </div>
    );
  }

  const fullName = employee?.userid?.name || employee?.employeeName || 'Staff Member';
  const empCode = employee?.empId || employee?.deviceUserId || 'N/A';
  const joinedDate = employee?.userid?.createdAt
    ? dayjs(employee.userid.createdAt).format('DD MMM, YYYY')
    : 'N/A';
  const deptName = employee?.department?.department || 'General';

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 text-xs text-slate-800">
      {/* Identity Header */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
            <EmployeeAvatar
              src={employee?.profileimage}
              name={fullName}
              sizeClass="w-full h-full"
              imgClassName="w-full h-full object-cover rounded-full"
              width={140}
              height={140}
              fallbackNode={<User size={26} className="text-slate-400" />}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 text-base tracking-tight capitalize truncate">
                {fullName}
              </h3>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                  employee?.status
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {employee?.status ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-slate-600 text-xs font-medium mt-0.5 capitalize truncate">
              {employee?.designation || employee?.userid?.role || 'Staff Member'}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 font-mono">
              <span>
                ID: <strong className="text-slate-700">{empCode}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span>Joined {joinedDate}</span>
            </div>
          </div>
        </div>

        <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-2.5 sm:pt-0 sm:pl-4 shrink-0">
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
            Department
          </span>
          <span className="font-semibold text-xs text-slate-800 capitalize mt-0.5 block">
            {deptName}
          </span>
        </div>
      </div>

      {/* Underline Tab Bar */}
      <div className="flex border-b border-slate-200 gap-6 px-1 select-none">
        {TABS.map((tab) => {
          const active = submenu === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setsubmenu(tab.id)}
              className={`pb-2.5 text-xs transition-colors duration-150 cursor-pointer border-b-2 -mb-px ${
                active
                  ? 'border-teal-700 text-teal-800 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Fixed-Height Tab Content Area (prevents modal height jumps across tabs) */}
      <div className="h-[272px] overflow-y-auto pr-0.5">
        {/* Tab 1: Personal Details */}
        {submenu === 1 && (
          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
            <div className="px-4 py-2.5 bg-slate-50/70 flex items-center gap-1.5 rounded-t-xl">
              <ShieldCheck size={14} className="text-teal-700" />
              <h4 className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                Contact &amp; Identification
              </h4>
            </div>

            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3.5">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-0.5">
                  Primary Phone
                </span>
                <span className="font-semibold text-slate-800 font-mono">
                  {employee?.phone || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-0.5">
                  Email Address
                </span>
                <span className="font-medium text-slate-700 truncate block" title={employee?.userid?.email || '—'}>
                  {employee?.userid?.email || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-0.5">
                  Emergency Contact
                </span>
                <span className="font-semibold text-slate-800 font-mono">
                  {employee?.Emergencyphone || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-0.5">
                  Blood Group
                </span>
                <span className={`font-semibold ${employee?.bloodGroup ? 'text-rose-600' : 'text-slate-400'}`}>
                  {employee?.bloodGroup || '—'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-0.5">
                  Date of Birth
                </span>
                <span className="font-medium text-slate-800">
                  {employee?.dob ? dayjs(employee.dob).format('DD MMM, YYYY') : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-0.5">
                  Gender
                </span>
                <span className="font-medium text-slate-800 capitalize">
                  {employee?.gender || 'Male'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-0.5">
                  PAN Card
                </span>
                <span className="font-mono font-semibold text-slate-800 uppercase">
                  {employee?.pan || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-0.5">
                  Aadhaar Card
                </span>
                <span className="font-mono font-semibold text-slate-800">
                  {employee?.adhaar
                    ? String(employee.adhaar).replace(/\s+/g, '').replace(/(\d{4})(?=\d)/g, '$1 ')
                    : '—'}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <MapPin size={12} className="text-teal-700" /> Residential Address
              </span>
              <p className={`text-xs leading-relaxed ${employee?.address ? 'font-medium text-slate-800' : 'text-slate-400 italic'}`}>
                {employee?.address || 'No residential address registered'}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Employment & Bank */}
        {submenu === 2 && (
          <div className="space-y-3">
            {/* Employment Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
              <div className="p-3.5 space-y-0.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                  Designation
                </span>
                <p className="font-semibold text-slate-800 text-xs capitalize">
                  {employee?.designation || 'Staff Member'}
                </p>
              </div>
              <div className="p-3.5 space-y-0.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                  Department
                </span>
                <p className="font-semibold text-slate-800 text-xs capitalize">
                  {deptName}
                </p>
              </div>
              <div className="p-3.5 space-y-0.5 bg-teal-50/40 sm:rounded-r-xl">
                <span className="text-[10px] font-medium uppercase tracking-wider text-teal-700 block">
                  Monthly Base Salary
                </span>
                <p className="font-semibold text-teal-900 text-sm font-mono">
                  ₹{Number(employee?.salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
              <div className="px-4 py-2.5 bg-slate-50/70 flex items-center gap-1.5 rounded-t-xl">
                <CreditCard size={14} className="text-teal-700" />
                <h4 className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                  Bank Account Details
                </h4>
              </div>
              {employee?.acnumber || employee?.bankName || employee?.upi ? (
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-0.5">
                      Account Holder
                    </span>
                    <span className="font-medium text-slate-800">
                      {employee?.acHolderName || fullName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-0.5">
                      Bank Name
                    </span>
                    <span className="font-medium text-slate-800">
                      {employee?.bankName || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-0.5">
                      A/C Number
                    </span>
                    <span className="font-mono font-semibold text-slate-800">
                      {employee?.acnumber || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-0.5">
                      IFSC Code
                    </span>
                    <span className="font-mono font-semibold text-slate-800 uppercase">
                      {employee?.ifscCode || '—'}
                    </span>
                  </div>
                  {employee?.bankbranch && (
                    <div>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-0.5">
                        Branch
                      </span>
                      <span className="font-medium text-slate-700">{employee.bankbranch}</span>
                    </div>
                  )}
                  {employee?.upi && (
                    <div>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-0.5">
                        UPI ID
                      </span>
                      <span className="font-mono font-medium text-slate-700">{employee.upi}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 italic text-xs p-4">No bank account details provided</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Education & Skills */}
        {submenu === 3 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Education */}
              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                <div className="px-3.5 py-2.5 bg-slate-50/70 flex items-center gap-1.5 rounded-t-xl">
                  <GraduationCap size={14} className="text-teal-700" />
                  <h4 className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                    Education Records
                  </h4>
                </div>
                <div className="p-3 space-y-2">
                  {Array.isArray(employee?.education) && employee.education.length > 0 ? (
                    employee.education.map((edu, idx) => (
                      <div key={idx} className="pb-2 last:pb-0 border-b last:border-b-0 border-slate-100">
                        <p className="font-semibold text-slate-800 text-xs">{edu.degree || 'Degree'}</p>
                        <p className="text-[11px] text-slate-500">{edu.institution || 'Institution'}</p>
                        {edu.date && <p className="text-[10px] text-slate-400 mt-0.5">{edu.date}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-xs py-6 text-center italic">No education records added</p>
                  )}
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                <div className="px-3.5 py-2.5 bg-slate-50/70 flex items-center gap-1.5 rounded-t-xl">
                  <Award size={14} className="text-amber-600" />
                  <h4 className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                    Certifications &amp; Achievements
                  </h4>
                </div>
                <div className="p-3 space-y-2">
                  {Array.isArray(employee?.achievements) && employee.achievements.length > 0 ? (
                    employee.achievements.map((ach, idx) => (
                      <div key={idx} className="pb-2 last:pb-0 border-b last:border-b-0 border-slate-100">
                        <p className="font-semibold text-slate-800 text-xs">{ach.title || 'Achievement'}</p>
                        <p className="text-[11px] text-slate-500">{ach.description || 'Description'}</p>
                        {ach.date && <p className="text-[10px] text-slate-400 mt-0.5">{ach.date}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-xs py-6 text-center italic">No achievements recorded</p>
                  )}
                </div>
              </div>
            </div>

            {Array.isArray(employee?.skills) && employee.skills.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-1">
                  <Sparkles size={12} className="text-teal-700" /> Skills:
                </span>
                {employee.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {onClose && (
        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile;
