import React, { useState } from 'react';
import OrganizationLayout from '../OrganizationLayout';
import BranchManager from '../components/BranchManager';
import { useOrganization } from '../useOrganization';
import Modalbox from '../../../../components/custommodal/Modalbox';
import Addbranch from '../addbranch';
import { useCustomStyles } from '../../attandence/attandencehelper';

const BranchManagerPage = () => {
    const { branch, company, employee } = useOrganization();
    const styles = useCustomStyles();
    const [openviewmodal, setopenviewmodal] = useState(false);
    const [editbranch, seteditbranch] = useState(false);
    const [editbranchdata, seteditbranchdata] = useState(null);

    const handleEditBranch = (data) => {
        seteditbranch(true);
        const formattedData = { ...data, managerIds: data?.managerIds?.map((id) => id._id) };
        seteditbranchdata(formattedData);
        setopenviewmodal(true);
    };

    return (
        <OrganizationLayout title="Branches & Managers">
            <div className='border shadow-lg bg-white border-dashed border-gray-300 rounded-md p-4'>
                <BranchManager
                    branch={branch}
                    setopenviewmodal={setopenviewmodal}
                    handleEditBranch={handleEditBranch}
                    styles={styles}
                />
            </div>

            <Modalbox open={openviewmodal} onClose={() => {
                setopenviewmodal(false);
                seteditbranchdata(null);
                seteditbranch(false);
            }}>
                <div className="membermodal w-[680px]" >
                    <Addbranch setopenviewmodal={setopenviewmodal} editbranchdata={editbranchdata} editbranch={editbranch} company={company} employee={employee} />
                </div>
            </Modalbox>
        </OrganizationLayout>
    );
};

export default BranchManagerPage;
