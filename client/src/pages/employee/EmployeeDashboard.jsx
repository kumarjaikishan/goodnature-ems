import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import HolidayCalander from '../holidays/holidayCalander';
import dayjs from 'dayjs';
import OfficialNoticeBoard from '../../components/notice';
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { motion } from 'framer-motion';
import {
  MdWavingHand,
  MdLogin,
  MdLogout,
  MdEventAvailable,
  MdCalendarMonth,
  MdInfo
} from 'react-icons/md';
import { Avatar, Tooltip } from '@mui/material';

dayjs.extend(isSameOrBefore);

const EmployeeDashboard = () => {
  const { attendance, companysetting, holiday, notices, profile, leave } = useSelector((state) => state.employee);
  const [holidaylist, setholidaylist] = useState(null);
  const [currentTime, setCurrentTime] = useState(dayjs());

  const weeklyOffs = companysetting?.weeklyOffs || [1];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (holiday) {
      const dateObjects = [];
      holiday.forEach(h => {
        let current = dayjs(h.fromDate);
        const end = h.toDate ? dayjs(h.toDate) : current;
        while (current.isSameOrBefore(end, 'day')) {
          dateObjects.push({ date: current.format('YYYY-MM-DD'), name: h.name });
          current = current.add(1, 'day');
        }
      });
      setholidaylist(dateObjects);
    }
  }, [holiday]);

  // Highlighted dates for the calendar
  const highlightedDates = useMemo(() => holidaylist?.map(dateObj => ({
    date: dayjs(dateObj.date),
    name: dateObj.name
  })) || [], [holidaylist]);

  // Today's Stats
  const todayAttendance = useMemo(() =>
    attendance?.find(a => dayjs(a.date).startOf('day').isSame(dayjs().startOf('day'))),
    [attendance]);

  // Monthly Stats
  const monthlyStats = useMemo(() => {
    const currentMonth = dayjs().month();
    const currentYear = dayjs().year();
    const monthRecords = attendance?.filter(a => {
      const d = dayjs(a.date);
      return d.month() === currentMonth && d.year() === currentYear;
    }) || [];

    return {
      present: monthRecords.filter(a => a.status === 'present').length,
      absent: monthRecords.filter(a => a.status === 'absent').length,
      onLeave: monthRecords.filter(a => a.status === 'leave').length,
    };
  }, [attendance]);

  // Next Holiday
  const nextHoliday = useMemo(() => {
    if (!holiday) return null;
    const future = holiday
      .filter(h => dayjs(h.fromDate).isAfter(dayjs(), 'day'))
      .sort((a, b) => dayjs(a.fromDate).unix() - dayjs(b.fromDate).unix());
    return future[0] || null;
  }, [holiday]);

  const greeting = () => {
    const hour = dayjs().hour();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8 bg-gray-50/50 min-h-screen">
      {/* Header Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-5">
          <Avatar
            src={profile?.profileimage}
            sx={{ width: 80, height: 80, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', border: '4px solid white' }}
          />
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              {greeting()}, {profile?.userid?.name?.split(' ')[0]} <MdWavingHand className="text-amber-400 animate-bounce" />
            </h1>
            <p className="text-gray-500 font-medium">{profile?.designation || 'Team Member'} • {profile?.empId}</p>
          </div>
        </div>
        <div className="text-left md:text-right bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center min-w-[200px]">
          <p className="text-sm font-bold text-teal-600 uppercase tracking-widest">{currentTime.format('dddd')}</p>
          <p className="text-2xl font-black text-gray-800">{currentTime.format('hh:mm:ss A')}</p>
          <p className="text-xs text-gray-400 font-medium">{currentTime.format('DD MMM YYYY')}</p>
        </div>
      </motion.div>

      {/* Stats Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Today's Punch */}
        <motion.div variants={itemVariants} className="bg-white p-5 rounded-3xl shadow-lg border border-white hover:shadow-xl transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-teal-50 rounded-2xl text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <MdLogin size={24} />
            </div>
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Today's Presence</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-gray-50 p-2 rounded-xl">
              <span className="text-xs font-bold text-gray-500">Punch In</span>
              <span className="text-sm font-black text-teal-700">{todayAttendance?.punchIn ? dayjs(todayAttendance.punchIn).format('hh:mm A') : '--:--'}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-50 p-2 rounded-xl">
              <span className="text-xs font-bold text-gray-500">Punch Out</span>
              <span className="text-sm font-black text-orange-600">{todayAttendance?.punchOut ? dayjs(todayAttendance.punchOut).format('hh:mm A') : '--:--'}</span>
            </div>
          </div>
        </motion.div>

        {/* Monthly Summary */}
        <motion.div variants={itemVariants} className="bg-white p-5 rounded-3xl shadow-lg border border-white hover:shadow-xl transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <MdCalendarMonth size={24} />
            </div>
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{dayjs().format('MMMM')} Overview</span>
          </div>
          <div className="flex justify-around items-center h-[70px]">
            <div className="text-center">
              <p className="text-2xl font-black text-indigo-700">{monthlyStats.present}</p>
              <p className="text-[9px] font-bold uppercase text-gray-400">Present</p>
            </div>
            <div className="w-[1px] h-8 bg-gray-100"></div>
            <div className="text-center">
              <p className="text-2xl font-black text-rose-500">{monthlyStats.absent}</p>
              <p className="text-[9px] font-bold uppercase text-gray-400">Absent</p>
            </div>
            <div className="w-[1px] h-8 bg-gray-100"></div>
            <div className="text-center">
              <p className="text-2xl font-black text-amber-500">{monthlyStats.onLeave}</p>
              <p className="text-[9px] font-bold uppercase text-gray-400">On Leave</p>
            </div>
          </div>
        </motion.div>

        {/* Leave Balance */}
        <motion.div variants={itemVariants} className="bg-white p-5 hidden rounded-3xl shadow-lg border border-white hover:shadow-xl transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <MdEventAvailable size={24} />
            </div>
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Leave Quota</span>
          </div>
          <div className="flex flex-col justify-center h-[70px]">
            <p className="text-3xl font-black text-emerald-700">
              {leave ? leave.reduce((acc, curr) => acc + (curr.remaining || 0), 0) : 0}
              <span className="text-lg text-gray-300 font-bold ml-1">Days</span>
            </p>
            <p className="text-xs text-gray-400 font-medium">Available across all policies</p>
          </div>
        </motion.div>

        {/* Next Holiday */}
        <motion.div variants={itemVariants} className="bg-gradient-to-br hidden from-amber-500 to-orange-600 p-5 rounded-3xl shadow-lg border-none hover:shadow-orange-200 transition-all group overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/20 rounded-2xl text-white">
                <MdEventAvailable size={24} />
              </div>
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Next Break</span>
            </div>
            <div className="h-[70px] flex flex-col justify-center text-white">
              <p className="text-xl font-black truncate">{nextHoliday?.name || 'No upcoming holidays'}</p>
              <p className="text-[10px] font-medium opacity-80">
                {nextHoliday ? `${dayjs(nextHoliday.fromDate).format('DD MMMM')} (In ${dayjs(nextHoliday.fromDate).diff(dayjs(), 'day')} days)` : '-'}
              </p>
            </div>
          </div>
          <MdEventAvailable className="absolute -right-4 -bottom-4 text-white/10 text-8xl rotate-12" />
        </motion.div>
      </motion.div>

      {/* Main Content Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col lg:flex-row gap-8"
      >
        {/* Left: Calendar Component */}
        <motion.div variants={itemVariants} className=" border-2 border-gray-200 bg-white  rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="p-6 pb-0 flex items-center gap-2 border-b border-gray-50 mb-2">
            <MdCalendarMonth className="text-2xl text-teal-600" />
            <h2 className="text-lg font-bold text-gray-800 underline decoration-teal-200 underline-offset-8">Holiday & Calendar</h2>
          </div>
          <div className="flex justify-center p-2">
            <HolidayCalander title={false} highlightedDates={highlightedDates} weeklyOffs={weeklyOffs} />
          </div>
        </motion.div>

        {/* Right: Notice Board */}
        <motion.div variants={itemVariants} className="lg:w-[400px] hidden">
          <OfficialNoticeBoard notices={notices} />
        </motion.div>
      </motion.div>

      {/* Quick Tips/Info Section */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="bg-amber-50 hidden rounded-2xl p-4 border border-amber-100 flex items-center gap-3"
      >
        <div className="bg-amber-200/50 p-2 rounded-xl text-amber-700">
          <MdInfo size={20} />
        </div>
        <p className="text-sm font-medium text-amber-900">
          <span className="font-bold">Pro Tip:</span> Always check the notice board for urgent updates regarding company policies and upcoming events!
        </p>
      </motion.div>
    </div>
  );
};

export default EmployeeDashboard;
