import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Sliders } from "lucide-react";
import Modalbox from '../../../components/custommodal/Modalbox';
import Addbranch from './addbranch';
import { useCustomStyles } from '../attandence/attandencehelper';
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

    const [openSection, setOpenSection] = useState('company');
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
        <div className="w-full flex h-screen overflow-hidden flex-col md:flex-row gap-4 p-2 md:p-6 bg-slate-50/50">
            <div className="flex-1 space-y-4 overflow-y-auto pb-10 scrollbar-hide">

                {/* 1. Company Information */}
                <div className='border bg-white border-slate-200 rounded-xl shadow-2xs overflow-hidden'>
                    <div className="flex justify-between items-center cursor-pointer bg-slate-50 hover:bg-slate-100/80 transition px-5 py-3.5"
                        onClick={() => toggleSection('company')}>
                        <span className="font-bold text-sm text-slate-800 tracking-wide">Company Information</span>
                        {openSection === 'company' ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${openSection === 'company' ? 'max-h-fit p-5' : 'max-h-0'}`}>
                        <CompanyInfo
                            companyinp={companyinp}
                            setcompany={setcompany}
                            isload={isload}
                            setisload={() => {}}
                            handleImage={handleImage}
                            addCompany={addCompany}
                            profile={profile}
                        />
                    </div>
                </div>

                {/* 2. Branch Manager */}
                <div className='border bg-white border-slate-200 rounded-xl shadow-2xs overflow-hidden'>
                    <div className="flex justify-between items-center cursor-pointer bg-slate-50 hover:bg-slate-100/80 transition px-5 py-3.5"
                        onClick={() => toggleSection('branches')}>
                        <span className="font-bold text-sm text-slate-800 tracking-wide">Branches & Managers</span>
                        {openSection === 'branches' ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${openSection === 'branches' ? 'max-h-fit p-5' : 'max-h-0'}`}>
                        <BranchManager
                            branch={branch}
                            setopenviewmodal={setopenviewmodal}
                            handleEditBranch={handleEditBranch}
                            styles={styles}
                        />
                    </div>
                </div>

                {/* 3. Department */}
                <div className='border bg-white border-slate-200 rounded-xl shadow-2xs overflow-hidden'>
                    <div className="flex justify-between items-center cursor-pointer bg-slate-50 hover:bg-slate-100/80 transition px-5 py-3.5"
                        onClick={() => toggleSection('department')}>
                        <span className="font-bold text-sm text-slate-800 tracking-wide">Department</span>
                        {openSection === 'department' ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${openSection === 'department' ? 'max-h-fit p-5' : 'max-h-0'}`}>
                        <Department />
                    </div>
                </div>

                {/* 4. Device Management */}
                <div className='border bg-white border-slate-200 rounded-xl shadow-2xs overflow-hidden'>
                    <div className="flex justify-between items-center cursor-pointer bg-slate-50 hover:bg-slate-100/80 transition px-5 py-3.5"
                        onClick={() => toggleSection('devices')}>
                        <span className="font-bold text-sm text-slate-800 tracking-wide">Biometric Device Management</span>
                        {openSection === 'devices' ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${openSection === 'devices' ? 'max-h-fit p-5' : 'max-h-0'}`}>
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
                <div className='border bg-white border-slate-200 rounded-xl shadow-2xs overflow-hidden'>
                    <div className="flex justify-between items-center cursor-pointer bg-slate-50 hover:bg-slate-100/80 transition px-5 py-3.5"
                        onClick={() => toggleSection('telegram')}>
                        <span className="font-bold text-sm text-slate-800 tracking-wide">Telegram Integration</span>
                        {openSection === 'telegram' ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${openSection === 'telegram' ? 'max-h-fit p-5' : 'max-h-0'}`}>
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

                {/* 6. User Management (Admin / Manager) */}
                {['superadmin'].includes(profile?.role) &&
                    <div className='border bg-white border-slate-200 rounded-xl shadow-2xs overflow-hidden'>
                        <div className="flex justify-between items-center cursor-pointer bg-slate-50 hover:bg-slate-100/80 transition px-5 py-3.5"
                            onClick={() => toggleSection('admin')}>
                            <span className="font-bold text-sm text-slate-800 tracking-wide">User Management & Access Control</span>
                            {openSection === 'admin' ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 ${openSection === 'admin' ? 'max-h-fit p-5' : 'max-h-0'}`}>
                            <SuperAdminDashboard />
                        </div>
                    </div>
                }

                {/* 7. Attendance & Overtime Rules */}
                <div className='border bg-white border-slate-200 rounded-xl shadow-2xs overflow-hidden'>
                    <div className="flex justify-between items-center cursor-pointer bg-slate-50 hover:bg-slate-100/80 transition px-5 py-3.5"
                        onClick={() => toggleSection('rules')}>
                        <span className="font-bold text-sm text-slate-800 tracking-wide">Attendance & Overtime Rules</span>
                        {openSection === 'rules' ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${openSection === 'rules' ? 'max-h-fit p-5' : 'max-h-0'}`}>
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
                <div className='border bg-white border-slate-200 rounded-xl shadow-2xs overflow-hidden'>
                    <div className="flex justify-between items-center cursor-pointer bg-slate-50 hover:bg-slate-100/80 transition px-5 py-3.5"
                        onClick={() => toggleSection('policies')}>
                        <span className="font-bold text-sm text-slate-800 tracking-wide">Default Payroll Policies</span>
                        {openSection === 'policies' ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${openSection === 'policies' ? 'max-h-fit p-5' : 'max-h-0'}`}>
                        <PayrollPolicies
                            companyinp={companyinp}
                            setcompany={setcompany}
                            handleSubmit={handleSubmit}
                        />
                    </div>
                </div>

                {/* 9. Leave Policies */}
                <div className='border bg-white border-slate-200 rounded-xl shadow-2xs overflow-hidden'>
                    <div className="flex justify-between items-center cursor-pointer bg-slate-50 hover:bg-slate-100/80 transition px-5 py-3.5"
                        onClick={() => toggleSection('leavePolicies')}>
                        <span className="font-bold text-sm text-slate-800 tracking-wide">Leave Policies</span>
                        {openSection === 'leavePolicies' ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${openSection === 'leavePolicies' ? 'max-h-fit p-5' : 'max-h-0'}`}>
                        <LeavePolicyManager />
                    </div>
                </div>

                {/* 10. Leave Visibility Settings */}
                <div className='border bg-white border-slate-200 rounded-xl shadow-2xs overflow-hidden'>
                    <div className="flex justify-between items-center cursor-pointer bg-slate-50 hover:bg-slate-100/80 transition px-5 py-3.5"
                        onClick={() => toggleSection('leaveSettings')}>
                        <div className="flex items-center gap-2 font-bold text-sm text-slate-800 tracking-wide">
                            <Sliders size={18} className="text-teal-700" />
                            <span>Ledger Visibility Settings</span>
                        </div>
                        {openSection === 'leaveSettings' ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${openSection === 'leaveSettings' ? 'max-h-fit p-5' : 'max-h-0'}`}>
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
