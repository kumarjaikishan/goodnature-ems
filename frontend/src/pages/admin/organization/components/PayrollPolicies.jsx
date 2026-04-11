import React from 'react';
import { Box, TextField, Select, MenuItem, Button } from '@mui/material';
import { AiOutlineDelete } from 'react-icons/ai';

const PayrollPolicies = ({ companyinp, setcompany, handleSubmit }) => {
    return (
        <div className="flex flex-col gap-3">
            {['allowances', 'bonuses', 'deductions'].map((type) => {
                const policies = companyinp?.payrollPolicies?.[type] || [];

                return (
                    <div className="flex flex-col shadow-lg gap-2 px-2 pb-2 my-2 border rounded border-dashed relative border-primary" key={type}>
                        <p className="capitalize absolute t-0 -translate-y-1/2 l-2 bg-white px-2 font-bold text-primary">{type}</p>
                        <div className="mt-6 flex flex-col gap-2">
                            {policies.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 mb-2">
                                    <TextField
                                        label="Name"
                                        size="small"
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
                                    <Select
                                        size="small"
                                        className="w-[120px]"
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
                                    >
                                        <MenuItem value="amount">Amount</MenuItem>
                                        <MenuItem value="percentage">%</MenuItem>
                                    </Select>
                                    <TextField
                                        label={item.type === 'amount' ? '₹' : '%'}
                                        type="number"
                                        size="small"
                                        required
                                        className="w-[90px]"
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
                                    <AiOutlineDelete
                                        className="text-red-500 w-8 h-8 p-1 cursor-pointer text-lg"
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
                                    />
                                </div>
                            ))}
                        </div>
                        <Button
                            size="small"
                            variant="outlined"
                            className='w-fit'
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
                            + Add {type.slice(0, -1)}
                        </Button>
                    </div>
                );
            })}
            <Box sx={{ mt: 2, textAlign: 'right' }}>
                <Button variant="contained" onClick={handleSubmit}>
                    Save Policies
                </Button>
            </Box>
        </div>
    );
};

export default PayrollPolicies;
