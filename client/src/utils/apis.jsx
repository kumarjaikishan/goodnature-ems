import { IoEyeOutline } from "react-icons/io5";
import { MdOutlineModeEdit } from "react-icons/md";
import { AiOutlineDelete } from "react-icons/ai";
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
                    <span className="eye edit text-[18px] text-green-500 cursor-pointer" ><IoEyeOutline /></span>
                    <span className="edit text-[18px] text-blue-500 cursor-pointer" title="Edit" onClick={() => edite(emp)}><MdOutlineModeEdit /></span>
                    <span className="delete text-[18px] text-red-500 cursor-pointer" onClick={() => deletee(emp._id)}><AiOutlineDelete /></span>
                </div>)
            }
        })
        return mappedData;
    } catch (error) {
        console.error('Error fetching employees:', error);
        throw error;
    } 
};