import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import { Printer, FileText } from 'lucide-react';
import { toast } from '../../utils/toast';
import { cloudinaryUrl } from '../../utils/imageurlsetter';

const PlotBookingFormPage = () => {
  const formRef = useRef(null);

  const { company: adminCompany } = useSelector((state) => state.user || {});
  const { companysetting: empCompany } = useSelector((state) => state.employee || {});
  const company = adminCompany || empCompany || {};
  const companyName = company?.name || 'Good Nature Projects Pvt. Ltd.';
  const companyAddress = company?.address || 'Good Nature Complex, Main Road, Bihar - 803118';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-2">
      {/* Top Action Bar (Print Button only) */}
      <div className="no-print flex justify-center items-center">
        <button
          onClick={handlePrint}
          type="button"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer border-none"
        >
          <Printer size={18} />
          Print Form
        </button>
      </div>

      {/* Embedded Print & Page Setup Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html, body, #root, main, div:has(> .printable-form-container) {
            width: 210mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: Arial, 'Segoe UI', Inter, -apple-system, BlinkMacSystemFont, sans-serif !important;
          }
          /* Hide app layout header, sidebar, navbar, mobile overlays and top action bar */
          .no-print, nav, header, aside, footer, [class*="fixed"], [class*="backdrop"], [class*="overlay"] {
            display: none !important;
          }
          main {
            margin-left: 0 !important;
            margin-right: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .printable-form-container {
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
          }
          .printable-page {
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 8mm 10mm !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            box-sizing: border-box !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            overflow: hidden !important;
          }
          .printable-page:last-child {
            page-break-after: avoid !important;
            break-after: auto !important;
          }
        }
      `}</style>

      {/* Printable Form Wrapper (Renders 2 distinct pages for front & back) */}
      <div ref={formRef} className="printable-form-container  dark:bg-slate-950 p-2 sm:p-6 rounded-xl space-y-6">

        {/* ==================== PAGE 1: APPLICATION FORM ==================== */}
        <div className="printable-page relative max-w-4xl mx-auto bg-white border-none p-5 sm:p-6 shadow-md text-black font-sans text-left overflow-hidden">

          {/* Background Watermark */}
          <div className="absolute inset-0 pointer-events-none select-none z-0 flex items-center justify-center opacity-[0.04] print:opacity-[0.04]">
            {company?.logo ? (
              <img
                src={cloudinaryUrl(company.logo, { format: "webp", width: 400, height: 400 })}
                alt="Watermark"
                className="w-[28rem] h-[28rem] object-contain filter grayscale"
              />
            ) : (
              <span className="text-7xl font-black uppercase tracking-widest text-slate-400">{companyName}</span>
            )}
          </div>

          {/* HEADER SECTION */}
          <div className="relative z-10 flex flex-row justify-between items-center border-b-2 border-gray-600 pb-3 mb-1 gap-2">
            {/* Logo / Brand Info */}
            <div className="flex items-center space-x-3">
              {company?.logo ? (
                <div className="w-14 h-14 shrink-0 overflow-hidden flex items-center justify-center">
                  <img
                    src={cloudinaryUrl(company.logo, { format: "webp", width: 120, height: 120 })}
                    alt="Company Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : null}
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight uppercase text-black leading-none">
                  {companyName}
                </h1>
                <p className="text-[11px] font-bold tracking-wider text-gray-900 uppercase mt-0.5">
                  PLOT BOOKING & LAND DEVELOPMENT
                </p>
                <p className="text-[9px] font-medium text-gray-600 leading-tight mt-0.5">
                  {companyAddress}
                </p>
              </div>
            </div>

            {/* Ref/Customer ID */}
            <div className="text-right">
              <div className="space-y-1 text-xs sm:text-sm font-semibold">
                <div className="flex items-center justify-end space-x-1.5">
                  <span>Customer ID No. </span>
                  <input type="text" className="border-b border-black w-28 sm:w-32 focus:outline-none px-1 text-center bg-transparent" />
                </div>
                <div className="flex items-center justify-end space-x-1.5">
                  <span>Booking No. </span>
                  <input type="text" className="border-b border-black w-28 sm:w-32 focus:outline-none px-1 text-center bg-transparent" />
                </div>
              </div>
            </div>
          </div>

          {/* FORM BODY PAGE 1 */}
          <form onSubmit={(e) => e.preventDefault()} className="relative z-10 space-y-3 text-xs">

            {/* FORM TITLE BANNER (Below Header Border & Above Project Details) */}
            <div className="text-center py-1  mb-1">
              <h3 className="text-base sm:text-lg font-black uppercase text-gray-600  m-0">
                NEELKANTH CITY PLOT BOOKING APPLICATION
              </h3>
            </div>

            {/* TOP GRID: PROJECT DETAILS + PHOTO PLACEHOLDER */}
            <div className="grid grid-cols-4 gap-3">

              {/* Project Details (3 cols) */}
              <div className="col-span-3 border border-dashed border-gray-400 p-2.5 rounded-sm space-y-2">
                <h3 className="font-bold text-xs bg-gray-200 px-2 py-0.5 border-b border-gray-300 uppercase tracking-wider mb-1.5 text-black">
                  Project Details
                </h3>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold whitespace-nowrap">Plot No.:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold whitespace-nowrap">Plot Size:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold whitespace-nowrap">Rate/Sq.Yd:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold whitespace-nowrap">Total Amount:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold whitespace-nowrap">Booking Type:</span>
                    <label className="inline-flex items-center space-x-1 cursor-pointer">
                      <input type="checkbox" className="form-checkbox h-3 w-3 text-emerald-600 rounded-none border-black" />
                      <span>Full</span>
                    </label>
                    <label className="inline-flex items-center space-x-1 cursor-pointer">
                      <input type="checkbox" className="form-checkbox h-3 w-3 text-emerald-600 rounded-none border-black" />
                      <span>D.P + EMI</span>
                    </label>
                    <label className="inline-flex items-center space-x-1 cursor-pointer">
                      <input type="checkbox" className="form-checkbox h-3 w-3 text-emerald-600 rounded-none border-black" />
                      <span>EMI</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold whitespace-nowrap">EMI Amt.:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold whitespace-nowrap">No. of EMI:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                </div>

                {/* Dimensions (N/S/E/W) */}
                <div className="pt-1 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-1 text-[10px]">
                  <div className="flex flex-col space-y-0.5">
                    <span className="font-semibold text-gray-700">North (उत्तर): <span className="text-[8.5px] text-teal-800 font-medium">पूरब-पश्चिम जानिब उत्तर</span></span>
                    <input type="text" placeholder="ft" className="border-b border-black w-full focus:outline-none px-0.5 text-center bg-transparent text-[10px]" />
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <span className="font-semibold text-gray-700">South (दक्षिण): <span className="text-[8.5px] text-teal-800 font-medium">पूरब-पश्चिम जानिब दक्षिण</span></span>
                    <input type="text" placeholder="ft" className="border-b border-black w-full focus:outline-none px-0.5 text-center bg-transparent text-[10px]" />
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <span className="font-semibold text-gray-700">East (पूरब): <span className="text-[8.5px] text-teal-800 font-medium">उत्तर-दक्षिण जानिब पूरब</span></span>
                    <input type="text" placeholder="ft" className="border-b border-black w-full focus:outline-none px-0.5 text-center bg-transparent text-[10px]" />
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <span className="font-semibold text-gray-700">West (पश्चिम): <span className="text-[8.5px] text-teal-800 font-medium">उत्तर-दक्षिण जानिब पश्चिम</span></span>
                    <input type="text" placeholder="ft" className="border-b border-black w-full focus:outline-none px-0.5 text-center bg-transparent text-[10px]" />
                  </div>
                </div>

                {/* Chaudhi (Surroundings) */}
                <div className="pt-1 border-t border-gray-200 grid grid-cols-2 gap-1 text-[11px]">
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold">चौहद्दी उत्तर (N):</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent text-[10px]" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold">चौहद्दी दक्षिण (S):</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent text-[10px]" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold">चौहद्दी पूरब (E):</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent text-[10px]" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold">चौहद्दी पश्चिम (W):</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent text-[10px]" />
                  </div>
                </div>

              </div>

              {/* Photo Box (1 col) */}
              <div className="col-span-1 flex items-center justify-end">
                <div className="w-[35mm] h-[45mm] min-w-[30mm] min-h-[40mm] rounded-md border-2 border-dashed border-gray-400 flex flex-col items-center justify-center p-1 text-center text-[10px] leading-tight text-gray-500 bg-gray-50/50">
                  <span>Passport<br />Size<br />Photo<br /><span className="text-[8px] font-mono text-gray-400">(3.5 x 4.5 cm)</span></span>
                </div>
              </div>
            </div>

            {/* PERSONAL DETAILS */}
            <div className="border border-dashed border-gray-400 p-2.5 rounded-sm space-y-2">
              <h3 className="font-bold text-xs bg-gray-200 px-2 py-0.5 border-b border-gray-300 uppercase tracking-wider mb-1 text-black">
                Personal Details
              </h3>

              <div className="text-xs space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold whitespace-nowrap">Name:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold whitespace-nowrap">Father's/Husband's Name:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold whitespace-nowrap">PIN:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold whitespace-nowrap">Mobile No:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 items-center">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">Gender:</span>
                    <label className="inline-flex items-center space-x-1 cursor-pointer">
                      <input type="checkbox" className="form-checkbox h-3 w-3 text-emerald-600 rounded-none border-black" />
                      <span>Male</span>
                    </label>
                    <label className="inline-flex items-center space-x-1 cursor-pointer">
                      <input type="checkbox" className="form-checkbox h-3 w-3 text-emerald-600 rounded-none border-black" />
                      <span>Female</span>
                    </label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold whitespace-nowrap">Date of Birth:</span>
                    <input type="text" placeholder="DD/MM/YYYY" className="border-b border-black w-full focus:outline-none px-1 bg-transparent placeholder:text-gray-400" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold whitespace-nowrap">Age:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold whitespace-nowrap">Adhaar No.:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold whitespace-nowrap">PAN No.:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold whitespace-nowrap">Email:</span>
                    <input type="email" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold whitespace-nowrap">Profession:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                </div>
              </div>
            </div>

            {/* ADDRESS DETAILS */}
            <div className="border border-dashed border-gray-400 rounded-sm p-2.5">
              <h3 className="font-bold text-xs bg-gray-200 px-2 py-0.5 border-b border-gray-300 uppercase tracking-wider mb-2 text-black">
                Address Details
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold whitespace-nowrap w-20">Vill/Town:</span>
                  <input type="text" name="village" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-semibold whitespace-nowrap w-24">Police Station:</span>
                  <input type="text" name="police_station" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-semibold whitespace-nowrap w-20">Post Office:</span>
                  <input type="text" name="post_office" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-semibold whitespace-nowrap w-24">Block:</span>
                  <input type="text" name="block" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-semibold whitespace-nowrap w-20">District:</span>
                  <input type="text" name="district" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-semibold whitespace-nowrap w-20">PIN Code:</span>
                  <input type="text" maxLength="6" name="pincode" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-semibold whitespace-nowrap w-24">State:</span>
                  <input type="text" name="state" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-semibold whitespace-nowrap w-20">Country:</span>
                  <input type="text" maxLength="6" name="pincode" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                </div>
              </div>
            </div>

            {/* NOMINEE'S INFORMATION */}
            <div className="border border-dashed border-gray-400 p-2.5 rounded-sm space-y-2">
              <h3 className="font-bold text-xs bg-gray-200 px-2 py-0.5 border-b border-gray-300 uppercase tracking-wider mb-1 text-black">
                Nominee's Information
              </h3>

              <div className="text-xs space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold whitespace-nowrap">Nominee's Name:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold whitespace-nowrap">Father's/Husband's Name:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold whitespace-nowrap">Nominee's Address:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold whitespace-nowrap">Mobile No:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold whitespace-nowrap">Relationship with Applicant:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold whitespace-nowrap">Date of Birth:</span>
                    <input type="text" placeholder="DD/MM/YYYY" className="border-b border-black w-full focus:outline-none px-1 bg-transparent placeholder:text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* BOOKING PAYMENT DETAILS */}
            <div className="border border-dashed border-gray-400 p-2.5 rounded-sm space-y-2">
              <h3 className="font-bold text-xs bg-gray-200 px-2 py-0.5 border-b border-gray-300 uppercase tracking-wider mb-1 text-black">
                Booking Payment Details
              </h3>

              <div className="text-xs space-y-2">
                <div className="grid grid-cols-3 gap-2 items-center">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">Payment Mode:</span>
                    <label className="inline-flex items-center space-x-1 cursor-pointer">
                      <input type="checkbox" className="form-checkbox h-3 w-3 text-emerald-600 rounded-none border-black" />
                      <span>Cash</span>
                    </label>
                    <label className="inline-flex items-center space-x-1 cursor-pointer">
                      <input type="checkbox" className="form-checkbox h-3 w-3 text-emerald-600 rounded-none border-black" />
                      <span>Cheque</span>
                    </label>
                    <label className="inline-flex items-center space-x-1 cursor-pointer">
                      <input type="checkbox" className="form-checkbox h-3 w-3 text-emerald-600 rounded-none border-black" />
                      <span>IMPS</span>
                    </label>
                  </div>
                  <div className="flex items-center space-x-1 col-span-2">
                    <span className="font-semibold whitespace-nowrap">Date:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold whitespace-nowrap">Bank Name & Branch:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold whitespace-nowrap">Cheque/ Trans. No.:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold whitespace-nowrap">Amount Rs:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                  <div className="flex items-center space-x-1 col-span-2">
                    <span className="font-semibold whitespace-nowrap">Amount in words:</span>
                    <input type="text" className="border-b border-black w-full focus:outline-none px-1 bg-transparent" />
                  </div>
                </div>
              </div>
            </div>

            {/* ENCLOSURES CHECKBOXES */}
            <div className="border border-dashed border-gray-400 p-2.5 rounded-sm space-y-1.5">
              <p className="text-xs font-semibold mb-1">The following enclosures are attached with the form</p>
              <div className="grid grid-cols-6 gap-1 text-xs">
                <label className="inline-flex items-center space-x-1 cursor-pointer">
                  <input type="checkbox" className="form-checkbox h-3 w-3 text-emerald-600 rounded-none border-black" />
                  <span>PAN Card</span>
                </label>
                <label className="inline-flex items-center space-x-1 cursor-pointer">
                  <input type="checkbox" className="form-checkbox h-3 w-3 text-emerald-600 rounded-none border-black" />
                  <span>Aadhar Card</span>
                </label>
                <label className="inline-flex items-center space-x-1 cursor-pointer">
                  <input type="checkbox" className="form-checkbox h-3 w-3 text-emerald-600 rounded-none border-black" />
                  <span>Voter ID Card</span>
                </label>
                <label className="inline-flex items-center space-x-1 cursor-pointer">
                  <input type="checkbox" className="form-checkbox h-3 w-3 text-emerald-600 rounded-none border-black" />
                  <span>Passport</span>
                </label>
                <label className="inline-flex items-center space-x-1 cursor-pointer">
                  <input type="checkbox" className="form-checkbox h-3 w-3 text-emerald-600 rounded-none border-black" />
                  <span>Driving License</span>
                </label>

                <label className="inline-flex items-center space-x-1 cursor-pointer">
                  <input type="checkbox" className="form-checkbox h-3 w-3 text-emerald-600 rounded-none border-black" />
                  <span>Other</span>
                </label>
              </div>
            </div>

            {/* INITIAL SIGNATURES ROW */}
            <div className="grid grid-cols-3 gap-4 pt-15 text-center text-xs">
              <div>
                <div className="border-b border-black mb-1"></div>
                <p className="font-bold">Buyer's Sign.</p>
              </div>
              <div>
                <div className="border-b border-black mb-1"></div>
                <p className="font-bold">Approved By</p>
              </div>
              <div>
                <div className="border-b border-black mb-1"></div>
                <p className="font-bold">Date and Place</p>
              </div>
            </div>

          </form>
        </div>


        {/* ==================== PAGE 2: TERMS, CONDITIONS & DECLARATION ==================== */}
        <div className="printable-page relative max-w-4xl mx-auto bg-white border-none p-5 sm:p-6 shadow-md text-black font-sans text-left flex flex-col justify-between overflow-hidden">

          {/* Background Watermark */}
          <div className="absolute inset-0 pointer-events-none select-none z-0 flex items-center justify-center opacity-[0.04] print:opacity-[0.04]">
            {company?.logo ? (
              <img
                src={cloudinaryUrl(company.logo, { format: "webp", width: 400, height: 400 })}
                alt="Watermark"
                className="w-[28rem] h-[28rem] object-contain filter grayscale"
              />
            ) : (
              <span className="text-7xl font-black uppercase tracking-widest text-slate-400">{companyName}</span>
            )}
          </div>

          <div className="relative z-10 space-y-4">
            {/* TERMS AND CONDITIONS */}
            <div>
              <h3 className="font-bold text-center text-sm uppercase underline mb-3 text-black">
                TERMS AND CONDITIONS (नियम एवं शर्तें)
              </h3>
              <ol className="list-decimal list-inside text-[10.5px] sm:text-[11px] space-y-2.5 text-gray-900 leading-relaxed">
                <li>
                  <span className="font-semibold">Plot Area & Allotment:</span> All brochures, maps and plans indicate gross plot area. Gross plot area includes contribution towards roads, common plots and township amenities.
                </li>
                <li>
                  <span className="font-semibold">Statutory Charges:</span> Stamp duty, registration fee, legal expenses, electricity and all present/future taxes shall be borne exclusively by the purchaser.
                </li>
                <li>
                  <span className="font-semibold">Payment Instrument:</span> All payments towards plot booking and installments must be made in favor of <span className="font-bold">{companyName}</span> only.
                </li>
                <li>
                  <span className="font-semibold">EMI Due Date & Grace Period:</span> Monthly EMI is due on the <span className="font-bold">1st of every month</span>. Grace period is allowed till the <span className="font-bold">14th</span>. Late fine at <span className="font-bold">0.05% per day</span> will apply from the 1st if payment is received on or after the 15th.
                </li>
                <li>
                  <span className="font-semibold">Default & Cancellation:</span> If the purchaser fails to pay 3 consecutive monthly EMIs or defaults beyond 90 days, the company reserves the right to cancel the booking after issuing a 30-day written notice.
                </li>
                <li>
                  <span className="font-semibold">Cancellation & Refund:</span> In case of voluntary cancellation by the buyer, <span className="font-bold">20% earnest money</span> and applicable late fines will be forfeited. The remaining balance will be refunded without interest within 3 months of cancellation request.
                </li>
                <li>
                  <span className="font-semibold">Possession & Construction:</span> Physical possession of the plot will be handed over within 12 months after 100% full payment realization. Boundary construction and statutory building approvals are buyer's responsibility.
                </li>
                <li>
                  <span className="font-semibold">Road Width Contribution:</span> For 20 ft wide internal roads, 16 ft road land will be provided by the company and 2 ft frontage space shall be contributed by purchasers on each side.
                </li>
                <li>
                  <span className="font-semibold">Cheque Bounce Charges:</span> A penalty charge of <span className="font-bold">Rs. 500/-</span> will be levied on every cheque return/dishonor event and must be paid by the purchaser.
                </li>
                <li>
                  <span className="font-semibold">Jurisdiction & Arbitration:</span> Any dispute arising out of this booking shall be resolved via arbitration by a Sole Arbitrator appointed by the company. Exclusive legal jurisdiction lies with Courts at <span className="font-bold">Bihar Sharif, Nalanda</span> only.
                </li>
              </ol>
            </div>

            {/* DECLARATION SECTION */}
            <div className="pt-4 border-t border-dashed border-gray-400">
              <h3 className="font-bold text-sm uppercase underline mb-2 text-black">DECLARATION</h3>
              <p className="text-xs text-justify font-medium leading-relaxed text-gray-900">
                I declare that I have fully read, heard and understood the project layout, plot plan and methodology and terms and conditions of the company. I agree with all the terms and conditions of the company.
              </p>

              {/* DATE / PLACE & REVENUE STAMP BOX */}
              <div className="flex justify-between items-end pt-8 text-xs">
                <div className="space-y-3 text-black">
                  <div><span className="font-bold">Date:</span> .....................................</div>
                  <div><span className="font-bold">Place:</span> .....................................</div>
                </div>

                {/* Revenue Stamp Placeholder */}
                <div className="flex flex-col items-center border-t w-60 pt-1">
                  <span className="font-bold text-[10px] text-black">Buyer's Signature</span>
                </div>
              </div>
            </div>
          </div>

          {/* CORPORATE FOOTER */}
          <div className="relative z-10 border-t border-dashed border-gray-400 pt-3 mt-6 text-center text-[10px] space-y-0.5 text-gray-800">
            <p className="font-semibold">
              Corporate Office: {companyAddress}
            </p>
          </div>

        </div>

      </div>

      {/* Bottom Action Bar (Print Button only) */}
      <div className="no-print flex justify-center items-center mt-6 mb-4">
        <button
          onClick={handlePrint}
          type="button"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors shadow-md cursor-pointer border-none"
        >
          <Printer size={18} />
          Print Form
        </button>
      </div>
    </div>
  );
};

export default PlotBookingFormPage;
