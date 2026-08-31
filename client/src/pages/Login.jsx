import React, { useState } from "react";
import { TextField, Button, Typography, IconButton, InputAdornment } from "@mui/material";
import { useApi } from "../utils/useApi";
import { toast } from "../utils/toast";
import { useDispatch } from "react-redux";
import { setlogin } from "../../store/authSlice";
import { useNavigate } from "react-router-dom";
import { setuser } from "../../store/userSlice";
import { Eye, EyeOff, Building2, Users2, ShieldCheck, Sparkles } from "lucide-react";

const Login = () => {
    const [loginType, setLoginType] = useState("admin"); // 'admin' | 'sponsor'
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { request, loading: isLoading } = useApi();
    const dispatch = useDispatch();
    let navigate = useNavigate();

    const isSponsor = loginType === "sponsor";

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!identifier || !password) {
            toast.error("Please enter your login ID and password");
            return;
        }

        try {
            const data = await request({
                url: "signin",
                method: "POST",
                body: { email: identifier.trim(), password, loginType }
            });

            toast.success(data.message || "Login successful!");
            localStorage.setItem("emstoken", data.token);
            dispatch(setlogin(true));
            dispatch(setuser(data.user));

            if (data.user?.role === "sponsor") {
                return navigate(`/dashboard/plots/sponsors/${data.user.id}/ledger`);
            }
            return navigate("/dashboard");
        } catch (error) {
            console.error("Login error:", error);
            toast.error(error.message || "Login failed. Please verify credentials.");
        }
    };

    return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-b from-green-200 to-white p-4 select-none">
            <div className="flex flex-col md:flex-row items-center md:items-stretch shadow-xl bg-white rounded-2xl overflow-hidden w-full max-w-fit border border-slate-200">
                {/* Left Side Illustration Image */}
                <div className="w-full md:w-[350px] h-[200px] md:h-auto flex-shrink-0 bg-slate-50 flex items-center justify-center p-4">
                    <img
                        src="https://res.cloudinary.com/dusxlxlvm/image/upload/v1756013721/ems/assets/10782895_19199299_1_q2oxsf.svg"
                        alt="Login Illustration"
                        className="w-full h-full max-h-[360px] object-contain"
                    />
                </div>

                {/* Right Side Form with Login Mode Switch */}
                <div className="flex items-center justify-center w-full md:w-[340px] p-6 md:p-8">
                    <div className="w-full space-y-4">
                        {/* Mode Selector Tabs */}
                        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 gap-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setLoginType("admin");
                                    setIdentifier("");
                                }}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    !isSponsor
                                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                <Building2 size={15} className={!isSponsor ? "text-teal-700" : "text-slate-400"} />
                                <span>Staff / Admin</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setLoginType("sponsor");
                                    setIdentifier("");
                                }}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    isSponsor
                                        ? "bg-teal-700 text-white shadow-xs"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                <Users2 size={15} className={isSponsor ? "text-teal-200" : "text-slate-400"} />
                                <span>Sponsor Portal</span>
                            </button>
                        </div>

                        {/* Title Header */}
                        <div>
                            <h2 className="text-xl font-black text-slate-900">
                                {isSponsor ? "Sponsor Login" : "Staff & Admin Sign In"}
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                                {isSponsor
                                    ? "Enter your Sponsor ID (e.g. GNE-26-27-001) or mobile"
                                    : "Enter your registered email and password to access"}
                            </p>
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    {isSponsor ? "Sponsor ID / Mobile / Email" : "Email Address"}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder={isSponsor ? "e.g. GNE-26-27-001 or 9876543210" : "name@goodnature.com"}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {isSponsor && (
                                    <p className="text-[11px] text-slate-400 mt-1 font-medium">
                                        Default password for new sponsors is <span className="font-mono font-bold text-slate-600">123456</span>
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98] cursor-pointer disabled:opacity-50 ${
                                    isSponsor
                                        ? "bg-teal-700 hover:bg-teal-800 shadow-teal-700/20"
                                        : "bg-slate-900 hover:bg-slate-800 shadow-slate-900/20"
                                }`}
                            >
                                {isLoading ? "Authenticating..." : isSponsor ? "Sign In to Sponsor Portal" : "Sign In to Workspace"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
