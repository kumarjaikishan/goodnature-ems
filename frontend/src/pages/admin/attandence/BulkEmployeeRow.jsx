import React, { memo } from 'react';
import { Checkbox, Avatar, Typography, TableCell, TableRow } from '@mui/material';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';

// STATUS_OPTIONS defined outside to be a stable reference (never recreated)
const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'leave', label: 'Leave' },
  { value: 'absent', label: 'Absent' },
  { value: 'weekly off', label: 'Weekly Off' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'half day', label: 'Half Day' },
];

/**
 * A single row in the BulkMark attendance table.
 * Wrapped in React.memo so it ONLY re-renders when its own data changes.
 * Receives stable callbacks (useCallback in parent) to prevent spurious re-renders.
 */
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
    <TableRow>
      <TableCell padding="checkbox">
        <Checkbox
          checked={isChecked}
          onChange={() => onCheck(emp._id)}
        />
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar
            alt={emp.userid?.name}
            src={cloudinaryUrl(emp.profileimage, { format: 'webp', width: 60, height: 60 })}
            sx={{ width: 30, height: 30 }}
          />
          <Typography variant="body2">{emp.userid?.name}</Typography>
        </div>
      </TableCell>

      <TableCell>
        <input
          type="time"
          className="form-input outline-0 border border-primary border-dashed p-1 rounded text-sm"
          value={punchIn || ''}
          onChange={(e) => onTimeChange(emp._id, 'punchIn', e.target.value)}
        />
      </TableCell>

      <TableCell>
        <input
          type="time"
          className="form-input outline-0 border border-primary border-dashed p-1 rounded text-sm"
          value={punchOut || ''}
          onChange={(e) => onTimeChange(emp._id, 'punchOut', e.target.value)}
        />
      </TableCell>

      <TableCell>
        {/* Native <select> is much faster than MUI Select (no portal + no floating layer) */}
        <select
          className="form-input outline-0 border border-primary border-dashed p-1.5 rounded text-sm w-full"
          value={status ?? 'absent'}
          onChange={(e) => onStatusChange(emp._id, e.target.value)}
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </TableCell>
    </TableRow>
  );
});

BulkEmployeeRow.displayName = 'BulkEmployeeRow';

export default BulkEmployeeRow;
