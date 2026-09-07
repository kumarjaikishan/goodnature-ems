import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import Input from '@/components/ui/Input';
import NumberInput from '@/components/ui/NumberInput';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

const PayrollPolicies = ({ companyinp, setcompany, handleSubmit }) => {
    return (
        <div className="space-y-6">
            {['allowances', 'bonuses', 'deductions'].map((type) => {
                const policies = companyinp?.payrollPolicies?.[type] || [];

                return (
                    <div
                        className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs relative"
                        key={type}
                    >
                        <span className="capitalize font-bold text-xs tracking-wider text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full">
                            {type}
                        </span>

                        <div className="mt-4 flex flex-col gap-3">
                            {policies.map((item, idx) => (
                                <div key={idx} className="flex flex-wrap md:flex-nowrap items-center gap-3 p-2 rounded-lg bg-slate-50/50 border border-slate-100">
                                    <div className="flex-1 min-w-[160px]">
                                        <Input
                                            size="sm"
                                            placeholder="Policy name (e.g. HRA, Medical)"
                                            required
                                            value={item.name}
                                            onChange={(e) => {
                                                const updated = policies.map((policy, i) =>
                                                    i === idx ? { ...policy, name: e.target.value } : policy
                                                );
                                                setcompany({
                                                    ...companyinp,
                                                    payrollPolicies: {
                                                        ...companyinp.payrollPolicies,
                                                        [type]: updated
                                                    }
                                                });
                                            }}
                                        />
                                    </div>

                                    <div className="w-32">
                                        <Select
                                            size="sm"
                                            options={[
                                                { label: 'Amount (₹)', value: 'amount' },
                                                { label: 'Percent (%)', value: 'percentage' }
                                            ]}
                                            value={item.type}
                                            onChange={(e) => {
                                                const updated = policies.map((policy, i) =>
                                                    i === idx ? { ...policy, type: e.target.value } : policy
                                                );
                                                setcompany({
                                                    ...companyinp,
                                                    payrollPolicies: {
                                                        ...companyinp.payrollPolicies,
                                                        [type]: updated
                                                    }
                                                });
                                            }}
                                        />
                                    </div>

                                    <div className="w-28">
                                        <NumberInput
                                            size="sm"
                                            currency={item.type === 'amount'}
                                            placeholder="0"
                                            value={item.value}
                                            onChange={(e) => {
                                                const updated = policies.map((policy, i) =>
                                                    i === idx ? { ...policy, value: Number(e.target.value) } : policy
                                                );
                                                setcompany({
                                                    ...companyinp,
                                                    payrollPolicies: {
                                                        ...companyinp.payrollPolicies,
                                                        [type]: updated
                                                    }
                                                });
                                            }}
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        title="Delete Policy"
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                        onClick={() => {
                                            const updated = policies.filter((_, i) => i !== idx);
                                            setcompany({
                                                ...companyinp,
                                                payrollPolicies: {
                                                    ...companyinp.payrollPolicies,
                                                    [type]: updated
                                                }
                                            });
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3">
                            <Button
                                size="sm"
                                variant="outline"
                                startIcon={Plus}
                                onClick={() =>
                                    setcompany({
                                        ...companyinp,
                                        payrollPolicies: {
                                            ...companyinp.payrollPolicies,
                                            [type]: [
                                                ...policies,
                                                { name: '', type: 'amount', value: 0 }
                                            ]
                                        }
                                    })
                                }
                            >
                                Add {type.slice(0, -1)}
                            </Button>
                        </div>
                    </div>
                );
            })}

            <div className="flex justify-end pt-2">
                <Button variant="primary" onClick={handleSubmit}>
                    Save Payroll Policies
                </Button>
            </div>
        </div>
    );
};

export default PayrollPolicies;
