import React from 'react';
import {
    Building2, Camera, Phone, MapPin, Save
} from 'lucide-react';
import { toast } from '../../../../utils/toast';
import { apiClient } from '../../../../utils/apiClient';
import { cloudinaryUrl } from '../../../../utils/imageurlsetter';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const CompanyInfo = ({
    companyinp,
    setcompany,
    isload,
    setisload,
    handleImage
}) => {

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        try {
            setisload(true);
            const data = await apiClient({
                url: "updateCompany",
                method: "POST",
                body: companyinp
            });
            toast.success(data.message || "Company details updated successfully!", { autoClose: 1800 });
        } catch (error) {
            console.error('Error updating company:', error);
            toast.error(error.message || "Failed to update company");
        } finally {
            setisload(false);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setisload(true);
            const optimisedLogo = await handleImage(300, file);
            const formData = new FormData();
            formData.append('_id', companyinp._id);
            formData.append('logo', optimisedLogo);

            const data = await apiClient({
                url: "updateCompany",
                method: "POST",
                body: formData
            });

            const uploadedUrl = data.logoUrl;
            setcompany((prev) => ({ ...prev, logo: uploadedUrl }));
            toast.success("Company logo updated successfully!");
        } catch (error) {
            console.error('Error uploading logo:', error);
            toast.error("Failed to upload logo");
        } finally {
            setisload(false);
        }
    };

    return (
        <div className="w-full">
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Card: Brand Identity */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Brand Card */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col items-center text-center space-y-4">
                        <div className="relative">
                            <div className="w-28 h-28 rounded-2xl border-2 border-teal-200 shadow-sm overflow-hidden flex items-center justify-center bg-slate-50 relative group">
                                {companyinp?.logo ? (
                                    <img
                                        src={cloudinaryUrl(companyinp.logo, {
                                            format: "webp",
                                            width: 250,
                                            height: 250,
                                        })}
                                        alt="Company Logo"
                                        className="w-full h-full object-contain p-2"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-teal-50 text-teal-700 p-3">
                                        <Building2 size={36} />
                                        <span className="text-[10px] font-bold mt-1 text-teal-800">No Logo</span>
                                    </div>
                                )}
                            </div>

                            {/* Camera Upload Button */}
                            <input
                                type="file"
                                id="logo-upload"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                            />
                            <label
                                htmlFor="logo-upload"
                                title="Change Brand Logo"
                                className="absolute -bottom-2 -right-2 w-9 h-9 bg-teal-800 hover:bg-teal-900 text-white rounded-xl flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-105 border-2 border-white"
                            >
                                <Camera size={15} />
                            </label>
                        </div>

                        <div>
                            <h3 className="text-base font-bold text-slate-800">
                                {companyinp?.name || "Company Name"}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-xs">
                                {companyinp?.fullname || "Legal Entity Title"}
                            </p>
                        </div>

                        <div className="w-full pt-3 border-t border-slate-100 flex flex-col gap-2 text-left">
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                <Phone size={14} className="text-teal-700 shrink-0" />
                                <span className="font-medium">{companyinp?.contact ? `+91 ${companyinp.contact}` : "No contact provided"}</span>
                            </div>
                            <div className="flex items-start gap-2 text-xs text-slate-600">
                                <MapPin size={14} className="text-teal-700 shrink-0 mt-0.5" />
                                <span className="text-[11px] leading-relaxed text-slate-500 line-clamp-2">
                                    {companyinp?.address || "Address not configured"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Card: Company Details Form */}
                <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
                    <div>
                        <h3 className="text-base font-bold text-slate-800">Corporate & Legal Information</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Update your organization's legal name, primary phone number, and registered headquarters address.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Company Short / Trade Name"
                                placeholder="e.g. Good Nature"
                                value={companyinp?.name || ""}
                                onChange={(e) => setcompany({ ...companyinp, name: e.target.value })}
                                required
                            />

                            <Input
                                label="Primary Contact Number"
                                type="tel"
                                placeholder="10-digit mobile or landline"
                                value={companyinp?.contact || ""}
                                maxLength={10}
                                onChange={(e) =>
                                    setcompany({
                                        ...companyinp,
                                        contact: e.target.value.replace(/\D/g, "")
                                    })
                                }
                            />
                        </div>

                        <Input
                            label="Legal Registered Full Entity Name"
                            placeholder="e.g. Good Nature Merchandise Private Limited"
                            value={companyinp?.fullname || ""}
                            onChange={(e) => setcompany({ ...companyinp, fullname: e.target.value })}
                        />

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-700 tracking-wide">
                                Registered Head Office Address
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Complete street address, landmark, city, state and PIN code..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-teal-700 focus:ring-1 focus:ring-teal-700 p-3 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400"
                                value={companyinp?.address || ""}
                                onChange={(e) => setcompany({ ...companyinp, address: e.target.value })}
                            />
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">
                                Last updated in system storage
                            </span>
                            <Button
                                variant="primary"
                                loading={isload}
                                startIcon={Save}
                                type="submit"
                            >
                                Save Company Details
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CompanyInfo;
