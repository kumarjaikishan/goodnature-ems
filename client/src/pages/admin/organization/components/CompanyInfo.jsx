import React from 'react';
import { TextField, Button } from '@mui/material';
import { AiFillAmazonCircle } from "react-icons/ai";
import { toast } from 'react-toastify';
import { apiClient } from '../../../../utils/apiClient';
import { cloudinaryUrl } from '../../../../utils/imageurlsetter';

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
            toast.success(data.message, { autoClose: 1800 });
        } catch (error) {
            console.error('Error updating company:', error);
        } finally {
            setisload(false);
        }
    };

    return (
        <div className="p-1 md:p-4 rounded flex flex-col md:flex-row items-center mt-2 space-y-4">
            <div className="relative flex items-center mx-auto">
                <div className="relative w-30 h-30 mx-auto">
                    {companyinp?.logo ? (
                        <img
                            src={cloudinaryUrl(companyinp.logo, {
                                format: "webp",
                                width: 200,
                                height: 200,
                            })}
                            alt="Company Logo"
                            className="w-full h-full object-fill rounded-full border-2 border-dashed border-blue-300"
                        />
                    ) : (
                        <AiFillAmazonCircle className="w-full h-full text-blue-400 rounded-full border-2 border-dashed border-blue-300" />
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
                            } finally {
                                setisload(false);
                            }
                        }}
                        className="hidden"
                    />

                    <label
                        htmlFor="logo-upload"
                        className="absolute w-8 h-8 text-center bottom-0 right-0 bg-white border border-gray-300 rounded-full p-1 cursor-pointer shadow-md"
                    >
                        ✎
                    </label>
                </div>
            </div>

            <div className="w-full md:w-[70%] flex flex-col gap-3">
                <div className='flex flex-wrap gap-2'>
                    <div className='w-full md:flex-1'>
                        <TextField
                            label="Company Name"
                            size='small'
                            variant="standard"
                            fullWidth
                            value={companyinp?.name || ""}
                            onChange={(e) => setcompany({ ...companyinp, name: e.target.value })}
                        />
                    </div>

                    <div className='w-full md:flex-1'>
                        <TextField
                            label="Contact"
                            type='tel'
                            variant="standard"
                            size='small'
                            fullWidth
                            value={companyinp?.contact || ""}
                            inputProps={{
                                maxLength: 10,
                                inputMode: "numeric",
                                pattern: "[0-9]*"
                            }}
                            onChange={(e) =>
                                setcompany({
                                    ...companyinp,
                                    contact: e.target.value.replace(/\D/g, "")
                                })
                            }
                        />
                    </div>
                </div>

                <div>
                    <TextField
                        label="Company Full Name"
                        variant="standard"
                        fullWidth
                        size='small'
                        value={companyinp?.fullname || ""}
                        onChange={(e) => setcompany({ ...companyinp, fullname: e.target.value })}
                    />
                </div>

                <div>
                    <TextField
                        label="Address"
                        fullWidth
                        multiline
                        size='small'
                        minRows={2}
                        value={companyinp?.address || ""}
                        onChange={(e) => setcompany({ ...companyinp, address: e.target.value })}
                    />
                </div>

                {companyinp?._id ? (
                    <Button variant="contained" loading={isload} onClick={handleSubmit}>
                        Save Changes
                    </Button>
                ) : (
                    <Button loading={isload} variant="contained" onClick={() => addCompany({ companyinp, setisload })}>
                        + Create Company
                    </Button>
                )}
            </div>
        </div>
    );
};

export default CompanyInfo;
