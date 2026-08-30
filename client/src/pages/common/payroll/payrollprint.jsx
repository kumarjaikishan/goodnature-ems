import { Divider } from "@mui/material";
import { apiClient } from "../../../utils/apiClient";
import dayjs from "dayjs";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { toast } from "../../../utils/toast";
import numberToWords from "../../../utils/numToWord";
import { cloudinaryUrl } from "../../../utils/imageurlsetter";
import { ArrowLeft, Printer } from "lucide-react";


export default function PayslipPrintPage() {
  const printRef = useRef(null);
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [payroll, setPayroll] = useState(null);
  const [error, setError] = useState(null);
  const { company } = useSelector(e => e.user);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
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
    <div className="flex flex-col items-center justify-center p-2 min-h-screen bg-gray-50 py-4 sm:py-6 print:p-0 print:bg-white print:py-0">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body, #root, main, section, article, div:not(.print-area):not(.print-area *) {
            background: transparent !important;
            background-color: transparent !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print-area {
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-area * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 8rem;
          color: rgba(0, 0, 0, 0.02);
          pointer-events: none;
          z-index: 0;
          font-weight: bold;
          white-space: nowrap;
        }
      `}</style>

      {/* Top action bar */}
      <div className="flex flex-wrap sm:flex-nowrap justify-between items-center w-full max-w-[794px] mb-4 sm:mb-6 gap-2 print:hidden px-2">
        <button 
          onClick={() => window.history.back()}
          className="text-slate-600 hover:text-slate-900 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-sm sm:text-lg font-bold text-slate-800">Salary Slip Preview</h1>
        <button 
          onClick={handlePrint}
          className="bg-slate-900 text-white px-4 py-1.5 sm:px-5 sm:py-2 rounded-lg shadow-md font-semibold text-xs sm:text-sm hover:bg-slate-800 transition-all flex items-center gap-1.5"
        >
          <Printer size={16} /> Print Salary Slip
        </button>
      </div>

      {/* Main Container Wrapper */}
      <div className="w-full max-w-[794px] p-0 sm:p-2 bg-transparent md:bg-slate-100 md:p-4 rounded-lg md:border md:border-slate-200 md:shadow-inner flex justify-center print:p-0 print:bg-transparent print:border-none print:shadow-none">
        
        {/* Printable Area */}
        <div 
          ref={printRef}
          className="print-area relative bg-white shadow-xl border border-gray-200 p-4 sm:p-6 md:p-10 overflow-hidden print:shadow-none print:border-none print:p-0 font-sans w-full max-w-[794px]"
        >
          <div className="watermark uppercase">Salary Slip</div>

          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-800 pb-4 mb-6 relative z-10 gap-3">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              {(payroll?.companyId?.logo || company?.logo) && (
                <img
                  src={cloudinaryUrl(payroll?.companyId?.logo || company?.logo, { format: "webp", width: 120, height: 120 })}
                  alt="Logo"
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain shrink-0"
                />
              )}
              <div className="text-left flex-1 min-w-0">
                <h1 className="text-base sm:text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase break-words leading-tight">
                  {payroll?.companyId?.fullname || payroll?.companyId?.name || company?.fullname || company?.name || 'COMPANY NAME'}
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-600 font-medium max-w-md leading-relaxed break-words mt-0.5">
                  {payroll?.companyId?.address || company?.address || 'Company Address Line 1, City, State'}
                </p>
                {(payroll?.companyId?.contact || company?.phone) && (
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Contact: {payroll?.companyId?.contact || company?.phone}
                  </p>
                )}
              </div>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
              <h2 className="text-sm sm:text-lg font-black text-slate-700 uppercase tracking-widest sm:border-b sm:border-slate-400 pb-0.5">
                Payslip
              </h2>
              <p className="text-xs text-slate-500 font-bold uppercase">
                {dayjs(`${payroll?.year}-${payroll?.month}-01`).format("MMMM YYYY")}
              </p>
            </div>
          </div>

          {/* Employee Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-6 bg-slate-50 p-3 sm:p-4 rounded-lg border border-slate-100 relative z-10 print:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500 font-bold text-[10px] uppercase">Employee Name</span>
                <span className="text-slate-800 font-extrabold text-xs uppercase">{payroll?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500 font-bold text-[10px] uppercase">Employee ID</span>
                <span className="text-slate-800 font-extrabold text-xs uppercase">{payroll?.employeeId?.empId || payroll?.empId || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500 font-bold text-[10px] uppercase">Designation</span>
                <span className="text-slate-800 font-extrabold text-xs uppercase">{payroll?.designation || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500 font-bold text-[10px] uppercase">Department</span>
                <span className="text-slate-800 font-extrabold text-xs uppercase">{payroll?.department || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500 font-bold text-[10px] uppercase">Date of Joining</span>
                <span className="text-slate-800 font-extrabold text-xs uppercase">{payroll?.employeeId?.createdAt ? dayjs(payroll.employeeId.createdAt).format("DD MMM YYYY") : 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500 font-bold text-[10px] uppercase">Bank Name</span>
                <span className="text-slate-800 font-extrabold text-xs uppercase">{payroll?.employeeId?.bankName || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500 font-bold text-[10px] uppercase">Account No</span>
                <span className="text-slate-800 font-extrabold text-xs uppercase">{payroll?.employeeId?.acnumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500 font-bold text-[10px] uppercase">PAN / IFSC</span>
                <span className="text-slate-800 font-extrabold text-xs uppercase">
                  {payroll?.employeeId?.pan || 'N/A'} / {payroll?.employeeId?.ifscCode || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="mb-6 relative z-10">
            <h3 className="text-[10px] font-bold text-slate-700 uppercase mb-2 px-1">Attendance Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 print:grid-cols-8 border border-slate-300 rounded overflow-hidden">
              {[
                { label: "Month Days", val: payroll?.monthDays, color: "text-slate-700" },
                { label: "Present", val: payroll?.present, color: "text-green-700" },
                { label: "Absent", val: payroll?.absent, color: "text-red-700" },
                { label: "Leaves", val: payroll?.leave, color: "text-amber-700" },
                { label: "Weekly Off", val: payroll?.weekOffs, color: "text-indigo-700" },
                { label: "Holidays", val: payroll?.holidays, color: "text-orange-700" },
                { label: "Work on WO", val: payroll?.options?.adjustedWeeklyOffMin !== undefined ? `${payroll.options.adjustedWeeklyOffMin} min` : (payroll?.weeklyOffWork ? `${payroll.weeklyOffWork} min` : "0 min"), color: "text-purple-700" },
                { label: "LWP", val: payroll?.lwp || 0, color: "text-rose-700" }
              ].map((item, i) => (
                <div key={i} className="border-b sm:border-b-0 border-r border-slate-200 last:border-0 text-center py-2 bg-white">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">{item.label}</p>
                  <p className={`text-xs font-black ${item.color}`}>{item.val || 0}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Earnings & Deductions Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 border border-slate-800 rounded overflow-hidden mb-6 relative z-10">
            <div className="border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between">
              <div>
                <div className="bg-slate-800 text-white px-3 py-1.5 flex justify-between uppercase font-bold text-[10px] tracking-wider">
                  <span>Earnings</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="p-0 space-y-0 divide-y divide-slate-100">
                  <div className="flex justify-between px-3 py-1.5 hover:bg-slate-50">
                    <span className="text-slate-700 font-medium text-xs">Basic Salary</span>
                    <span className="text-slate-900 font-bold text-xs">{formatRupee(payroll?.baseSalary || 0)}</span>
                  </div>
                  {payroll?.allowances?.map((e, i) => (
                    <div key={i} className="flex justify-between px-3 py-1.5 hover:bg-slate-50">
                      <div className="flex flex-col">
                        <span className="text-slate-700 font-medium text-xs">{e.name}</span>
                        {e.extraInfo && (
                          <span className="text-[9px] text-gray-500 font-normal italic">{e.extraInfo}</span>
                        )}
                      </div>
                      <span className="text-slate-900 font-bold text-xs">{formatRupee(e.amount)}</span>
                    </div>
                  ))}
                  {payroll?.bonuses?.map((e, i) => (
                    <div key={i} className="flex justify-between px-3 py-1.5 hover:bg-slate-50">
                      <div className="flex flex-col">
                        <span className="text-slate-700 font-medium text-xs">{e.name}</span>
                        {e.extraInfo && (
                          <span className="text-[9px] text-gray-500 font-normal italic">{e.extraInfo}</span>
                        )}
                      </div>
                      <span className="text-slate-900 font-bold text-xs">{formatRupee(e.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-100 border-t border-slate-300 px-3 py-2 flex justify-between uppercase font-bold text-xs text-slate-800">
                <span>Gross Earnings</span>
                <span>{formatRupee(
                  (payroll?.baseSalary || 0) + 
                  (payroll?.allowances?.reduce((a, b) => a + b.amount, 0) || 0) + 
                  (payroll?.bonuses?.reduce((a, b) => a + b.amount, 0) || 0)
                )}</span>
              </div>
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <div className="bg-rose-900 text-white px-3 py-1.5 flex justify-between uppercase font-bold text-[10px] tracking-wider">
                  <span>Deductions</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="p-0 space-y-0 divide-y divide-slate-100">
                  {payroll?.deductions?.map((d, i) => (
                    <div key={i} className="flex justify-between px-3 py-1.5 hover:bg-slate-50">
                      <div className="flex flex-col">
                        <span className="text-slate-700 font-medium text-xs">{d.name}</span>
                        {d.extraInfo && (
                          <span className="text-[9px] text-gray-500 font-normal italic">{d.extraInfo}</span>
                        )}
                      </div>
                      <span className="text-slate-900 font-bold text-xs">{formatRupee(d.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-100 border-t border-slate-300 px-3 py-2 flex justify-between uppercase font-bold text-xs text-slate-800">
                <span>Total Deductions</span>
                <span>{formatRupee(payroll?.deductions?.reduce((a, b) => a + b.amount, 0) || 0)}</span>
              </div>
            </div>
          </div>

          {/* Net Salary Summary */}
          <div className="bg-slate-800 text-white rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 relative z-10 shadow-md">
            <div className="text-left">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Net Salary Payable</p>
              <p className="text-xs font-medium italic opacity-90 capitalize break-words">
                In Words: {numberToWords(Math.floor(payroll?.netSalary || 0))} Rupees Only
              </p>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 border-slate-700/80 pt-2 sm:pt-0">
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {formatRupee(Math.floor(payroll?.netSalary || 0))}
              </span>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-12 sm:mt-20 grid grid-cols-2 gap-6 sm:gap-12 relative z-10">
            <div className="text-center pt-4 sm:pt-6 border-t border-dashed border-slate-300">
              <p className="text-xs font-bold uppercase text-slate-700 mb-0.5">{payroll?.name}</p>
              <p className="text-[9px] uppercase text-slate-500 font-bold tracking-wider">Employee Signature</p>
            </div>
            <div className="text-center pt-4 sm:pt-6 border-t border-dashed border-slate-300 relative">
               <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-15 pointer-events-none z-0">
                  {(payroll?.companyId?.logo || company?.logo) && (
                    <img src={cloudinaryUrl(payroll?.companyId?.logo || company?.logo, { width: 100 })} className="h-16 grayscale" alt="stamp" />
                  )}
               </div>
              <p className="text-xs font-bold uppercase text-slate-700 mb-0.5">
                {payroll?.companyId?.fullname || payroll?.companyId?.name || company?.fullname || company?.name || 'COMPANY NAME'}
              </p>
              <p className="text-[9px] uppercase text-slate-500 font-bold tracking-wider">Manager / Authorized Signatory</p>
            </div>
          </div>

          {/* Footer Disclaimer */}
          <div className="mt-10 pt-4 border-t border-slate-100 text-[9px] text-slate-400 text-center uppercase tracking-widest">
            This is a computer generated document and does not require a physical signature.
            <br/>
            Confidential - Internal Use Only
          </div>
        </div>
      </div>

      {/* Bottom Print Controls */}
      <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 no-print flex gap-2 sm:gap-3 print:hidden z-20">
         <button 
          onClick={() => window.history.back()}
          className="bg-white text-slate-700 px-4 py-2 sm:px-6 sm:py-3 rounded-full shadow-2xl font-bold border border-slate-200 hover:bg-slate-50 transition-all text-xs sm:text-sm flex items-center gap-2"
        >
          Cancel
        </button>
        <button 
          onClick={handlePrint}
          className="bg-slate-900 text-white px-5 py-2 sm:px-8 sm:py-3 rounded-full shadow-2xl font-bold hover:bg-slate-800 transition-all transform hover:scale-105 active:scale-95 text-xs sm:text-sm flex items-center gap-2"
        >
          Print Salary Slip
        </button>
      </div>
    </div>
  );
}
