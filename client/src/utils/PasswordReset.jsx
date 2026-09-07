import { useParams, useNavigate } from 'react-router-dom';
import { Save, Lock } from "lucide-react";
import { useState } from 'react';
import { toast } from "./toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const PasswordReset = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [inp, setinp] = useState({ pass: '', cpass: '' });
    const [isloading, setloading] = useState(false);

    const handlechange = (e) => {
        const { name, value } = e.target;
        setinp({ ...inp, [name]: value });
    };

    const handlesubmit = async (e) => {
        e.preventDefault();
        try {
            setloading(true);
            const rese = await fetch(`${import.meta.env.VITE_API_ADDRESS}setpassword?token=${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: inp.pass })
            });
            const resuke = await rese.json();
            setloading(false);
            if (!rese.ok) {
                return toast.warn(resuke.message, { autoClose: 2100 });
            }
            toast.success(resuke.message, { autoClose: 1600 });
            navigate('/logout');
        } catch (error) {
            toast.warn(error.message, { autoClose: 2100 });
            setloading(false);
        }
    };

    const isMismatch = inp.cpass.length > 0 && inp.pass !== inp.cpass;

    return (
        <div className="w-full p-4 h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl border border-slate-200/80 overflow-hidden">
                <div className="px-6 py-4 bg-teal-800 text-white flex items-center gap-2.5">
                    <Lock size={18} />
                    <h2 className="text-base font-bold tracking-wide">
                        Reset Password
                    </h2>
                </div>

                <form onSubmit={handlesubmit} className="p-6 space-y-4">
                    <Input
                        required
                        type='password'
                        name="pass"
                        label="New Password"
                        placeholder="Enter new password"
                        onChange={handlechange}
                        value={inp.pass}
                    />

                    <Input
                        required
                        type='password'
                        name="cpass"
                        label="Confirm Password"
                        placeholder="Repeat new password"
                        onChange={handlechange}
                        value={inp.cpass}
                        error={isMismatch ? "Passwords must match" : undefined}
                    />

                    <div className="pt-2">
                        <Button
                            type="submit"
                            variant="primary"
                            loading={isloading}
                            disabled={isMismatch || !inp.pass.length}
                            startIcon={Save}
                            className="w-full"
                        >
                            Change Password
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordReset;
