import React from "react";
import dayjs from "dayjs";
import { Edit2, Trash2, Eye, Play } from "lucide-react";
import { cloudinaryUrl } from "../../../utils/imageurlsetter";
import Button from "../../../components/ui/Button";

export const payrollColumns = (
  handleGenerate,
  handleView,
  handleEdit,
  handleDelete,
  canCreate,
  canView,
  canEdit,
  canDelete,
  payrollMap,
  selectedMonth,
  selectedYear
) => {
  return [
    {
      name: "S.no",
      selector: (row, ind) => ind + 1,
      width: "60px",
    },
    {
      name: "Employee",
      selector: (row) => (
        <div className="flex items-center capitalize gap-3 py-1">
          {row?.profileimage ? (
            <img
              src={cloudinaryUrl(row?.profileimage, {
                format: "webp",
                width: 100,
                height: 100,
              })}
              alt={row?.userid?.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-semibold flex items-center justify-center text-xs border border-teal-200">
              {row?.userid?.name?.charAt(0)?.toUpperCase() || 'E'}
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-slate-900">{row?.userid?.name}</p>
            <p className="text-[11px] text-slate-500 font-normal">
              ({row?.designation || "-"})
            </p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      name: "Department",
      selector: (row) => (
        <span className="text-xs text-slate-700 font-medium">
          {row.department?.department || "-"}
        </span>
      ),
      width: "140px",
    },
    {
      name: "Actions",
      cell: (row) => {
        const key = `${row._id}-${selectedMonth}-${selectedYear}`;
        const exists = payrollMap?.[key];

        return (
          <div className="flex items-center gap-1.5 py-1">
            {canCreate && (
              <Button
                size="sm"
                variant={exists ? "ghost" : "primary"}
                icon={<Play size={13} />}
                disabled={exists}
                title={exists ? 'Already Generated' : 'Generate Payroll'}
                onClick={() => handleGenerate(row)}
              >
                {exists ? 'Generated' : 'Generate'}
              </Button>
            )}
            {canView && (
              <Button
                size="sm"
                disabled={!exists}
                variant="outline"
                icon={<Eye size={13} />}
                onClick={() => handleView(row)}
              >
                View
              </Button>
            )}
            {canEdit && (
              <Button
                size="sm"
                disabled={!exists}
                variant="outline"
                icon={<Edit2 size={13} />}
                onClick={() => handleEdit(row)}
              >
                Edit
              </Button>
            )}
            {canDelete && (
              <Button
                size="sm"
                disabled={!exists}
                variant="danger"
                icon={<Trash2 size={13} />}
                onClick={() => handleDelete(row._id)}
              >
                Delete
              </Button>
            )}
          </div>
        );
      },
      width: "360px",
    },
  ];
};
