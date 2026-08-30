import { Building2, Clock, Users, Briefcase } from "lucide-react";

const DashboardCard = ({ employee, todaypresent, currentpresent, todayleave }) => {
    return (
        <div className="car grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6">
            <div className="relative px-1 md:px-4 py-1 md:py-2 shadow flex-1 flex-col bg-white rounded overflow-hidden">
                {/* Left color strip */}
                <div className={`absolute left-0 top-0 h-full w-1 bg-slate-600 rounded-l`} />

                <div className="flex items-center gap-3 pl-2">
                    <span className={`p-2 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center`}>
                        <Users size={18} />
                    </span>
                    <div className="text-gray-600 font-bold text-[12px] md:text-[16px]">Total Employee</div>
                </div>

                <div className="details px-2">
                    <p className="text-[22px] md:text-[28px] text-slate-800 font-bold mt-1 md:mt-2">{employee?.filter(e => e.status)?.length || 0}</p>
                </div>
            </div>
            <div className="relative px-1 md:px-4 py-1 md:py-2 shadow flex-1 flex-col bg-white rounded overflow-hidden">
                {/* Left color strip */}
                <div className={`absolute left-0 top-0 h-full w-1 bg-green-600 rounded-l`} />

                <div className="flex items-center gap-3 pl-2">
                    <span className={`p-2 bg-green-100 text-green-700 rounded-full flex items-center justify-center`}>
                        <Clock size={18} />
                    </span>
                    <div className="text-gray-600 font-bold text-[12px] md:text-[16px]">Today Present</div>
                </div>

                <div className="details px-2">
                    <p className="text-[22px] md:text-[28px] text-slate-800 font-bold mt-1 md:mt-2">{todaypresent}</p>
                </div>
            </div>
            <div className="relative px-1 md:px-4 py-1 md:py-2 shadow flex-1 flex-col bg-white rounded overflow-hidden">
                {/* Left color strip */}
                <div className={`absolute left-0 top-0 h-full w-1 bg-amber-600 rounded-l`} />

                <div className="flex items-center gap-3 pl-2">
                    <span className={`p-2 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center`}>
                        <Briefcase size={18} />
                    </span>
                    <div className="text-gray-600 font-bold text-[12px] md:text-[16px]">On leave</div>
                </div>

                <div className="details px-2">
                    <p className="text-[22px] md:text-[28px] text-slate-800 font-bold mt-1 md:mt-2">{todayleave}</p>
                </div>
            </div>
            <div className="relative px-1 md:px-4 py-1 md:py-2 shadow flex-1 flex-col bg-white rounded overflow-hidden">
                {/* Left color strip */}
                <div className={`absolute left-0 top-0 h-full w-1 bg-violet-600 rounded-l`} />

                <div className="flex items-center gap-3 pl-2">
                    <span className={`p-2 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center`}>
                        <Building2 size={18} />
                    </span>
                    <div className="text-gray-600 font-bold text-[12px] md:text-[16px]">In office</div>
                </div>

                <div className="details px-2">
                    <p className="text-[22px] md:text-[28px] text-slate-800 font-bold mt-1 md:mt-2">{currentpresent}</p>
                </div>
            </div>
        </div>
    )
}

export default DashboardCard
