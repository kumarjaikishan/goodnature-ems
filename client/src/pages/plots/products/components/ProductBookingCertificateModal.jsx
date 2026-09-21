import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import Modalbox from '../../../../components/custommodal/Modalbox';
import { Printer, Building2, User, MapPin, ShieldCheck, CheckCircle2, Layers } from 'lucide-react';
import { cloudinaryUrl } from '../../../../utils/imageurlsetter';

const ProductBookingCertificateModal = ({ open, onClose, booking }) => {
  const printRef = useRef(null);

  const { company: adminCompany } = useSelector((state) => state.user || {});
  const { companysetting: empCompany } = useSelector((state) => state.employee || {});
  const company = adminCompany || empCompany || {};
  const companyName = company?.name || company?.companyName || 'Good Nature EMS';
  const companyAddress = company?.address || 'Corporate Office: Good Nature Complex, Main Road, India';

  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const cust = booking.customerId || {};
  const prd = booking.productId || {};
  const spon = booking.sponsorId || {};
  const dims = booking.dimensionsSnapshot || prd.dimensions || {};

  const bookingDateStr = booking.bookingDate
    ? new Date(booking.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN');

  return (
    <Modalbox
      open={open}
      onClose={onClose}
      size="5xl"
      title="Product Booking Certificate"
      subtitle={`Certificate #${booking.bookingNumber || ''} • Official Unit Allocation`}
      bodyClassName="bg-slate-100/90 p-3 sm:p-5 md:p-6"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500 font-medium">
            Booking ID: <strong className="font-mono text-slate-800">{booking.bookingNumber}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Printer size={15} /> Print Certificate
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      {/* Print Styles for Clean Single-Page / A4 Printout */}
      <style>{`
        @media print {
          @page {
            size: portrait;
            margin: 10mm 12mm 10mm 12mm !important;
          }
          body * {
            visibility: hidden;
          }
          .certificate-print-root, .certificate-print-root * {
            visibility: visible;
          }
          .certificate-print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Center Wrapper */}
      <div className="w-full flex justify-center">
        {/* Certificate Paper Container */}
        <div
          ref={printRef}
          className="certificate-print-root w-full max-w-[850px] bg-white rounded-2xl border border-slate-200/90 shadow-md p-4 sm:p-6 md:p-7 relative text-slate-800 space-y-4 print:p-0 print:border-none print:shadow-none print:m-0"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {/* Inner Teal Double-Line Border Frame */}
          <div className="border-4 border-double border-teal-800/90 rounded-xl p-5 sm:p-6 md:p-7 space-y-5 relative overflow-hidden bg-white">
            {/* Subtle Watermark in Center */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none select-none">
              {company?.logo ? (
                <img
                  src={cloudinaryUrl(company.logo, { format: 'webp', width: 450, height: 450 })}
                  alt="Watermark Logo"
                  className="w-72 h-72 md:w-80 md:h-80 object-contain grayscale"
                />
              ) : (
                <Building2 size={340} className="text-teal-900" />
              )}
            </div>

            {/* 1. Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-teal-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  {company?.logo ? (
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-teal-200 shadow-xs shrink-0">
                      <img
                        className="w-full h-full object-cover"
                        src={cloudinaryUrl(company?.logo, { format: 'webp', width: 100, height: 100 })}
                        alt="Company Logo"
                      />
                    </div>
                  ) : (
                    <span className="p-2 rounded-xl bg-teal-800 text-white font-black text-lg shadow-sm shrink-0">
                      GN
                    </span>
                  )}
                  <div>
                    <h1 className="text-xl md:text-2xl font-black tracking-tight text-teal-950 uppercase leading-tight">
                      {companyName}
                    </h1>
                    <p className="text-[10px] sm:text-[11px] font-bold text-teal-700 uppercase tracking-widest">
                      Plot &amp; Fractional Land Development Division
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {companyAddress}
                </p>
              </div>

              <div className="text-left sm:text-right flex flex-col sm:items-end">
                <span className="inline-block px-3 py-1 bg-teal-800 text-white font-mono font-bold text-xs rounded-lg uppercase tracking-wider">
                  Official Product Certificate
                </span>
                <div className="text-xs text-slate-500 mt-1.5 font-medium">
                  Booking No: <strong className="font-mono text-slate-800">{booking.bookingNumber}</strong>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Date: <strong className="text-slate-800">{bookingDateStr}</strong>
                </div>
              </div>
            </div>

            {/* 2. Certificate Title */}
            <div className="text-center py-1 space-y-1">
              <h2 className="text-base sm:text-lg md:text-xl font-extrabold uppercase text-teal-900 tracking-wide">
                Certificate of Product Booking &amp; Allocation
              </h2>
              <p className="text-xs text-slate-600 font-medium max-w-xl mx-auto leading-relaxed">
                This certifies that the subscriber mentioned herein has booked fractional plot units under the official Good Nature scheme subject to the schedule and terms specified below.
              </p>
            </div>

            {/* 3. Customer & Sponsoring Associate Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-50/90 p-3.5 sm:p-4 rounded-xl border border-slate-200 text-xs">
              {/* Customer Details */}
              <div className="space-y-1.5">
                <div className="text-[11px] uppercase font-bold text-teal-800 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                  <User size={13} /> Subscriber / Customer Details
                </div>
                <div className="space-y-1 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Name:</span>
                    <span className="font-bold text-slate-900">{cust.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer ID:</span>
                    <span className="font-mono font-bold">{cust.customerCode || cust.customerId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Father/Husband:</span>
                    <span className="font-medium">{cust.fatherOrHusbandName || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mobile:</span>
                    <span className="font-medium">{cust.mobile || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Address:</span>
                    <span className="font-medium text-right max-w-[200px] truncate">{cust.currentAddress || cust.address || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Business Associate Details */}
              <div className="space-y-1.5">
                <div className="text-[11px] uppercase font-bold text-teal-800 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                  <ShieldCheck size={13} /> Sponsoring Associate Details
                </div>
                <div className="space-y-1 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Business Associate:</span>
                    <span className="font-bold text-slate-900">{spon.name || 'Direct Company'}</span>
                  </div>
                  {spon.sponsorCode && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Associate Code:</span>
                      <span className="font-mono font-bold">{spon.sponsorCode}</span>
                    </div>
                  )}
                  {spon.sponsorId && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Partner Supervisor:</span>
                      <span className="font-medium">{spon.sponsorId.name || '-'}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Booking Status:</span>
                    <span className="font-bold uppercase text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {booking.status || 'ACTIVE'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Product & Dimensional Specifications Table */}
            <div className="space-y-1.5">
              <div className="text-[11px] uppercase font-bold text-teal-800 flex items-center gap-1.5">
                <MapPin size={13} /> Product &amp; Dimensional Specifications
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-teal-50/70 border-b border-slate-200 text-teal-950 font-bold">
                    <tr>
                      <th className="p-2.5">Product Name &amp; Code</th>
                      <th className="p-2.5">Dimensions (N x S x E x W)</th>
                      <th className="p-2.5 text-center">Unit Area</th>
                      <th className="p-2.5 text-center">Quantity</th>
                      <th className="p-2.5 text-right">Unit Rate</th>
                      <th className="p-2.5 text-right">Total Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">
                        <div>{prd.productName || 'Micro Plot Unit'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{prd.productCode || 'PRD-001'}</div>
                      </td>
                      <td className="p-2.5">
                        <span className="font-mono font-semibold text-slate-800">
                          North: {dims.north ?? 1} ft | South: {dims.south ?? 1} ft
                          <br />
                          East: {dims.east ?? 2} ft | West: {dims.west ?? 2} ft
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-semibold">
                        {(prd.areaSqFt || 2)} Sq.Ft
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="font-bold text-slate-900 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          {booking.quantity || 1} {booking.quantity === 1 ? 'Unit' : 'Units'}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-semibold">
                        ₹{Number(booking.unitPrice || prd.unitPrice || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 text-right font-black text-teal-900 text-sm">
                        ₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Land Stock Sourcing & Plot Reference */}
            {((booking.landSourcing && booking.landSourcing.length > 0) || booking.plotId) && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-xs space-y-1.5">
                <div className="text-[11px] uppercase font-bold text-emerald-900 flex items-center gap-1.5">
                  <Layers size={13} className="text-emerald-700" /> Land Sourcing &amp; Allocation Reference
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-slate-700 font-medium">
                  {booking.landSourcing?.[0]?.agreementNumber && (
                    <div>
                      <span className="text-slate-400 text-[10px] block">Kisan Agreement</span>
                      <span className="font-bold text-slate-900 font-mono">{booking.landSourcing[0].agreementNumber}</span>
                    </div>
                  )}
                  {booking.landSourcing?.[0]?.mauja && (
                    <div>
                      <span className="text-slate-400 text-[10px] block">Mauja / Thana</span>
                      <span className="font-semibold text-slate-900">{booking.landSourcing[0].mauja} {booking.landSourcing[0].thanaNumber ? `(Thana #${booking.landSourcing[0].thanaNumber})` : ''}</span>
                    </div>
                  )}
                  {(booking.landSourcing?.[0]?.khataNumber || booking.landSourcing?.[0]?.khesraNumber) && (
                    <div>
                      <span className="text-slate-400 text-[10px] block">Khata / Khesra (Plot)</span>
                      <span className="font-semibold text-slate-900">Khata: {booking.landSourcing[0].khataNumber || '-'} | Plot: {booking.landSourcing[0].khesraNumber || '-'}</span>
                    </div>
                  )}
                  {booking.landSourcing?.[0]?.allocatedSqFt && (
                    <div>
                      <span className="text-slate-400 text-[10px] block">Allocated Area</span>
                      <span className="font-bold text-emerald-800">{booking.landSourcing[0].allocatedSqFt} Sq.Ft ({booking.landSourcing[0].allocatedDismil || (Math.round((booking.landSourcing[0].allocatedSqFt / 435.6) * 1000) / 1000)} Dismil)</span>
                    </div>
                  )}
                  {booking.plotId && (
                    <div>
                      <span className="text-slate-400 text-[10px] block">Master Plot Link</span>
                      <span className="font-bold text-slate-900">Plot #{booking.plotId.plotNumber || booking.plotId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. Financial Breakdown & Period Scheme */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-slate-50/90 p-3 sm:p-3.5 rounded-xl border border-slate-200">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Valuation</div>
                <div className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                  ₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Selected Period (Tenure)</div>
                <div className="text-sm sm:text-base font-extrabold text-teal-800 mt-0.5">
                  {booking.tenureMonths || 24} Months
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  {booking.paymentType === 'FULL_PAYMENT' ? 'Payment Scheme' : 'Initial Downpayment'}
                </div>
                <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
                  {booking.paymentType === 'FULL_PAYMENT'
                    ? '100% Upfront Paid'
                    : `₹${Number(booking.downPayment || 0).toLocaleString('en-IN')}`}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  {booking.paymentType === 'FULL_PAYMENT' ? 'Payment Status' : 'Monthly EMI'}
                </div>
                <div className="text-sm sm:text-base font-black text-emerald-700 mt-0.5">
                  {booking.paymentType === 'FULL_PAYMENT'
                    ? 'FULLY SETTLED'
                    : `₹${Number(booking.monthlyEmi || 0).toLocaleString('en-IN')}`}
                </div>
              </div>
            </div>

            {/* 6. Terms & Verification Signatures */}
            <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-slate-800">Terms &amp; Declarations:</div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  1. Fractional units allocated herein are subject to timely fulfillment of scheduled monthly installments.<br />
                  2. Certificate is valid upon administrative stamp and acknowledgment from Good Nature EMS.
                </p>
              </div>

              <div className="flex flex-col items-start sm:items-end justify-end space-y-2 text-left sm:text-right">
                <div className="h-8 border-b-2 border-slate-400 w-44" />
                <div className="text-[11px] font-bold uppercase text-slate-800">
                  Authorized Signatory
                  <div className="text-[10px] font-normal text-slate-500">{companyName}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modalbox>
  );
};

export default ProductBookingCertificateModal;
