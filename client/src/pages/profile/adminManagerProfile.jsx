import { Mail, Settings, Edit2, KeyRound, Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "../../utils/toast";
import useImageUpload from "../../utils/imageresizer";
import { FirstFetch } from "../../../store/userSlice";
import Modalbox from "../../components/custommodal/Modalbox";
import { apiClient } from "../../utils/apiClient";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

const AdminManagerProfile = () => {
  const [isload] = useState(false);
  const { profile } = useSelector((state) => state.user);
  const [profilee, setprofile] = useState(null);
  const [isLoading, setisloading] = useState(false);
  const { handleImage } = useImageUpload();
  const dispatch = useDispatch();
  const [EditOpen, setEditOpen] = useState(false);
  const [name, setname] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

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

  const inputRef = useRef(null);

  useEffect(() => {
    if (profile) setprofile(profile);
  }, [profile]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setprofile((prev) => ({ ...prev, profileImage: previewUrl }));
  };

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

  const handlesave = async () => {
    try {
      setisloading(true);

      const formData = new FormData();
      formData.append("name", name);

      if (selectedFile) {
        const resizedFile = await handleImage(200, selectedFile);
        formData.append("profileImage", resizedFile);
      }

      const data = await apiClient({
        url: "update-profile",
        method: "POST",
        body: formData
      });

      toast.success(data.message);
      dispatch(FirstFetch());
      setSelectedFile(null);
      setEditOpen(false);
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setisloading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {isload ? (
        <div className="w-full h-64 flex flex-col justify-center items-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <Settings className="animate-spin text-teal-700" size={40} />
          <p className="text-xs font-semibold text-teal-800 mt-3">Loading profile details...</p>
        </div>
      ) : (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="relative">
              {profilee?.profileImage ? (
                <img
                  src={profilee?.profileImage}
                  alt={profilee?.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-teal-600 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-2xl">
                  {profilee?.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Profile Details */}
            <div className="space-y-1 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 capitalize">
                  {profilee?.name}
                </h1>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Mail size={14} className="text-slate-400" />
                <span>{profilee?.email || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Action buttons (Available for all authenticated users) */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
            <Button
              onClick={() => { setname(profilee?.name || ''); setEditOpen(true); }}
              disabled={isLoading}
              variant="primary"
            >
              <Edit2 size={14} /> Edit Profile
            </Button>

            <Button
              onClick={() => setPassModalOpen(true)}
              disabled={isLoading}
              variant="secondary"
            >
              <KeyRound size={14} /> Change Password
            </Button>
          </div>
        </div>
      )}

      {/* 1. Edit Profile Modal (Using Standard Common Modalbox) */}
      <Modalbox
        open={EditOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Profile"
        subtitle="Update your display name and profile picture"
        icon={<Edit2 size={18} />}
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={isLoading} onClick={handlesave}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setname(e.target.value)}
            placeholder="Your name"
          />

          {/* Avatar file upload */}
          <div className="flex flex-col items-center justify-center pt-1">
            <span className="text-xs font-semibold text-slate-600 mb-2">Profile Photo</span>
            <div className="relative group">
              {profilee?.profileImage ? (
                <img
                  src={profilee?.profileImage}
                  alt={profilee?.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-teal-600 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
                  {profilee?.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <input
                type="file"
                ref={inputRef}
                className="hidden"
                onChange={handlePhotoChange}
                accept="image/*"
              />
              <button
                type="button"
                onClick={() => inputRef.current && inputRef.current.click()}
                className="absolute bottom-0 right-0 rounded-full bg-teal-800 hover:bg-teal-900 text-white p-1.5 shadow cursor-pointer transition"
                title="Change Photo"
              >
                <Edit2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </Modalbox>

      {/* 2. Direct Change Password Modal (Using Standard Common Modalbox) */}
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
          {/* Current Password */}
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

          {/* New Password */}
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

          {/* Confirm New Password */}
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

export default AdminManagerProfile;
