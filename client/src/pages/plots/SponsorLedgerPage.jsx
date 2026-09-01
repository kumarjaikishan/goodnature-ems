import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiClient } from '../../utils/apiClient';
import PageLoader from '../../components/common/PageLoader';

const SponsorLedgerPage = () => {
  const { id: paramId } = useParams();
  const user = useSelector((state) => state.user);
  const loggedInId = user?.profile?.id || user?.profile?._id || user?.id || user?._id;
  const targetId = paramId || loggedInId;

  const navigate = useNavigate();

  useEffect(() => {
    if (targetId) {
      // Look up sponsor info to forward cleanly to the universal ledger page
      apiClient({ url: `plots/sponsors/${targetId}/ledger` })
        .then((res) => {
          const sp = res.data?.sponsor;
          const name = encodeURIComponent(sp?.name || 'Sponsor');
          const empId = encodeURIComponent(sp?.sponsorCode || sp?.customerId || '');
          const imgParam = sp?.profileImage ? `&profileimage=${encodeURIComponent(sp.profileImage)}` : '';
          navigate(`/dashboard/ledger/${targetId}?name=${name}&empid=${empId}&ledgertype=sponsor${imgParam}`, { replace: true });
        })
        .catch(() => {
          navigate(`/dashboard/ledger/${targetId}?name=Sponsor&ledgertype=sponsor`, { replace: true });
        });
    }
  }, [targetId, navigate]);

  return (
    <PageLoader
      title="Opening Financial Ledger..."
      subtitle="Redirecting to the official company account ledger"
    />
  );
};

export default SponsorLedgerPage;
