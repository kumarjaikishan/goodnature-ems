import React, { useState, useEffect } from 'react';
import {
    Box, TextField, Button, Typography, MenuItem,
    Grid, FormControl, InputLabel, Select, OutlinedInput, Checkbox, ListItemText,
    Avatar,
    IconButton,
    Tooltip,
    InputAdornment,
    FormControlLabel
} from '@mui/material';
import { MdExpandLess, MdExpandMore, MdSettingsSuggest } from "react-icons/md";
import { toast } from 'react-toastify';
import Modalbox from '../../../components/custommodal/Modalbox';
import Addbranch from './addbranch';
import { useCustomStyles } from '../attandence/attandencehelper';
import swal from 'sweetalert';
import dayjs from 'dayjs';
import { useOrganization } from './useOrganization';

// Import Modular Components
import CompanyInfo from './components/CompanyInfo';
import BranchManager from './components/BranchManager';
import DeviceManager from './components/DeviceManager';
import TelegramSettings from './components/TelegramSettings';
import AttendanceRules from './components/AttendanceRules';
import PayrollPolicies from './components/PayrollPolicies';
import LeavePolicyManager from './components/LeavePolicyManager';
import LeaveSettings from './components/LeaveSettings';
import SuperAdminDashboard from './admin';
import Department from './department/Department';

const weekdays = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
];

export default function OrganizationSettings() {
    const {
        companyinp,
        setcompany,
        handleChange,
        handleNestedChange,
        addDevice,
        removeDevice,
        isOnline,
        deviceRefresh,
        handleSubmit,
        fetchgroup,
        isload,
        refreshload,
        teleloading,
        handleImage,
        employee,
        company,
        branch,
        profile
    } = useOrganization();
    const styles = useCustomStyles();

    const [openSection, setOpenSection] = useState(null);
    const [editbranch, seteditbranch] = useState(false);
    const [openviewmodal, setopenviewmodal] = useState(false);
    const [editbranchdata, seteditbranchdata] = useState(null);

    const toggleSection = (section) => {
        setOpenSection((prev) => (prev === section ? null : section));
    };

    const handleEditBranch = (data) => {
        seteditbranch(true);
        const formattedData = { ...data, managerIds: data?.managerIds?.map((id) => id._id) };
        seteditbranchdata(formattedData);
        setopenviewmodal(true);
    };

    const addCompany = () => {
        // defined but may not be used
    };

    return (
        <div className="w-full flex h-screen overflow-hidden flex-col md:flex-row gap-4 p-1 md:p-6 bg-gray-50">
            <div className="flex-1 space-y-6 overflow-y-auto pb-10 scrollbar-hide">

                {/* 1. Company Information */}
                <div className='border hidden shadow-lg bg-white border-dashed border-gray-300 rounded-md'>
                    <div className="flex justify-between items-center cursor-pointer bg-gray-100 px-4 py-2 rounded-md"
                        onClick={() => toggleSection('company')}>
                        <span className="font-semibold text-lg">Company Information</span>
                        {openSection === 'company' ? <MdExpandLess /> : <MdExpandMore />}
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${openSection === 'company' ? 'max-h-fit p-4' : 'max-h-0'}`}>
                        <CompanyInfo
                            companyinp={companyinp}
                            setcompany={setcompany}
                            isload={isload}
                            setisload={setisload}
                            handleImage={handleImage}
                            addCompany={addCompany}
                            profile={profile}
                        />
                    </div>
                </div>

                {/* 2. Branch Manager */}
                <div className='border shadow-lg bg-white border-dashed border-gray-300 rounded-md'>
                    <div className="flex justify-between items-center cursor-pointer bg-gray-100 px-4 py-2 rounded-md"
                        onClick={() => toggleSection('branches')}>
                        <span className="font-semibold text-lg">Branches & Managers</span>
                        {openSection === 'branches' ? <MdExpandLess /> : <MdExpandMore />}
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${openSection === 'branches' ? 'max-h-fit p-4' : 'max-h-0'}`}>
                        <BranchManager
                            branch={branch}
                            setopenviewmodal={setopenviewmodal}
                            handleEditBranch={handleEditBranch}
                            styles={styles}
                        />
                    </div>
                </div>

                {/* 3. Department */}
                <div className='border shadow-lg bg-teal-50 border-dashed border-teal-400 rounded-md'>
                    <div className="flex justify-between items-center cursor-pointer bg-teal-200 px-4 py-2 rounded-md"
                        onClick={() => toggleSection('department')}>
                        <span className="font-semibold text-lg">Department</span>
                        {openSection === 'department' ? <MdExpandLess /> : <MdExpandMore />}
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${openSection === 'department' ? 'max-h-fit p-4' : 'max-h-0'}`}>
                        <Department />
                    </div>
                </div>

                {/* 4. Device Management */}
                <div className='border shadow-lg bg-white border-dashed border-gray-300 rounded-md'>
                    <div className="flex justify-between items-center cursor-pointer bg-gray-100 px-4 py-2 rounded-md"
                        onClick={() => toggleSection('devices')}>
                        <span className="font-semibold text-lg">Device Management</span>
                        {openSection === 'devices' ? <MdExpandLess /> : <MdExpandMore />}
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${openSection === 'devices' ? 'max-h-fit p-4' : 'max-h-0'}`}>
                        <DeviceManager
                            companyinp={companyinp}
                            setcompany={setcompany}
                            isOnline={isOnline}
                            deviceRefresh={deviceRefresh}
                            refreshload={refreshload}
                            removeDevice={removeDevice}
                            addDevice={addDevice}
                            handleSubmit={handleSubmit}
                            isload={isload}
                        />
                    </div>
                </div>

                {/* 5. Telegram Integration */}
                <div className='border shadow-lg bg-white border-dashed border-gray-300 rounded-md'>
                    <div className="flex justify-between items-center cursor-pointer bg-gray-100 px-4 py-2 rounded-md"
                        onClick={() => toggleSection('telegram')}>
                        <span className="font-semibold text-lg">Telegram Integration</span>
                        {openSection === 'telegram' ? <MdExpandLess /> : <MdExpandMore />}
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${openSection === 'telegram' ? 'max-h-fit p-4' : 'max-h-0'}`}>
                        <TelegramSettings
                            companyinp={companyinp}
                            setcompany={setcompany}
                            handleChange={handleChange}
                            fetchgroup={fetchgroup}
                            teleloading={teleloading}
                            isload={isload}
                            handleSubmit={handleSubmit}
                        />
                    </div>
                </div>

                {/* 6. Admin / Manager Info */}
                {['superadmin'].includes(profile?.role) &&
                    <div className='border shadow-lg bg-slate-50 border-dashed border-slate-400 rounded-md'>
                        <div className="flex justify-between items-center cursor-pointer bg-slate-200 px-4 py-2 rounded-md"
                            onClick={() => toggleSection('admin')}>
                            <span className="font-semibold text-lg">Admin/Manager</span>
                            {openSection === 'admin' ? <MdExpandLess /> : <MdExpandMore />}
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 ${openSection === 'admin' ? 'max-h-fit p-4' : 'max-h-0'}`}>
                            <SuperAdminDashboard />
                        </div>
                    </div>
                }

                {/* 7. Attendance & Overtime Rules */}
                <div className='border shadow-lg bg-white border-dashed border-gray-300 rounded-md'>
                    <div className="flex justify-between items-center cursor-pointer bg-gray-100 px-4 py-2 rounded-md"
                        onClick={() => toggleSection('rules')}>
                        <span className="font-semibold text-lg">Attendance & Overtime Rules</span>
                        {openSection === 'rules' ? <MdExpandLess /> : <MdExpandMore />}
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${openSection === 'rules' ? 'max-h-fit p-4' : 'max-h-0'}`}>
                        <AttendanceRules
                            companyinp={companyinp}
                            setcompany={setcompany}
                            handleChange={handleChange}
                            handleNestedChange={handleNestedChange}
                            handleSubmit={handleSubmit}
                            isload={isload}
                        />
                    </div>
                </div>

                {/* 8. Payroll Policies */}
                <div className='border hidden shadow-lg bg-purple-50 border-dashed border-purple-400 rounded-md'>
                    <div className="flex justify-between items-center cursor-pointer bg-purple-200 px-4 py-2 rounded-md"
                        onClick={() => toggleSection('policies')}>
                        <span className="font-semibold text-lg text-primary">Default Payroll Policies</span>
                        {openSection === 'policies' ? <MdExpandLess /> : <MdExpandMore />}
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${openSection === 'policies' ? 'max-h-fit p-4' : 'max-h-0'}`}>
                        <PayrollPolicies
                            companyinp={companyinp}
                            setcompany={setcompany}
                            handleSubmit={handleSubmit}
                        />
                    </div>
                </div>

                {/* 9. Leave Policies */}
                <div className='border hidden shadow-lg bg-white border-dashed border-blue-300 rounded-md'>
                    <div className="flex justify-between items-center cursor-pointer bg-blue-50 px-4 py-2 rounded-md"
                        onClick={() => toggleSection('leavePolicies')}>
                        <span className="font-semibold text-lg text-blue-700">Leave Policies</span>
                        {openSection === 'leavePolicies' ? <MdExpandLess /> : <MdExpandMore />}
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${openSection === 'leavePolicies' ? 'max-h-fit p-4' : 'max-h-0'}`}>
                        <LeavePolicyManager />
                    </div>
                </div>

                {/* 10. Leave Visibility Settings */}
                <div className='border hidden shadow-lg bg-white border-dashed border-orange-300 rounded-md'>
                    <div className="flex justify-between items-center cursor-pointer bg-orange-50 px-4 py-2 rounded-md"
                        onClick={() => toggleSection('leaveSettings')}>
                        <div className="flex gap-2 font-semibold text-lg text-orange-700">
                            <MdSettingsSuggest size={24} color="#1a3353" />
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a3353' }}>
                                Ledger Visibility Settings
                            </Typography>
                        </div>
                        {openSection === 'leaveSettings' ? <MdExpandLess /> : <MdExpandMore />}
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${openSection === 'leaveSettings' ? 'max-h-fit p-4' : 'max-h-0'}`}>
                        <LeaveSettings
                            data={companyinp}
                            onChange={handleChange}
                            onSubmit={handleSubmit}
                            isload={isload}
                        />
                    </div>
                </div>

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
        </div>
    );
}
