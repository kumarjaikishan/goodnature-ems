import { FaPhone, FaEnvelope, FaBirthdayCake, FaMapMarkerAlt, FaUser, FaIdCardAlt, FaUniversity, FaUserCircle, FaRegCreditCard } from 'react-icons/fa';
import { MdAccountBalance, MdBadge, MdContactEmergency } from 'react-icons/md';
import { BsDropletFill } from "react-icons/bs";
import { useEffect, useState } from 'react';
import { apiClient } from '../../../utils/apiClient';
import { toast } from 'react-toastify';
import { PiOfficeChairFill } from "react-icons/pi";
import { FaBuilding, FaCalendarAlt, FaIdCard } from "react-icons/fa";
import dayjs from 'dayjs';
import { LiaMedalSolid } from "react-icons/lia";
import { MdCurrencyRupee, MdClose } from "react-icons/md";
import { GoGear } from "react-icons/go";
import { BiKey } from 'react-icons/bi';
import { cloudinaryUrl } from '../../../utils/imageurlsetter';

const EmployeeProfile = ({ viewEmployee, onClose }) => {
  const [isload, setisload] = useState(false);
  const [employee, setemployee] = useState(null);
  const [submenu, setsubmenu] = useState(1);

  useEffect(() => {
    const first = async () => {
      setisload(true);
      try {
        const data = await apiClient({
          url: `getemployee?empid=${viewEmployee}`
        });
        setemployee(data);
      } catch (error) {
        console.error('Error fetching employee profile:', error);
      } finally {
        setisload(false);
      }
    };
    if (viewEmployee) {
      first();
    }
  }, [viewEmployee]);

  return (
    <div className="w-full bg-white rounded-xl flex flex-col overflow-hidden shadow-2xl">
      {/* Modal Header */}
      <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <h2 className="text-lg font-bold tracking-wide text-white flex items-center gap-2">
          <FaUser className="text-teal-400 text-base" /> Employee Profile
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
            title="Close"
          >
            <MdClose size={20} />
          </button>
        )}
      </div>

      {isload ? (
        <div className="w-full h-[320px] flex gap-4 flex-col justify-center items-center bg-white">
          <div className="relative">
            <GoGear className="animate-spin" style={{ animationDuration: '2.5s' }} size={48} color="teal" />
            <GoGear className="absolute -bottom-3 left-0 animate-spin" style={{ animationDuration: '3s' }} size={20} color="teal" />
          </div>
          <p className="text-teal-700 text-sm font-medium">Loading employee details...</p>
        </div>
      ) : (
        <div className="p-5 md:p-6 flex flex-col gap-4">
          {/* Top Hero Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-4 border-b border-slate-100">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 rounded-full border-2 border-teal-500 p-1 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
              {employee?.profileimage ? (
                <img
                  src={cloudinaryUrl(employee.profileimage, {
                    format: "webp",
                    width: 200,
                    height: 200,
                  })}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <FaUser className="text-3xl text-slate-400" />
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xl capitalize font-bold text-slate-900 leading-tight">
                    {employee?.userid?.name || employee?.name}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 capitalize">
                    {employee?.designation || employee?.userid?.role || 'Employee'}
                  </p>
                </div>
                <div className="flex items-center justify-center sm:justify-end gap-2">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200">
                    {employee?.department?.department || 'General'}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                    employee?.status
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {employee?.status ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <FaEnvelope className="text-slate-400 text-sm" />
                  <span className="truncate">{employee?.userid?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaPhone className="text-slate-400 text-sm" />
                  <span>{employee?.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="text-slate-400 text-sm" />
                  <span>Joined: {employee?.userid?.createdAt ? dayjs(employee?.userid?.createdAt).format('DD MMM, YYYY') : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaIdCard className="text-slate-400 text-sm" />
                  <span className="font-mono font-semibold text-slate-800">
                    ID: {employee?.empId || employee?.deviceUserId || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

        <div className="pt-1 capitalize">
          <div className="flex gap-2 md:gap-6 bg-slate-200 p-1 mt-2 text-[12px] md:text-sm font-medium text-gray-700">
            <div onClick={() => setsubmenu(1)} className={`${submenu == 1 ? 'bg-white' : 'text-gray-400'} w-1/3 cursor-pointer py-1.5 text-center rounded`}>Personal Info</div>
            <div onClick={() => setsubmenu(2)} className={`${submenu == 2 ? 'bg-white' : 'text-gray-400'} w-1/3 cursor-pointer py-1.5 text-center rounded`}>Employment</div>
            <div onClick={() => setsubmenu(3)} className={`${submenu == 3 ? 'bg-white' : 'text-gray-400'} w-1/3 cursor-pointer py-1.5 text-center rounded`}>Documents & Skills</div>
          </div>
          {submenu == 1 &&
            <div className="mt-2 grid grid-cols-2 max-h-[300px] overflow-y-auto md:grid-cols-2 gap-4 text-[12px] md:text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <FaBirthdayCake className="mt-1 text-gray-500" />
                <div>
                  <div className="font-semibold">Date of Birth</div>
                  <div>{employee?.dob ? dayjs(employee?.dob).format('DD MMM,YYYY') : 'N/A'}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FaMapMarkerAlt className="mt-1 text-gray-500" />
                <div>
                  <div className="font-semibold">Address</div>
                  <div>{employee?.address || 'N/A'}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MdContactEmergency className="mt-1 text-gray-500" />
                <div>
                  <div className="font-semibold">Emergency Contact</div>
                  <div>{employee?.Emergencyphone || 'N/A'}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <BsDropletFill className="mt-1 text-gray-500" />
                <div>
                  <div className="font-semibold">Blood Group</div>
                  <div>{employee?.bloodGroup || 'N/A'}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MdBadge className="mt-1 text-gray-500" />
                <div>
                  <div className="font-semibold">Adhaar No.</div>
                  <div>{employee?.adhaar || 'N/A'}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FaIdCardAlt className="mt-1 text-gray-500" />
                <div>
                  <div className="font-semibold">Pan No.</div>
                  <div>{employee?.pan || 'N/A'}</div>
                </div>
              </div>
            </div>}
          {submenu == 2 &&
            <div className="mt-2 grid grid-cols-2 max-h-[300px] overflow-y-auto md:grid-cols-2 gap-4 text-[12px] md:text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <PiOfficeChairFill className="mt-1 text-gray-500" />
                <div>
                  <div className="font-semibold">Position</div>
                  <div>{employee?.designation || 'Accounts'}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FaBuilding className="mt-1 text-gray-500" />
                <div>
                  <div className="font-semibold">Department</div>
                  <div>{employee?.department?.department || 'N/A'}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MdCurrencyRupee className="mt-1 text-gray-500" />
                <div>
                  <div className="font-semibold">Salary</div>
                  <div>{employee?.salary || 'N/A'}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FaUniversity className="mt-1 text-gray-500" />
                <div>
                  <div className="font-semibold">Bank Name</div>
                  <div>{employee?.bankName || 'N/A'}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FaUserCircle className="mt-1 text-gray-500" />
                <div>
                  <div className="font-semibold">Account Holder</div>
                  <div>{employee?.acHolderName || 'N/A'}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MdAccountBalance className="mt-1 text-gray-500" />
                <div>
                  <div className="font-semibold">Branch</div>
                  <div>{employee?.bankbranch || 'N/A'}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FaRegCreditCard className="mt-1 text-gray-500" />
                <div>
                  <div className="font-semibold">A/C No.</div>
                  <div>{employee?.acnumber || 'N/A'}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <BiKey className="mt-1 text-gray-500" />
                <div>
                  <div className="font-semibold">Ifsc Code</div>
                  <div>{employee?.ifscCode || 'N/A'}</div>
                </div>
              </div>

            </div>}
          {submenu == 3 &&
            <div className="mt-2 p-2 grid grid-cols-1 max-h-[300px] overflow-y-auto sm:grid-cols-2 gap-4 text-[12px] md:text-sm text-gray-700">
              <div className='rounded border border-gray-300 bg-white p-2 md:p-4 flex flex-col gap-1'>
                <h3 className='font-bold'>Education</h3>
                {employee.education.length > 0 ? employee.education.map((edu) => {
                  return <div className='relative my-1 pl-2 rounded overflow-hidden'>
                    <p className='text-gray-700 font-semibold'>{edu.degree}</p>
                    <p className='text-gray-700'>{edu.institution}</p>
                    <p className='text-gray-500 text-[10px]'>{edu.date}</p>
                    <span className='absolute w-0.5 h-full bg-amber-800 top-0 left-0' ></span>
                  </div>
                }) : <div>No Data found</div>}
              </div>
              <div className='rounded border border-gray-300 bg-white p-2 md:p-4 flex flex-col gap-1'>
                <h3 className='font-bold'>Achievement</h3>
                {employee.achievements.length > 0 ? employee.achievements.map((ach) => {
                  return <div className='relative my-1 pl-5 rounded overflow-hidden'>
                    <p className='text-gray-700 font-semibold'>{ach.title}</p>
                    <p className='text-gray-700'>{ach.description}</p>
                    <p className='text-gray-500 text-[10px]'>{ach.date}</p>
                    <span className='absolute top-1 -left-0' > <LiaMedalSolid size={18} color='orange' /> </span>
                    <span className='absolute w-0.5 h-full bg-blue-500 top-0 right-0' ></span>
                  </div>
                }) : <div>No Achievement found</div>}

              </div>
            </div>}
        </div>

        {/* Modal Footer */}
        {onClose && (
          <div className="pt-3 mt-1 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    )}
  </div>
  );
};

export default EmployeeProfile;
