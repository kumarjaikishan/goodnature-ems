import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from "react-router-dom";
import DashboardCard from '../../components/dashboardCard';
import dayjs from 'dayjs';
import { FirstFetch } from '../../../store/userSlice';
import { Search, User, Users } from 'lucide-react';
import { cloudinaryUrl } from '../../utils/imageurlsetter';

const ManagerDashboard = () => {
  const { attandence, employee, branch, department, profile } = useSelector((state) => state.user);
  const { islogin } = useSelector((state) => state.auth);
  const [currentpresent, setcurrentpresent] = useState([]);
  const [todaypresent, settodaypresent] = useState([]);
  let navigate = useNavigate();
  const dispatch = useDispatch();
  const attandenceRef = useRef(attandence);
  const [branc, setbranc] = useState('all');
  const [depfilter, setdepfilter] = useState('all');
  const [employeelist, setemployeelist] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    !islogin && navigate('/login');
  }, []);

  useEffect(() => {
    if (!employee || employee.length === 0) return;

    const filtered = employee.filter(dep => {
      const matchBranch =
        branc === 'all' || dep.branchId === branc;
      const matchdepart =
        depfilter === 'all' || dep.department._id === depfilter;
      const matchSearch = 
        searchQuery === '' || dep?.userid?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchBranch && matchdepart && matchSearch;
    });

    setemployeelist(filtered);
  }, [branc, depfilter, employee, searchQuery]);

  useEffect(() => {
    setdepfilter('all');
  }, [branc]);

  useEffect(() => {
    attandenceRef.current = attandence;
  }, [attandence]);

  useEffect(() => {
    if (!attandence) return;
    let currentPresent = attandence.filter((val) => {
      return dayjs(val.date).isSame(dayjs(), 'day') && !val.punchOut;
    });
    let todaypresentList = attandence.filter((val) => {
      return dayjs(val.date).isSame(dayjs(), 'day');
    });
    setcurrentpresent(currentPresent);
    settodaypresent(todaypresentList);
  }, [attandence]);

  return (
    <div className='p-0 md:p-3 space-y-4 max-w-7xl mx-auto'>
      <div className="mb-3">
        <DashboardCard employee={employee} todaypresent={todaypresent.length} currentpresent={currentpresent.length} />
      </div>

      <div className='w-full flex-col flex gap-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs'>
        {/* Filters */}
        <div className='flex flex-wrap items-center gap-3'>
          <select
            value={branc}
            onChange={(e) => setbranc(e.target.value)}
            className="h-10 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-teal-600 cursor-pointer"
          >
            <option value="all">All Branches</option>
            {branch?.filter(e => profile?.branchIds?.includes(e._id))?.map((list) => (
              <option key={list._id} value={list._id}>{list.name}</option>
            ))}
          </select>

          <select
            disabled={branc === 'all'}
            value={depfilter}
            onChange={(e) => setdepfilter(e.target.value)}
            className="h-10 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-teal-600 disabled:opacity-50 cursor-pointer"
          >
            <option value="all">All Departments</option>
            {department?.filter(e => (e.branchId?._id || e.branchId) === branc)?.map((val) => (
              <option key={val._id} value={val._id}>{val.department}</option>
            ))}
          </select>

          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee..."
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-none focus:border-teal-600"
            />
          </div>
        </div>

        {/* Employee Presence Grid */}
        <div className='grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3 md:gap-4'>
          {employeelist?.filter((e) => e.status !== false)?.map((emp) => {
            const isPresent = currentpresent.some(att => att.employeeId?._id === emp._id);
            const todaypresente = todaypresent.find(att => att.employeeId?._id === emp._id);

            const getBorderColor = () => {
              if (isPresent) return 'border-emerald-500';
              if (todaypresente) return 'border-amber-400';
              return 'border-slate-300';
            };

            const getTextColor = () => {
              if (isPresent) return 'text-emerald-600';
              if (todaypresente) return 'text-amber-700';
              return 'text-slate-500';
            };

            return (
              <div
                key={emp._id}
                className="flex flex-col items-center group relative cursor-pointer"
                title={`${emp.userid?.name || 'Employee'} - In: ${todaypresente?.punchIn ? dayjs(todaypresente.punchIn).format('hh:mm A') : '-:-'} | Out: ${todaypresente?.punchOut ? dayjs(todaypresente.punchOut).format('hh:mm A') : '-:-'}`}
              >
                <span className={`${getBorderColor()} p-[2px] border-2 rounded-full transition-transform group-hover:scale-105`}>
                  {emp.profileimage ? (
                    <img
                      src={cloudinaryUrl(emp.profileimage, {
                        format: "webp",
                        width: 80,
                        height: 80,
                      })}
                      alt={emp.employeename}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                      {emp.userid?.name?.charAt(0) || <User size={16} />}
                    </div>
                  )}
                </span>
                <p className={`${getTextColor()} text-[11px] font-semibold text-center truncate w-full mt-1 capitalize`}>
                  {emp.userid?.name}
                </p>
              </div>
            );
          })}
          {(!employeelist || employeelist.filter(e => e.status !== false).length === 0) && (
            <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-400">
              <Users size={40} className="mb-2 opacity-30" />
              <p className="text-xs font-medium">No employee found</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className='flex gap-5 flex-wrap pt-2 border-t border-slate-100'>
          <span className='flex items-center gap-1.5 text-emerald-600 text-xs font-semibold'>
            <span className='block w-2.5 h-2.5 rounded-full bg-emerald-500'></span> In Premise
          </span>
          <span className='flex items-center gap-1.5 text-amber-700 text-xs font-semibold'>
            <span className='block w-2.5 h-2.5 rounded-full bg-amber-500'></span> Present
          </span>
          <span className='flex items-center gap-1.5 text-slate-400 text-xs font-semibold'>
            <span className='block w-2.5 h-2.5 rounded-full bg-slate-400'></span> Absent / No status
          </span>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
