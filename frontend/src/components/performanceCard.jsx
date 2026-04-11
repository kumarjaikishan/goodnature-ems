import { useMemo } from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import {
    FaCalendarAlt,
    FaCheckCircle,
    FaSuitcase,
    FaUserSlash,
    FaClock,
    FaCompressAlt,
    FaSignInAlt,
    FaSignOutAlt,
    FaArrowCircleLeft,
    FaArrowCircleRight,
} from "react-icons/fa";
import { Tooltip } from "@mui/material";

const EmployeeProfileCard = ({ attandence, employee, hell }) => {
    const employepic = 'https://res.cloudinary.com/dusxlxlvm/image/upload/v1753113610/ems/assets/employee_fi3g5p.webp';

    const total = useMemo(() => 
        (hell?.present?.length || 0) + (hell?.absent?.length || 0) + (hell?.leave?.length || 0),
    [hell]);

    const perc = useMemo(() => ({
        present: total ? Math.floor((hell?.present?.length / total) * 100) : 0,
        absent: total ? Math.floor((hell?.absent?.length / total) * 100) : 0,
        leave: total ? Math.floor((hell?.leave?.length / total) * 100) : 0,
    }), [hell, total]);

    const chartData = useMemo(() => total
        ? [
            { id: 0, value: perc.present, color: "#008080", label: "Present" },
            { id: 1, value: perc.leave, color: "#f97316", label: "Leave" },
            { id: 2, value: perc.absent, color: "#94a3b8", label: "Absent" },
        ]
        : [{ id: 0, value: 100, color: "#cbd5e1", label: "No record" }],
    [total, perc]);

    const pieChartSize = typeof window !== 'undefined' && window.innerWidth < 640 ? 220 : 280;
    const pieRadius = typeof window !== 'undefined' && window.innerWidth < 640 ? { inner: 80, outer: 100 } : { inner: 105, outer: 125 };

    const StatCard = ({ icon: Icon, label, value, subValue, colorClass, tooltip }) => {
        const content = (
            <div className={`flex items-center justify-between p-3 rounded-2xl bg-white/60 backdrop-blur-md border border-white/40 shadow-sm hover:shadow-md transition-all duration-300 group`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${colorClass} text-white group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={18} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-base font-bold text-gray-800">{value}</span>
                    {subValue && <span className="text-[10px] text-gray-500 font-medium">{subValue}</span>}
                </div>
            </div>
        );

        return tooltip ? <Tooltip title={tooltip} arrow placement="top">{content}</Tooltip> : content;
    };

    return (
        <div className="w-full max-w-6xl mx-auto rounded-3xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-200 border border-white/50 shadow-2xl p-4 md:p-8">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                {/* Profile & Pie Chart Section */}
                <div className="relative flex-shrink-0 flex items-center justify-center group">
                    <div className="absolute inset-0 bg-white/30 blur-3xl rounded-full group-hover:bg-teal-500/10 transition-colors duration-700"></div>
                    <PieChart
                        series={[{
                            innerRadius: pieRadius.inner,
                            outerRadius: pieRadius.outer,
                            data: chartData,
                            paddingAngle: 2,
                            cornerRadius: 8,
                            highlightScope: { faded: 'global', highlighted: 'item' },
                            faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                        }]}
                        width={pieChartSize}
                        height={pieChartSize}
                        legend={{ hidden: true }}
                        className="drop-shadow-lg"
                    />
                    <div className="absolute w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] rounded-full overflow-hidden border-[6px] border-white shadow-inner transform transition-transform duration-500 group-hover:scale-105">
                        <img
                            src={employee?.profileimage || employepic}
                            alt={employee?.name || employee?.userid?.name || "Employee"}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Stats Grid Section */}
                <div className="flex-grow w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <StatCard 
                            icon={FaCalendarAlt} 
                            label="Total Days" 
                            value={total} 
                            colorClass="bg-indigo-500" 
                        />
                        <StatCard 
                            icon={FaCheckCircle} 
                            label="Present" 
                            value={`${hell?.present?.length || 0} Days`} 
                            subValue={perc.present ? `${perc.present}% Attendance` : ""}
                            colorClass="bg-teal-600" 
                        />
                        <StatCard 
                            icon={FaSuitcase} 
                            label="Leaves" 
                            value={hell?.leave?.length || 0} 
                            colorClass="bg-orange-500" 
                        />
                        <StatCard 
                            icon={FaUserSlash} 
                            label="Absent" 
                            value={hell?.absent?.length || 0} 
                            colorClass="bg-rose-500" 
                        />
                        <StatCard 
                            icon={FaClock} 
                            label="Overtime" 
                            value={`${hell?.overtime?.length || 0} Records`} 
                            subValue={hell?.overtimemin > 0 ? `${hell.overtimemin} min total` : ""}
                            colorClass="bg-green-600"
                            tooltip={hell?.overtimesalary > 0 ? (
                                <div className="p-2 space-y-1">
                                    <div className="flex justify-between gap-4"><span>Salary:</span> <b>{employee?.salary} ₹</b></div>
                                    <div className="flex justify-between gap-4"><span>Net Time:</span> <b>{(hell?.overtimemin || 0) - (hell?.shorttimemin || 0)} min</b></div>
                                    <div className="flex justify-between gap-4"><span>Payout:</span> <b>{hell?.overtimesalary || 0} ₹</b></div>
                                </div>
                            ) : null}
                        />
                        <StatCard 
                            icon={FaCompressAlt} 
                            label="Short Time" 
                            value={`${hell?.short?.length || 0} Records`} 
                            subValue={hell?.shorttimemin > 0 ? `${hell.shorttimemin} min total` : ""}
                            colorClass="bg-amber-500" 
                        />
                        <StatCard 
                            icon={FaSignInAlt} 
                            label="Late Arrival" 
                            value={hell?.latearrival?.length || 0} 
                            colorClass="bg-orange-400" 
                        />
                        <StatCard 
                            icon={FaSignOutAlt} 
                            label="Early Exit" 
                            value={hell?.earlyLeave?.length || 0} 
                            colorClass="bg-amber-600" 
                        />
                        <StatCard 
                            icon={FaArrowCircleLeft} 
                            label="Early Arrival" 
                            value={hell?.earlyarrival?.length || 0} 
                            colorClass="bg-sky-500" 
                        />
                        <StatCard 
                            icon={FaArrowCircleRight} 
                            label="Late Exit" 
                            value={hell?.lateleave?.length || 0} 
                            colorClass="bg-indigo-600" 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeProfileCard;
