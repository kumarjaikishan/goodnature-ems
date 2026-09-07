import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { swal } from "../utils/confirmDialog";
import {
  LayoutDashboard,
  Network,
  Users,
  CalendarCheck2,
  Banknote,
  Building2,
  CalendarDays,
  BookOpen,
  Receipt,
  UserCircle2,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  FileText,
  History,
  TrendingUp,
  Coins,
} from "lucide-react";
import { cloudinaryUrl } from "../utils/imageurlsetter";

const Sidebar = () => {
  const navigate = useNavigate();
  const { company: adminCompany, profile: adminProfile } = useSelector((state) => state.user);
  const { companysetting: empCompany, profile: empProfile } = useSelector((state) => state.employee);

  const user = useSelector((state) => state.user);
  const role = user?.profile?.role;
  const company = role === 'employee' ? empCompany : adminCompany;
  const sidebarOpen = Boolean(user?.sidebar);
  const extended = Boolean(user?.extendedonMobile);
  const isMobile = window.innerWidth < 600;

  const [openSubmenu, setOpenSubmenu] = useState(null); // for expanded sidebar
  const [hoveredMenu, setHoveredMenu] = useState(null); // for collapsed sidebar
  const [anchorEl, setAnchorEl] = useState(null);

  const menu = [
    {
      title: "Menu",
      items: [
        { menu: "Dashboard", link: "/dashboard", icon: <LayoutDashboard size={20} />, roles: ["developer", "admin", "superadmin", "manager", "employee", "demo", "sponsor"] },
        { menu: "Permissions", link: "/dashboard/permission", icon: <LayoutDashboard size={20} />, roles: ["developer"] },
        { menu: "API Monitor", link: "/dashboard/api-monitor", icon: <LayoutDashboard size={20} />, roles: ["developer"] },
        {
          menu: "Organization",
          icon: <Network size={20} />,
          roles: ["admin", "superadmin"],
          children: [
            { menu: "Company Info", link: "/dashboard/organization/company", roles: ["admin", "superadmin"] },
            { menu: "Branches & Managers", link: "/dashboard/organization/branches", roles: ["admin", "superadmin"] },
            { menu: "Departments", link: "/dashboard/organization/departments", roles: ["admin", "superadmin"] },
            { menu: "Admin/Manager", link: "/dashboard/organization/admin", roles: ["superadmin"] },
            { menu: "Attendance Rules", link: "/dashboard/organization/rules", roles: ["admin", "superadmin"] },
            { menu: "Device Management", link: "/dashboard/organization/devices", roles: ["admin", "superadmin"] },
            { menu: "Telegram", link: "/dashboard/organization/telegram", roles: ["admin", "superadmin"] },
            { menu: "Payroll Policies", link: "/dashboard/organization/payroll", roles: ["admin", "superadmin"] },
            { menu: "Leave Policies", link: "/dashboard/organization/leave-policies", roles: ["admin", "superadmin"] },
          ],
        },
        {
          menu: "Employees",
          icon: <Users size={20} />,
          roles: ["admin", "superadmin", "manager", "employee", "demo"],
          children: [
            { menu: "Employee", link: "/dashboard/employe", roles: ["admin", "superadmin", "manager", "demo"] },
            { menu: "Leave Request", link: "/dashboard/leave-request", roles: ["employee", "admin", "superadmin", "manager", "demo"], icon: <FileText size={18} /> },
            { menu: "Leave Balance", link: "/dashboard/leave-ledger", roles: ["admin", "superadmin", "manager", "demo"], icon: <History size={18} /> },
            { menu: "Leave Policies", link: "/dashboard/leave-policies", roles: ["admin", "superadmin", "demo"], icon: <Settings size={18} /> },
            { menu: "Leave Ledger", link: "/dashboard/my-leave-ledger", roles: ["employee"], icon: <History size={18} />, hidden: !company?.leaveSettings?.allowEmployeeToSeeLedger },
          ].filter(c => !c.hidden),
        },
        {
          menu: "Attendance",
          icon: <CalendarCheck2 size={20} />,
          roles: ["admin", "superadmin", "manager", "employee", "demo"],
          children: [
            { menu: "Attendance", link: "/dashboard/attandence", roles: ["admin", "superadmin", "manager", "demo"] },
            { menu: "Emp Attendance", link: "/dashboard/empattandence", roles: ["employee"] },
            { menu: "Report", link: "/dashboard/attandence_Report", roles: ["admin", "superadmin", "manager", "demo"] },
          ],
        },
        { menu: "Payroll", link: "/dashboard/payroll", icon: <Banknote size={20} />, roles: ["admin", "superadmin", "manager", "demo"] },
        {
          menu: "Plot Management",
          icon: <Building2 size={20} />,
          roles: ["admin", "superadmin", "manager", "demo"],
          children: [
            { menu: "Dashboard", link: "/dashboard/plots/dashboard", roles: ["admin", "superadmin", "manager", "demo"] },
            { menu: "Agreements", link: "/dashboard/plots/agreements", roles: ["admin", "superadmin", "manager", "demo"] },
            { menu: "Series & Inventory", link: "/dashboard/plots/series-master", roles: ["admin", "superadmin", "manager", "demo"] },
            { menu: "Sponsors", link: "/dashboard/plots/sponsors", roles: ["admin", "superadmin", "manager", "demo"] },
            { menu: "Customers", link: "/dashboard/plots/customers", roles: ["admin", "superadmin", "manager", "demo"] },
            { menu: "Bookings", link: "/dashboard/plots/booking", roles: ["admin", "superadmin", "manager", "demo"] },
            { menu: "Collections", link: "/dashboard/plots/installments", roles: ["admin", "superadmin", "manager", "demo"] },
            { menu: "Commission Closings", link: "/dashboard/plots/closings", roles: ["admin", "superadmin", "manager", "demo"] },
            { menu: "Settlement Calculator", link: "/dashboard/plots/interest-calculator", roles: ["admin", "superadmin", "manager", "demo"] },
            { menu: "Reports", link: "/dashboard/plots/reports", roles: ["admin", "superadmin", "manager", "demo"] },
          ],
        },
        {
          menu: "Investments",
          icon: <Coins size={20} />,
          roles: ["admin", "superadmin", "manager", "demo"],
          children: [
            { menu: "Dashboard", link: "/dashboard/investments/dashboard", roles: ["admin", "superadmin", "manager", "demo"] },
            { menu: "Investment", link: "/dashboard/investments/accounts", roles: ["admin", "superadmin", "manager", "demo"] },
            { menu: "Collections", link: "/dashboard/investments/collections", roles: ["admin", "superadmin", "manager", "demo"] },
            { menu: "Dues & Defaulters", link: "/dashboard/investments/dues", roles: ["admin", "superadmin", "manager", "demo"] },
            { menu: "Premature Settlement", link: "/dashboard/investments/settlement", roles: ["admin", "superadmin", "manager", "demo"] },
            { menu: "Scheme Matrix & Rules", link: "/dashboard/investments/schemes", roles: ["admin", "superadmin", "manager", "demo"] },
          ],
        },
        { menu: "Holiday", link: "/dashboard/holiday", icon: <CalendarDays size={20} />, roles: ["superadmin", "admin", "demo"] },
        { menu: "Ledger", link: "/dashboard/ledger", icon: <BookOpen size={20} />, roles: ["admin", "superadmin", "manager"] },
        { menu: "Vouchers", link: "/dashboard/vouchers", icon: <Receipt size={20} />, roles: ["admin", "superadmin", "manager", "demo"] },
        { menu: "Commission Ledger", link: "/dashboard/ledger", icon: <BookOpen size={20} />, roles: ["sponsor"] },
        { menu: "My Plot Bookings", link: "/dashboard/my-bookings", icon: <Building2 size={20} />, roles: ["sponsor"] },
        { menu: "Business Report", link: "/dashboard/my-business", icon: <TrendingUp size={20} />, roles: ["sponsor"] },
      ],
    },
    {
      title: "Others",
      items: [
        { menu: "Profile", link: "/dashboard/profile", icon: <UserCircle2 size={20} />, roles: ["admin", "superadmin", "manager", "employee", "grant", "demo", "sponsor"] },
        { menu: "Setting", link: "/dashboard/setting", icon: <Settings size={20} />, roles: ["admin", "superadmin", "manager", "employee", "demo"] },
        { menu: "Logout", isLogout: true, icon: <LogOut size={20} />, roles: ["admin", "employee", "superadmin", "developer", "manager", "grant", "demo", "sponsor"] },
      ],
    },
  ];

  const handleLogout = () => {
    swal({
      title: "Are you sure you want to logout?",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((willLogout) => {
      if (willLogout) navigate("/logout");
    });
  };

  const showText = isMobile ? sidebarOpen && extended : sidebarOpen;

  useEffect(() => {
    setOpenSubmenu(null);
    setHoveredMenu(null);
    setAnchorEl(null);
  }, [showText]);

  return (
    <div className="w-full h-full scrollbar-hide overflow-y-auto px-1.5 md:px-2 py-2">
      {/* Brand Header */}
      <div className="h-[60px] flex items-center gap-3 px-1 mb-2 border-b border-slate-100">
        <span className="shrink-0">
          {company?.logo ? (
            <div className="rounded-xl overflow-hidden w-9 h-9 md:h-10 md:w-10 border border-teal-100 shadow-xs">
              <img
                className="w-full h-full object-cover"
                src={cloudinaryUrl(company?.logo, { format: "webp", width: 100, height: 100 })}
                alt="Company Logo"
              />
            </div>
          ) : (
            <div className="w-9 h-9 md:h-10 md:w-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
              <Building2 size={22} />
            </div>
          )}
        </span>
        {showText && (
          <div className="min-w-0">
            <h2 className="capitalize font-bold text-sm text-slate-800 truncate tracking-tight">
              {company?.name || "Good Nature"}
            </h2>
            <p className="text-[10px] font-semibold text-teal-700 uppercase tracking-wider">
              Management Portal
            </p>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      {menu.map((section, sIndex) => {
        const filteredItems = section.items.filter((item) =>
          item.roles.includes(role)
        );
        if (!filteredItems.length) return null;

        return (
          <div key={sIndex} className="mb-3">
            {showText && section.title && (
              <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {section.title}
              </div>
            )}

            <div className="space-y-1">
              {filteredItems.map((item, iIndex) => {
                const menuId = `${sIndex}-${iIndex}`;
                const isOpen = showText
                  ? openSubmenu === menuId
                  : hoveredMenu === menuId;

                if (item.children) {
                  return (
                    <div
                      key={item.menu}
                      className="relative"
                      onMouseEnter={(e) => {
                        if (!showText) {
                          setHoveredMenu(menuId);
                          setAnchorEl(e.currentTarget);
                        }
                      }}
                      onMouseLeave={() => {
                        if (!showText) {
                          setHoveredMenu(null);
                          setAnchorEl(null);
                        }
                      }}
                    >
                      {/* Parent Group Button */}
                      <button
                        onClick={() => {
                          if (showText) setOpenSubmenu(openSubmenu === menuId ? null : menuId);
                        }}
                        className={`relative flex w-full items-center rounded-xl font-medium text-xs transition-all cursor-pointer ${
                          showText
                            ? "justify-between px-3 py-2 text-slate-700 hover:text-teal-900 hover:bg-teal-50/80"
                            : "justify-center h-10 w-full text-slate-600 hover:text-teal-800 hover:bg-teal-50"
                        } ${isOpen && showText ? "bg-teal-50/60 text-teal-900 font-semibold" : ""}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`text-[17px] transition-colors ${isOpen ? "text-teal-700" : "text-slate-500"}`}>
                            {item.icon}
                          </span>
                          {showText && <span className="truncate">{item.menu}</span>}
                        </div>
                        {showText && (
                          <span className="text-slate-400">
                            {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          </span>
                        )}
                      </button>

                      {/* Expanded Submenu (Open Sidebar) */}
                      {showText && (
                        <div
                          className="ml-4 pl-2.5 mt-0.5 space-y-0.5 border-l-2 border-teal-100 overflow-hidden transition-all duration-200"
                          style={{ maxHeight: isOpen ? `${item.children.length * 42}px` : "0px" }}
                        >
                          {item.children.map((child) => {
                            if (!child.roles.includes(role)) return null;
                            return (
                              <NavLink
                                to={child.link}
                                key={child.menu}
                                onClick={() => setOpenSubmenu(menuId)}
                                className={({ isActive }) =>
                                  `block px-2.5 py-1.5 text-xs rounded-lg transition-all ${
                                    isActive
                                      ? "bg-teal-700 text-white font-semibold shadow-xs"
                                      : "text-slate-600 hover:text-teal-800 hover:bg-teal-50 font-medium"
                                  }`
                                }
                              >
                                {child.menu}
                              </NavLink>
                            );
                          })}
                        </div>
                      )}

                      {/* Collapsed Flyout Popover */}
                      {!showText && isOpen && (
                        <div
                          onMouseEnter={() => setHoveredMenu(menuId)}
                          onMouseLeave={() => setHoveredMenu(null)}
                          className="absolute left-full top-0 ml-2 z-50 bg-white rounded-xl shadow-xl border border-slate-200 min-w-[200px] py-1.5 animate-in fade-in zoom-in-95 duration-100"
                        >
                          <div className="px-3 py-1.5 text-[10px] font-extrabold text-teal-800 uppercase tracking-wider border-b border-slate-100 bg-teal-50/50">
                            {item.menu}
                          </div>
                          <div className="p-1 space-y-0.5">
                            {item.children.map((child) => {
                              if (!child.roles.includes(role)) return null;
                              return (
                                <NavLink
                                  to={child.link}
                                  key={child.menu}
                                  onClick={() => setHoveredMenu(null)}
                                  className={({ isActive }) =>
                                    `block px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition font-medium ${
                                      isActive
                                        ? "bg-teal-700 text-white font-semibold shadow-xs"
                                        : "text-slate-700 hover:text-teal-900 hover:bg-teal-50"
                                    }`
                                  }
                                >
                                  {child.menu}
                                </NavLink>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // Single Navigation Item or Logout Button
                return item.isLogout ? (
                  <button
                    key={item.menu}
                    onClick={handleLogout}
                    className={`flex cursor-pointer w-full items-center rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors ${
                      showText ? "justify-start gap-2.5 px-3 py-2" : "justify-center h-10 w-full"
                    }`}
                  >
                    <span className="text-[17px] text-rose-500">{item.icon}</span>
                    {showText && <span>{item.menu}</span>}
                  </button>
                ) : (
                  <NavLink
                    to={item.link}
                    end={item.link === "/dashboard"}
                    key={item.link}
                    onClick={() => setOpenSubmenu(null)}
                    className={({ isActive }) =>
                      `flex items-center rounded-xl text-xs transition-all ${
                        showText ? "justify-start gap-2.5 px-3 py-2" : "justify-center h-10 w-full"
                      } ${
                        isActive
                          ? "bg-teal-700 text-white font-semibold shadow-xs"
                          : "text-slate-700 hover:text-teal-900 hover:bg-teal-50 font-medium"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`text-[17px] ${isActive ? "text-white" : "text-slate-500"}`}>
                          {item.icon}
                        </span>
                        {showText && <span className="truncate">{item.menu}</span>}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Sidebar;
