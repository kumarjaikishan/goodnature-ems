import { apiClient } from "../../../utils/apiClient";
import { FirstFetch } from "../../../../store/userSlice";
import { toast } from "react-toastify";

export const columns = [
    {
        name: "S.no",
        selector: (row, index) => index + 1,
        width: '40px'
    },
    {
        name: "Name",
        selector: (row) => row.name
    },
    {
        name: "Emp Id",
        selector: (row) => row.empId,
        sortable: true,
        width: '80px'
    },
    {
        name: "Phone",
        selector: (row) => row.phone,
        width: '90px'
    },
    {
        name: "Department",
        selector: (row) => row.department,
        width: '120px'
    },
    {
        name: "Status",
        selector: (row) => <span className={` ${row.status ? "bg-green-100 text-green-800" : 'bg-red-100 text-red-800'}  px-1 rounded`}>{row.status ? "Active" : 'In Active'}</span>,
        width: '120px'
    },
    {
        name: "Action",
        selector: (row) => row.action,
        width: '180px'
    }
]


export const addemployee = async ({ formData, dispatch, setisload, setInp, setopenmodal, init, resetPhoto }) => {
    setisload(true);

    try {
        const data = await apiClient({
            url: "addemployee",
            method: "POST",
            body: formData
        });

        toast.success(data.message, { autoClose: 1200 });
        setInp(init);
        resetPhoto();
        setopenmodal(false);
        dispatch(FirstFetch())
    } catch (error) {
        console.error('Error adding employee:', error);
        // Error handling is managed by apiClient/useApi (toast.warn/error)
    } finally {
        setisload(false);
    }
};


export const employeeupdate = async ({ formData, dispatch, setEmployeePhoto, setisload, setInp, setopenmodal, init }) => {
    setisload(true);

    try {
        const data = await apiClient({
            url: "updateemployee",
            method: "POST",
            body: formData
        });

        toast.success(data.message, { autoClose: 1200 });
        setEmployeePhoto(null)
        setInp(init);
        setopenmodal(false);
        dispatch(FirstFetch())
    } catch (error) {
        console.error('Error updating employee:', error);
    } finally {
        setisload(false);
    }
};

export const employeedelette = async ({ employeeId, setisload, dispatch }) => {
    if (!employeeId) {
        alert('All fileds are Required');
        return;
    }

    setisload(true);

    try {
        const data = await apiClient({
            url: "deleteemployee",
            method: "POST",
            body: { employeeId }
        });

        dispatch(FirstFetch())
        toast.success(data.message, { autoClose: 1200 });
    } catch (error) {
        console.error('Error deleting employee:', error);
    } finally {
        setisload(false);
    }
};


