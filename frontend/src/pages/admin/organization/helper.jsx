import { apiClient } from "../../../utils/apiClient";
import { toast } from "react-toastify";

export const addCompany = async ({ companyinp, setisload }) => {
    setisload(true);

    try {
        const data = await apiClient({
            url: "addcompany",
            method: "POST",
            body: { name: companyinp.name, industry: companyinp.industry }
        });

        toast.success(data.message, { autoClose: 1200 });
    } catch (error) {
        console.error('Error adding company:', error);
    } finally {
        setisload(false);
    }
};