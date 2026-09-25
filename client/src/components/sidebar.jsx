import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
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
  ShieldAlert,
  Gauge,
  KeyRound,
  Wallet,
} from "lucide-react";
import { cloudinaryUrl } from "../utils/imageurlsetter";

import { hasPermission } from "../utils/CheckPermission";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { company: adminCompany, profile: adminProfile } = useSelector((state) => state.user);
  const { companysetting: empCompany, profile: empProfile } = useSelector((state) => state.employee);

  const user = useSelector((state) => state.user);
  const role = user?.profile?.role;
  const profile = role === 'employee' ? empProfile : adminProfile;
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
        { menu: "Permissions", link: "/dashboard/permission", icon: <KeyRound size={20} />, roles: ["developer"] },
        { menu: "API Monitor", link: "/dashboard/api-monitor", icon: <Gauge size={20} />, roles: ["developer"] },
        { menu: "Error Logs", link: "/dashboard/error-logs", icon: <ShieldAlert size={20} />, roles: ["developer"] },
        {
          menu: "Organization",
          icon: <Network size={20} />,
          roles: ["admin", "superadmin"],
          children: [
            { menu: "Company Info", link: "/dashboard/organization/company", roles: ["admin", "superadmin"] },
            { menu: "Branches", link: "/dashboard/organization/branches", roles: ["admin", "superadmin"], resource: "branch" },
            { menu: "Departments", link: "/dashboard/organization/departments", roles: ["admin", "superadmin"], resource: "department" },
            { menu: "User Management", link: "/dashboard/organization/users", roles: ["superadmin"] },
            { menu: "Attendance Rules", link: "/dashboard/organization/rules", roles: ["admin", "superadmin"], resource: "attandence" },
            { menu: "Device Management", link: "/dashboard/organization/devices", roles: ["admin", "superadmin"] },
            { menu: "Telegram", link: "/dashboard/organization/telegram", roles: ["admin", "superadmin"] },
            { menu: "Payroll Policies", link: "/dashboard/organization/payroll", roles: ["admin", "superadmin"], resource: "salary" },
            { menu: "Leave Policies", link: "/dashboard/organization/leave-policies", roles: ["admin", "superadmin"], resource: "leave" },
          ],
        },
        {
          menu: "Employees",
          icon: <Users size={20} />,
          roles: ["admin", "superadmin", "manager", "employee", "demo"],
          children: [
            { menu: "Employee", link: "/dashboard/employe", roles: ["admin", "superadmin", "manager", "demo"], resource: "employee" },
            { menu: "Leave Request", link: "/dashboard/leave-request", roles: ["employee", "admin", "superadmin", "manager", "demo"], resource: "leave", icon: <FileText size={18} /> },
            { menu: "Leave Balance", link: "/dashboard/leave-ledger", roles: ["admin", "superadmin", "manager", "demo"], resource: "leave", icon: <History size={18} /> },
            { menu: "Leave Ledger", link: "/dashboard/my-leave-ledger", roles: ["employee"], icon: <History size={18} />, hidden: !company?.leaveSettings?.allowEmployeeToSeeLedger },
          ].filter(c => !c.hidden),
        },
        {
          menu: "Attendance",
          icon: <CalendarCheck2 size={20} />,
          roles: ["admin", "superadmin", "manager", "employee", "demo"],
          children: [
            { menu: "Attendance", link: "/dashboard/attandence", roles: ["admin", "superadmin", "manager", "demo"], resource: "attandence" },
            { menu: "Emp Attendance", link: "/dashboard/empattandence", roles: ["employee"] },
            { menu: "Report", link: "/dashboard/attandence_Report", roles: ["admin", "superadmin", "manager", "demo"], resource: "attandence" },
          ],
        },
        {
          menu: "Account",
          icon: <Wallet size={20} />,
          roles: ["admin", "superadmin", "manager", "demo"],
          children: [
            { menu: "Downpayment", link: "/dashboard/plots/collections/downpayment", roles: ["admin", "superadmin", "manager", "demo"], resource: "plot_collection" },
            { menu: "EMI", link: "/dashboard/plots/collections/emi", roles: ["admin", "superadmin", "manager", "demo"], resource: "plot_collection" },
            { menu: "Product Collections", link: "/dashboard/plots/collections/products", roles: ["admin", "superadmin", "manager", "demo"], resource: "plot_collection" },
            { menu: "Payroll", link: "/dashboard/payroll", roles: ["admin", "superadmin", "manager", "demo"], resource: "salary" },
            { menu: "Advance", link: "/dashboard/advance", roles: ["admin", "superadmin", "manager", "demo"], resource: "advance" },
            { menu: "Vouchers", link: "/dashboard/vouchers", roles: ["admin", "superadmin", "manager", "demo"], resource: "voucher" },
          ],
        },
        {
          menu: "Ledger",
          icon: <BookOpen size={20} />,
          roles: ["admin", "superadmin", "manager", "demo"],
          children: [
            { menu: "Employee", link: "/dashboard/ledger/employees", roles: ["admin", "superadmin", "manager", "demo"], resource: "ledger" },
            { menu: "Seller (Kisan)", link: "/dashboard/ledger/sellers", roles: ["admin", "superadmin", "manager", "demo"], resource: "ledger" },
            { menu: "Business Associate", link: "/dashboard/ledger/business-associates", roles: ["admin", "superadmin", "manager", "demo"], resource: "ledger" },
            { menu: "Business Partner", link: "/dashboard/ledger/business-partners", roles: ["admin", "superadmin", "manager", "demo"], resource: "ledger" },
            { menu: "Branch Partner", link: "/dashboard/ledger/branch-partners", roles: ["admin", "superadmin", "manager", "demo"], resource: "ledger" },
          ],
        },
        {
          menu: "Plot Management",
          icon: <Building2 size={20} />,
          roles: ["admin", "superadmin", "manager", "demo"],
          children: [
            { menu: "Dashboard", link: "/dashboard/plots/dashboard", roles: ["admin", "superadmin", "manager", "demo"], resource: "plot_reports" },
            { menu: "Plot Purchase", link: "/dashboard/plots/purchase", roles: ["admin", "superadmin", "manager", "demo"], resource: "plot_inventory" },
            { menu: "Series & Inventory", link: "/dashboard/plots/series-master", roles: ["admin", "superadmin", "manager", "demo"], resource: "plot_inventory" },
            { menu: "Plot Products", link: "/dashboard/plots/products", roles: ["admin", "superadmin", "manager", "demo"], resource: "plot_inventory" },
            { menu: "Business Developer", link: "/dashboard/plots/business-developer", roles: ["admin", "superadmin", "manager", "demo"], resource: "plot_sponsor" },
            { menu: "Customers", link: "/dashboard/plots/customers", roles: ["admin", "superadmin", "manager", "demo"], resource: "plot_customer" },
            { menu: "Bookings", link: "/dashboard/plots/booking", roles: ["admin", "superadmin", "manager", "demo"], resource: "plot_booking" },
            { menu: "Incentive", link: "/dashboard/plots/incentives", roles: ["admin", "superadmin", "manager", "demo"], resource: "plot_sponsor" },
            { menu: "Settlement Calculator", link: "/dashboard/plots/interest-calculator", roles: ["admin", "superadmin", "manager", "demo"], resource: "plot_inventory" },
            { menu: "Reports", link: "/dashboard/plots/reports", roles: ["admin", "superadmin", "manager", "demo"], resource: "plot_reports" },
          ],
        },
        { menu: "Holiday", link: "/dashboard/holiday", icon: <CalendarDays size={20} />, roles: ["superadmin", "admin", "demo"], resource: "holiday" },

        { menu: "Activity Logs", link: "/dashboard/activity-logs", icon: <History size={20} />, roles: ["superadmin", "admin", "developer"], resource: "audit_log" },
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

  // Auto-expand parent submenu if current route matches any child link
  useEffect(() => {
    let activeMenuKey = null;
    menu.forEach((section) => {
      const allowedItems = section.items.filter((item) => item.roles.includes(role));
      allowedItems.forEach((item) => {
        if (item.children) {
          const hasActiveChild = item.children.some((child) => {
            if (!child.link) return false;
            if (location.pathname === child.link) return true;
            if (child.link !== '/dashboard' && location.pathname.startsWith(child.link)) return true;
            return false;
          });
          if (hasActiveChild) {
            activeMenuKey = item.menu;
          }
        }
      });
    });

    if (activeMenuKey) {
      setOpenSubmenu(activeMenuKey);
    }
  }, [location.pathname, role]);

  useEffect(() => {
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
              {filteredItems.map((item) => {
                const menuId = item.menu;
                const isOpen = showText
                  ? openSubmenu === menuId
                  : hoveredMenu === menuId;

                if (item.children) {
                  const isChildActive = item.children.some((child) => {
                    if (!child.link) return false;
                    if (location.pathname === child.link) return true;
                    if (child.link !== '/dashboard' && location.pathname.startsWith(child.link)) return true;
                    return false;
                  });

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
                        className={`relative flex w-full items-center rounded-xl font-medium text-xs transition-all cursor-pointer ${showText
                          ? "justify-between px-3 py-2 text-slate-700 hover:text-teal-900 hover:bg-teal-50/80"
                          : "justify-center h-10 w-full text-slate-600 hover:text-teal-800 hover:bg-teal-50"
                          } ${isChildActive
                            ? "bg-teal-50/90 text-teal-900 font-semibold border border-teal-200/80"
                            : isOpen && showText
                              ? "bg-teal-50/50 text-teal-900 font-semibold"
                              : ""
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`text-[17px] transition-colors ${isChildActive ? "text-teal-700" : isOpen ? "text-teal-600" : "text-slate-500"}`}>
                            {item.icon}
                          </span>
                          {showText && <span className="truncate">{item.menu}</span>}
                        </div>
                        {showText && (
                          <span className={`${isChildActive ? "text-teal-700" : "text-slate-400"}`}>
                            {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          </span>
                        )}
                      </button>

                      {/* Expanded Submenu (Open Sidebar) */}
                      {showText && (
                        <div
                          className="relative ml-5 pl-3 mt-1.5 space-y-1 border-l-2 border-slate-200 overflow-hidden transition-all duration-200"
                          style={{ maxHeight: isOpen ? `${item.children.length * 48}px` : "0px" }}
                        >
                          {item.children.map((child) => {
                            if (!child.roles.includes(role)) return null;
                            if (child.resource && !hasPermission(profile, child.resource, 1)) return null;
                            return (
                              <div key={child.menu} className="relative flex items-center">
                                {/* Tree horizontal branch connector line */}
                                <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-2.5 h-[2px] bg-slate-200 pointer-events-none" />

                                <NavLink
                                  to={child.link}
                                  onClick={() => setOpenSubmenu(menuId)}
                                  className={({ isActive }) =>
                                    `w-full block px-2.5 py-1.5 text-xs rounded-lg transition-all ${isActive
                                      ? "bg-teal-700 text-white font-semibold shadow-xs"
                                      : "text-slate-600 hover:text-teal-800 hover:bg-teal-50 font-medium"
                                    }`
                                  }
                                >
                                  {child.menu}
                                </NavLink>
                              </div>
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
                              if (child.resource && !hasPermission(profile, child.resource, 1)) return null;
                              return (
                                <NavLink
                                  to={child.link}
                                  key={child.menu}
                                  onClick={() => setHoveredMenu(null)}
                                  className={({ isActive }) =>
                                    `block px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition font-medium ${isActive
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
                    className={`flex cursor-pointer w-full items-center rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors ${showText ? "justify-start gap-2.5 px-3 py-2" : "justify-center h-10 w-full"
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
                      `flex items-center rounded-xl text-xs transition-all ${showText ? "justify-start gap-2.5 px-3 py-2" : "justify-center h-10 w-full"
                      } ${isActive
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
