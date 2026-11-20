import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiClient } from '../../../utils/apiClient';
import PageLoader from '../../../components/common/PageLoader';

const BusinessDeveloperLedgerPage = () => {
  const { id: paramId } = useParams();
  const user = useSelector((state) => state.user);
  const loggedInId = user?.profile?.id || user?.profile?._id || user?.id || user?._id;
  const targetId = paramId || loggedInId;

  const navigate = useNavigate();

  useEffect(() => {
    if (targetId) {
      // Look up business developer info to forward cleanly to the universal ledger page
      apiClient({ url: `plots/sponsors/${targetId}/ledger` })
        .then((res) => {
          const sp = res.data?.sponsor;
          const isBranchPartner = Boolean(
            sp?.isBranchPartner ||
            sp?.sponsorCode?.startsWith('BRP-') ||
            sp?.sponsorCode?.startsWith('BR-') ||
            res.data?.isBranchPartner
          );
          const isAssociate = !isBranchPartner && (sp?.isDeveloperSponsor === false || Boolean(sp?.parentSponsor) || sp?.sponsorCode?.startsWith('BA-'));
          const computedType = isBranchPartner ? 'branch_partner' : (isAssociate ? 'associate' : 'partner');

          const defaultLabel = isBranchPartner ? 'Branch Partner' : (isAssociate ? 'Business Associate' : 'Business Partner');
          const branchSuffix = (isBranchPartner && sp?.branchName) ? ` (${sp.branchName})` : '';
          const name = encodeURIComponent(
            isBranchPartner
              ? (sp?.branchName ? `${sp.branchName} BRANCH` : `${sp?.name || defaultLabel}${branchSuffix}`)
              : `${sp?.name || defaultLabel}${branchSuffix}`
          );
          const empId = encodeURIComponent(
            isBranchPartner
              ? (sp?.branchCode || sp?.sponsorCode || sp?.customerId || '')
              : (sp?.sponsorCode || sp?.customerId || '')
          );
          const imgParam = sp?.profileImage ? `&profileimage=${encodeURIComponent(sp.profileImage)}` : '';

          const destinationLedgerId = (isBranchPartner && (res.data?.branchLedgerId || sp?.branchLedgerId))
            ? (res.data?.branchLedgerId || sp?.branchLedgerId)
            : targetId;

          navigate(`/dashboard/ledger/${destinationLedgerId}?name=${name}&empid=${empId}&ledgertype=${computedType}${imgParam}`, { replace: true });
        })
        .catch(() => {
          navigate(`/dashboard/ledger/${targetId}?name=Business Developer&ledgertype=associate`, { replace: true });
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

export default BusinessDeveloperLedgerPage;
