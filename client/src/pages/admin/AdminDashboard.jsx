import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from "react-router-dom";
import DashboardCard from '../../components/dashboardCard';
import { toast } from '../../utils/toast';
import { User, Search, Users, Filter } from 'lucide-react';
import dayjs from 'dayjs';
import { FirstFetch, updateAttendance, setEmployees } from '../../../store/userSlice';
import OfficialNoticeBoard from '../../components/notice';
import { cloudinaryUrl } from '../../utils/imageurlsetter';
import { apiClient } from '../../utils/apiClient';
import { EmployeeAttendanceSkeleton } from '../../components/skeletons';

const Main = () => {
  const { attandence, employee, branch, department, notices } = useSelector((state) => state.user);
  const { islogin } = useSelector((state) => state.auth);
  const [currentpresent, setcurrentpresent] = useState([]);
  const [todaypresent, settodaypresent] = useState([]);
  const [todayabsent, settodayabsent] = useState([]);
  const [todayleave, settodayleave] = useState([]);
  let navigate = useNavigate();
  const dispatch = useDispatch();
  const attandenceRef = useRef(attandence);
  const [branc, setbranc] = useState('all');
  const [depfilter, setdepfilter] = useState('all');
  const [employeelist, setemployeelist] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  useEffect(() => {
    !islogin && navigate('/login');
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoadingDashboard(true);
      const [empData, attData] = await Promise.all([
        apiClient({ url: 'getemployee' }),
        apiClient({ url: 'attandence/list', params: { date: dayjs().format('YYYY-MM-DD') } })
      ]);
      if (Array.isArray(empData)) dispatch(setEmployees(empData));
      if (Array.isArray(attData?.data)) dispatch(updateAttendance(attData.data));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const isLoadingData = loadingDashboard || !employee;

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

  const handleSaveNotice = async (formData) => {
    try {
      const response = await apiClient({
        url: 'notices',
        method: 'POST',
        data: formData
      });
      if (response.success) {
        toast.success(response.message || 'Notice published successfully');
        dispatch(FirstFetch());
      }
    } catch (err) {
      toast.error(err.message || 'Failed to publish notice');
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    try {
      const response = await apiClient({
        url: `notices/${noticeId}`,
        method: 'DELETE'
      });
      if (response.success) {
        toast.success(response.message || 'Notice deleted successfully');
        dispatch(FirstFetch());
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete notice');
    }
  };

  useEffect(() => {
    let cp = [];
    let ta = [];
    let tp = [];
    let tl = [];

    const todayKey = dayjs().format('YYYY-MM-DD');

    attandence?.forEach(e => {
      // Ensure we only count records for today (date is stored at UTC midnight for that calendar day)
      const recordDateKey = e.date ? dayjs(e.date).format('YYYY-MM-DD') : null;
      if (recordDateKey !== todayKey) return;

      if (e.status === 'absent') {
        ta.push(e);
      }
      if (e.status === 'leave') {
        tl.push(e);
      }
      if (e.status === 'present' || e.status === 'halfday') {
        tp.push(e);
        if (e.punchIn && !e.punchOut) {
          cp.push(e);
        }
      }
    });

    setcurrentpresent(cp);
    settodayabsent(ta);
    settodaypresent(tp);
    settodayleave(tl);
  }, [attandence]);

  return (
    <div className='p-0 md:p-3 max-w-7xl mx-auto space-y-4'>
      <div className="mb-3">
        <DashboardCard employee={employee} todayleave={todayleave.length + todayabsent.length} todaypresent={todaypresent.length} currentpresent={currentpresent.length} />
      </div>

      <div className='w-full flex-col flex gap-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs'>
        {/* Filter Controls */}
        <div className='flex flex-wrap items-center gap-3'>
          <div className="relative">
            <select
              value={branc}
              onChange={(e) => setbranc(e.target.value)}
              className="h-10 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-teal-600 cursor-pointer"
            >
              <option value="all">All Branches</option>
              {branch?.map((list) => (
                <option key={list._id} value={list._id}>{list.name}</option>
              ))}
            </select>
          </div>

          <div className="relative">
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
          </div>

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
        {isLoadingData ? (
          <EmployeeAttendanceSkeleton count={20} />
        ) : (
          <div className="px-1 md:px-3 grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3 md:gap-4">
            {employeelist
              ?.filter((e) => e.status !== false)
              .map((emp) => {
                const isPresent = currentpresent.some(
                  (att) => att.employeeId?._id === emp?._id
                );
                const isAbsent = todayabsent.some(
                  (att) => att.employeeId?._id === emp?._id
                );
                const isLeave = todayleave.find(
                  (att) => att.employeeId?._id === emp?._id
                );
                const todaypresente = todaypresent.find(
                  (att) => att.employeeId?._id === emp?._id
                );

                const getStatusBorder = () => {
                  if (isAbsent || isLeave) return 'border-rose-500';
                  if (isPresent) return 'border-emerald-500';
                  if (todaypresente) return 'border-amber-400';
                  return 'border-slate-300';
                };

                const getStatusText = () => {
                  if (isAbsent || isLeave) return 'text-rose-600';
                  if (isPresent) return 'text-emerald-600';
                  if (todaypresente) return 'text-amber-700';
                  return 'text-slate-500';
                };

                return (
                  <div
                    key={emp._id}
                    className="flex flex-col items-center group relative cursor-pointer"
                    title={`${emp?.userid?.name || 'Employee'} - ${
                      isAbsent ? 'Absent' : isLeave ? `On Leave (${isLeave?.leave?.reason || ''})` : todaypresente ? `In: ${todaypresente.punchIn ? dayjs(todaypresente.punchIn).format('hh:mm A') : '-:-'} | Out: ${todaypresente.punchOut ? dayjs(todaypresente.punchOut).format('hh:mm A') : '-:-'}` : 'No Status'
                    }`}
                  >
                    <span className={`${getStatusBorder()} p-[2px] border-2 rounded-full transition-transform group-hover:scale-105`}>
                      {emp?.profileimage ? (
                        <img
                          src={cloudinaryUrl(emp?.profileimage, {
                            format: "webp",
                            width: 80,
                            height: 80,
                          })}
                          alt={emp.employeename}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <User size={16} />
                        </div>
                      )}
                    </span>

                    <p className={`${getStatusText()} text-[11px] font-semibold text-center truncate w-full mt-1`}>
                      {emp?.userid?.name}
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
        )}

        {/* Legend */}
        <div className='flex gap-5 flex-wrap pt-2 border-t border-slate-100'>
          <span className='flex items-center gap-1.5 text-emerald-600 text-xs font-semibold'>
            <span className='block w-2.5 h-2.5 rounded-full bg-emerald-500'></span> Currently In Premise
          </span>
          <span className='flex items-center gap-1.5 text-amber-700 text-xs font-semibold'>
            <span className='block w-2.5 h-2.5 rounded-full bg-amber-500'></span> Present
          </span>
          <span className='flex items-center gap-1.5 text-rose-500 text-xs font-semibold'>
            <span className='block w-2.5 h-2.5 rounded-full bg-rose-500'></span> Leave/Absent
          </span>
          <span className='flex items-center gap-1.5 text-slate-400 text-xs font-semibold'>
            <span className='block w-2.5 h-2.5 rounded-full bg-slate-400'></span> No status
          </span>
        </div>
      </div>

      <div className='mt-3 hidden'>
        <OfficialNoticeBoard
          notices={notices}
          onSave={handleSaveNotice}
          onDelete={handleDeleteNotice}
          employees={employee}
        />
      </div>
    </div>
  );
};

export default Main;
