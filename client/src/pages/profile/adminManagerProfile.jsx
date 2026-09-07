import { Mail, Settings, Edit2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "../../utils/toast";
import { swal } from "../../utils/confirmDialog";
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

  const resetpassword = async () => {
    let id;
    try {
      setisloading(true);
      id = toast.loading("Please wait...");

      const data = await apiClient({
        url: "resetrequest"
      });

      setisloading(false);
      swal({ title: data.extramessage, icon: "success" });

      toast.update(id, {
        render: data.message,
        type: "success",
        isLoading: false,
        autoClose: 2100,
      });
    } catch (error) {
      setisloading(false);
      toast.update(id, {
        render: error.message,
        type: "warn",
        isLoading: false,
        autoClose: 2200,
      });
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
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
                  {profilee?.role}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Mail size={14} className="text-slate-400" />
                <span>{profilee?.email || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {profile?.role === "superadmin" && (
            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
              <Button
                onClick={() => { setname(profilee?.name || ''); setEditOpen(true); }}
                disabled={isLoading}
                variant="primary"
              >
                <Edit2 size={14} /> Edit Profile
              </Button>

              <Button
                onClick={resetpassword}
                disabled={isLoading}
                variant="secondary"
              >
                Send Password Reset Link
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modalbox open={EditOpen} onClose={() => setEditOpen(false)}>
        <div className="w-[380px] max-w-[92vw] p-6 bg-white rounded-2xl space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800">Edit Profile</h2>
            <button type="button" onClick={() => setEditOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
          </div>

          <div className="space-y-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setname(e.target.value)}
              placeholder="Your name"
            />

            {/* Avatar file upload */}
            <div className="flex justify-center">
              <div className="relative group">
                {profilee?.profileImage ? (
                  <img
                    src={profilee?.profileImage}
                    alt={profilee?.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-teal-600"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-2xl">
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
                >
                  <Edit2 size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={isLoading} onClick={handlesave}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modalbox>
    </div>
  );
};

export default AdminManagerProfile;
