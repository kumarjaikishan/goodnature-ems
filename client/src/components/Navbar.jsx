
import { useSelector, useDispatch } from 'react-redux';
import { Menu, User, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NotificationIcon } from './popover';
import { useLocation } from 'react-router-dom';
import { toogleextendedonMobile, tooglesidebar } from '../../store/userSlice';
import dayjs from 'dayjs';

const Navbar = () => {
  const location = useLocation();
  const [notificatione, setnotification] = useState([]);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const { notification, profile } = useSelector((state) => state.employee);
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();

  // Dynamic live time update every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (notification) {
      setnotification(notification)
    }
  }, [notification])

  const commonTitles = {
    "dashboard": "Dashboard",
    "employe": "Employee",
    "organization": "Organization",
    "permission": "Permission",
    "holiday": "Holiday",
    "ledger": "Ledger",
    "ledger/:id": "Ledger Detail",
    "leave-request": "Leave Request",
    "attandence": "Attendance",
    "salary": "Salary",
    "department": "Department",
    "payroll": "Payroll",
    "payroll/edit/:id": "Payroll Edit",
    "advance": "Advance",
    "setting": "Settings",
    "leave-ledger": "Leave",
    "faceatten": "Face Attendance",
    "performance/:userid": "Performance",
    "empattandence": "Attendance",
    "attandence_Report": "Attendance Report",
    "profile": "Profile",
    "adminprofile": "Profile",
    "company": "Company Info",
    "branches": "Branch Manager",
    "departments": "Departments",
    "devices": "Device Management",
    "telegram": "Telegram Integration",
    "admin": "Admin/Manager",
    "rules": "Attendance Rules",
    "leave-policies": "Leave Policies",
    "attandence-import": "Attendance Import",
    "add": "Create Payroll",
    "vouchers": "Vouchers",
    // Plot Management Titles
    "plots": "Plot Management",
    "inventory": "Plots Inventory",
    "sponsors": "Plot Sponsors",
    "sponsor-ledger": "Sponsor Ledger",
    "customers": "Customers",
    "booking": "Bookings",
    "addbooking": "Create Booking",
    "installments": "Collections",
    "series-master": "Plot Series Master",
    "reports": "Plot Reports",
    "payout-ledger": "Payout Ledger",
    "interest-calculator": "Plot Refund & Settlement Calculator",
  };

  const notifications = [
    {
      _id: "64a1b2c3d4e5f67890123456",
      userId: "64f9a1c2e3b4d56789012345",
      message: "Your leave request has been approved.",
      read: false,
      createdAt: new Date("2025-08-21T09:30:00Z")
    },
    {
      _id: "64a1b2c3d4e5f67890123457",
      userId: "64f9a1c2e3b4d56789012345",
      message: "New policy update: Please review the company guidelines.",
      read: true,
      createdAt: new Date("2025-08-20T14:15:00Z")
    },
    {
      _id: "64a1b2c3d4e5f67890123458",
      userId: "64f9a1c2e3b4d56789012346",
      message: "Reminder: Submit your timesheet for this week.",
      read: false,
      createdAt: new Date("2025-08-19T18:00:00Z")
    },
    {
      _id: "64a1b2c3d4e5f67890123459",
      userId: "64f9a1c2e3b4d56789012347",
      message: "Your password was changed successfully.",
      read: false,
      createdAt: new Date("2025-08-18T08:45:00Z")
    },
    {
      _id: "64a1b2c3d4e5f67890123459",
      userId: "64f9a1c2e3b4d56789012347",
      message: "Your password was changed successfully.",
      read: true,
      createdAt: new Date("2025-08-18T08:45:00Z")
    },
    {
      _id: "64a1b2c3d4e5f67890123459",
      userId: "64f9a1c2e3b4d56789012347",
      message: "Your password was changed successfully.",
      read: false,
      createdAt: new Date("2025-08-18T08:45:00Z")
    },

  ];

  const pathParts = location.pathname.split("/").filter(Boolean);

  const lastPart = pathParts[pathParts.length - 1] || "";

  // special handling for dynamic routes like ledger/:id, plots/customers/new, plots/booking/:id
  let pageTitle;
  if (pathParts.includes("plots")) {
    if (pathParts.includes("customers")) {
      if (pathParts.includes("new")) pageTitle = "Add New Customer";
      else if (pathParts.includes("edit")) pageTitle = "Edit Customer";
      else pageTitle = "Plot Customers";
    } else if (pathParts.includes("booking")) {
      if (pathParts.includes("new")) pageTitle = "New Booking";
      else if (pathParts.length > 3) pageTitle = "Booking Details";
      else pageTitle = "Plot Bookings";
    } else if (pathParts.includes("receipts")) {
      pageTitle = "Print Receipt";
    } else if (pathParts.includes("certificates")) {
      pageTitle = "Booking Certificate";
    } else if (pathParts.includes("agreements")) {
      pageTitle = "Buyer Agreement";
    } else if (pathParts.includes("vouchers")) {
      pageTitle = "Payout Voucher";
    } else {
      pageTitle = commonTitles[lastPart] || "Plot Management";
    }
  } else if (pathParts.includes("investments")) {
    if (pathParts.includes("new")) pageTitle = "New Deposit Account";
    else if (pathParts.includes("accounts")) pageTitle = "Investment Accounts";
    else if (pathParts.includes("collections")) pageTitle = "Deposit Collections";
    else if (pathParts.includes("dues")) pageTitle = "Dues & Defaulters";
    else if (pathParts.includes("schemes")) pageTitle = "Scheme Matrix";
    else if (pathParts.includes("settlement")) pageTitle = "Premature Settlement";
    else if (pathParts.includes("certificates")) pageTitle = "Deposit Certificate";
    else if (pathParts.includes("passbook")) pageTitle = "Passbook Statement";
    else pageTitle = "Investment Management";
  } else if (lastPart && !commonTitles[lastPart]) {
    if (pathParts.includes("ledger") && pathParts.length > 2) {
      pageTitle = "Ledger Detail";
    } else if (pathParts.includes("vouchers") && pathParts.length > 2) {
      pageTitle = "Voucher Detail";
    } else if (pathParts.includes("payroll") && pathParts.includes("print")) {
      pageTitle = "Payslip Print";
    } else if (pathParts.includes("performance")) {
      pageTitle = "Performance";
    } else {
      pageTitle = "Page";
    }
  } else {
    pageTitle = commonTitles[lastPart] || "Page";
  }


  const sidebarOpen = Boolean(user?.sidebar);
  const isMobile = window.innerWidth < 600;

  return (
    <div className='navbar no-print h-[50px] w-full bg-white flex items-center justify-between px-2 md:px-4 py-2 border-b border-slate-100'>
      <div className='flex items-center gap-2.5'>
        <Menu onClick={() => dispatch(tooglesidebar())} className='cursor-pointer text-slate-700 hover:text-teal-700 transition-colors' size={22} />
        <p className='font-semibold text-[14px] md:text-lg text-slate-800 tracking-tight'>{pageTitle}</p>
      </div>

      <div className={` ${(sidebarOpen && isMobile) ? "hidden" : "flex"} gap-3 md:gap-4 items-center text-grey`}>
        {/* Dynamic Live Date & Time Card */}
        <div className="hidden sm:flex items-center gap-2 select-none py-0.5">
          <Clock size={16} className="text-teal-600 shrink-0" />
          <div className="flex flex-col justify-center">
            <span className="text-[13px] font-bold text-slate-800 tracking-wide tabular-nums leading-tight">
              {currentTime.format("hh:mm:ss A")}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 leading-tight">
              {currentTime.format("ddd, DD MMM")}
            </span>
          </div>
        </div>

        <NotificationIcon notifications={notificatione} />

        {/* Divider */}
        <div className="w-[1px] h-5 bg-slate-200" />

        <div className='flex flex-col items-end px-1'>
          <span className='text-[10px] md:text-xs font-semibold text-slate-800 leading-4 capitalize'>{user?.profile?.name}</span>
          <p className='text-[8px] md:text-[10px] text-teal-700 font-medium text-right capitalize'>{user?.profile?.role === 'grant' ? 'User' : user?.profile?.role}</p>
        </div>
        {user?.profile?.role === 'employee' ? (
          profile?.profileimage ? (
            <img src={profile.profileimage} alt={profile.employeeName} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
              {profile?.employeeName?.charAt(0) || <User size={14} />}
            </div>
          )
        ) : (
          user?.profile?.profileImage ? (
            <img src={user.profile.profileImage} alt={user.profile.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
              {user?.profile?.name?.charAt(0) || <User size={14} />}
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default Navbar
