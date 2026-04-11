import { Divider } from "@mui/material";
import { apiClient } from "../../../utils/apiClient";
import dayjs from "dayjs";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { toast } from "react-toastify";
import numberToWords from "../../../utils/numToWord";
import { FaCalendarAlt, FaCalendarWeek, FaUmbrellaBeach, FaBriefcase, FaUserCheck, FaUserTimes, FaUserClock } from "react-icons/fa";
import { cloudinaryUrl } from "../../../utils/imageurlsetter";


export default function PayslipPrintPage() {
  const printRef = useRef(null);
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [payroll, setPayroll] = useState(null);
  const [error, setError] = useState(null);
  const { company } = useSelector(e => e.user);

  const handlePrint = useReactToPrint({
    contentRef: printRef,   // ✅ v3 uses contentRef
    documentTitle: "Payroll Slip",
    removeAfterPrint: true,
  });

  // Dummy employee data
  const employee = {
    name: "John Doe",
    designation: "Software Engineer",
    department: "IT",
    month: "August 2025",
    profilePic: "https://i.pravatar.cc/100",
    earnings: [
      { head: "Basic", amount: 30000 },
      { head: "HRA", amount: 8000 },
      { head: "Transport", amount: 2000 },
      { head: "Medical Allowance", amount: 1500 },
    ],
    deductions: [
      { head: "PF Employee", amount: 2000 },
      { head: "ESI Employee", amount: 500 },
      { head: "Tax", amount: 2500 },
    ],
  };

  useEffect(() => {
    // console.log(company)
  }, []);

  function formatRupee(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await apiClient({
          url: `payroll/${id}`
        });

        setPayroll(data.payroll || employee); // fallback to dummy
      } catch (error) {
        console.error(error);
        setError("Failed to fetch payroll");
        toast.warn("Using dummy payroll data for testing", { autoClose: 1500 });
        setPayroll(employee); // fallback
      } finally {
        setLoading(false);
      }
    };
    fetchPayroll();
  }, [id]);

  // Calculate totals
  const gross = employee.earnings.reduce((acc, e) => acc + e.amount, 0);
  const totalDeduction = employee.deductions.reduce((acc, d) => acc + d.amount, 0);
  const netSalary = gross - totalDeduction;
  const defaultProfile = 'https://res.cloudinary.com/dusxlxlvm/image/upload/v1753113610/ems/assets/employee_fi3g5p.webp'

  return (
    <div className="flex justify-center p-2 min-h-screen bg-gray-50 py-10 print:p-0 print:bg-white print:py-0">
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none !export; }
        }
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 8rem;
          color: rgba(0, 0, 0, 0.03);
          pointer-events: none;
          z-index: 0;
          font-weight: bold;
          white-space: nowrap;
        }
      `}</style>

      {/* Main Container */}
      <div 
        ref={printRef}
        className="relative w-full max-w-5xl bg-white shadow-xl border border-gray-200 p-6 md:p-10 overflow-hidden print:shadow-none print:border-none print:p-0"
      >
        <div className="watermark uppercase">Salary Slip</div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-slate-800 pb-6 mb-8 relative z-10">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            {company.logo && (
              <img
                src={cloudinaryUrl(company.logo, { format: "webp", width: 120, height: 120 })}
                alt="Logo"
                className="w-16 h-16 md:w-20 md:h-20 object-contain"
              />
            )}
            <div className="text-left">
              <h1 className="text-2xl md:text-3xl font-extra-bold text-slate-800 tracking-tight uppercase">
                {company?.fullname || 'COMPANY NAME'}
              </h1>
              <p className="text-sm text-slate-600 font-medium max-w-md leading-relaxed">
                {company?.address || 'Company Address Line 1, City, State'}
              </p>
              {company?.phone && <p className="text-xs text-slate-500 mt-1">Contact: {company.phone}</p>}
            </div>
          </div>
          <div className="text-center md:text-right">
            <h2 className="text-xl font-bold text-slate-700 uppercase tracking-widest border-b border-slate-400 pb-1">
              Payslip
            </h2>
            <p className="text-sm text-slate-500 font-bold mt-2 uppercase">
              {dayjs(`${payroll?.year}-${payroll?.month}-01`).format("MMMM YYYY")}
            </p>
          </div>
        </div>

        {/* Employee Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 mb-8 bg-slate-50 p-4 rounded-lg border border-slate-100 relative z-10">
          <div className="space-y-2">
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-500 font-semibold text-xs uppercase">Employee Name</span>
              <span className="text-slate-800 font-bold text-sm uppercase">{payroll?.name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-500 font-semibold text-xs uppercase">Employee ID</span>
              <span className="text-slate-800 font-bold text-sm uppercase">{payroll?.empId || 'EMP-XXXX'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-500 font-semibold text-xs uppercase">Designation</span>
              <span className="text-slate-800 font-bold text-sm uppercase">{payroll?.designation}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-500 font-semibold text-xs uppercase">Department</span>
              <span className="text-slate-800 font-bold text-sm uppercase">{payroll?.department}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-500 font-semibold text-xs uppercase">Date of Joining</span>
              <span className="text-slate-800 font-bold text-sm uppercase">{payroll?.doj ? dayjs(payroll.doj).format("DD MMM YYYY") : 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-500 font-semibold text-xs uppercase">Bank Name</span>
              <span className="text-slate-800 font-bold text-sm uppercase">{payroll?.bankName || 'HDFC BANK'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-500 font-semibold text-xs uppercase">Account No</span>
              <span className="text-slate-800 font-bold text-sm uppercase">{payroll?.accountNo || 'XXXXXXXXXXXX'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="text-slate-500 font-semibold text-xs uppercase">PAN / UAN</span>
              <span className="text-slate-800 font-bold text-sm uppercase">{payroll?.pan || 'XXXXXXXXXX'}</span>
            </div>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="mb-8 relative z-10">
          <h3 className="text-xs font-bold text-slate-700 uppercase mb-3 px-1">Attendance Summary</h3>
          <div className="grid grid-cols-4 md:grid-cols-7 border border-slate-300 rounded overflow-hidden">
            {[
              { label: "Month Days", val: payroll?.monthDays, color: "text-slate-700" },
              { label: "Present", val: payroll?.present, color: "text-green-700" },
              { label: "Absent", val: payroll?.absent, color: "text-red-700" },
              { label: "Leaves", val: payroll?.leave, color: "text-amber-700" },
              { label: "Weekly Off", val: payroll?.weekOffs, color: "text-indigo-700" },
              { label: "Holidays", val: payroll?.holidays, color: "text-orange-700" },
              { label: "LWP", val: payroll?.lwp || 0, color: "text-rose-700" }
            ].map((item, i) => (
              <div key={i} className="border-r border-slate-200 last:border-0 text-center py-2 bg-white">
                <p className="text-[10px] font-bold text-slate-500 uppercase">{item.label}</p>
                <p className={`text-sm font-black ${item.color}`}>{item.val || 0}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Earnings & Deductions Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 border border-slate-800 rounded overflow-hidden mb-8 relative z-10">
          <div className="border-r border-slate-800">
            <div className="bg-slate-800 text-white px-4 py-2 flex justify-between uppercase font-bold text-xs tracking-wider">
              <span>Earnings</span>
              <span>Amount (₹)</span>
            </div>
            <div className="p-0 space-y-0 divide-y divide-slate-100">
              <div className="flex justify-between px-4 py-2 hover:bg-slate-50">
                <span className="text-slate-700 font-medium text-sm">Basic Salary</span>
                <span className="text-slate-900 font-bold text-sm">{formatRupee(payroll?.baseSalary || 0)}</span>
              </div>
              {payroll?.allowances?.map((e, i) => (
                <div key={i} className="flex justify-between px-4 py-2 hover:bg-slate-50">
                  <span className="text-slate-700 font-medium text-sm">{e.name}</span>
                  <span className="text-slate-900 font-bold text-sm">{formatRupee(e.amount)}</span>
                </div>
              ))}
              {payroll?.bonuses?.map((e, i) => (
                <div key={i} className="flex justify-between px-4 py-2 hover:bg-slate-50">
                  <span className="text-slate-700 font-medium text-sm">{e.name}</span>
                  <span className="text-slate-900 font-bold text-sm">{formatRupee(e.amount)}</span>
                </div>
              ))}
              {/* Fillers to balance the table height */}
              {[...Array(Math.max(0, 5 - (payroll?.allowances?.length || 0) - (payroll?.bonuses?.length || 0)))].map((_, i) => (
                <div key={i} className="px-4 py-4">&nbsp;</div>
              ))}
            </div>
            <div className="bg-slate-100 border-t border-slate-300 px-4 py-3 flex justify-between uppercase font-bold text-sm text-slate-800">
              <span>Gross Earnings</span>
              <span>{formatRupee(
                (payroll?.baseSalary || 0) + 
                (payroll?.allowances?.reduce((a, b) => a + b.amount, 0) || 0) + 
                (payroll?.bonuses?.reduce((a, b) => a + b.amount, 0) || 0)
              )}</span>
            </div>
          </div>

          <div>
            <div className="bg-rose-900 text-white px-4 py-2 flex justify-between uppercase font-bold text-xs tracking-wider">
              <span>Deductions</span>
              <span>Amount (₹)</span>
            </div>
            <div className="p-0 space-y-0 divide-y divide-slate-100">
              {payroll?.deductions?.map((d, i) => (
                <div key={i} className="flex justify-between px-4 py-2 hover:bg-slate-50">
                  <span className="text-slate-700 font-medium text-sm">{d.name}</span>
                  <span className="text-slate-900 font-bold text-sm">{formatRupee(d.amount)}</span>
                </div>
              ))}
                {/* Fallback space for deductions */}
               {[...Array(Math.max(0, 6 - (payroll?.deductions?.length || 0)))].map((_, i) => (
                <div key={i} className="px-4 py-4">&nbsp;</div>
              ))}
            </div>
            <div className="bg-slate-100 border-t border-slate-300 px-4 py-3 flex justify-between uppercase font-bold text-sm text-slate-800">
              <span>Total Deductions</span>
              <span>{formatRupee(payroll?.deductions?.reduce((a, b) => a + b.amount, 0) || 0)}</span>
            </div>
          </div>
        </div>

        {/* Net Salary Summary */}
        <div className="bg-slate-800 text-white rounded-lg p-6 flex flex-col md:flex-row justify-between items-center mb-8 relative z-10 shadow-lg">
          <div className="mb-4 md:mb-0 text-center md:text-left">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Net Salary Payable</p>
            <p className="text-sm font-medium italic opacity-90 capitalize">
              In Words: {numberToWords(Math.floor(payroll?.netSalary || 0))} Only
            </p>
          </div>
          <div className="text-center md:text-right">
            <span className="text-3xl md:text-4xl font-black text-white tracking-tight">
              {formatRupee(Math.floor(payroll?.netSalary || 0))}
            </span>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 grid grid-cols-2 gap-12 relative z-10">
          <div className="text-center pt-8 border-t border-dashed border-slate-300">
            <p className="text-xs font-bold uppercase text-slate-700 mb-1">{payroll?.name}</p>
            <p className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">Employee Signature</p>
          </div>
          <div className="text-center pt-8 border-t border-dashed border-slate-300 relative">
             <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-20">
                <img src={cloudinaryUrl(company.logo, { width: 100 })} className="h-20 grayscale" alt="stamp" />
             </div>
            <p className="text-xs font-bold uppercase text-slate-700 mb-1">{company.fullname}</p>
            <p className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">Manager / Authorized Signatory</p>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="mt-12 pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center uppercase tracking-widest">
          This is a computer generated document and does not require a physical signature.
          <br/>
          Confidential - Internal Use Only
        </div>
      </div>
      
      {/* Print Controls (Non-Printable) */}
      <div className="fixed bottom-8 right-8 no-print flex gap-3">
         <button 
          onClick={() => window.history.back()}
          className="bg-white text-slate-700 px-6 py-3 rounded-full shadow-2xl font-bold border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          Cancel
        </button>
        <button 
          onClick={handlePrint}
          className="bg-slate-900 text-white px-8 py-3 rounded-full shadow-2xl font-bold hover:bg-slate-800 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          Print Salary Slip
        </button>
      </div>
    </div>
  );
}
