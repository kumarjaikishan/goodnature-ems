import { Eye, Edit2, Trash2 } from "lucide-react";
import { apiClient } from "./apiClient";

export const employeefetche = async ({ deletee, edite }) => {
    try {
        const result = await apiClient({
            url: "employeelist"
        });

        console.log('employee fetch Query:', result);
        let sno = 1;
        const mappedData = result.list.map((emp) => {
            return {
                id: emp._id,
                sno: sno++,
                photo: emp.profileimage,
                name: emp.employeename,
                dob: emp.dob,
                department: emp.department,
                action: (<div className="action flex gap-2.5">
                    <span className="eye edit text-[18px] text-green-500 cursor-pointer" ><Eye size={18} /></span>
                    <span className="edit text-[18px] text-blue-500 cursor-pointer" title="Edit" onClick={() => edite(emp)}><Edit2 size={18} /></span>
                    <span className="delete text-[18px] text-red-500 cursor-pointer" onClick={() => deletee(emp._id)}><Trash2 size={18} /></span>
                </div>)
            }
        })
        return mappedData;
    } catch (error) {
        console.error('Error fetching employees:', error);
        throw error;
    } 
};