import React from 'react';
import {
  Box, Button, FormControl, FormControlLabel, InputAdornment,
  InputLabel, MenuItem, Select, Switch, TextField, Typography, Avatar
} from '@mui/material';
import { Send, Edit2, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import Modalbox from '../../../components/custommodal/Modalbox';

const EmployeeFormModal = ({
  open,
  onClose,
  isupdate,
  inp,
  setInp,
  handleChange,
  handleNestedChange,
  addItem,
  removeItem,
  photoPreview,
  handlePhotoChange,
  inputref,
  openSection,
  toggleSection,
  branch,
  department,
  profile,
  adddepartcall,
  isload,
  init,
  resetPhoto
}) => {
  return (
    <Modalbox open={open} onClose={onClose}>
      <div className="membermodal w-[680px]">
        <div className="whole">
          <form onSubmit={adddepartcall}>
            <div className="modalhead">{isupdate ? "Update Employee" : "Add Employee"}</div>
            <span className="modalcontent">
              <div className='flex flex-col gap-3 w-full'>
                <FormControl fullWidth required size="small">
                  <InputLabel>Branch</InputLabel>
                  <Select
                    value={inp.branchId}
                    label="branch"
                    onChange={(e) => handleChange(e, 'branchId')}
                  >
                    {profile?.role === 'manager'
                      ? branch?.filter((e) => profile?.branchIds?.includes(e._id))
                        ?.map((list) => (
                          <MenuItem key={list._id} value={list._id}>
                            {list.name}
                          </MenuItem>
                        ))
                      : branch?.map((list) => (
                        <MenuItem key={list._id} value={list._id}>
                          {list.name}
                        </MenuItem>
                      ))
                    }
                  </Select>
                </FormControl>

                <div className="flex gap-2">
                  <FormControl disabled={!inp.branchId} fullWidth required size="small">
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={inp.department}
                      label="Department"
                      onChange={(e) => handleChange(e, 'department')}
                    >
                      {department?.filter(e => (e.branchId?._id || e.branchId) === inp.branchId).length > 0 ? (
                        department
                          .filter(e => (e.branchId?._id || e.branchId) === inp.branchId)
                          .map((list) => (
                            <MenuItem key={list._id} value={list._id}>
                              {list.department}
                            </MenuItem>
                          ))
                      ) : (
                        <MenuItem disabled>No departments found</MenuItem>
                      )}
                    </Select>
                  </FormControl>

                  <FormControl disabled={!inp.branchId} fullWidth required size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={inp?.status}
                      label="Status"
                      onChange={(e) => handleChange(e, 'status')}
                    >
                      <MenuItem value={true}>Active</MenuItem>
                      <MenuItem value={false}>Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </div>

                <div className="flex gap-2">
                  <TextField fullWidth required value={inp.employeeName || ''} onChange={(e) => handleChange(e, 'employeeName')} label="Name" size="small" />
                  <TextField fullWidth required value={inp.email || ''} onChange={(e) => handleChange(e, 'email')} label="Email" size="small" />
                </div>

                <div className="flex gap-2">
                  <TextField fullWidth value={inp.designation || ''} onChange={(e) => handleChange(e, 'designation')} label="Designation" size="small" />
                  <TextField fullWidth value={inp.salary || ''} onChange={(e) => handleChange(e, 'salary')} label="Salary" size="small" />
                </div>

                <div className="flex gap-2">
                  <TextField
                    fullWidth
                    type="number"
                    value={inp.empId || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.length <= 3) {
                        handleChange(e, "empId");
                      }
                    }}
                    label="Employee ID"
                    size="small"
                    helperText={`ID - EMP${String(inp?.empId || '').padStart(3, '0')}`}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">EMP</InputAdornment>,
                    }}
                    inputProps={{
                      maxLength: 3,
                    }}
                  />

                  <TextField
                    fullWidth
                    value={inp?.guardian?.name || ''}
                    onChange={(e) =>
                      setInp((prev) => ({
                        ...prev,
                        guardian: { ...prev.guardian, name: e.target.value },
                      }))
                    }
                    label="Guardian Name"
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ minWidth: 45 }}>
                          <Select
                            variant="standard"
                            disableUnderline
                            value={inp?.guardian?.relation || "S/o"}
                            onChange={(e) =>
                              setInp((prev) => ({
                                ...prev,
                                guardian: { ...prev.guardian, relation: e.target.value },
                              }))
                            }
                          >
                            <MenuItem value="S/o">S/o</MenuItem>
                            <MenuItem value="D/o">D/o</MenuItem>
                            <MenuItem value="H/o">H/o</MenuItem>
                            <MenuItem value="W/o">W/o</MenuItem>
                          </Select>
                        </InputAdornment>
                      ),
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <TextField
                    fullWidth
                    type="tel"
                    value={inp.deviceUserId || ''}
                    inputProps={{ maxLength: 1000, inputMode: 'numeric', pattern: '[0-9]*' }}
                    onChange={(e) => {
                      const onlyNums = e.target.value.replace(/\D/g, '');
                      handleChange({ ...e, target: { ...e.target, value: onlyNums } }, 'deviceUserId');
                    }}
                    label="deviceUserId"
                    size="small"
                  />
                  <TextField
                    fullWidth
                    value={inp.telegramId || ''}
                    onChange={(e) => handleChange(e, 'telegramId')}
                    label="Telegram Chat ID"
                    size="small"
                  />
                </div>

                <div className="w-full flex justify-center">
                  <div className="mt-1 w-fit text-center gap-2 relative">
                    <input style={{ display: 'none' }} type="file" onChange={handlePhotoChange} ref={inputref} accept="image/*" id="fileInput" />
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="mt-2 w-[100px] h-[100px] rounded-full object-cover" />
                    ) : (
                      <Avatar sx={{ width: 100, height: 100 }} alt={inp.employeeName} src="/static/images/avatar/1.jpg" />
                    )}
                    <span
                      onClick={() => inputref.current && inputref.current.click()}
                      className="absolute -bottom-1 -right-1 rounded-full bg-teal-900 text-white p-1 cursor-pointer"
                    >
                      <Edit2 size={16} />
                    </span>
                  </div>
                </div>

                {/* Personal Details (Accordion) */}
                {isupdate && (
                  <div className='border flex flex-col w-full shadow-lg bg-slate-50 border-dashed border-slate-400 rounded-md'>
                    <div
                      className="flex justify-between items-center cursor-pointer bg-primary text-white px-4 py-2 rounded-md"
                      onClick={() => toggleSection('personal')}
                    >
                      <span className="md:font-semibold text-[12px] md:text-sm text-left">Personal Details (Optional)</span>
                      {openSection === 'personal' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>

                    <div
                      className={`
                        rounded overflow-hidden transition-all duration-300 ease-linear
                        ${openSection === 'personal' ? 'max-h-[500px] p-2 my-2' : 'max-h-0 p-0 my-0'}
                      `}
                    >
                      <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 2,
                      }}>
                        <TextField fullWidth value={inp.phone || ''} inputProps={{ maxLength: 10 }} onChange={(e) => handleChange(e, 'phone')} label="Phone" size="small" />
                        <TextField fullWidth value={inp.Emergencyphone || ''} inputProps={{ maxLength: 10 }} onChange={(e) => handleChange(e, 'Emergencyphone')} label="Emergency/ Relative Phone" size="small" />
                        <TextField fullWidth value={inp.address || ''} onChange={(e) => handleChange(e, 'address')} label="Address" size="small" />
                        <TextField fullWidth value={inp.bloodGroup || ''} onChange={(e) => handleChange(e, 'bloodGroup')} label="Blood Group" size="small" />
                        <TextField fullWidth inputProps={{ maxLength: 12 }} value={inp.adhaar || ''} onChange={(e) => handleChange(e, 'adhaar')} label="Adhaar No." size="small" />
                        <TextField fullWidth inputProps={{ maxLength: 10 }} value={inp.pan || ''} onChange={(e) => handleChange(e, 'pan')} label="Pan No." size="small" />
                        <TextField InputLabelProps={{ shrink: true }} fullWidth value={inp.dob || ''} type="date" onChange={(e) => handleChange(e, 'dob')} label="Date of Birth" size="small" />
                        <FormControl size="small">
                          <InputLabel>Marital Status</InputLabel>
                          <Select
                            label="maritalStatus"
                            value={inp.maritalStatus}
                            onChange={(e) => handleChange(e, 'maritalStatus')}
                          >
                            <MenuItem value={true}>Married</MenuItem>
                            <MenuItem value={false}>Unmarried</MenuItem>
                          </Select>
                        </FormControl>
                        <FormControl size="small">
                          <InputLabel>Gender</InputLabel>
                          <Select
                            label="Gender"
                            value={inp.gender}
                            onChange={(e) => handleChange(e, 'gender')}
                          >
                            <MenuItem value='male'>Male</MenuItem>
                            <MenuItem value='female'>Female</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </div>
                  </div>
                )}

                {/* Banking Details */}
                {isupdate && (
                  <div className='border flex flex-col w-full shadow-lg bg-slate-50 border-dashed border-slate-400 rounded-md'>
                    <div
                      className="flex justify-between items-center cursor-pointer bg-primary text-white px-4 py-2 rounded-md"
                      onClick={() => toggleSection('banking')}
                    >
                      <span className="md:font-semibold text-[12px] md:text-sm text-left">Banking Details (optional)</span>
                      {openSection === 'banking' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>

                    <div
                      className={`
                        rounded overflow-hidden transition-all duration-300 ease-linear
                        ${openSection === 'banking' ? 'max-h-[500px] p-2 my-2' : 'max-h-0 p-0 my-0'}
                      `}
                    >
                      <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 2,
                      }}>
                        <TextField fullWidth value={inp.acHolderName || ''} onChange={(e) => handleChange(e, 'acHolderName')} label="A/C Holder Name" size="small" />
                        <TextField fullWidth value={inp.bankName || ''} onChange={(e) => handleChange(e, 'bankName')} label="Bank Name" size="small" />
                        <TextField fullWidth value={inp.bankbranch || ''} onChange={(e) => handleChange(e, 'bankbranch')} label="Branch" size="small" />
                        <TextField fullWidth value={inp.acnumber || ''} onChange={(e) => handleChange(e, 'acnumber')} label="A/C No." size="small" />
                        <TextField fullWidth value={inp.ifscCode || ''} onChange={(e) => handleChange(e, 'ifscCode')} label="IFSC Code" size="small" />
                        <TextField fullWidth value={inp.upi || ''} onChange={(e) => handleChange(e, 'upi')} label="Upi Id/No." size="small" />
                      </Box>
                    </div>
                  </div>
                )}

                {/* Achievements and Education */}
                {isupdate && (
                  <div className='border flex flex-col w-full shadow-lg bg-slate-50 border-dashed border-slate-400 rounded-md'>
                    <div
                      className="flex justify-between items-center cursor-pointer bg-primary text-white px-4 py-2 rounded-md"
                      onClick={() => toggleSection('document')}
                    >
                      <span className="md:font-semibold text-[12px] md:text-sm text-left">Document & Skills (optional)</span>
                      {openSection === 'document' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>

                    <div
                      className={`
                        rounded overflow-hidden transition-all duration-300 ease-linear flex gap-6 flex-col
                        ${openSection === 'document' ? 'max-h-[500px] p-2 my-2' : 'max-h-0 p-0 my-0'}
                      `}
                    >
                      <div className="flex flex-col gap-2">
                        <Typography fontWeight="bold">Achievements</Typography>
                        {inp?.achievements?.map((ach, idx) => (
                          <Box key={idx} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 2, alignItems: 'center' }}>
                            <TextField
                              label="Title"
                              size="small"
                              value={ach.title || ''}
                              onChange={(e) => handleNestedChange(e, 'achievements', idx, 'title')}
                            />
                            <TextField
                              label="Description"
                              size="small"
                              value={ach.description || ''}
                              onChange={(e) => handleNestedChange(e, 'achievements', idx, 'description')}
                            />
                            <TextField
                              type="date"
                              size="small"
                              label="Date"
                              InputLabelProps={{ shrink: true }}
                              value={ach.date || ''}
                              onChange={(e) => handleNestedChange(e, 'achievements', idx, 'date')}
                            />
                            <Trash2 size={20} className="text-red-500 hover:text-red-600 cursor-pointer" title="Delete this" onClick={() => removeItem('achievements', idx)} />
                          </Box>
                        ))}
                        <Button onClick={() => addItem('achievements')} variant="outlined">Add Achievement</Button>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Typography fontWeight="bold">Education</Typography>
                        {inp?.education?.map((edu, idx) => (
                          <Box key={idx} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 2, alignItems: 'center' }}>
                            <TextField
                              label="Degree"
                              size="small"
                              value={edu.degree || ''}
                              onChange={(e) => handleNestedChange(e, 'education', idx, 'degree')}
                            />
                            <TextField
                              label="Institution"
                              size="small"
                              value={edu.institution || ''}
                              onChange={(e) => handleNestedChange(e, 'education', idx, 'institution')}
                            />
                            <TextField
                              type="date"
                              size="small"
                              label="Date"
                              InputLabelProps={{ shrink: true }}
                              value={edu.date || ''}
                              onChange={(e) => handleNestedChange(e, 'education', idx, 'date')}
                            />
                            <Trash2 size={20} className="text-red-500 hover:text-red-600 cursor-pointer" title="Delete this" onClick={() => removeItem('education', idx)} />
                          </Box>
                        ))}
                        <Button onClick={() => addItem('education')} variant="outlined">Add Education</Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={inp.allowSeeLedger}
                        onChange={(e) => setInp({ ...inp, allowSeeLedger: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="Allow to see Ledger"
                  />
                </div>

                <FormControlLabel
                  label="Override Payroll Policies"
                  control={
                    <Switch
                      checked={inp.overridedefaultPolicies}
                      onChange={() =>
                        setInp(prev => ({
                          ...prev,
                          overridedefaultPolicies: !inp.overridedefaultPolicies,
                        }))
                      }
                      color="primary"
                    />
                  }
                  sx={{ mt: 2 }}
                />

                {/* Payroll Policies */}
                {isupdate && inp.overridedefaultPolicies && (
                  <div className='border flex flex-col w-full shadow-lg bg-slate-50 border-dashed border-slate-400 rounded-md'>
                    <div
                      className="flex justify-between items-center cursor-pointer bg-primary text-white px-4 py-2 rounded-md"
                      onClick={() => toggleSection('policy')}
                    >
                      <span className="md:font-semibold text-[12px] md:text-sm text-left">Payroll Policies</span>
                      {openSection === 'policy' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>

                    <div
                      className={`
                        rounded overflow-hidden transition-all duration-300 ease-linear flex gap-6 flex-col
                        ${openSection === 'policy' ? 'max-h-[500px] p-2 my-2' : 'max-h-0 p-0 my-0'}
                      `}
                    >
                      <div className="flex flex-col gap-3">
                        {['allowances', 'bonuses', 'deductions'].map((type) => {
                          const policies = inp?.[type] || [];
                          return (
                            <div className="flex flex-col shadow-lg gap-2 px-2 pb-2 my-2 border rounded border-dashed relative border-primary" key={type}>
                              <p className="capitalize absolute t-0 -translate-y-1/2 l-2 bg-white px-2">{type}</p>
                              <div className="mt-6 flex flex-col gap-2">
                                {policies.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2 mb-2">
                                    <TextField
                                      label="Name"
                                      size="small"
                                      required
                                      className="flex-1"
                                      value={item.name || ''}
                                      onChange={(e) => {
                                        const updated = policies.map((policy, i) =>
                                          i === idx ? { ...policy, name: e.target.value } : policy
                                        );
                                        setInp({ ...inp, [type]: updated });
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
                                        setInp({ ...inp, [type]: updated });
                                      }}
                                    >
                                      <MenuItem value="amount">Amount</MenuItem>
                                    </Select>
                                    <TextField
                                      label={item.type === 'amount' ? '₹' : '%'}
                                      type="number"
                                      size="small"
                                      value={item.value || ''}
                                      required
                                      className="w-[90px]"
                                      onChange={(e) => {
                                        const updated = policies.map((policy, i) =>
                                          i === idx ? { ...policy, value: Number(e.target.value) } : policy
                                        );
                                        setInp({ ...inp, [type]: updated });
                                      }}
                                    />
                                    <Trash2
                                      size={18}
                                      className="text-red-500 hover:text-red-600 cursor-pointer"
                                      onClick={() => {
                                        const updated = policies.filter((_, i) => i !== idx);
                                        setInp({ ...inp, [type]: updated });
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() =>
                                  setInp({
                                    ...inp,
                                    [type]: [
                                      ...policies,
                                      { name: '', type: 'amount', value: 0 }
                                    ]
                                  })
                                }
                              >
                                + Add more {type.slice(0, -1)}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </span>

            <div className="modalfooter">
              <Button size="small" onClick={onClose} variant="outlined">Cancel</Button>
              {!isupdate ? (
                <Button sx={{ mr: 2 }} loading={isload} loadingPosition="end" endIcon={<Send size={16} />} variant="contained" type="submit">
                  Add
                </Button>
              ) : (
                <Button sx={{ mr: 2 }} loading={isload} loadingPosition="end" endIcon={<Send size={16} />} variant="contained" type="submit">
                  Update
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </Modalbox>
  );
};

export default EmployeeFormModal;
