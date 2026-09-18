import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import OrganizationLayout from '../OrganizationLayout';
import BranchManager from '../components/BranchManager';
import { useOrganization } from '../useOrganization';
import Modal from '@/components/ui/Modal';
import Addbranch from '../addbranch';
import { useCustomStyles } from '../../attandence/attandencehelper';
import { FirstFetch } from '../../../../../store/userSlice';
import { apiClient } from '../../../../utils/apiClient';
import { toast } from '../../../../utils/toast';
import { swal } from '../../../../utils/confirmDialog';

const BranchManagerPage = () => {
    const { branch, company, employee } = useOrganization();
    const styles = useCustomStyles();
    const dispatch = useDispatch();
    const [openviewmodal, setopenviewmodal] = useState(false);
    const [editbranch, seteditbranch] = useState(false);
    const [editbranchdata, seteditbranchdata] = useState(null);

    const handleEditBranch = (data) => {
        seteditbranch(true);
        const formattedData = { ...data, managerIds: data?.managerIds?.map((id) => id._id) };
        seteditbranchdata(formattedData);
        setopenviewmodal(true);
    };

    const handleDeleteBranch = (data) => {
        swal({
            title: `Delete branch "${data.name}"?`,
            text: "This will remove the branch and unassign associated managers.",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then(async (willDelete) => {
            if (willDelete) {
                let toastId = toast.loading("Deleting branch...");
                try {
                    const res = await apiClient({
                        url: "deleteBranch",
                        method: "POST",
                        body: { _id: data._id }
                    });
                    toast.update(toastId, {
                        render: res.message || "Branch deleted successfully",
                        type: "success",
                        isLoading: false,
                        autoClose: 1800,
                    });
                    dispatch(FirstFetch());
                } catch (err) {
                    console.error("Error deleting branch:", err);
                    toast.update(toastId, {
                        render: err.message || "Failed to delete branch",
                        type: "warning",
                        isLoading: false,
                        autoClose: 2500,
                    });
                }
            }
        });
    };

    return (
        <OrganizationLayout title="Branches & Managers">
            <div className="w-full">
                <BranchManager
                    branch={branch}
                    setopenviewmodal={setopenviewmodal}
                    handleEditBranch={handleEditBranch}
                    handleDeleteBranch={handleDeleteBranch}
                    styles={styles}
                />
            </div>

            <Modal
                open={openviewmodal}
                onClose={() => {
                    setopenviewmodal(false);
                    seteditbranchdata(null);
                    seteditbranch(false);
                }}
                title={editbranch ? "Edit Branch" : "Add New Branch"}
                subtitle="Configure branch location, assigned branch managers and attendance rules"
                maxWidth="max-w-2xl"
            >
                <Addbranch
                    setopenviewmodal={setopenviewmodal}
                    editbranchdata={editbranchdata}
                    editbranch={editbranch}
                    company={company}
                    employee={employee}
                />
            </Modal>
        </OrganizationLayout>
    );
};

export default BranchManagerPage;
