import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Modalbox from "@/components/custommodal/Modalbox";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ResetPasswordModal({
    isOpen,
    onClose,
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
            subtitle="Set a new secure password for this administrative account"
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
