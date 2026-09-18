import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import PageLoader from '../../../components/common/PageLoader';
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
  RotateCcw,
  History,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Edit3,
} from 'lucide-react';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';
import Modalbox from '../../../components/custommodal/Modalbox';

const PlotBookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Refund Modal state
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundForm, setRefundForm] = useState({
    deductionAmount: 0,
    paymentMode: 'BANK_TRANSFER',
    transactionReference: '',
    remarks: '',
    refundDate: new Date().toISOString().split('T')[0],
  });

  const fetchBookingData = () => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      api.get(`/plots/bookings/${id}`),
      api.get(`/plots/bookings/${id}/installments`).catch(() => ({ data: { data: [] } })),
      api.get(`/plots/receipts/list?bookingId=${id}`).catch(() => ({ data: { data: [] } })),
      api.get(`/plots/bookings/${id}/revisions`).catch(() => ({ data: { data: [] } })),
    ])
      .then(([bookingRes, instRes, receiptRes, revRes]) => {
        const bData = bookingRes.data.data;
        setBooking(bData);
        setInstallments(instRes.data.data || []);
        setReceipts(receiptRes.data.data || []);
        setRevisions(revRes.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load booking details:', err);
        toast.error('Failed to load plot booking details');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBookingData();
  }, [id]);

  if (loading) {
    return <PageLoader text="Loading plot booking details..." />;
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

  const plotAreaSize = Number(plot.plotSize) || 0;
  // Calculate dynamic effective booked rate from booking.plotValue / plotArea or booking.basePlotRate
  const bookingEffectiveRate = plotAreaSize > 0 && booking.plotValue > 0
    ? Math.round((Number(booking.plotValue) / plotAreaSize) * 100) / 100
    : (booking.basePlotRate || plot.effectiveRate || plot.baseRate || 0);

  const netPlotValue = Math.max(0, (booking.plotValue || 0) - (booking.discount || 0));
  const paidAmount = Math.max(0, netPlotValue - (booking.remainingAmount || 0));

  // Downpayment completion check:
  // For FULL_PAYMENT: 100% of net value must be paid (or remainingAmount === 0)
  // For MONTHLY_INSTALLMENT: Initial booking/downpayment amount must be completed
  const downpaymentRequired = booking.scheme === 'FULL_PAYMENT'
    ? netPlotValue
    : (booking.downpaymentAmount || booking.bookingAmount || (booking.downpaymentRate && plotAreaSize > 0 ? booking.downpaymentRate * plotAreaSize : Math.round(netPlotValue * 0.40)));
  const isDownpaymentCompleted = paidAmount >= (downpaymentRequired - 1); // 1 rupee margin for rounding

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
            onClick={() => {
              if (!isDownpaymentCompleted) {
                toast.warning(`Agreement available only after downpayment is completed. Required: ₹${downpaymentRequired.toLocaleString('en-IN')}, Paid: ₹${paidAmount.toLocaleString('en-IN')}`);
                return;
              }
              window.open(`/dashboard/plots/agreements/${booking._id}`, '_blank');
            }}
            title={
              !isDownpaymentCompleted
                ? `Agreement locked: Downpayment pending (Paid: ₹${paidAmount.toLocaleString('en-IN')} / Required: ₹${downpaymentRequired.toLocaleString('en-IN')})`
                : 'Open Customer Plot Agreement'
            }
            className={`flex items-center gap-1.5 px-3.5 py-2 border font-medium text-xs rounded-xl transition shadow-2xs ${
              isDownpaymentCompleted
                ? 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 cursor-pointer'
                : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-75'
            }`}
          >
            <ClipboardCheck size={16} className={isDownpaymentCompleted ? 'text-amber-600' : 'text-slate-400'} />
            Agreement {!isDownpaymentCompleted && <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded ml-1">Pending DP</span>}
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
          {booking.status !== 'CANCELLED' && (
            <>
              <button
                onClick={() => navigate(`/dashboard/plots/booking/edit/${booking._id}`)}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-xs rounded-xl transition cursor-pointer shadow-2xs"
              >
                <Edit3 size={15} className="text-indigo-700" /> Edit Contract
              </button>
              <button
                onClick={() => setRefundOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs rounded-xl transition cursor-pointer shadow-2xs"
              >
                <RotateCcw size={15} className="text-rose-600" /> Cancel & Refund
              </button>
            </>
          )}
          {booking.status !== 'CANCELLED' && (
            <button
              onClick={() => navigate('/dashboard/plots/installments')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-white font-medium text-xs rounded-xl transition cursor-pointer shadow-2xs bg-primary"
            >
              <Banknote size={16} /> Collect Payment
            </button>
          )}
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <p className="text-[0.68rem] font-semibold text-slate-500 uppercase tracking-wider">Total Plot Value (Gross)</p>
          <p className="text-xl font-bold text-slate-900 mt-1">₹{(booking.plotValue || 0).toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">{plotAreaSize} Sq Ft @ ₹{bookingEffectiveRate.toLocaleString('en-IN')}/Sq Ft</p>
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
            <div className="min-w-0">
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Email Address</span>
              <span 
                className="font-medium text-slate-700 block truncate" 
                title={customer.email || booking.customerEmail || '-'}
              >
                {customer.email || booking.customerEmail || '-'}
              </span>
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
              <span className="font-medium text-slate-700">{plotAreaSize} Sq Ft</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[0.68rem] uppercase">Booked Rate (Effective)</span>
              <span className="font-bold text-slate-900">₹{bookingEffectiveRate.toLocaleString('en-IN')} / Sq Ft</span>
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

        {/* Card 6: Land Acquisition Sourcing / किसान एग्रीमेंट & रजिस्ट्री डीड */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col gap-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-teal-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Land Acquisition & Sourcing (किसान एग्रीमेंट / रजिस्ट्री डीड विवरण)
              </h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
              {booking.landSourcing?.length || 0} Source{booking.landSourcing?.length === 1 ? '' : 's'} Linked
            </span>
          </div>

          {(!booking.landSourcing || booking.landSourcing.length === 0) ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>⚠️ No specific land agreement linked to this booking yet.</span>
              <button
                type="button"
                onClick={() => setRestructureOpen(true)}
                className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                + Link Land Agreement Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {booking.landSourcing.map((src, idx) => (
                <div key={idx} className="p-3.5 bg-teal-50/40 border border-teal-200 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-950 text-xs flex items-center gap-1.5">
                      <FileText size={15} className="text-teal-700" />
                      {src.sourceType === 'REGISTRY_DEED' ? (
                        <>Registry Deed #{src.deedNumber || 'N/A'}</>
                      ) : (
                        <>Agreement #{src.agreementNumber || 'N/A'}</>
                      )}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-teal-800 border border-teal-200 uppercase">
                      {src.sourceType === 'REGISTRY_DEED' ? 'REGISTRY DEED' : 'AGREEMENT'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-2 border-t border-teal-100 text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Mauja / मौजा</span>
                      <span className="font-semibold text-slate-800">{src.mauja || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Khata / Khesra</span>
                      <span className="font-semibold text-slate-800">{src.khataNumber || '-'}/{src.khesraNumber || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Allocated Area</span>
                      <span className="font-bold text-teal-800">{src.allocatedSqFt || 0} SqFt ({src.allocatedDismil || 0} Dismil)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                        {inst.dueDate ? (
                          new Date(inst.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[0.68rem] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Awaiting DP Completion
                          </span>
                        )}
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
              <tfoot className="border-t-2 border-slate-300 bg-slate-50/90 font-bold text-slate-900">
                <tr>
                  <td colSpan={2} className="p-2.5 uppercase tracking-wider text-slate-700">
                    Total
                  </td>
                  <td className="p-2.5 text-right font-mono">
                    ₹{installments.reduce((sum, i) => sum + (Number(i.dueAmount) || 0), 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-2.5 text-right font-mono text-rose-700">
                    {(() => {
                      const totalFine = installments.reduce((sum, i) => sum + (Number(i.lateFine) || 0), 0);
                      return totalFine > 0 ? `₹${totalFine.toLocaleString('en-IN')}` : '-';
                    })()}
                  </td>
                  <td className="p-2.5 text-right font-mono text-slate-900">
                    ₹{installments.reduce((sum, i) => sum + (Number(i.dueAmount) || 0) + (Number(i.lateFine) || 0), 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-2.5 text-right font-mono text-emerald-700">
                    ₹{installments.reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0).toLocaleString('en-IN')}
                  </td>
                  <td colSpan={3} className="p-2.5"></td>
                </tr>
              </tfoot>
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
              <tfoot className="border-t-2 border-slate-300 bg-slate-50/90 font-bold text-slate-900">
                <tr>
                  <td colSpan={3} className="p-2.5 uppercase tracking-wider text-slate-700">
                    Total
                  </td>
                  <td className="p-2.5 text-right font-mono text-emerald-700">
                    ₹{receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-2.5 text-right font-mono text-rose-700">
                    ₹{receipts.reduce((sum, r) => sum + (Number(r.lateFinePaid) || 0), 0).toLocaleString('en-IN')}
                  </td>
                  <td colSpan={2} className="p-2.5"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Revisions & Restructuring History Section */}
      {revisions.length > 0 && (
        <div className="bg-white border border-indigo-200 rounded-2xl shadow-xs p-5 flex flex-col gap-4 mt-2">
          <div className="flex items-center gap-2 border-b border-indigo-100 pb-3">
            <History size={16} className="text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
              Contract Revision & Restructuring History ({revisions.length})
            </h3>
          </div>

          <div className="space-y-3">
            {revisions.map((rev) => (
              <div key={rev._id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900">
                    Revision #{rev.revisionNumber} — {new Date(rev.revisionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">Edited by: {rev.editedBy?.name || 'Admin'}</span>
                </div>
                <p className="text-xs text-slate-700 italic">"{rev.reason}"</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Area Change</span>
                    <span className="font-bold text-slate-800">{rev.previousSnapshot?.plotSize} → {rev.newSnapshot?.plotSize} SqFt ({rev.deltas?.deltaPlotSize >= 0 ? `+${rev.deltas?.deltaPlotSize}` : rev.deltas?.deltaPlotSize})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Tenure</span>
                    <span className="font-bold text-slate-800">{rev.previousSnapshot?.tenureMonths}M → {rev.newSnapshot?.tenureMonths}M</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Plot Value</span>
                    <span className="font-bold text-slate-800">₹{rev.previousSnapshot?.plotValue?.toLocaleString('en-IN')} → ₹{rev.newSnapshot?.plotValue?.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Monthly EMI</span>
                    <span className="font-bold text-slate-800">₹{rev.previousSnapshot?.emiMonthlyAmount?.toLocaleString('en-IN')} → ₹{rev.newSnapshot?.emiMonthlyAmount?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: CUSTOMER CANCELLATION & REFUND ── */}
      <Modalbox open={refundOpen} onClose={() => setRefundOpen(false)} outside={true}>
        <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-rose-900 flex items-center gap-2">
              <RotateCcw size={18} className="text-rose-600" />
              Cancel Booking & Process Refund
            </h3>
            <button onClick={() => setRefundOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
            <p className="font-bold flex items-center gap-1.5"><AlertTriangle size={14} /> Total Collections Paid: ₹{paidAmount.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-amber-700">Cancelling will release the plot to AVAILABLE status and restore allocated land stock to the Kisan agreement.</p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setRefundLoading(true);
              try {
                await api.post(`/plots/bookings/${booking._id}/refund`, refundForm);
                toast.success('Booking cancelled and refund voucher generated successfully');
                setRefundOpen(false);
                fetchBookingData();
              } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to process refund');
              } finally {
                setRefundLoading(false);
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Deduction / Cancellation Fee (₹)</label>
              <input
                type="number"
                min={0}
                className="h-10 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-rose-600 outline-none px-3.5 rounded-xl text-xs font-bold"
                value={refundForm.deductionAmount}
                onChange={(e) => setRefundForm({ ...refundForm, deductionAmount: Number(e.target.value) })}
              />
              <span className="text-[11px] text-slate-500">
                Net Refund: <strong className="text-emerald-700 font-mono">₹{Math.max(0, paidAmount - (refundForm.deductionAmount || 0)).toLocaleString('en-IN')}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Refund Payment Mode</label>
                <select
                  className="h-10 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-rose-600 outline-none px-3.5 rounded-xl text-xs font-medium"
                  value={refundForm.paymentMode}
                  onChange={(e) => setRefundForm({ ...refundForm, paymentMode: e.target.value })}
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Ref / Cheque #</label>
                <input
                  type="text"
                  className="h-10 w-full bg-white border border-slate-300 focus:ring-2 focus:ring-rose-600 outline-none px-3.5 rounded-xl text-xs font-medium"
                  placeholder="e.g. UTR1084920"
                  value={refundForm.transactionReference}
                  onChange={(e) => setRefundForm({ ...refundForm, transactionReference: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cancellation Remarks</label>
              <textarea
                rows={2}
                className="w-full bg-white border border-slate-300 focus:ring-2 focus:ring-rose-600 outline-none p-3 rounded-xl text-xs font-medium resize-none"
                placeholder="Reason for cancellation and refund notes..."
                value={refundForm.remarks}
                onChange={(e) => setRefundForm({ ...refundForm, remarks: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRefundOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="submit"
                disabled={refundLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                {refundLoading ? 'Processing...' : 'Confirm Cancellation & Issue Refund'}
              </button>
            </div>
          </form>
        </div>
      </Modalbox>
    </div>
  );
};

export default PlotBookingDetails;
