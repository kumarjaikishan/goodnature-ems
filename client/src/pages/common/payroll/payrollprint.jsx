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

function formatRupee(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export default function PayslipPrintPage() {
  const printRef = useRef(null);
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [payroll, setPayroll] = useState(null);
  const [error, setError] = useState(null);
  const { company } = useSelector((state) => state.user);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: payroll
      ? `Payslip_${payroll.name || "Employee"}_${dayjs(`${payroll.year}-${payroll.month}-01`).format("MMM_YYYY")}`
      : "Payroll_Slip",
    removeAfterPrint: true,
  });

  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient({
          url: `payroll/${id}`,
        });
        setPayroll(data.payroll || null);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch payroll record.");
        toast.error("Failed to fetch payroll record");
      } finally {
        setLoading(false);
      }
    };
    fetchPayroll();
  }, [id]);

  const companyLogo = payroll?.companyId?.logo || company?.logo;
  const companyName =
    payroll?.companyId?.fullname ||
    payroll?.companyId?.name ||
    company?.fullname ||
    company?.name ||
    "COMPANY NAME";
  const companyAddress =
    payroll?.companyId?.address || company?.address || "";
  const companyPhone = payroll?.companyId?.contact || company?.phone || "";

  const payPeriod =
    payroll?.year && payroll?.month
      ? dayjs(`${payroll.year}-${payroll.month}-01`).format("MMMM YYYY")
      : "N/A";

  const grossEarnings =
    (payroll?.baseSalary || 0) +
    (payroll?.allowances?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0) +
    (payroll?.bonuses?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0);

  const totalDeductions =
    payroll?.deductions?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

  const netPayable = Math.floor(payroll?.netSalary || 0);

  const workOnWoValue =
    payroll?.options?.adjustedWeeklyOffMin !== undefined
      ? `${payroll.options.adjustedWeeklyOffMin} min`
      : payroll?.weeklyOffWork
        ? `${payroll.weeklyOffWork} min`
        : "0 min";

  const attendanceMetrics = [
    { label: "Month Days", val: payroll?.monthDays ?? 0, valueClass: "text-slate-900" },
    { label: "Present", val: payroll?.present ?? 0, valueClass: "text-emerald-700" },
    { label: "Absent", val: payroll?.absent ?? 0, valueClass: "text-rose-700" },
    { label: "Leaves", val: payroll?.leave ?? 0, valueClass: "text-slate-900" },
    { label: "Weekly Off", val: payroll?.weekOffs ?? 0, valueClass: "text-slate-900" },
    { label: "Holidays", val: payroll?.holidays ?? 0, valueClass: "text-slate-900" },
    { label: "Work on WO", val: workOnWoValue, valueClass: "text-slate-900" },
    { label: "LWP", val: payroll?.lwp ?? 0, valueClass: "text-rose-700" },
  ];

  const leftInfoRows = [
    { label: "Employee Name", value: payroll?.name || "N/A" },
    {
      label: "Employee ID",
      value: payroll?.employeeId?.empId || payroll?.empId || "N/A",
    },
    { label: "Designation", value: payroll?.designation || "N/A" },
    { label: "PAN Number", value: payroll?.employeeId?.pan || "N/A" },
  ];

  const rightInfoRows = [
    {
      label: "Date of Joining",
      value: payroll?.employeeId?.createdAt
        ? dayjs(payroll.employeeId.createdAt).format("DD MMM YYYY")
        : "N/A",
    },
    { label: "Bank Name", value: payroll?.employeeId?.bankName || "N/A" },
    { label: "Account No.", value: payroll?.employeeId?.acnumber || "N/A" },
    { label: "IFSC Code", value: payroll?.employeeId?.ifscCode || "N/A" },
  ];

  return (
    <div className="min-h-screen bg-slate-100/80 py-6 px-3 sm:px-6 print:p-0 print:bg-white">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-area {
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            height: auto !important;
            padding: 10mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
          .print-area * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Top Action Bar */}
      <div className="max-w-[794px] mx-auto mb-4 flex items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:inline">
          Payslip Preview — {payPeriod}
        </span>

        <button
          type="button"
          onClick={handlePrint}
          disabled={loading || !payroll}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-teal-700 rounded-md hover:bg-teal-800 transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          <Printer size={14} />
          Print
        </button>
      </div>

      {/* Loading / Error State */}
      {loading ? (
        <div className="max-w-[794px] mx-auto bg-white border border-slate-200 rounded-md p-8 sm:p-10 space-y-6 animate-pulse">
          <div className="flex justify-between items-start border-b border-slate-200 pb-5">
            <div className="space-y-2">
              <div className="h-5 w-56 bg-slate-200 rounded" />
              <div className="h-3 w-72 bg-slate-100 rounded" />
            </div>
            <div className="h-6 w-28 bg-slate-200 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-slate-100 rounded" />
            <div className="h-24 bg-slate-100 rounded" />
          </div>
          <div className="h-14 bg-slate-100 rounded" />
          <div className="h-44 bg-slate-100 rounded" />
        </div>
      ) : error || !payroll ? (
        <div className="max-w-[794px] mx-auto bg-white border border-slate-200 rounded-md p-10 text-center">
          <p className="text-sm font-medium text-slate-800">
            {error || "Payroll record not found."}
          </p>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft size={14} />
            Go Back
          </button>
        </div>
      ) : (
        /* Official A4 Document Sheet */
        <div
          ref={printRef}
          className="print-area relative max-w-[794px] mx-auto bg-white border border-slate-300 shadow-sm p-6 sm:p-10 font-sans text-slate-900 print:border-none print:shadow-none overflow-hidden"
        >
          {/* Watermark Logo - strictly positioned in the background layer */}
          {companyLogo && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "300px",
                height: "300px",
                backgroundImage: `url(${cloudinaryUrl(companyLogo, { format: "webp", width: 500 })})`,
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                opacity: 0.08,
                zIndex: 0,
                pointerEvents: "none",
              }}
            />
          )}

          {/* Foreground Document Layer */}
          <div className="relative z-10">
            {/* Letterhead / Header */}
            <header className="flex flex-col sm:flex-row print:flex-row justify-between items-start sm:items-center print:items-center gap-4 border-b-2 border-teal-800 pb-4 mb-6">
              <div className="flex items-center gap-3.5 min-w-0">
                {companyLogo && (
                  <img
                    src={cloudinaryUrl(companyLogo, {
                      format: "webp",
                      width: 120,
                      height: 120,
                    })}
                    alt={`${companyName} Logo`}
                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight uppercase leading-snug break-words">
                    {companyName}
                  </h1>
                  {companyAddress && (
                    <p className="text-[11px] text-slate-600 leading-relaxed max-w-md break-words mt-0.5">
                      {companyAddress}
                    </p>
                  )}
                  {companyPhone && (
                    <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                      Tel: {companyPhone}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-left sm:text-right print:text-right w-full sm:w-auto print:w-auto flex sm:flex-col print:flex-col justify-between items-center sm:items-end print:items-end border-t sm:border-t-0 print:border-t-0 pt-2 sm:pt-0 print:pt-0 border-slate-200">
                <h2 className="text-sm sm:text-lg font-black text-slate-700 uppercase tracking-widest sm:border-b print:border-b sm:border-slate-400 print:border-slate-400 pb-0.5">
                  Payslip
                </h2>
                <p className="text-xs text-slate-500 font-bold uppercase mt-0.5">
                  {payPeriod}
                </p>
              </div>
            </header>

            {/* Employee & Payment Details */}
            <section className="mb-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 border border-slate-300 rounded-sm overflow-hidden divide-y sm:divide-y-0 sm:divide-x print:divide-y-0 print:divide-x divide-slate-300 bg-white/70">
                <div className="divide-y divide-slate-200">
                  {leftInfoRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between items-center px-3 py-1.5 text-xs gap-3"
                    >
                      <span className="text-slate-500 font-medium shrink-0">
                        {row.label}
                      </span>
                      <span className="text-slate-900 font-semibold text-right uppercase truncate tabular-nums">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="divide-y divide-slate-200">
                  {rightInfoRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between items-center px-3 py-1.5 text-xs gap-3"
                    >
                      <span className="text-slate-500 font-medium shrink-0">
                        {row.label}
                      </span>
                      <span className="text-slate-900 font-semibold text-right uppercase truncate tabular-nums">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Attendance Summary */}
            <section className="mb-5">
              <h2 className="text-[10px] font-semibold text-teal-800 uppercase tracking-wider mb-1.5">
                Attendance Summary
              </h2>
              <div className="grid grid-cols-4 sm:grid-cols-8 print:grid-cols-8 border border-slate-300 rounded-sm overflow-hidden divide-x divide-y sm:divide-y-0 print:divide-y-0 divide-slate-200 bg-white/70">
                {attendanceMetrics.map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="bg-teal-50/70 border-b border-slate-200 px-1.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-teal-900 truncate">
                      {item.label}
                    </div>
                    <div className={`py-1.5 px-1 text-xs font-semibold tabular-nums ${item.valueClass}`}>
                      {item.val}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Earnings & Deductions Table */}
            <section className="mb-5">
              <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 border border-slate-800 rounded-sm overflow-hidden divide-y md:divide-y-0 md:divide-x print:divide-y-0 print:divide-x divide-slate-800 bg-white/80">
                {/* Earnings Column */}
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="bg-slate-800 text-white px-3 py-2 flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span>Earnings</span>
                      <span>Amount (INR)</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      <div className="flex justify-between items-center px-3 py-2 text-xs">
                        <span className="text-slate-700 font-medium">
                          Basic Salary
                        </span>
                        <span className="text-slate-900 font-bold tabular-nums">
                          {formatRupee(payroll?.baseSalary || 0)}
                        </span>
                      </div>
                      {payroll?.allowances?.map((item, i) => (
                        <div
                          key={`allowance-${i}`}
                          className="flex justify-between items-start px-3 py-2 text-xs gap-2"
                        >
                          <div className="flex flex-col">
                            <span className="text-slate-700 font-medium">
                              {item.name}
                            </span>
                            {item.extraInfo && (
                              <span className="text-[10px] text-slate-500 italic">
                                {item.extraInfo}
                              </span>
                            )}
                          </div>
                          <span className="text-slate-900 font-bold tabular-nums shrink-0">
                            {formatRupee(item.amount)}
                          </span>
                        </div>
                      ))}
                      {payroll?.bonuses?.map((item, i) => (
                        <div
                          key={`bonus-${i}`}
                          className="flex justify-between items-start px-3 py-2 text-xs gap-2"
                        >
                          <div className="flex flex-col">
                            <span className="text-slate-700 font-medium">
                              {item.name}
                            </span>
                            {item.extraInfo && (
                              <span className="text-[10px] text-slate-500 italic">
                                {item.extraInfo}
                              </span>
                            )}
                          </div>
                          <span className="text-slate-900 font-bold tabular-nums shrink-0">
                            {formatRupee(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-100 border-t border-slate-300 px-3 py-2 flex justify-between items-center text-xs font-bold text-slate-800">
                    <span className="uppercase tracking-wide text-[11px]">
                      Gross Earnings
                    </span>
                    <span className="tabular-nums">
                      {formatRupee(grossEarnings)}
                    </span>
                  </div>
                </div>

                {/* Deductions Column */}
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="bg-rose-900 text-white px-3 py-2 flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span>Deductions</span>
                      <span>Amount (INR)</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {payroll?.deductions?.length > 0 ? (
                        payroll.deductions.map((item, i) => (
                          <div
                            key={`deduction-${i}`}
                            className="flex justify-between items-start px-3 py-2 text-xs gap-2"
                          >
                            <div className="flex flex-col">
                              <span className="text-slate-700 font-medium">
                                {item.name}
                              </span>
                              {item.extraInfo && (
                                <span className="text-[10px] text-slate-500 italic">
                                  {item.extraInfo}
                                </span>
                              )}
                            </div>
                            <span className="text-slate-900 font-bold tabular-nums shrink-0">
                              {formatRupee(item.amount)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-xs text-slate-400">
                          No deductions for this period
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-100 border-t border-slate-300 px-3 py-2 flex justify-between items-center text-xs font-bold text-slate-800">
                    <span className="uppercase tracking-wide text-[11px]">
                      Total Deductions
                    </span>
                    <span className="tabular-nums">
                      {formatRupee(totalDeductions)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Net Pay Summary */}
            <section className="mb-10 border border-teal-200 border-l-4 border-l-teal-700 bg-teal-50/60 px-4 py-3 flex flex-col sm:flex-row print:flex-row justify-between items-start sm:items-center print:items-center gap-2 rounded-r-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-800">
                  Net Salary Payable
                </p>
                <p className="text-xs text-slate-700 mt-0.5 capitalize break-words">
                  In Words: {numberToWords(netPayable)} Rupees Only
                </p>
              </div>
              <div className="sm:text-right print:text-right w-full sm:w-auto print:w-auto border-t sm:border-t-0 print:border-t-0 border-teal-200/80 pt-2 sm:pt-0 print:pt-0">
                <span className="text-lg sm:text-xl font-semibold text-teal-950 tracking-tight tabular-nums">
                  {formatRupee(netPayable)}
                </span>
              </div>
            </section>

            {/* Signatures */}
            <section className="mt-12 sm:mt-16 print:mt-16 grid grid-cols-2 gap-8 sm:gap-14">
              <div className="text-center pt-3 border-t border-slate-300">
                <p className="text-xs font-semibold uppercase text-slate-800">
                  {payroll?.name || "Employee"}
                </p>
                <p className="text-[10px] uppercase text-slate-500 tracking-wider mt-0.5">
                  Employee Signature
                </p>
              </div>

              <div className="text-center pt-3 border-t border-slate-300 relative">
                {companyLogo && (
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-15 pointer-events-none">
                    <img
                      src={cloudinaryUrl(companyLogo, { width: 100 })}
                      className="h-14 grayscale"
                      alt="Company Stamp"
                    />
                  </div>
                )}
                <p className="text-xs font-semibold uppercase text-slate-800">
                  {companyName}
                </p>
                <p className="text-[10px] uppercase text-slate-500 tracking-wider mt-0.5">
                  Authorized Signatory
                </p>
              </div>
            </section>

            {/* Footer Disclaimer */}
            <footer className="mt-8 pt-3 border-t border-slate-200 text-[10px] text-slate-400 text-center tracking-wide">
              This is a computer-generated payslip and does not require a physical signature. Confidential — Internal Use Only.
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
