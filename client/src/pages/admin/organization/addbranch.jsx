import React, { useEffect, useState } from 'react';
import { toast } from '../../../utils/toast';
import { User } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { FirstFetch } from '../../../../store/userSlice';
import { apiClient } from '../../../utils/apiClient';
import Input from '@/components/ui/Input';
import NumberInput from '@/components/ui/NumberInput';
import Button from '@/components/ui/Button';

const weekdays = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const Addbranch = ({ setopenviewmodal, employee, company, editbranch, editbranchdata }) => {
  const init = {
    id: '',
    name: '',
    location: '',
    companyId: '',
    managerIds: [],
    defaultsetting: true,
    setting: {
      officeTime: { in: '10:00', out: '18:00', breakMinutes: 30 },
      gracePeriod: { lateEntryMinutes: 10, earlyExitMinutes: 10 },
      workingMinutes: {
        fullDay: 480,
        halfDay: 240,
        shortDayThreshold: 270,
        overtimeAfterMinutes: 480
      },
      weeklyOffs: [0],
      attendanceRules: {
        considerEarlyEntryBefore: '09:50',
        considerLateEntryAfter: '10:10',
        considerEarlyExitBefore: '17:50',
        considerLateExitAfter: '18:15',
        esslPunchInStart: '00:00',
        esslPunchInEnd: '23:59',
        esslPunchOutStart: '00:00',
        esslPunchOutEnd: '23:59'
      }
    }
  };

  const [branch, setBranch] = useState(init);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const { adminManager } = useSelector((state) => state.user);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    setBranch(prev => ({ ...prev, companyId: company?._id }));
    if (editbranch && editbranchdata) {
      setBranch(prev => ({
        ...prev,
        ...editbranchdata,
        setting: {
          ...prev.setting,
          ...(editbranchdata?.setting || {}),
          attendanceRules: {
            ...prev.setting.attendanceRules,
            ...(editbranchdata?.setting?.attendanceRules || {})
          }
        }
      }));
    }
  }, [company, editbranch, editbranchdata]);

  useEffect(() => {
    fetchManagers();
  }, [adminManager]);

  const fetchManagers = async () => {
    if (adminManager?.length > 0) {
      setUsers(adminManager.filter(e => e.role === 'manager'));
      return;
    }
    try {
      const data = await apiClient({ url: "getAdmin" });
      if (Array.isArray(data)) {
        setUsers(data.filter(e => e.role === 'manager'));
      }
    } catch (err) {
      console.error("Error fetching admin/managers:", err);
    }
  };

  const cancele = () => {
    setopenviewmodal(false);
    setBranch(init);
  };

  const handleFieldChange = (field, value) => {
    setBranch(prev => ({ ...prev, [field]: value }));
  };

  const handleSettingChange = (section, key, value) => {
    setBranch(prev => ({
      ...prev,
      setting: {
        ...prev.setting,
        [section]: { ...prev.setting[section], [key]: value }
      }
    }));
  };

  const toggleManager = (managerId) => {
    const current = branch?.managerIds || [];
    const updated = current.includes(managerId)
      ? current.filter(id => id !== managerId)
      : [...current, managerId];
    handleFieldChange('managerIds', updated);
  };

  const toggleWeeklyOff = (dayVal) => {
    const current = branch.setting.weeklyOffs || [];
    const updated = current.includes(dayVal)
      ? current.filter(v => v !== dayVal)
      : [...current, dayVal];
    setBranch(prev => ({
      ...prev,
      setting: { ...prev.setting, weeklyOffs: updated }
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const data = await apiClient({
        url: "addBranch",
        method: "POST",
        body: branch
      });
      toast.success(data.message || "Branch added successfully!");
      setopenviewmodal(false);
      dispatch(FirstFetch());
      cancele();
    } catch (err) {
      console.error('Error adding branch:', err);
      toast.error(err.message || "Failed to add branch");
    } finally {
      setLoading(false);
    }
  };

  const edite = async () => {
    try {
      setLoading(true);
      const data = await apiClient({
        url: "editBranch",
        method: "POST",
        body: branch
      });
      toast.success(data.message || "Branch updated successfully!");
      dispatch(FirstFetch());
      setopenviewmodal(false);
      cancele();
    } catch (err) {
      console.error('Error editing branch:', err);
      toast.error(err.message || "Failed to update branch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='p-6 space-y-5'>
      <div>
        <h3 className='text-base font-bold text-slate-800'>{editbranch ? 'Edit Branch' : 'Add New Branch'}</h3>
        <p className='text-xs text-slate-500'>Configure branch location, assigned branch managers and attendance rules</p>
      </div>

      <div className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Input
            label="Branch Name"
            value={branch.name}
            onChange={e => handleFieldChange('name', e.target.value)}
            required
            placeholder="e.g. Head Office, Patna Branch"
          />

          <Input
            label="Location"
            value={branch.location}
            onChange={e => handleFieldChange('location', e.target.value)}
            placeholder="e.g. Patna, Bihar"
          />
        </div>

        {/* Assigned Managers Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 tracking-wide">Assigned Branch Managers</label>
          <div className="flex flex-wrap gap-2 pt-1 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50/50">
            {users && users.length > 0 ? (
              users.map(u => {
                const isSelected = (branch?.managerIds || []).includes(u._id);
                return (
                  <button
                    type="button"
                    key={u._id}
                    onClick={() => toggleManager(u._id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer select-none ${isSelected
                      ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                  >
                    {u.profileImage ? (
                      <img src={u.profileImage} alt={u.name} className="w-4 h-4 rounded-full object-cover" />
                    ) : (
                      <User size={13} />
                    )}
                    <span>{u.name}</span>
                  </button>
                );
              })
            ) : (
              <span className="text-xs text-slate-400 italic">No managers registered in system yet.</span>
            )}
          </div>
        </div>

        {/* Attendance Override Checkbox */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 block">Override Company Default Rules</span>
            <span className="text-[11px] text-slate-500">Enable custom office timings and biometric rules for this branch</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={!branch.defaultsetting}
              onChange={e => setBranch(prev => ({ ...prev, defaultsetting: !e.target.checked }))}
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
          </label>
        </div>

        {/* Custom Timings Section */}
        {!branch.defaultsetting && (
          <div className="p-4 border border-teal-200 bg-teal-50/20 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wide">Custom Branch Timings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Office Time In"
                type="time"
                value={branch.setting.officeTime.in}
                onChange={e => handleSettingChange('officeTime', 'in', e.target.value)}
              />

              <Input
                label="Office Time Out"
                type="time"
                value={branch.setting.officeTime.out}
                onChange={e => handleSettingChange('officeTime', 'out', e.target.value)}
              />

              <NumberInput
                label="Break Minutes"
                value={branch.setting.officeTime.breakMinutes}
                onChange={e => handleSettingChange('officeTime', 'breakMinutes', Number(e.target.value))}
              />

              <NumberInput
                label="Full Day Minutes"
                value={branch.setting.workingMinutes.fullDay}
                onChange={e => handleSettingChange('workingMinutes', 'fullDay', Number(e.target.value))}
              />

              <NumberInput
                label="Half Day Minutes"
                value={branch.setting.workingMinutes.halfDay}
                onChange={e => handleSettingChange('workingMinutes', 'halfDay', Number(e.target.value))}
              />

              <NumberInput
                label="Short Day Threshold (Min)"
                value={branch.setting.workingMinutes.shortDayThreshold}
                onChange={e => handleSettingChange('workingMinutes', 'shortDayThreshold', Number(e.target.value))}
              />

              <NumberInput
                label="Overtime After (Min)"
                value={branch.setting.workingMinutes.overtimeAfterMinutes}
                onChange={e => handleSettingChange('workingMinutes', 'overtimeAfterMinutes', Number(e.target.value))}
              />

              {/* Weekly Off Days */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 tracking-wide">Weekly Offs</label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {weekdays.map(d => {
                    const isSelected = (branch.setting.weeklyOffs || []).includes(d.value);
                    return (
                      <button
                        type="button"
                        key={d.value}
                        onClick={() => toggleWeeklyOff(d.value)}
                        className={`px-2 py-1 text-[11px] font-semibold rounded-md border transition cursor-pointer select-none ${isSelected
                          ? 'bg-teal-700 text-white border-teal-800'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        {d.label.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className='flex justify-end gap-2 pt-4 border-t border-slate-100'>
        <Button variant="outline" onClick={cancele}>
          Cancel
        </Button>
        <Button
          variant="primary"
          loading={loading}
          onClick={editbranch ? edite : handleSubmit}
        >
          {editbranch ? 'Save Branch' : 'Add Branch'}
        </Button>
      </div>
    </div>
  );
};

export default Addbranch;
