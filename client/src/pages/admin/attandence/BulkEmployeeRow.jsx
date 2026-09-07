import React, { memo } from 'react';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'leave', label: 'Leave' },
  { value: 'absent', label: 'Absent' },
  { value: 'weekly off', label: 'Weekly Off' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'half day', label: 'Half Day' },
];

const BulkEmployeeRow = memo(({
  emp,
  isChecked,
  punchIn,
  punchOut,
  status,
  onCheck,
  onTimeChange,
  onStatusChange,
}) => {
  return (
    <tr className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
      <td className="p-2.5 text-center">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => onCheck(emp._id)}
          className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 border-slate-300 cursor-pointer"
        />
      </td>

      <td className="p-2.5">
        <div className="flex items-center gap-2.5">
          {emp.profileimage ? (
            <img
              alt={emp.userid?.name}
              src={cloudinaryUrl(emp.profileimage, { format: 'webp', width: 60, height: 60 })}
              className="w-7 h-7 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
              {emp.userid?.name?.charAt(0) || 'E'}
            </div>
          )}
          <span className="text-xs font-semibold text-slate-800">{emp.userid?.name}</span>
        </div>
      </td>

      <td className="p-2.5">
        <input
          type="time"
          className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
          value={punchIn || ''}
          onChange={(e) => onTimeChange(emp._id, 'punchIn', e.target.value)}
        />
      </td>

      <td className="p-2.5">
        <input
          type="time"
          className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
          value={punchOut || ''}
          onChange={(e) => onTimeChange(emp._id, 'punchOut', e.target.value)}
        />
      </td>

      <td className="p-2.5">
        <select
          className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white transition-colors cursor-pointer"
          value={status ?? 'absent'}
          onChange={(e) => onStatusChange(emp._id, e.target.value)}
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </td>
    </tr>
  );
});

BulkEmployeeRow.displayName = 'BulkEmployeeRow';

export default BulkEmployeeRow;
