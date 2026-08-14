
import { toast } from "react-toastify";
import { FirstFetch } from "../../../../../store/userSlice";
import { apiClient } from "../../../../utils/apiClient";

export const columns = [
    {
        name: "S.no",
        selector: (row) => row.sno,
        width: '40px'
    },
    {
        name: "Branch",
        selector: (row) => row.branch
    },
    {
        name: "Department",
        selector: (row) => row.dep_name
    },
    {
        name: "Action",
        selector: (row) => row.action,
        width: '80px'
    }
]
export const adddepartment = async ({ inp, setisload, setInp, setopenmodal, init, dispatch }) => {
    const { branchId, department, description } = inp;

    if (!department) {
        alert('Please fill in both fields');
        return;
    }

    setisload(true);

    try {
        const data = await apiClient({
            url: "adddepartment",
            method: "POST",
            body: { department, branchId, description }
        });

        dispatch(FirstFetch());
        toast.success(data.message, { autoClose: 1200 });
        setInp(init);
        setopenmodal(false);
    } catch (error) {
        console.error('Error adding department:', error);
    } finally {
        setisload(false);
    }
};
export const update = async ({ inp, setisload, setInp, setopenmodal, init, dispatch }) => {

    const { departmentId, department, description } = inp;

    if (!department || !departmentId) {
        alert('All fileds are Required');
        return;
    }

    setisload(true);

    try {
        const data = await apiClient({
            url: "updatedepartment",
            method: "POST",
            body: { departmentId, department, description }
        });

        dispatch(FirstFetch());
        toast.success(data.message, { autoClose: 1200 });
        setInp(init);
        setopenmodal(false);
    } catch (error) {
        console.error('Error updating department:', error);
    } finally {
        setisload(false);
    }
};

export const delette = async ({ departmentId, setisload, dispatch }) => {
    if (!departmentId) {
        alert('All fileds are Required');
        return;
    }

    setisload(true);

    try {
        const data = await apiClient({
            url: "deletedepartment",
            method: "POST",
            body: { departmentId }
        });
        dispatch(FirstFetch())
        toast.success(data.message, { autoClose: 1200 });
    } catch (error) {
        console.error('Error deleting department:', error);
    } finally {
        setisload(false);
    }
};


