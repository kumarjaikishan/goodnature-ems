import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from '../../utils/toast';
import { CircularProgress } from '@mui/material';
import {
  ArrowLeft,
  User,
  MapPin,
  Banknote,
  Users,
  FileText,
  ClipboardCheck,
  Printer,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { cloudinaryUrl } from '../../utils/imageurlsetter';

const PlotBookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      api.get(`/plots/bookings/${id}`),
      api.get(`/plots/bookings/${id}/installments`).catch(() => ({ data: { data: [] } })),
      api.get(`/plots/receipts/list?bookingId=${id}`).catch(() => ({ data: { data: [] } }))
    ])
      .then(([bookingRes, instRes, receiptRes]) => {
        setBooking(bookingRes.data.data);
        setInstallments(instRes.data.data || []);
        setReceipts(receiptRes.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load booking details:', err);
        toast.error('Failed to load plot booking details');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <CircularProgress sx={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-sm font-bold text-slate-500">Booking details not found.</p>
        <button
          onClick={() => navigate('/dashboard/plots/booking')}
          className="px-4 py-2 text-white rounded-xl text-xs font-bold bg-primary shadow-sm"
        >
          Back to Bookings
        </button>
      </div>
    );
  }

  const customer = booking.customerId || {};
  const sponsor = booking.sponsorId || {};
  const plot = booking.plotId || {};
  const series = plot.seriesId || {};

  const netPlotValue = Math.max(0, (booking.plotValue || 0) - (booking.discount || 0));
  const paidAmount = Math.max(0, netPlotValue - (booking.remainingAmount || 0));

  // Determine scheme display label
  const schemeLabel = booking.scheme === 'FULL_PAYMENT' ? 'One Time (Full Payment)' : 'EMI (Monthly Installment)';

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6 max-w-7xl mx-auto">
      {/* Top Header / Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-slate-600 font-medium text-xs flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={16} /> Back
          </button>

        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.open(`/dashboard/plots/certificates/${booking._id}`, '_blank')}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl transition cursor-pointer shadow-2xs"
          >
            <FileText size={16} className="text-slate-500" /> Certificate
          </button>
          <button
            onClick={() => window.open(`/dashboard/plots/agreements/${booking._id}`, '_blank')}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl transition cursor-pointer shadow-2xs"
          >
            <ClipboardCheck size={16} className="text-slate-500" /> Agreement
          </button>
          <button
            onClick={() => navigate(`/dashboard/plots/interest-calculator?bookingId=${booking._id}&bookingNumber=${booking.bookingNumber}`)}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-800 font-medium text-xs rounded-xl transition cursor-pointer shadow-2xs"
          >
            <Sparkles size={16} className="text-teal-700" /> Growth & Interest
          </button>
          {booking.scheme === 'FULL_PAYMENT' && booking.payoutStatus === 'ACTIVE' && (
            <button
              onClick={() => navigate(`/dashboard/plots/payout-ledger?bookingId=${booking._id}`)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-white font-medium text-xs rounded-xl transition cursor-pointer shadow-2xs bg-primary"
            >
              <Banknote size={16} /> Payout Ledger
            </button>
          )}
          <button
            onClick={() => navigate('/dashboard/plots/installments')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-white font-medium text-xs rounded-xl transition cursor-pointer shadow-2xs bg-primary"
          >
            <Banknote size={16} /> Collect Payment
          </button>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <p className="text-[0.68rem] font-semibold text-slate-500 uppercase tracking-wider">Total Plot Value</p>
          <p className="text-xl font-bold text-slate-900 mt-1">₹{(booking.plotValue || 0).toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">{plot.plotSize || 0} Sq Ft @ ₹{plot.effectiveRate || 0}/Sq Ft</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <p className="text-[0.68rem] font-semibold text-slate-500 uppercase tracking-wider">Discount Granted</p>
          <p className="text-xl font-bold text-slate-900 mt-1">₹{(booking.discount || 0).toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">Net Payable: ₹{netPlotValue.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <p className="text-[0.68rem] font-semibold text-slate-500 uppercase tracking-wider">Total Amount Paid</p>
          <p className="text-xl font-bold text-slate-900 mt-1">₹{paidAmount.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">Includes downpayment & EMIs</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <p className="text-[0.68rem] font-semibold text-slate-500 uppercase tracking-wider">Outstanding Balance</p>
          <p className="text-xl font-bold text-slate-900 mt-1">₹{(booking.remainingAmount || 0).toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">Remaining liability</p>
        </div>
      </div>

      {/* Details Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Card 1: Customer Details */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                {customer?.photo || customer?.profileImage ? (
                  <img
                    src={cloudinaryUrl(customer.photo || customer.profileImage, { format: 'webp', width: 80, height: 80, crop: 'fill' })}
                    alt={customer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={16} className="text-slate-500" />
                )}
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Customer Details</h3>
            </div>
            {customer?.signature && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Sign:</span>
                <img
                  src={cloudinaryUrl(customer.signature, { format: 'webp', width: 100, height: 40, crop: 'fit' })}
                  alt="Customer Signature"
                  className="h-5 w-auto object-contain"
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Customer Name</span>
              <span className="font-semibold text-slate-800 text-sm">{customer.name || booking.customerName || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Customer ID</span>
              <span className="font-semibold text-slate-800">
                {typeof customer?.customerCode === 'string' ? customer.customerCode :
                  typeof customer?.customerId === 'string' ? customer.customerId :
                    typeof booking?.customerCode === 'string' ? booking.customerCode :
                      typeof booking?.customerId === 'string' ? booking.customerId : '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Father / Husband</span>
              <span className="font-medium text-slate-700">
                {customer.fatherOrHusbandName ? `${customer.relationType ? customer.relationType + ' ' : ''}${customer.fatherOrHusbandName}` : '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Gender & Age</span>
              <span className="font-medium text-slate-700">
                {customer.gender || 'Male'} {customer.age ? `(${customer.age} yrs)` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Mobile Number</span>
              <span className="font-medium text-slate-700">{customer.mobile || booking.customerMobile || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Email Address</span>
              <span className="font-medium text-slate-700">{customer.email || booking.customerEmail || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Aadhaar Card</span>
              <span className="font-medium text-slate-700">{customer.aadhaarCard || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">PAN Card</span>
              <span className="font-medium text-slate-700 uppercase">{customer.panCard || '-'}</span>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Residential Address</span>
              <span className="font-medium text-slate-700">{customer.address || '-'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Booking Contract & Financial Terms */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Banknote size={16} className="text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Booking Contract & Financial Terms</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Booking ID</span>
              <span className="font-semibold text-slate-800">{booking.bookingNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Booking Date</span>
              <span className="font-medium text-slate-700">
                {new Date(booking.bookingDate || booking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Payment Scheme</span>
              <span className="font-medium text-slate-700">{schemeLabel}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Downpayment Paid</span>
              <span className="font-medium text-slate-700">₹{(booking.bookingAmount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Discount Amount</span>
              <span className="font-medium text-slate-700">₹{(booking.discount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Net Plot Value</span>
              <span className="font-bold text-slate-900">₹{netPlotValue.toLocaleString('en-IN')}</span>
            </div>
            {booking.scheme === 'FULL_PAYMENT' ? (
              <div>
                <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">One Time Period</span>
                <span className="font-medium text-slate-700">{booking.oneTimeMonths || 1} Months</span>
              </div>
            ) : (
              <>
                <div>
                  <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Total Installments</span>
                  <span className="font-medium text-slate-700">{installments.filter(i => i.installmentNumber > 0).length || '-'} Months</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Monthly EMI Amount</span>
                  <span className="font-medium text-slate-700">
                    {(() => {
                      const regularInsts = (installments || []).filter(i => i.installmentNumber > 0);
                      const months = regularInsts.length || booking.installmentCount || booking.tenureMonths || 0;
                      const net = Math.max(0, (booking.plotValue || 0) - (booking.discount || 0));
                      const dp = booking.bookingAmount || booking.downpaymentAmount || 0;
                      const rem = Math.max(0, net - dp);
                      const rawEmi = months > 0 ? (rem / months) : (regularInsts[0]?.dueAmount || 0);
                      const emiFormatted = rawEmi % 1 === 0
                        ? rawEmi.toLocaleString('en-IN')
                        : rawEmi.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      return `₹${emiFormatted}`;
                    })()}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card 3: Plot Specifications */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin size={16} className="text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Plot Specifications</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Plot Number</span>
              <span className="font-bold text-slate-800 text-sm">#{plot.plotNumber || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Series / Block</span>
              <span className="font-medium text-slate-700">{series.seriesName || 'Default Series'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Plot Type</span>
              <span className="font-medium text-slate-700">{plot.plotType?.replace('_', ' ') || 'NORMAL'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Plot Area / Size</span>
              <span className="font-medium text-slate-700">{plot.plotSize || 0} Sq Ft</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Effective Rate</span>
              <span className="font-medium text-slate-700">₹{plot.effectiveRate || booking.basePlotRate || 0} / Sq Ft</span>
            </div>
            {/* Dimensions (N/S/E/W) */}
            <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-100">
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase mb-1">Plot Dimensions / पैमाइश (Ft)</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-700 font-bold block">North (उत्तर)</span>
                    <span className="text-[9px] text-teal-700 font-medium block">पूरब-पश्चिम जानिब उत्तर</span>
                  </div>
                  <strong className="text-slate-800 font-mono text-sm mt-1">{plot.dimensions?.north || '-'} ft</strong>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-700 font-bold block">South (दक्षिण)</span>
                    <span className="text-[9px] text-teal-700 font-medium block">पूरब-पश्चिम जानिब दक्षिण</span>
                  </div>
                  <strong className="text-slate-800 font-mono text-sm mt-1">{plot.dimensions?.south || '-'} ft</strong>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-700 font-bold block">East (पूरब)</span>
                    <span className="text-[9px] text-teal-700 font-medium block">उत्तर-दक्षिण जानिब पूरब</span>
                  </div>
                  <strong className="text-slate-800 font-mono text-sm mt-1">{plot.dimensions?.east || '-'} ft</strong>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-700 font-bold block">West (पश्चिम)</span>
                    <span className="text-[9px] text-teal-700 font-medium block">उत्तर-दक्षिण जानिब पश्चिम</span>
                  </div>
                  <strong className="text-slate-800 font-mono text-sm mt-1">{plot.dimensions?.west || '-'} ft</strong>
                </div>
              </div>
            </div>

            {/* Boundaries / Chaudhi */}
            <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-100">
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase mb-1">Boundaries / चौहद्दी (Surroundings)</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-bold block">North (उत्तर चौहद्दी)</span>
                  <span className="text-slate-800 font-semibold">{plot.boundaries?.north || '-'}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-bold block">South (दक्षिण चौहद्दी)</span>
                  <span className="text-slate-800 font-semibold">{plot.boundaries?.south || '-'}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-bold block">East (पूरब चौहद्दी)</span>
                  <span className="text-slate-800 font-semibold">{plot.boundaries?.east || '-'}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-bold block">West (पश्चिम चौहद्दी)</span>
                  <span className="text-slate-800 font-semibold">{plot.boundaries?.west || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Dedicated Nominee Details */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User size={16} className="text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Nominee Information</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Nominee Name</span>
              <span className="font-semibold text-slate-800 text-sm">{customer.nomineeName || customer.nominee?.name || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Relation to Allottee</span>
              <span className="font-medium text-slate-700">{customer.nomineeRelation || customer.nominee?.relation || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Nominee Age</span>
              <span className="font-medium text-slate-700">{(customer.nomineeAge || customer.nominee?.age) ? `${customer.nomineeAge || customer.nominee.age} Years` : '-'}</span>
            </div>
          </div>
        </div>

        {/* Card 5: Sponsor / Referral Details */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users size={16} className="text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Sponsor / Referral Details</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Sponsor Name</span>
              <span className="font-semibold text-slate-800 text-sm">
                {(!sponsor._id || sponsor._id === customer._id) ? 'Direct / Company' : (sponsor.name || 'Direct / Company')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Sponsor ID</span>
              <span className="font-semibold text-slate-800">
                {(!sponsor._id || sponsor._id === customer._id) ? 'N/A' : (
                  typeof sponsor?.sponsorCode === 'string' ? sponsor.sponsorCode :
                    typeof sponsor?.customerId === 'string' ? sponsor.customerId : 'N/A'
                )}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Installments Ledger Section */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Installments Schedule ({installments.length})
            </h3>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Paid: {installments.filter(i => i.status === 'PAID').length} / {installments.length}
          </span>
        </div>

        {installments.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">No installments schedule generated yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 select-none">
                  <th className="p-2.5 font-semibold uppercase">Inst #</th>
                  <th className="p-2.5 font-semibold uppercase">Due Date</th>
                  <th className="p-2.5 font-semibold uppercase text-right">Principal Due</th>
                  <th className="p-2.5 font-semibold uppercase text-right">Late Fine</th>
                  <th className="p-2.5 font-semibold uppercase text-right">Total Due</th>
                  <th className="p-2.5 font-semibold uppercase text-right">Paid Amount</th>
                  <th className="p-2.5 font-semibold uppercase">Status</th>
                  <th className="p-2.5 font-semibold uppercase">Paid Date</th>
                  <th className="p-2.5 font-semibold uppercase">Receipt #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {installments.map(inst => {
                  const isPaid = inst.status === 'PAID';
                  const lateFine = inst.lateFine || 0;
                  const totalDue = inst.dueAmount + lateFine;

                  return (
                    <tr key={inst._id} className="hover:bg-slate-50 transition">
                      <td className="p-2.5 font-semibold text-slate-800">
                        {inst.installmentNumber === 0 ? 'Downpmt' : `#${inst.installmentNumber}`}
                      </td>
                      <td className="p-2.5 text-slate-600">
                        {new Date(inst.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-2.5 text-right font-medium text-slate-700">₹{(inst.dueAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="p-2.5 text-right font-medium text-slate-700">
                        {lateFine > 0 ? `₹${lateFine.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="p-2.5 text-right font-semibold text-slate-800">₹{totalDue.toLocaleString('en-IN')}</td>
                      <td className="p-2.5 text-right font-semibold text-slate-800">₹{(inst.paidAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded-sm text-[0.62rem] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          {inst.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-500">
                        {inst.paidDate ? new Date(inst.paidDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="p-2.5 font-medium text-slate-800">
                        {inst.receiptNumber ? (
                          <button
                            onClick={() => {
                              const rec = receipts.find(r => r.receiptNumber === inst.receiptNumber);
                              if (rec) navigate(`/dashboard/plots/receipts/${rec._id}`);
                            }}
                            className="hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>{inst.receiptNumber}</span>
                            <Printer size={12} className="text-slate-400" />
                          </button>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Receipts History Section */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col gap-4 mt-2">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Printer size={16} className="text-slate-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Payment Receipts Ledger ({receipts.length})
          </h3>
        </div>

        {receipts.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">No receipts recorded for this booking yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 select-none">
                  <th className="p-2.5 font-semibold uppercase">Receipt #</th>
                  <th className="p-2.5 font-semibold uppercase">Date</th>
                  <th className="p-2.5 font-semibold uppercase">Type</th>
                  <th className="p-2.5 font-semibold uppercase text-right">Amount Paid</th>
                  <th className="p-2.5 font-semibold uppercase text-right">Late Fine Paid</th>
                  <th className="p-2.5 font-semibold uppercase">Payment Mode</th>
                  <th className="p-2.5 font-semibold uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map(rec => (
                  <tr key={rec._id} className="hover:bg-slate-50 transition">
                    <td className="p-2.5 font-medium text-slate-800">{rec.receiptNumber}</td>
                    <td className="p-2.5 text-slate-600">
                      {new Date(rec.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[0.68rem] font-semibold uppercase tracking-wider ${
                        rec.receiptType === 'DOWNPAYMENT'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : rec.receiptType === 'FULL_PAYMENT'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {rec.receiptType === 'DOWNPAYMENT' ? 'Down Payment' : rec.receiptType === 'FULL_PAYMENT' ? 'Full Payment' : 'Installment'}
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-semibold text-slate-800">
                      ₹{(rec.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-2.5 text-right font-medium text-slate-700">
                      ₹{(rec.lateFinePaid || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-2.5 text-slate-700 font-medium uppercase">
                      {rec.paymentMode} {rec.transactionReference ? `(${rec.transactionReference})` : ''}
                    </td>
                    <td className="p-2.5">
                      <button
                        onClick={() => navigate(`/dashboard/plots/receipts/${rec._id}`)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-medium text-[0.68rem] transition cursor-pointer flex items-center gap-1"
                      >
                        <Printer size={14} /> Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlotBookingDetails;
