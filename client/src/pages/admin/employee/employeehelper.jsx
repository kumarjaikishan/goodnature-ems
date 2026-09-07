import { apiClient } from "../../../utils/apiClient";
import { FirstFetch } from "../../../../store/userSlice";
import { toast } from "../../../utils/toast";
import { cloudinaryUrl } from "../../../utils/imageurlsetter";
import { Eye, FileSpreadsheet, Clock, Edit2, KeyRound, Trash2 } from "lucide-react";

const AVATAR_PALETTES = [
    { bg: '#dbeafe', text: '#1d4ed8' }, // Sky Blue
    { bg: '#e0e7ff', text: '#4338ca' }, // Indigo
    { bg: '#dcfce7', text: '#15803d' }, // Emerald Green
    { bg: '#fef3c7', text: '#b45309' }, // Amber / Warm Orange
    { bg: '#f3e8ff', text: '#7e22ce' }, // Purple
    { bg: '#ccfbf1', text: '#0f766e' }, // Deep Teal
    { bg: '#ffe4e6', text: '#be123c' }, // Rose Pink
    { bg: '#fae8ff', text: '#a21caf' }, // Fuchsia
    { bg: '#e0f2fe', text: '#0369a1' }, // Cyan
    { bg: '#fef9c3', text: '#854d0e' }, // Yellow Gold
    { bg: '#ffedd5', text: '#c2410c' }, // Coral
    { bg: '#e2e8f0', text: '#334155' }, // Slate Blue
];

const getAvatarColor = (name = '') => {
    if (!name || name === '—') return AVATAR_PALETTES[0];
    let hash = 5381;
    for (let i = 0; i < name.length; i++) {
        hash = ((hash << 5) + hash) + name.charCodeAt(i);
    }
    const index = Math.abs(hash) % AVATAR_PALETTES.length;
    return AVATAR_PALETTES[index];
};

const getInitials = (name = '') => {
    if (!name || name === '—') return 'EM';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const getEmployeeColumns = ({
    canEdit,
    canDelete,
    onViewProfile,
    onViewAttendance,
    onViewWOLedger,
    onEdit,
    onResetPassword,
    onDelete,
}) => [
    {
        name: "EMPLOYEE NAME",
        selector: (row) => row?.rawname || '',
        sortable: true,
        style: { minWidth: "220px" },
        cell: (row) => {
            const empName = row?.rawname || '—';
            const designation = row?.designation || '';
            const initials = getInitials(empName);
            const palette = getAvatarColor(empName);
            const hasPhoto = Boolean(row?.profileimage);

            return (
                <div className="flex items-center gap-2.5 py-0.5">
                    {hasPhoto ? (
                        <img
                            alt={empName}
                            className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                            src={cloudinaryUrl(row?.profileimage, {
                                format: "webp",
                                width: 80,
                                height: 80,
                            })}
                        />
                    ) : (
                        <div
                            style={{ backgroundColor: palette.bg, color: palette.text }}
                            className="w-[32px] h-[32px] rounded-full flex items-center justify-center font-bold text-[11px] tracking-wider shrink-0 select-none shadow-2xs"
                        >
                            {initials}
                        </div>
                    )}
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-slate-800 text-xs truncate leading-tight">
                            {empName}
                        </span>
                        {designation && (
                            <span className="text-[10px] text-slate-400 font-medium truncate leading-tight mt-0.5">
                                {designation}
                            </span>
                        )}
                    </div>
                </div>
            );
        },
    },
    {
        name: "PHONE",
        selector: (row) => row?.phone || '',
        width: '120px',
        cell: (row) => (
            <span className="text-xs font-mono text-slate-700">
                {row?.phone || '—'}
            </span>
        ),
    },
    {
        name: "DEPARTMENT",
        selector: (row) => row?.department || '',
        sortable: true,
        width: '150px',
        cell: (row) => (
            <span className="text-xs font-medium text-slate-700">
                {row?.department || '—'}
            </span>
        ),
    },
    {
        name: "STATUS",
        selector: (row) => (row?.status ? "Active" : "Inactive"),
        sortable: true,
        width: '110px',
        cell: (row) => (
            <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide border ${
                    row?.status
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
            >
                {row?.status ? "Active" : "Inactive"}
            </span>
        ),
    },
    {
        name: "ACTIONS",
        width: '190px',
        cell: (row) => (
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                    title="View Profile"
                    onClick={() => onViewProfile(row._id)}
                >
                    <Eye size={15} />
                </button>
                <button
                    type="button"
                    className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                    title="Attendance Report"
                    onClick={() => onViewAttendance(row?.userid?._id || row?._id)}
                >
                    <FileSpreadsheet size={15} />
                </button>
                <button
                    type="button"
                    className="p-1 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors cursor-pointer"
                    title="Weekly Off Ledger"
                    onClick={() => onViewWOLedger(row)}
                >
                    <Clock size={15} />
                </button>
                {canEdit && (
                    <button
                        type="button"
                        className="p-1 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors cursor-pointer"
                        title="Edit Employee"
                        onClick={() => onEdit(row)}
                    >
                        <Edit2 size={15} />
                    </button>
                )}
                {canEdit && (
                    <button
                        type="button"
                        className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                        title="Reset Password"
                        onClick={() => onResetPassword(row?.userid?._id || row?._id)}
                    >
                        <KeyRound size={15} />
                    </button>
                )}
                {canDelete && (
                    <button
                        type="button"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Delete Employee"
                        onClick={() => onDelete(row._id)}
                    >
                        <Trash2 size={15} />
                    </button>
                )}
            </div>
        ),
    },
];

export const columns = getEmployeeColumns({});


export const addemployee = async ({ formData, dispatch, setisload, setInp, setopenmodal, init, resetPhoto }) => {
    setisload(true);

    try {
        const data = await apiClient({
            url: "addemployee",
            method: "POST",
            body: formData
        });

        toast.success(data.message, { autoClose: 1200 });
        setInp(init);
        resetPhoto();
        setopenmodal(false);
        dispatch(FirstFetch())
    } catch (error) {
        console.error('Error adding employee:', error);
        // Error handling is managed by apiClient/useApi (toast.warn/error)
    } finally {
        setisload(false);
    }
};


export const employeeupdate = async ({ formData, dispatch, setEmployeePhoto, setisload, setInp, setopenmodal, init }) => {
    setisload(true);

    try {
        const data = await apiClient({
            url: "updateemployee",
            method: "POST",
            body: formData
        });

        toast.success(data.message, { autoClose: 1200 });
        setEmployeePhoto(null)
        setInp(init);
        setopenmodal(false);
        dispatch(FirstFetch())
    } catch (error) {
        console.error('Error updating employee:', error);
    } finally {
        setisload(false);
    }
};

export const employeedelette = async ({ employeeId, setisload, dispatch }) => {
    if (!employeeId) {
        alert('All fileds are Required');
        return;
    }

    setisload(true);

    try {
        const data = await apiClient({
            url: "deleteemployee",
            method: "POST",
            body: { employeeId }
        });

        dispatch(FirstFetch())
        toast.success(data.message, { autoClose: 1200 });
    } catch (error) {
        console.error('Error deleting employee:', error);
    } finally {
        setisload(false);
    }
};


