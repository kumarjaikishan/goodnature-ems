import React from 'react';
import Modalbox from '../../../../components/custommodal/Modalbox';
import { useSelector } from 'react-redux';
import { Printer, X, Receipt, CheckCircle, Clock } from 'lucide-react';
import { cloudinaryUrl } from '../../../../utils/imageurlsetter';
import numberToWords from '../../../../utils/numToWord';

const ProductReceiptModal = ({ open, onClose, collection }) => {
  const { company: adminCompany } = useSelector((state) => state.user || {});
  const { companysetting: empCompany } = useSelector((state) => state.employee || {});
  const company = adminCompany || empCompany || {};
  const companyName = company?.name || 'Good Nature Projects Pvt. Ltd.';
  const companyAddress = company?.address || 'Good Nature Complex, Main Road, Bihar - 803118';
  const companyMobile = company?.mobile || company?.phone || '7766954518';

  if (!collection) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatReceiptDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '-';
    return dt.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const amountPaid = Number(collection.amountPaid || 0);
  const principalPaid = Number(collection.principalPaid || 0);
  const lateFinePaid = Number(collection.lateFinePaid || 0);
  const lateFineRebate = Number(collection.lateFineRebate || 0);
  const customer = collection.customer || {};
  const product = collection.product || {};
  const sponsor = collection.sponsor || {};

  return (
    <Modalbox open={open} onClose={onClose}>
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden font-sans">
        {/* Modal Action Header (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-teal-800 text-white print:hidden">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-emerald-300" />
            <h3 className="text-base font-bold tracking-wide">Product Collection Receipt Bill</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Bill
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-teal-700/80 rounded-lg text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-6 sm:p-8 text-slate-800 printable-receipt relative">
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .printable-receipt, .printable-receipt * {
                visibility: visible;
              }
              .printable-receipt {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 10mm 15mm !important;
                background: white !important;
              }
            }
          `}</style>

          {/* Company Brand Header */}
          <div className="flex justify-between items-start border-b-2 border-teal-800 pb-4 mb-4">
            <div className="flex items-center gap-3.5">
              {company?.logo ? (
                <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-slate-100 flex items-center justify-center bg-slate-50">
                  <img
                    src={cloudinaryUrl(company.logo, { format: 'webp', width: 120, height: 120 })}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : null}
              <div>
                <h1 className="text-xl font-black tracking-tight text-teal-900 uppercase">
                  {companyName}
                </h1>
                <p className="text-xs text-slate-500 font-medium">{companyAddress}</p>
                <p className="text-xs text-slate-500">Contact: {companyMobile}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-teal-50 text-teal-800 font-black text-xs uppercase tracking-wider rounded-md border border-teal-200">
                Official Receipt
              </span>
              <div className="mt-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-500">Receipt No: </span>
                <span className="font-mono font-bold text-slate-900">{collection.receiptNumber}</span>
              </div>
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-500">Date: </span>
                <span className="font-semibold text-slate-800">{formatReceiptDate(collection.paymentDate)}</span>
              </div>
            </div>
          </div>

          {/* Customer & Booking Details 2-Column Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 mb-4">
            <div className="space-y-1.5">
              <div className="flex justify-between border-b border-slate-200/50 pb-1">
                <span className="text-slate-500">Customer Name:</span>
                <span className="font-bold text-slate-900">{customer.name || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/50 pb-1">
                <span className="text-slate-500">Customer ID:</span>
                <span className="font-mono font-semibold text-slate-800">{customer.customerCode || customer.customerId || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/50 pb-1">
                <span className="text-slate-500">Mobile Number:</span>
                <span className="font-medium text-slate-800">{customer.mobile || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Business Associate:</span>
                <span className="font-medium text-slate-800">{sponsor.name ? `${sponsor.name} (${sponsor.sponsorCode || ''})` : 'Direct'}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between border-b border-slate-200/50 pb-1">
                <span className="text-slate-500">Product Booking #:</span>
                <span className="font-mono font-bold text-teal-800">{collection.bookingNumber}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/50 pb-1">
                <span className="text-slate-500">Product Name:</span>
                <span className="font-semibold text-slate-900">{product.productName || 'Micro Plot Unit'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/50 pb-1">
                <span className="text-slate-500">Dimensions & Qty:</span>
                <span className="font-medium text-slate-800">
                  {product.dimensionLabel || '-'} • <b className="text-teal-700">{collection.quantity || 1} units</b>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Plan:</span>
                <span className="font-semibold text-slate-800">{collection.tenureMonths || 24} Months EMI</span>
              </div>
            </div>
          </div>

          {/* Payment & Installment Breakdown Table */}
          <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden mb-4">
            <thead className="bg-teal-800 text-white font-semibold">
              <tr>
                <th className="p-2.5 text-left">Description</th>
                <th className="p-2.5 text-center">Installment(s)</th>
                <th className="p-2.5 text-right">Principal</th>
                <th className="p-2.5 text-right">Late Fine Paid</th>
                <th className="p-2.5 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              <tr>
                <td className="p-2.5 font-medium text-slate-800">
                  Plot Product EMI Collection
                  {lateFineRebate > 0 && (
                    <span className="block text-[10px] text-emerald-600 font-normal">
                      (Late Fine Rebate granted: ₹{lateFineRebate.toLocaleString('en-IN')})
                    </span>
                  )}
                </td>
                <td className="p-2.5 text-center font-semibold text-slate-700">
                  {Array.isArray(collection.installmentNumbers) && collection.installmentNumbers.length > 0
                    ? collection.installmentNumbers.map((n) => (n === 0 ? 'Downpayment' : `EMI #${n}`)).join(', ')
                    : 'EMI Payment'}
                </td>
                <td className="p-2.5 text-right font-medium text-slate-800">
                  ₹{principalPaid.toLocaleString('en-IN')}
                </td>
                <td className="p-2.5 text-right font-medium text-amber-700">
                  ₹{lateFinePaid.toLocaleString('en-IN')}
                </td>
                <td className="p-2.5 text-right font-black text-teal-900 text-sm">
                  ₹{amountPaid.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
              <tr>
                <td colSpan="4" className="p-2.5 text-right text-xs uppercase tracking-wider text-slate-600">
                  Total Collected (INR):
                </td>
                <td className="p-2.5 text-right text-base font-black text-teal-800">
                  ₹{amountPaid.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Amount In Words & Payment Mode Info */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 mb-6 text-xs space-y-1.5">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-slate-500 uppercase tracking-wide text-[10px] shrink-0 mt-0.5">
                Amount In Words:
              </span>
              <span className="font-bold text-slate-800 capitalize">
                {numberToWords(amountPaid) || `${amountPaid} Rupees Only`}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-slate-600 pt-1 border-t border-slate-200/50">
              <div>
                <span className="text-slate-500">Payment Mode: </span>
                <span className="font-semibold text-slate-800 uppercase">{collection.paymentMode || 'Cash'}</span>
              </div>
              {collection.transactionReference && (
                <div>
                  <span className="text-slate-500">Ref / Cheque #: </span>
                  <span className="font-mono font-semibold text-slate-800">{collection.transactionReference}</span>
                </div>
              )}
              {collection.remarks && (
                <div>
                  <span className="text-slate-500">Remarks: </span>
                  <span className="font-medium text-slate-700">{collection.remarks}</span>
                </div>
              )}
            </div>
          </div>

          {/* Signatures Footer */}
          <div className="grid grid-cols-2 pt-8 text-xs select-none">
            <div className="text-center">
              <div className="w-44 border-b border-slate-400 mx-auto mb-1.5"></div>
              <p className="font-semibold text-slate-600">Customer Signature</p>
            </div>
            <div className="text-center">
              <div className="w-44 border-b border-slate-400 mx-auto mb-1.5"></div>
              <p className="font-semibold text-slate-800">Authorized Signatory</p>
              <p className="text-[10px] text-slate-400">{companyName}</p>
            </div>
          </div>
        </div>
      </div>
    </Modalbox>
  );
};

export default ProductReceiptModal;
