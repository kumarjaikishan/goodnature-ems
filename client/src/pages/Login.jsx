import React, { useState } from "react";
import { useApi } from "../utils/useApi";
import { toast } from "../utils/toast";
import { useDispatch } from "react-redux";
import { setlogin } from "../../store/authSlice";
import { useNavigate } from "react-router-dom";
import { setuser } from "../../store/userSlice";
import { resetRedirectFlag } from "../utils/auth";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { request, loading: isLoading } = useApi();
    const dispatch = useDispatch();
    const navigate = useNavigate();

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
                body: { email: identifier.trim(), password }
            });

            toast.success(data.message || "Login successful!");
            resetRedirectFlag();
            localStorage.setItem("emstoken", data.token);
            dispatch(setlogin(true));
            dispatch(setuser(data.user));

            navigate("/dashboard");
        } catch (error) {
            console.error("Login error:", error);
            toast.error(error.message || "Login failed. Please verify credentials.");
        }
    };

    return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-b from-teal-100/60 via-slate-50 to-white p-4 sm:p-6 select-none">
            {/* Main Card */}
            <div className="flex flex-col md:flex-row items-center md:items-stretch shadow-xl bg-white rounded-3xl overflow-hidden w-full max-w-[820px] border border-slate-200">
                {/* Left Side Illustration Image */}
                <div className="w-full md:w-[380px] min-h-[260px] md:min-h-full flex-shrink-0 bg-slate-50 flex items-center justify-center p-0 overflow-hidden border-b md:border-b-0 md:border-r border-slate-100">
                    <img
                        src="https://res.cloudinary.com/dusxlxlvm/image/upload/v1756013721/ems/assets/10782895_19199299_1_q2oxsf.svg"
                        alt="Login Illustration"
                        className="w-full h-full min-h-[260px] md:min-h-[440px] object-cover object-center"
                    />
                </div>

                {/* Right Side Form */}
                <div className="flex items-center justify-center w-full md:w-[440px] p-6 sm:p-8 md:p-10">
                    <div className="w-full space-y-6">
                        {/* Title Header */}
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                Good Feel
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                Enter ID and Password
                            </p>
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    ID
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoComplete="username"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="Enter ID"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none transition"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-slate-700">Password</label>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter Password"
                                        className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md bg-teal-700 hover:bg-teal-800 active:scale-[0.98] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-teal-700/20"
                                >
                                    {isLoading ? "Authenticating..." : "Sign In"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
