import React, { useState } from "react";
import { Eye, EyeOff, User } from "lucide-react";
import Modalbox from "@/components/custommodal/Modalbox";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ResetPasswordModal({
    isOpen,
    onClose,
    user,
    pass,
    setPass,
    onSubmit,
}) {
    const [showPassword, setShowPassword] = useState(true);

    return (
        <Modalbox
            open={isOpen}
            onClose={onClose}
            title="Reset User Password"
            subtitle={user?.name ? `Set a new password for ${user.name}` : "Set a new secure password for this account"}
            maxWidth="max-w-md"
            footer={
                <>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="reset-password-form"
                        variant="primary"
                    >
                        Update Password
                    </Button>
                </>
            }
        >
            <form id="reset-password-form" onSubmit={onSubmit} className="space-y-4">
                {user && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/90 rounded-2xl">
                        {user.profileImage ? (
                            <img
                                src={user.profileImage}
                                alt={user.name}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-sm border border-teal-200 shrink-0">
                                {user.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 text-xs truncate">{user.name}</span>
                                {user.role && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100/80 text-teal-900 border border-teal-200 shrink-0">
                                        {user.role}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</p>
                        </div>
                    </div>
                )}

                <div className="relative">
                    <Input
                        label="New Password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={4}
                        maxLength={20}
                        placeholder="Enter new password (min 4 characters)"
                        value={pass.pass}
                        onChange={(e) => setPass({ ...pass, pass: e.target.value })}
                        className="pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-[27px] p-1 text-slate-400 hover:text-teal-700 transition cursor-pointer rounded"
                        title={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </form>
        </Modalbox>
    );
}
