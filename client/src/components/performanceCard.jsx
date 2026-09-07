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
} from "lucide-react";

const EmployeeProfileCard = ({ employee, hell }) => {
    const employepic = 'https://res.cloudinary.com/dusxlxlvm/image/upload/v1753113610/ems/assets/employee_fi3g5p.webp';

    const total = useMemo(() =>
        (hell?.present?.length || 0) + (hell?.absent?.length || 0) + (hell?.leave?.length || 0),
        [hell]);

    const perc = useMemo(() => ({
        present: total ? Math.floor((hell?.present?.length / total) * 100) : 0,
        absent: total ? Math.floor((hell?.absent?.length / total) * 100) : 0,
        leave: total ? Math.floor((hell?.leave?.length / total) * 100) : 0,
    }), [hell, total]);

    const formatMinToHours = (mins) => {
        if (!mins || mins <= 0) return "";
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0 && m > 0) return `${mins} Min Total (${h}h ${m}m)`;
        if (h > 0) return `${mins} Min Total (${h}h)`;
        return `${mins} Min Total`;
    };

    // SVG Donut Chart Calculation
    const donutRadius = 75;
    const circumference = 2 * Math.PI * donutRadius;
    const presentDash = (perc.present / 100) * circumference;
    const leaveDash = (perc.leave / 100) * circumference;
    const absentDash = (perc.absent / 100) * circumference;

    const StatCard = ({ icon: Icon, label, value, subValue, colorClass, tooltipText }) => {
        return (
            <div
                title={tooltipText || undefined}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/70 backdrop-blur-md border border-white/60 shadow-xs hover:shadow-md transition-all duration-200 group"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${colorClass} text-white shadow-xs group-hover:scale-105 transition-transform`}>
                        <Icon size={18} />
                    </div>
                    <span className="text-xs font-bold text-slate-700">{label}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-slate-800">{value}</span>
                    {subValue && <span className="text-[10px] text-slate-500 font-semibold">{subValue}</span>}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-6xl mx-auto rounded-3xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-200/80 border border-slate-200 shadow-xl p-4 md:p-8">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                {/* Profile & SVG Donut Chart */}
                <div className="print:hidden relative flex-shrink-0 flex items-center justify-center">
                    <svg className="w-56 h-56 transform -rotate-90">
                        <circle
                            cx="112"
                            cy="112"
                            r={donutRadius}
                            className="text-slate-200"
                            strokeWidth="14"
                            stroke="currentColor"
                            fill="transparent"
                        />
                        {/* Present Arc */}
                        <circle
                            cx="112"
                            cy="112"
                            r={donutRadius}
                            className="text-teal-600 transition-all duration-700"
                            strokeWidth="14"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference - presentDash}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                        />
                        {/* Leave Arc */}
                        <circle
                            cx="112"
                            cy="112"
                            r={donutRadius}
                            className="text-amber-500 transition-all duration-700"
                            strokeWidth="14"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference - (presentDash + leaveDash)}
                            stroke="currentColor"
                            fill="transparent"
                        />
                    </svg>

                    <div className="absolute w-36 h-36 rounded-full overflow-hidden border-4 border-white shadow-md">
                        <img
                            src={employee?.profileimage || employepic}
                            alt={employee?.name || employee?.userid?.name || "Employee"}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="flex-grow w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <StatCard
                            icon={Calendar}
                            label="Total Days"
                            value={total}
                            colorClass="bg-indigo-600"
                        />
                        <StatCard
                            icon={CheckCircle}
                            label="Present"
                            value={`${hell?.present?.length || 0} Days`}
                            subValue={perc.present ? `${perc.present}% Attendance` : ""}
                            colorClass="bg-teal-700"
                        />
                        <StatCard
                            icon={Briefcase}
                            label="Leaves"
                            value={hell?.leave?.length || 0}
                            colorClass="bg-amber-600"
                        />
                        <StatCard
                            icon={UserX}
                            label="Absent"
                            value={hell?.absent?.length || 0}
                            colorClass="bg-rose-600"
                        />
                        <StatCard
                            icon={Clock}
                            label="Overtime"
                            value={`${hell?.overtime?.length || 0} Records`}
                            subValue={hell?.overtimemin > 0 ? `OT ${hell.overtimemin} min | Net ${(hell?.overtimemin || 0) - (hell?.shorttimemin || 0)} min | ₹${hell?.overtimesalary || 0}` : ""}
                            colorClass="bg-emerald-600"
                            tooltipText={`Salary: ${employee?.salary || 0} ₹ | Net Time: ${(hell?.overtimemin || 0) - (hell?.shorttimemin || 0)} min | Payout: ${hell?.overtimesalary || 0} ₹`}
                        />
                        <StatCard
                            icon={Minimize2}
                            label="Short Time"
                            value={`${hell?.short?.length || 0} Records`}
                            subValue={hell?.shorttimemin > 0 ? `${hell.shorttimemin} Min Total` : ""}
                            colorClass="bg-orange-500"
                        />
                        <StatCard
                            icon={CalendarDays}
                            label="Work On Weekly Off"
                            value={`${hell?.weeklyoffwork?.length || 0} Days`}
                            subValue={hell?.weeklyoffworkmin > 0 ? formatMinToHours(hell.weeklyoffworkmin) : ""}
                            colorClass="bg-purple-600"
                        />
                        <StatCard
                            icon={LogIn}
                            label="Late Arrival"
                            value={hell?.latearrival?.length || 0}
                            colorClass="bg-amber-500"
                        />
                        <StatCard
                            icon={LogOut}
                            label="Early Exit"
                            value={hell?.earlyLeave?.length || 0}
                            colorClass="bg-orange-600"
                        />
                        <StatCard
                            icon={ArrowLeftCircle}
                            label="Early Arrival"
                            value={hell?.earlyarrival?.length || 0}
                            colorClass="bg-sky-600"
                        />
                        <StatCard
                            icon={ArrowRightCircle}
                            label="Late Exit"
                            value={hell?.lateleave?.length || 0}
                            colorClass="bg-indigo-700"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeProfileCard;
