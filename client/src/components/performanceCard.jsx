import React, { useMemo } from "react";
import {
    Calendar,
    CheckCircle,
    Briefcase,
    UserX,
    Clock,
    Minimize2,
    LogIn,
    LogOut,
    ArrowLeftCircle,
    ArrowRightCircle,
    CalendarDays,
    Award,
    TrendingUp,
} from "lucide-react";

const EmployeeProfileCard = ({ employee, user, hell }) => {
    const employepic = 'https://res.cloudinary.com/dusxlxlvm/image/upload/v1753113610/ems/assets/employee_fi3g5p.webp';

    const total = useMemo(() =>
        (hell?.present?.length || 0) + (hell?.absent?.length || 0) + (hell?.leave?.length || 0),
        [hell]);

    const perc = useMemo(() => {
        if (!total || total === 0) {
            return { present: 0, leave: 0, absent: 0 };
        }
        const p = Math.round((hell?.present?.length / total) * 100);
        const l = Math.round((hell?.leave?.length / total) * 100);
        const a = Math.max(0, 100 - p - l);
        return { present: p, leave: l, absent: a };
    }, [hell, total]);

    const formatMinToHours = (mins) => {
        if (!mins || mins <= 0) return "";
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0 && m > 0) return `${h}h ${m}m`;
        if (h > 0) return `${h}h`;
        return `${mins}m`;
    };

    // SVG Donut Chart Calculation with Present (Teal), Leaves (Amber), and Absent (Rose) segments
    const donutRadius = 78;
    const circumference = 2 * Math.PI * donutRadius;
    const presentDash = total > 0 ? (hell?.present?.length / total) * circumference : 0;
    const leaveDash = total > 0 ? (hell?.leave?.length / total) * circumference : 0;
    const absentDash = total > 0 ? (hell?.absent?.length / total) * circumference : 0;

    const StatCard = ({ icon: Icon, label, value, subValue, tag, colorConfig, tooltipText }) => {
        const { bg, iconBg, iconColor, border, valueColor } = colorConfig;
        return (
            <div
                title={tooltipText || undefined}
                className={`relative flex items-center justify-between p-3.5 rounded-2xl ${bg} ${border} border shadow-2xs hover:shadow-md transition-all duration-200 group`}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl ${iconBg} ${iconColor} shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-2xs`}>
                        <Icon size={17} strokeWidth={2.2} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-700 truncate">{label}</span>
                        {subValue && (
                            <span className="text-[11px] font-semibold text-slate-500 truncate mt-0.5">
                                {subValue}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end shrink-0 pl-2">
                    <span className={`text-base font-black ${valueColor} tracking-tight`}>
                        {value}
                    </span>
                    {tag && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/90 text-slate-600 border border-slate-200/80 shadow-2xs mt-0.5">
                            {tag}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    const colors = {
        total: {
            bg: "bg-gradient-to-br from-slate-50 to-indigo-50/40",
            iconBg: "bg-indigo-600",
            iconColor: "text-white",
            border: "border-indigo-100/80",
            valueColor: "text-indigo-950",
        },
        present: {
            bg: "bg-gradient-to-br from-slate-50 to-teal-50/50",
            iconBg: "bg-teal-700",
            iconColor: "text-white",
            border: "border-teal-200/80",
            valueColor: "text-teal-950",
        },
        leave: {
            bg: "bg-gradient-to-br from-slate-50 to-amber-50/40",
            iconBg: "bg-amber-600",
            iconColor: "text-white",
            border: "border-amber-200/80",
            valueColor: "text-amber-950",
        },
        absent: {
            bg: "bg-gradient-to-br from-slate-50 to-rose-50/40",
            iconBg: "bg-rose-600",
            iconColor: "text-white",
            border: "border-rose-200/80",
            valueColor: "text-rose-950",
        },
        overtime: {
            bg: "bg-gradient-to-br from-slate-50 to-emerald-50/50",
            iconBg: "bg-emerald-600",
            iconColor: "text-white",
            border: "border-emerald-200/80",
            valueColor: "text-emerald-950",
        },
        short: {
            bg: "bg-gradient-to-br from-slate-50 to-orange-50/40",
            iconBg: "bg-orange-500",
            iconColor: "text-white",
            border: "border-orange-200/80",
            valueColor: "text-orange-950",
        },
        weeklyoff: {
            bg: "bg-gradient-to-br from-slate-50 to-purple-50/40",
            iconBg: "bg-purple-600",
            iconColor: "text-white",
            border: "border-purple-200/80",
            valueColor: "text-purple-950",
        },
        lateArrival: {
            bg: "bg-gradient-to-br from-slate-50 to-amber-50/30",
            iconBg: "bg-amber-500",
            iconColor: "text-white",
            border: "border-amber-100",
            valueColor: "text-slate-800",
        },
        earlyExit: {
            bg: "bg-gradient-to-br from-slate-50 to-orange-50/30",
            iconBg: "bg-orange-600",
            iconColor: "text-white",
            border: "border-orange-100",
            valueColor: "text-slate-800",
        },
        earlyArrival: {
            bg: "bg-gradient-to-br from-slate-50 to-sky-50/40",
            iconBg: "bg-sky-600",
            iconColor: "text-white",
            border: "border-sky-100",
            valueColor: "text-slate-800",
        },
        lateExit: {
            bg: "bg-gradient-to-br from-slate-50 to-blue-50/30",
            iconBg: "bg-blue-600",
            iconColor: "text-white",
            border: "border-blue-100",
            valueColor: "text-slate-800",
        },
    };

    return (
        <div className="w-full rounded-2xl bg-white border border-slate-200 shadow-sm p-5 md:p-6 transition-all">
            <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
                {/* Left: Interactive Donut Chart & Profile Hub */}
                <div className="flex flex-col items-center justify-center shrink-0 w-full lg:w-72 p-4 rounded-2xl bg-gradient-to-b from-slate-50/90 to-teal-50/30 border border-slate-100 text-center">
                    <div className="relative flex items-center justify-center mb-3">
                        <svg className="w-48 h-48 transform -rotate-90">
                            {/* Background Track Circle */}
                            <circle
                                cx="96"
                                cy="96"
                                r={donutRadius}
                                className="text-slate-100"
                                strokeWidth="6"
                                stroke="currentColor"
                                fill="transparent"
                            />

                            {/* Absent Arc (Rose / Red) */}
                            {absentDash > 0 && (
                                <circle
                                    cx="96"
                                    cy="96"
                                    r={donutRadius}
                                    className="text-rose-500 transition-all duration-700 ease-out"
                                    strokeWidth="6"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={circumference - (presentDash + leaveDash + absentDash)}
                                    stroke="currentColor"
                                    fill="transparent"
                                />
                            )}

                            {/* Leave Arc (Amber / Yellow) */}
                            {leaveDash > 0 && (
                                <circle
                                    cx="96"
                                    cy="96"
                                    r={donutRadius}
                                    className="text-amber-500 transition-all duration-700 ease-out"
                                    strokeWidth="6"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={circumference - (presentDash + leaveDash)}
                                    stroke="currentColor"
                                    fill="transparent"
                                />
                            )}

                            {/* Present Arc (Teal / Emerald) */}
                            {presentDash > 0 && (
                                <circle
                                    cx="96"
                                    cy="96"
                                    r={donutRadius}
                                    className="text-teal-600 transition-all duration-700 ease-out"
                                    strokeWidth="6"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={circumference - presentDash}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                />
                            )}
                        </svg>

                        {/* Bigger Profile Avatar Inside Donut */}
                        <div className="absolute w-[138px] h-[138px] rounded-full overflow-hidden border-2 border-white shadow-md bg-white">
                            <img
                                src={employee?.profileimage || employepic}
                                alt={employee?.name || user?.name || "Employee"}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Attendance Score Badge & Ratio Legend */}
                    <div className="flex flex-col items-center gap-1.5 mb-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-700 text-white font-extrabold text-xs shadow-xs">
                            <TrendingUp size={13} className="text-teal-200" />
                            <span>{perc.present}% Present</span>
                        </div>

                        {total > 0 && (
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                <span className="flex items-center gap-1 text-teal-700">
                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 inline-block" />
                                    {perc.present}%
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1 text-amber-700">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                                    {perc.leave}%
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1 text-rose-700">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                                    {perc.absent}%
                                </span>
                            </div>
                        )}
                    </div>

                    <p className="font-bold text-sm text-slate-800 leading-snug mt-1">
                        {user?.name || employee?.name || 'Employee Profile'}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500">
                        {employee?.designation ? `${employee.designation} • ` : ''}
                        {employee?.branchId?.name || (typeof employee?.branchId === 'string' ? employee.branchId : 'Head Office')}
                    </p>
                </div>

                {/* Right: Metrics Grid */}
                <div className="flex-1 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        <StatCard
                            icon={Calendar}
                            label="Total Days"
                            value={total}
                            tag="Working Days"
                            colorConfig={colors.total}
                        />
                        <StatCard
                            icon={CheckCircle}
                            label="Present"
                            value={`${hell?.present?.length || 0} Days`}
                            tag={perc.present ? `${perc.present}% Rate` : "0%"}
                            colorConfig={colors.present}
                        />
                        <StatCard
                            icon={Briefcase}
                            label="Leaves"
                            value={`${hell?.leave?.length || 0} Days`}
                            tag={perc.leave ? `${perc.leave}%` : "0%"}
                            colorConfig={colors.leave}
                        />
                        <StatCard
                            icon={UserX}
                            label="Absent"
                            value={`${hell?.absent?.length || 0} Days`}
                            tag={perc.absent ? `${perc.absent}%` : "0%"}
                            colorConfig={colors.absent}
                        />
                        <StatCard
                            icon={Clock}
                            label="Overtime"
                            value={`${hell?.overtime?.length || 0} Rec`}
                            subValue={hell?.overtimemin > 0 ? `OT: ${formatMinToHours(hell.overtimemin)} ${hell?.overtimesalary ? `| ₹${hell.overtimesalary}` : ''}` : "0 min"}
                            colorConfig={colors.overtime}
                            tooltipText={`Salary: ₹${employee?.salary || 0} | Payout: ₹${hell?.overtimesalary || 0}`}
                        />
                        <StatCard
                            icon={Minimize2}
                            label="Short Time"
                            value={`${hell?.short?.length || 0} Rec`}
                            subValue={hell?.shorttimemin > 0 ? `Short: ${formatMinToHours(hell.shorttimemin)}` : "0 min"}
                            colorConfig={colors.short}
                        />
                        <StatCard
                            icon={CalendarDays}
                            label="Weekly Off Work"
                            value={`${hell?.weeklyoffwork?.length || 0} Days`}
                            subValue={hell?.weeklyoffworkmin > 0 ? formatMinToHours(hell.weeklyoffworkmin) : "0 min"}
                            colorConfig={colors.weeklyoff}
                        />
                        <StatCard
                            icon={LogIn}
                            label="Late Arrival"
                            value={hell?.latearrival?.length || 0}
                            colorConfig={colors.lateArrival}
                        />
                        <StatCard
                            icon={LogOut}
                            label="Early Exit"
                            value={hell?.earlyLeave?.length || 0}
                            colorConfig={colors.earlyExit}
                        />
                        <StatCard
                            icon={ArrowLeftCircle}
                            label="Early Arrival"
                            value={hell?.earlyarrival?.length || 0}
                            colorConfig={colors.earlyArrival}
                        />
                        <StatCard
                            icon={ArrowRightCircle}
                            label="Late Exit"
                            value={hell?.lateleave?.length || 0}
                            colorConfig={colors.lateExit}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeProfileCard;
