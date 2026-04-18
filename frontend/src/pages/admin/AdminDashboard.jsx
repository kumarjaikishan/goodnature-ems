import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import DashboardCard from '../../components/dashboardCard';
import { toast } from 'react-toastify';
import { FaBuilding, FaRegUser, FaSearch, FaTachometerAlt, FaUsers } from 'react-icons/fa'
import dayjs from 'dayjs';
import { FirstFetch, updateAttendance } from '../../../store/userSlice';
import { Avatar, FormControl, InputAdornment, InputLabel, MenuItem, OutlinedInput, Select, Tooltip, Typography } from '@mui/material';
import { CiFilter } from 'react-icons/ci';
import OfficialNoticeBoard from '../../components/notice';
import { cloudinaryUrl } from '../../utils/imageurlsetter';
import { apiClient } from '../../utils/apiClient';
import { CgLayoutGrid } from 'react-icons/cg';


const Main = () => {

  const { attandence, employee, branch, department, notices } = useSelector((state) => state.user);
  const { islogin, isadmin } = useSelector((state) => state.auth);
  const [currentpresent, setcurrentpresent] = useState([]);
  const [todaypresent, settodaypresent] = useState([])
  const [todayabsent, settodayabsent] = useState([])
  const [todayleave, settodayleave] = useState([])
  let navigate = useNavigate();
  const dispatch = useDispatch();
  const attandenceRef = useRef(attandence);
  const [branc, setbranc] = useState('all');
  const [depfilter, setdepfilter] = useState('all');
  const [employeelist, setemployeelist] = useState([])
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    !islogin && navigate('/login');
  }, [])

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
    setdepfilter('all')
  }, [branc]);

  useEffect(() => {
    attandenceRef.current = attandence;
  }, [attandence]);

  useEffect(() => {
    // console.log("attandence", attandence)
    // console.log("employee", employee)
    // console.log("currentPresent", currentpresent)
    // console.log("department", attandence)
    if (!attandence) return;
    let todaysAttendance = attandence.filter(val => dayjs(val.date).isSame(dayjs(), 'day'));
    // console.log(todaysAttendance)
    let currentPresent = todaysAttendance?.filter((val) => {
      return !val.punchOut && val.status !== 'absent' && val.status !== 'leave'
    })
    let todaypresent = todaysAttendance?.filter((val) => {
      return val.status == 'present'
    })
    let todayabsent = todaysAttendance?.filter((val) => {
      return val.status == 'absent'
    })
    let todayleave = todaysAttendance?.filter((val) => {
      return val.status == 'leave'
    })
    // console.log("today present",todaypresent,todayabsent,todayleave)
    setcurrentpresent(currentPresent);
    settodaypresent(todaypresent)
    settodayabsent(todayabsent)
    settodayleave(todayleave)
  }, [attandence])

  // SSE logic removed as it is now handled globally in App.jsx

  const handleSaveNotice = async (noticeData) => {
    try {
      const payload = {
        title: noticeData.title,
        message: noticeData.message,
        date: noticeData.date,
        employeeType: noticeData.employeeType,
        noticeType: noticeData.noticeType,
      };

      if (noticeData.employeeType === 'Individual' && noticeData.targetEmployeeId) {
        payload.targetEmployeeId = noticeData.targetEmployeeId;
      }

      if (noticeData._id) {
        await apiClient({
          url: `notice/${noticeData._id}`,
          method: 'PUT',
          body: payload
        });
        toast.success('Notice updated successfully');
      } else {
        await apiClient({
          url: 'notice',
          method: 'POST',
          body: payload
        });
        toast.success('Notice created successfully');
      }
      dispatch(FirstFetch());
    } catch (error) {
      toast.error(error.message || 'Failed to save notice');
    }
  };

  const handleDeleteNotice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await apiClient({
        url: `notice/${id}`,
        method: 'DELETE'
      });
      toast.success('Notice deleted successfully');
      dispatch(FirstFetch());
    } catch (error) {
      toast.error(error.message || 'Failed to delete notice');
    }
  };


  return (
    <div className='p-0 md:p-3 max-w-7xl mx-auto'>
      <div className="mb-3 ">
        {/* <h3 className='mb-3 text-xl font-semibold capitalize'>Dashboar overview</h3> */}
        <DashboardCard employee={employee} todayleave={todayleave.length + todayabsent.length} todaypresent={todaypresent.length} currentpresent={currentpresent.length} />
      </div>

      <div className='w-full flex-col flex gap-5 shadow  bg-white p-2 rounded'>
        <div className='flex gap-3 pt-3'>
          <FormControl sx={{ width: '160px' }} required size="small">
            <InputLabel id="demo-simple-select-helper-label">Branch</InputLabel>
            <Select
              value={branc}
              input={
                <OutlinedInput
                  startAdornment={
                    <InputAdornment position="start">
                      <CiFilter fontSize="small" />
                    </InputAdornment>
                  }
                  label="branch"
                />
              }
              onChange={(e) => setbranc(e.target.value)}
            >
              <MenuItem selected value={'all'}>All</MenuItem>
              {branch?.length > 1 ? branch?.map((list) => (
                <MenuItem key={list._id} value={list._id}>{list.name}</MenuItem>
              )) :
                <MenuItem disabled value={""}>No Branch Found</MenuItem>
              }
            </Select>
          </FormControl>
          <FormControl sx={{ width: '160px' }} required size="small">
            <InputLabel id="demo-simple-select-helper-label">Department</InputLabel>
            <Select
              disabled={branc == 'all'}
              value={depfilter}
              input={
                <OutlinedInput
                  startAdornment={
                    <InputAdornment position="start">
                      <CiFilter fontSize="small" />
                    </InputAdornment>
                  }
                  label="Department"
                />
              }
              onChange={(e) => setdepfilter(e.target.value)}
            >
              <MenuItem selected value={'all'}>All</MenuItem>
              {department?.length > 1 ? department.filter(e => e.branchId._id == branc)?.map((val) => (
                <MenuItem key={val._id} value={val._id}>{val.department}</MenuItem>
              )) : (
                <MenuItem disabled value={''}>No Department Found</MenuItem>
              )}
            </Select>
          </FormControl>
          <FormControl sx={{ flex: 1, maxWidth: '300px' }} size="small">
            <OutlinedInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee..."
              startAdornment={
                <InputAdornment position="start">
                  <FaSearch fontSize="small" color="#94a3b8" />
                </InputAdornment>
              }
            />
          </FormControl>
        </div>

        <div className="px-1 md:px-3 grid grid-cols-5 md:grid-cols-10 lg:grid-cols-13 gap-2 md:gap-4">
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
              {/* console.log(emp.empId, isPresent, isAbsent, isLeave, todaypresente)  */ }

              return (
                <Tooltip
                  arrow
                  enterDelay={800}
                  key={emp._id}
                  placement="top"
                  title={
                    <div className="flex flex-col">
                      {isAbsent && <span>Absent</span>}
                      {isLeave && <>
                        <span>on Leave</span>
                        <span>{isLeave?.leave?.reason}</span>
                      </>
                      }
                      {(!isAbsent && !isLeave) && <>
                        <span>
                          In &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{" "}
                          {todaypresente?.punchIn
                            ? dayjs(todaypresente.punchIn).format("hh:mm A")
                            : " -:-"}
                        </span>
                        <span>
                          Out &nbsp;&nbsp;&nbsp;
                          {todaypresente?.punchOut
                            ? dayjs(todaypresente.punchOut).format("hh:mm A")
                            : "-:-"}
                        </span>
                      </>}
                    </div>
                  }
                >
                  <div className="flex flex-col items-center cursor-help ">
                    <span
                      className={`${isAbsent || isLeave
                        ? "border-red-500"
                        : isPresent
                          ? "border-green-500"
                          : todaypresente
                            ? "border-amber-400"
                            : "border-gray-300"
                        } p-[2px] border-3 rounded-full`}
                    >
                      <Avatar
                        src={cloudinaryUrl(emp?.profileimage, {
                          format: "webp",
                          width: 100,
                          height: 100,
                        })}
                        alt={emp.employeename}
                      >
                        {!emp.profileimage && <FaRegUser />}
                      </Avatar>
                    </span>


                    <p
                      className={`${isAbsent || isLeave
                        ? "text-red-600 text-[14px]"
                        : isPresent
                          ? "text-green-600 text-[14px]"
                          : todaypresente
                            ? "text-amber-700"
                            : "text-gray-500"
                        } text-[12px] text-center transition-all duration-300 capitalize`}
                    >
                      {emp?.userid?.name}
                    </p>

                  </div>
                </Tooltip>
            );
          })}
          {(!employeelist || employeelist.filter(e => e.status !== false).length === 0) && (
            <div className="col-span-full py-10 flex flex-col items-center justify-center text-gray-400">
              <FaUsers size={40} className="mb-2 opacity-20" />
              <Typography variant="body2">No employee found</Typography>
            </div>
          )}
        </div>

        <div className='flex gap-5 flex-wrap'>
          <span className='flex items-center gap-1 text-green-500 text-[13px] '>
            <span className='block w-[15px] rounded-3xl h-[15px] bg-green-500 '></span> Currently In Premise
          </span>
          <span className='flex items-center gap-1 text-amber-700 text-[13px]'>
            <span className='block w-[15px] rounded-3xl h-[15px] bg-amber-500 '></span> Present
          </span>
          <span className='flex items-center gap-1 text-red-500 text-[13px]'>
            <span className='block w-[15px] rounded-3xl h-[15px] bg-red-500  '></span> Leave/Absent
          </span>
          <span className='flex items-center gap-1 text-gray-500 text-[13px]'>
            <span className='block w-[15px] rounded-3xl h-[15px] bg-gray-500  '></span> No status
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

      {/* <div className="leaveDetail">
        <h3>Leave Details</h3>
        <DashboardCard todaypresent={todaypresent.length} currentpresent={currentpresent.length} />
      </div> */}
    </div>
  )
}

export default Main
