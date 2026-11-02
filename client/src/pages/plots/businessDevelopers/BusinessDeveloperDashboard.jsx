import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Users, Wallet, TrendingUp, Award, ShieldCheck, Phone } from 'lucide-react';
import apiClient from '../../../api/axios';
import { getJwtPayload } from '../../../utils/auth';

const BusinessDeveloperDashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const loggedInProfile = user?.profile || user || {};
  const [liveSponsor, setLiveSponsor] = useState(null);

  const tokenPayload = getJwtPayload(localStorage.getItem('emstoken')) || {};
  const loggedInId = loggedInProfile._id || loggedInProfile.id || tokenPayload.id || tokenPayload.userId;

  useEffect(() => {
    if (!loggedInId) return;
    const fetchSponsorProfile = async () => {
      try {
        const res = await apiClient({
          url: `plots/sponsors/${loggedInId}/dashboard`,
          method: 'GET',
        });
        const sp = res.data?.sponsor || res.sponsor;
        if (sp) {
          setLiveSponsor(sp);
        }
      } catch (err) {
        // Silent fallback to token / profile
      }
    };
    fetchSponsorProfile();
  }, [loggedInId]);

  const developer = {
    name: liveSponsor?.name || loggedInProfile.name || tokenPayload.name || 'Associate',
    sponsorCode: liveSponsor?.sponsorCode || loggedInProfile.sponsorCode || loggedInProfile.customerCode || tokenPayload.sponsorCode || 'N/A',
    isDeveloperSponsor: liveSponsor ? liveSponsor.isDeveloperSponsor : (loggedInProfile.isDeveloperSponsor ?? tokenPayload.isDeveloperSponsor),
    role: loggedInProfile.role || tokenPayload.role,
    mobile: liveSponsor?.mobile || loggedInProfile.mobile,
    profileImage: liveSponsor?.profileImage || loggedInProfile.profileImage || loggedInProfile.image,
    isBranchPartner: liveSponsor ? liveSponsor.isBranchPartner : (loggedInProfile.isBranchPartner ?? tokenPayload.isBranchPartner),
    branchName: liveSponsor?.branchName || loggedInProfile.branchName,
    parentSponsor: liveSponsor?.parentSponsor || loggedInProfile.parentSponsor || loggedInProfile.sponsorId,
  };

  const isDeveloperPartner = developer.isDeveloperSponsor;
  const roleTitle = developer.isBranchPartner
    ? `Branch Partner (${developer.branchName || 'Regional Head'})`
    : isDeveloperPartner
    ? 'Business Partner'
    : 'Business Associate';

  return (
    <div className="w-full p-4 md:p-8 bg-slate-50 min-h-[calc(100vh-64px)] flex flex-col justify-center items-center">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-12 shadow-sm flex flex-col items-center text-center">
        {/* Goodfeel Logo */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 mb-6 rounded-2xl p-3 bg-white border border-slate-100 shadow-xs flex items-center justify-center">
          <img
            src="/logo.webp"
            alt="Goodfeel Logo"
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.src = '/favicon.png';
            }}
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome, {developer.name}!
        </h1>

        {/* Small ID Badge directly below name */}
        {developer.sponsorCode && developer.sponsorCode !== 'N/A' && (
          <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-slate-600 font-mono font-medium">
            <ShieldCheck size={13} className="text-teal-700" />
            <span>ID: <strong className="text-slate-800 font-bold">{developer.sponsorCode}</strong></span>
          </div>
        )}

        <p className="text-sm text-slate-500 max-w-md mt-3 font-medium">
          Welcome to your official Goodfeel partner portal. Access your customer network, ledger statements, and business performance below.
        </p>

        {/* Direct Action Shortcuts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-2xl mt-8">
          <button
            onClick={() => navigate('/dashboard/my-network')}
            className="p-3.5 bg-teal-50 hover:bg-teal-100/80 text-teal-900 rounded-xl border border-teal-200 transition font-bold text-xs flex flex-col items-center gap-2 cursor-pointer shadow-2xs"
          >
            <div className="p-2 rounded-lg bg-teal-700 text-white">
              <Users size={18} />
            </div>
            <span>{isDeveloperPartner ? 'Network & Customers' : 'My Customers'}</span>
          </button>

          <button
            onClick={() => navigate('/dashboard/ledger')}
            className="p-3.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 rounded-xl border border-emerald-200 transition font-bold text-xs flex flex-col items-center gap-2 cursor-pointer shadow-2xs"
          >
            <div className="p-2 rounded-lg bg-emerald-700 text-white">
              <Wallet size={18} />
            </div>
            <span>Commission Ledger</span>
          </button>

          <button
            onClick={() => navigate('/dashboard/my-business')}
            className="p-3.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl border border-slate-200 transition font-bold text-xs flex flex-col items-center gap-2 cursor-pointer shadow-2xs"
          >
            <div className="p-2 rounded-lg bg-slate-700 text-white">
              <TrendingUp size={18} />
            </div>
            <span>Business Report</span>
          </button>

          <button
            onClick={() => navigate('/dashboard/my-commission-rates')}
            className="p-3.5 bg-amber-50 hover:bg-amber-100/80 text-amber-900 rounded-xl border border-amber-200 transition font-bold text-xs flex flex-col items-center gap-2 cursor-pointer shadow-2xs"
          >
            <div className="p-2 rounded-lg bg-amber-600 text-white">
              <Award size={18} />
            </div>
            <span>Plan & Commission</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessDeveloperDashboard;
