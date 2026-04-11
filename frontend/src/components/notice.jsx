// src/components/OfficialNoticeBoard.jsx
import React, { useState } from 'react';
import { MdEdit, MdDelete, MdOutlinePushPin, MdNotificationsActive, MdEvent, MdDescription, MdInfoOutline } from 'react-icons/md';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, MenuItem, IconButton, Tooltip
} from '@mui/material';
import dayjs from 'dayjs';

const employeeTypes = ['All', 'Staff', 'Manager', 'HR', 'Individual'];
const noticeTypes = ['Holiday', 'Policy', 'Event', 'Urgent'];

const OfficialNoticeBoard = ({ notices = [], onDelete, onSave, employees = [], isAdmin = false }) => {
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

  const getNoticeIcon = (type) => {
    switch (type) {
      case 'Urgent': return <MdNotificationsActive className="text-rose-500" />;
      case 'Holiday': return <MdEvent className="text-sky-500" />;
      case 'Policy': return <MdDescription className="text-indigo-500" />;
      default: return <MdInfoOutline className="text-emerald-500" />;
    }
  };

  const getNoticeTheme = (type) => {
    switch (type) {
      case 'Urgent': return 'bg-rose-50 border-rose-200 text-rose-900 icon-rose';
      case 'Holiday': return 'bg-sky-50 border-sky-200 text-sky-900 icon-sky';
      case 'Policy': return 'bg-indigo-50 border-indigo-200 text-indigo-900 icon-indigo';
      default: return 'bg-emerald-50 border-emerald-200 text-emerald-900 icon-emerald';
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md h-full shadow-xl rounded-2xl p-5 w-full flex flex-col border border-white/20">
      <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="bg-amber-100 p-2 rounded-xl text-amber-600 shadow-sm">
            <MdOutlinePushPin className="text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Official Notices</h3>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Stay updated with latest news</p>
          </div>
        </div>
        {isAdmin && (
          <Button 
            size="small" 
            variant="contained" 
            onClick={() => handleOpen()}
            sx={{ borderRadius: '10px', textTransform: 'none', px: 2 }}
          >
            New Notice
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar max-h-[500px]">
        {notices?.length ? (
          notices.map((notice, idx) => (
            <div 
              key={idx} 
              className={`group relative p-4 rounded-xl border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${getNoticeTheme(notice.noticeType)}`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg opacity-80">{getNoticeIcon(notice.noticeType)}</span>
                  <p className="font-bold text-[14px] leading-tight">{notice.title}</p>
                </div>
                <p className="text-[10px] font-medium opacity-60 bg-white/50 px-2 py-0.5 rounded-full">
                  {dayjs(notice.date).format('DD MMM')}
                </p>
              </div>

              <div className="pl-6">
                <p className="text-xs opacity-80 line-clamp-2 mb-2 leading-relaxed">
                  {notice.message || 'No additional details provided.'}
                </p>
                
                <div className="flex items-center justify-between mt-1">
                  {notice.employeeType === 'Individual' && (
                    <p className="text-[10px] font-semibold flex items-center gap-1 opacity-70">
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      Directly for you
                    </p>
                  )}
                  <span className="text-[9px] font-bold uppercase tracking-tighter opacity-40">
                    {notice.noticeType}
                  </span>
                </div>
              </div>

              {isAdmin && (
                <div className="absolute right-2 bottom-2 hidden group-hover:flex gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-lg border border-gray-100 shadow-sm transition-all animate-in fade-in zoom-in duration-200">
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleOpen(notice)}>
                      <MdEdit className="text-[16px] text-blue-500" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => onDelete && onDelete(notice._id)}>
                      <MdDelete className="text-[16px] text-red-500" />
                    </IconButton>
                  </Tooltip>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
             <MdNotificationsActive className="text-5xl mb-2" />
             <p className="text-sm font-medium italic">No active notices</p>
          </div>
        )}
      </div>

      {isAdmin && (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
          <DialogTitle sx={{ pb: 1, fontWeight: 'bold' }}>{editingNotice ? "Edit Official Notice" : "Compose New Notice"}</DialogTitle>
          <DialogContent className="flex flex-col gap-4 mt-2">
            <TextField
              label="Notice Title"
              fullWidth
              required
              size="small"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <TextField
              label="Important Message"
              fullWidth
              multiline
              rows={3}
              size="small"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Provide more context here..."
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Post Date"
                type="date"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
               <TextField
                select
                label="Priority/Type"
                fullWidth
                size="small"
                value={form.noticeType}
                onChange={(e) => setForm({ ...form, noticeType: e.target.value })}
              >
                {noticeTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </TextField>
            </div>
            
            <TextField
              select
              label="Visibility Level"
              fullWidth
              size="small"
              value={form.employeeType}
              onChange={(e) => setForm({ ...form, employeeType: e.target.value })}
            >
              {employeeTypes.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </TextField>

            {form.employeeType === 'Individual' && (
              <TextField
                select
                label="Target Recipient"
                fullWidth
                size="small"
                value={form.targetEmployeeId}
                onChange={(e) => setForm({ ...form, targetEmployeeId: e.target.value })}
              >
                {employees.map((emp) => (
                  <MenuItem key={emp._id} value={emp._id}>
                    {emp.userid?.name} ({emp.empId})
                  </MenuItem>
                ))}
              </TextField>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleClose} sx={{ color: 'gray', textTransform: 'none' }}>Discard</Button>
            <Button variant="contained" onClick={handleSave} sx={{ borderRadius: '10px', px: 4, textTransform: 'none' }}>
              {editingNotice ? "Apply Changes" : "Publish Notice"}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
};

export default OfficialNoticeBoard;
