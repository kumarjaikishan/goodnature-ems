import React from 'react';
import Button from '@/components/ui/Button';

const LeaveSettings = ({ data, onChange, onSubmit, isload }) => {
    return (
        <div className="p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="p-4 rounded-xl border border-slate-200/80 flex items-center justify-between bg-slate-50/50">
                <div>
                    <h4 className="text-sm font-bold text-slate-800">Employee Leave Ledger Visibility</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                        When enabled, employees can view their full leave history and ledger balance in their self-service portal.
                    </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={data?.leaveSettings?.allowEmployeeToSeeLedger || false}
                        onChange={(e) => onChange('leaveSettings', 'allowEmployeeToSeeLedger', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
            </div>

            <div className="flex justify-end pt-2">
                <Button
                    variant="primary"
                    onClick={onSubmit}
                    loading={isload}
                >
                    Save Settings
                </Button>
            </div>
        </div>
    );
};

export default LeaveSettings;
