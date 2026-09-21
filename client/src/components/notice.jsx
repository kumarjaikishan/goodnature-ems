import React, { useState } from 'react';
import { Edit2, Trash2, Pin, Bell, Calendar } from 'lucide-react';
import Modalbox from './custommodal/Modalbox';
import Input from './ui/Input';
import Select from './ui/Select';
import Button from './ui/Button';
import dayjs from 'dayjs';

const employeeTypes = ['All', 'Staff', 'Manager', 'HR', 'Individual'];
const noticeTypes = ['Holiday', 'Policy', 'Event', 'Urgent'];

const OfficialNoticeBoard = ({ notices = [], onDelete, onSave, employees = [], isAdmin = false }) => {
  const safeNotices = Array.isArray(notices) ? notices : [];
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const [open, setOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);

  const [form, setForm] = useState({
    title: '',
    message: '',
    date: '',
    employeeType: 'All',
    noticeType: 'Event',
    targetEmployeeId: ''
  });

  const handleOpen = (notice = null) => {
    setEditingNotice(notice);
    if (notice) {
      setForm({
        title: notice.title || '',
        message: notice.message || '',
        date: notice.date ? dayjs(notice.date).format('YYYY-MM-DD') : '',
        employeeType: notice.employeeType || 'All',
        noticeType: notice.noticeType || 'Event',
        targetEmployeeId: notice.targetEmployeeId || ''
      });
    } else {
      setForm({ 
        title: '', 
        message: '', 
        date: dayjs().format('YYYY-MM-DD'), 
        employeeType: 'All', 
        noticeType: 'Event',
        targetEmployeeId: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setEditingNotice(null);
    setOpen(false);
  };

  const handleSave = () => {
    if (onSave) {
      onSave({ 
        ...form, 
        _id: editingNotice?._id 
      });
    }
    handleClose();
  };

  return (
    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Pin className="text-teal-700" size={18} />
          <h2 className="text-sm font-bold text-slate-800">Notice Board</h2>
        </div>
        {isAdmin && (
          <Button variant="primary" size="sm" onClick={() => handleOpen()}>
            + Compose Notice
          </Button>
        )}
      </div>

      <div className="space-y-2.5 max-h-96 overflow-y-auto">
        {safeNotices.length > 0 ? (
          safeNotices.map((notice) => (
            <div
              key={notice._id}
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition flex justify-between items-start gap-3"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    notice.noticeType === 'Urgent' ? 'bg-rose-100 text-rose-800' :
                    notice.noticeType === 'Policy' ? 'bg-amber-100 text-amber-800' :
                    notice.noticeType === 'Holiday' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-teal-100 text-teal-800'
                  }`}>
                    {notice.noticeType || 'Notice'}
                  </span>
                  <p className="text-xs font-bold text-slate-800">{notice.title}</p>
                </div>
                {notice.message && (
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{notice.message}</p>
                )}
                <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {notice.date ? dayjs(notice.date).format('DD MMM YYYY') : '-'}
                  </span>
                  <span>• Target: {notice.employeeType}</span>
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpen(notice)}
                    className="p-1 text-slate-400 hover:text-teal-700 cursor-pointer"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete && onDelete(notice._id)}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
            <Bell size={32} className="mb-2 opacity-30" />
            <p className="text-xs font-medium">No active notices</p>
          </div>
        )}
      </div>

      {isAdmin && (
        <Modalbox open={open} onClose={handleClose}>
          <div className="w-[420px] max-w-[92vw] p-6 bg-white rounded-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                {editingNotice ? "Edit Notice" : "Compose New Notice"}
              </h3>
              <button type="button" onClick={handleClose} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-3">
              <Input
                label="Notice Title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Office holiday announcement"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message Context</label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Provide more context here..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Post Date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />

                <Select
                  label="Priority / Type"
                  value={form.noticeType}
                  onChange={(e) => setForm({ ...form, noticeType: e.target.value })}
                >
                  {noticeTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Select>
              </div>

              <Select
                label="Visibility Level"
                value={form.employeeType}
                onChange={(e) => setForm({ ...form, employeeType: e.target.value })}
              >
                {employeeTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>

              {form.employeeType === 'Individual' && (
                <Select
                  label="Target Recipient"
                  value={form.targetEmployeeId}
                  onChange={(e) => setForm({ ...form, targetEmployeeId: e.target.value })}
                >
                  <option value="">Select Employee</option>
                  {safeEmployees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.userid?.name} ({emp.empId})
                    </option>
                  ))}
                </Select>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={handleClose}>Cancel</Button>
              <Button variant="primary" onClick={handleSave}>
                {editingNotice ? "Apply Changes" : "Publish Notice"}
              </Button>
            </div>
          </div>
        </Modalbox>
      )}
    </div>
  );
};

export default OfficialNoticeBoard;
