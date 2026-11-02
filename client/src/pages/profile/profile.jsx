import {
  Phone, Mail, Cake, MapPin, User, Building2, Calendar, Droplets,
  Award, IndianRupee, Settings, Briefcase, PhoneCall, ShieldCheck, CreditCard,
  KeyRound, Eye, EyeOff
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from '../../utils/toast';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import Modalbox from '../../components/custommodal/Modalbox';
import Button from '../../components/ui/Button';
import { apiClient } from '../../utils/apiClient';

const EmployeeProfile = () => {
  const [isload] = useState(false);
  const [submenu, setsubmenu] = useState(1);
  const employeee = useSelector((state) => state.employee);
  const [profile, setprofile] = useState(null);

  // Change Password Modal States
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    if (employeee?.profile) {
      setprofile(employeee?.profile);
    }
  }, [employeee?.profile]);

  const handlePasswordChange = async (e) => {
    if (e) e.preventDefault();
    if (!passForm.newPassword || passForm.newPassword.trim().length < 4) {
      toast.error("New password must be at least 4 characters long");
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    setPassLoading(true);
    try {
      const res = await apiClient({
        url: "change-password",
        method: "POST",
        body: {
          currentPassword: passForm.currentPassword.trim(),
          newPassword: passForm.newPassword.trim()
        }
      });
      toast.success(res.message || "Password changed successfully!");
      setPassModalOpen(false);
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowCurrentPass(false);
      setShowNewPass(false);
      setShowConfirmPass(false);
    } catch (err) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="p-4">
      {isload ? (
        <div className="w-full h-[300px] flex gap-5 flex-col justify-center items-center bg-white rounded-xl">
          <div className="relative">
            <Settings className="animate-spin" style={{ animationDuration: '2.5s' }} size={50} color="teal" />
            <Settings className="absolute -bottom-4 left-0 animate-spin" style={{ animationDuration: '3s' }} size={20} color="teal" />
          </div>
          <p className="text-teal-600 font-medium">loading...</p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto bg-white flex flex-col shadow rounded-lg p-4">
          <div className="flex gap-4 items-start pb-2">
            <div className="w-20 h-20 bg-gray-200 rounded-full border-2 border-teal-500 border-dashed p-[2px] flex items-center justify-center overflow-hidden">
              {profile?.profileimage ? (
                <img
                  src={profile.profileimage}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="text-3xl text-gray-500" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xl capitalize font-bold text-gray-800">{profile?.userid?.name}</h3>
                  <p className="text-sm text-gray-600 capitalize">{profile?.userid?.role}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPassModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 flex items-center gap-1.5 cursor-pointer transition"
                >
                  <KeyRound size={14} /> Change Password
                </button>
              </div>

              <div className="flex gap-2 mt-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">{profile?.department?.department || 'Department'}</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">active</span>
              </div>

              <div className="mt-3 justify-start flex flex-wrap text-sm text-gray-600 space-y-1">
                <div className="flex w-1/2 items-center gap-2"><Mail size={16} className="text-gray-500 lowercase" /> {profile?.userid?.email || 'N/A'}</div>
                <div className="flex w-1/2 items-center gap-2"><Phone size={16} className="text-gray-500" /> {profile?.phone || 'N/A'}</div>
                <div className="flex w-1/2 items-center gap-2"><Calendar size={16} className="text-gray-500" /> {dayjs(profile?.userid?.createdAt).format('DD MMM, YYYY')}</div>
                <div className="flex w-1/2 items-center gap-2"><CreditCard size={16} className="text-gray-500" /> ID: {profile?.employeeCode || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div className="pt-1 capitalize">
            <div className="flex gap-6 bg-slate-200 p-1 mt-2 text-sm font-medium text-gray-700">
              <div onClick={() => setsubmenu(1)} className={`${submenu === 1 ? 'bg-white font-bold' : 'text-gray-400'} w-1/3 cursor-pointer py-1.5 text-center rounded`}>Personal Info</div>
              <div onClick={() => setsubmenu(2)} className={`${submenu === 2 ? 'bg-white font-bold' : 'text-gray-400'} w-1/3 cursor-pointer py-1.5 text-center rounded`}>Employment</div>
              <div onClick={() => setsubmenu(3)} className={`${submenu === 3 ? 'bg-white font-bold' : 'text-gray-400'} w-1/3 cursor-pointer py-1.5 text-center rounded`}>Documents &amp; Skills</div>
            </div>
            {submenu === 1 && (
              <div className="mt-2 grid grid-cols-1 max-h-[300px] overflow-y-auto sm:grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <Cake size={16} className="mt-1 text-gray-500" />
                  <div>
                    <div className="font-semibold">Date of Birth</div>
                    <div>{profile?.dob ? dayjs(profile?.dob).format('DD MMM, YYYY') : 'N/A'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="mt-1 text-gray-500" />
                  <div>
                    <div className="font-semibold">Address</div>
                    <div>{profile?.address || 'N/A'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <PhoneCall size={16} className="mt-1 text-gray-500" />
                  <div>
                    <div className="font-semibold">Emergency Contact</div>
                    <div>{profile?.Emergencyphone || 'N/A'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Droplets size={16} className="mt-1 text-gray-500" />
                  <div>
                    <div className="font-semibold">Blood Group</div>
                    <div>{profile?.bloodGroup || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}
            {submenu === 2 && (
              <div className="mt-2 grid grid-cols-1 max-h-[300px] overflow-y-auto sm:grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <Briefcase size={16} className="mt-1 text-gray-500" />
                  <div>
                    <div className="font-semibold">Job Title</div>
                    <div>{profile?.jobTitle || 'N/A'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Building2 size={16} className="mt-1 text-gray-500" />
                  <div>
                    <div className="font-semibold">Branch</div>
                    <div>{profile?.branch?.branch || 'N/A'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar size={16} className="mt-1 text-gray-500" />
                  <div>
                    <div className="font-semibold">Joining Date</div>
                    <div>{profile?.joiningDate ? dayjs(profile?.joiningDate).format('DD MMM, YYYY') : 'N/A'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <IndianRupee size={16} className="mt-1 text-gray-500" />
                  <div>
                    <div className="font-semibold">Salary</div>
                    <div>{profile?.salary ? `₹${profile.salary.toLocaleString('en-IN')}` : 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}
            {submenu === 3 && (
              <div className="mt-2 p-2 grid grid-cols-1 max-h-[300px] overflow-y-auto sm:grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="rounded border border-gray-300 bg-white p-2 md:p-3 flex flex-col gap-1">
                  <h3 className="font-bold">Education</h3>
                  {Array.isArray(profile?.education) && profile.education.length > 0 ? profile.education.map((edu, ind) => (
                    <div key={ind} className="relative my-1 pl-2 rounded overflow-hidden">
                      <p className="text-gray-800 font-semibold">{edu.degree}</p>
                      <p className="text-gray-700">{edu.institution}</p>
                      <p className="text-gray-500 text-[10px]">{dayjs(edu.date).format('DD MMM, YYYY')}</p>
                      <span className="absolute w-0.5 h-full bg-amber-800 top-0 left-0"></span>
                    </div>
                  )) : <div className="text-xs text-slate-400">No Data found</div>}
                </div>
                <div className="rounded border border-gray-300 bg-white p-2 md:p-3 flex flex-col gap-1">
                  <h3 className="font-bold">Achievement</h3>
                  {Array.isArray(profile?.achievements) && profile.achievements.length > 0 ? profile.achievements.map((ach, ind) => (
                    <div key={ind} className="relative my-1 pl-5 rounded overflow-hidden">
                      <p className="text-gray-800 font-semibold">{ach.title}</p>
                      <p className="text-gray-700">{ach.description}</p>
                      <p className="text-gray-500 text-[10px]">{dayjs(ach.date).format('MMM YYYY')}</p>
                      <span className="absolute top-1 left-[1.5px]"><Award size={18} color="orange" /></span>
                      <span className="absolute w-0.5 h-full bg-blue-500 top-0 left-0"></span>
                    </div>
                  )) : <div className="text-xs text-slate-400">No Achievement found</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Direct Change Password Modal (Using Standard Common Modalbox) */}
      <Modalbox
        open={passModalOpen}
        onClose={() => setPassModalOpen(false)}
        title="Change Account Password"
        subtitle="Update your login password directly here without requiring an email link"
        icon={<KeyRound size={18} />}
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPassModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={passLoading}
              onClick={handlePasswordChange}
            >
              Update Password
            </Button>
          </>
        }
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Password
            </label>
            <div className="relative flex items-center">
              <input
                type={showCurrentPass ? "text" : "password"}
                value={passForm.currentPassword}
                onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                placeholder="Enter current password (if known)"
                className="w-full h-10 px-3 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                type={showNewPass ? "text" : "password"}
                required
                value={passForm.newPassword}
                onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                placeholder="Minimum 4 characters"
                className="w-full h-10 px-3 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                type={showConfirmPass ? "text" : "password"}
                required
                value={passForm.confirmPassword}
                onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                placeholder="Re-enter new password"
                className="w-full h-10 px-3 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="hidden" />
        </form>
      </Modalbox>
    </div>
  );
};

export default EmployeeProfile;
