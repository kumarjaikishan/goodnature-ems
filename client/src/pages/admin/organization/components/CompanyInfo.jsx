import React from 'react';
import { Building2, Camera } from 'lucide-react';
import { toast } from '../../../../utils/toast';
import { apiClient } from '../../../../utils/apiClient';
import { cloudinaryUrl } from '../../../../utils/imageurlsetter';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const CompanyInfo = ({ companyinp, setcompany, isload, setisload, handleImage, addCompany, profile }) => {
    const handleSubmit = async (e) => {
        e.preventDefault();
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

    return (
        <div className="p-4 md:p-6 rounded-xl flex flex-col md:flex-row items-center gap-8">
            <div className="relative flex items-center justify-center">
                <div className="relative w-32 h-32">
                    {companyinp?.logo ? (
                        <img
                            src={cloudinaryUrl(companyinp.logo, {
                                format: "webp",
                                width: 200,
                                height: 200,
                            })}
                            alt="Company Logo"
                            className="w-full h-full object-cover rounded-full border-2 border-teal-200 shadow-sm"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center rounded-full border-2 border-dashed border-teal-300 bg-teal-50 text-teal-700">
                            <Building2 className="w-12 h-12" />
                        </div>
                    )}
                    <input
                        type="file"
                        id="logo-upload"
                        accept="image/*"
                        onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;

                            const optimisedLogo = await handleImage(300, file);
                            const formData = new FormData();
                            formData.append('_id', companyinp._id);
                            formData.append('logo', optimisedLogo);

                            try {
                                setisload(true);
                                const data = await apiClient({
                                    url: "updateCompany",
                                    method: "POST",
                                    body: formData
                                });

                                const uploadedUrl = data.logoUrl;
                                setcompany((prev) => ({ ...prev, logo: uploadedUrl }));
                                toast.success("Logo uploaded successfully!");
                            } catch (error) {
                                console.error('Error uploading logo:', error);
                                toast.error("Failed to upload logo");
                            } finally {
                                setisload(false);
                            }
                        }}
                        className="hidden"
                    />

                    <label
                        htmlFor="logo-upload"
                        title="Upload Logo"
                        className="absolute bottom-0 right-0 w-8 h-8 flex items-center justify-center bg-white border border-slate-300 rounded-full cursor-pointer shadow-md hover:bg-slate-50 transition text-slate-600"
                    >
                        <Camera size={16} />
                    </label>
                </div>
            </div>

            <div className="w-full md:flex-1 flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Company Short Name"
                        size="md"
                        placeholder="e.g. Good Nature"
                        value={companyinp?.name || ""}
                        onChange={(e) => setcompany({ ...companyinp, name: e.target.value })}
                    />

                    <Input
                        label="Contact Number"
                        type="tel"
                        size="md"
                        placeholder="10-digit number"
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
                    label="Company Full Name"
                    size="md"
                    placeholder="e.g. Good Nature Merchandise Private Limited"
                    value={companyinp?.fullname || ""}
                    onChange={(e) => setcompany({ ...companyinp, fullname: e.target.value })}
                />

                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700 tracking-wide">
                        Office Address
                    </label>
                    <textarea
                        rows={2}
                        placeholder="Complete office address with pincode..."
                        className="w-full rounded-lg border border-slate-300 hover:border-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100/80 p-3 text-sm text-slate-800 outline-none transition"
                        value={companyinp?.address || ""}
                        onChange={(e) => setcompany({ ...companyinp, address: e.target.value })}
                    />
                </div>

                <div className="pt-2">
                    {companyinp?._id ? (
                        <Button
                            variant="primary"
                            loading={isload}
                            onClick={handleSubmit}
                        >
                            Save Company Details
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            loading={isload}
                            onClick={() => addCompany({ companyinp, setisload })}
                        >
                            + Create Company
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompanyInfo;
