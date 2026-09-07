import React from 'react';
import { Send, Edit2, ChevronUp, ChevronDown, Trash2, User } from 'lucide-react';
import Modalbox from '../../../components/custommodal/Modalbox';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';

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
    <Modalbox
      open={open}
      onClose={onClose}
      title={isupdate ? "Update Employee" : "Add Employee"}
      subtitle={isupdate ? "Modify employee details, compensation, and policies" : "Create a new employee profile in the system"}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={isload}
            onClick={adddepartcall}
            type="button"
          >
            {isupdate ? "Update Employee" : "Add Employee"}
          </Button>
        </>
      }
    >
      <form id="employee-form" onSubmit={adddepartcall} className="space-y-4">
        <div className="flex flex-col gap-3 w-full">
          <Select
            label="Branch"
            required
            value={inp.branchId || ''}
            onChange={(e) => handleChange(e, 'branchId')}
          >
            <option value="">Select Branch</option>
            {profile?.role === 'manager'
              ? branch?.filter((e) => profile?.branchIds?.includes(e._id))
                ?.map((list) => (
                  <option key={list._id} value={list._id}>
                    {list.name}
                  </option>
                ))
              : branch?.map((list) => (
                <option key={list._id} value={list._id}>
                  {list.name}
                </option>
              ))
            }
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Department"
              required
              disabled={!inp.branchId}
              value={inp.department || ''}
              onChange={(e) => handleChange(e, 'department')}
            >
              <option value="">Select Department</option>
              {department?.filter(e => (e.branchId?._id || e.branchId) === inp.branchId).map((list) => (
                <option key={list._id} value={list._id}>
                  {list.department}
                </option>
              ))}
            </Select>

            <Select
              label="Status"
              required
              disabled={!inp.branchId}
              value={inp?.status !== undefined ? String(inp?.status) : 'true'}
              onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value === 'true' } }, 'status')}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              required
              value={inp.employeeName || ''}
              onChange={(e) => handleChange(e, 'employeeName')}
              placeholder="e.g. Rahul Sharma"
            />
            <Input
              label="Email Address"
              type="email"
              required
              value={inp.email || ''}
              onChange={(e) => handleChange(e, 'email')}
              placeholder="rahul@example.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Designation"
              value={inp.designation || ''}
              onChange={(e) => handleChange(e, 'designation')}
              placeholder="e.g. Sales Executive"
            />
            <Input
              label="Base Salary (₹)"
              type="number"
              value={inp.salary || ''}
              onChange={(e) => handleChange(e, 'salary')}
              placeholder="e.g. 25000"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Input
                label="Employee ID (3 digits)"
                type="number"
                value={inp.empId || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.length <= 3) {
                    handleChange(e, "empId");
                  }
                }}
                placeholder="e.g. 001"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Generated ID: EMP{String(inp?.empId || '').padStart(3, '0')}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Guardian Details</label>
              <div className="flex gap-2">
                <select
                  className="w-24 h-10 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition"
                  value={inp?.guardian?.relation || "S/o"}
                  onChange={(e) =>
                    setInp((prev) => ({
                      ...prev,
                      guardian: { ...prev.guardian, relation: e.target.value },
                    }))
                  }
                >
                  <option value="S/o">S/o</option>
                  <option value="D/o">D/o</option>
                  <option value="H/o">H/o</option>
                  <option value="W/o">W/o</option>
                </select>
                <input
                  type="text"
                  className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition"
                  placeholder="Guardian Name"
                  value={inp?.guardian?.name || ''}
                  onChange={(e) =>
                    setInp((prev) => ({
                      ...prev,
                      guardian: { ...prev.guardian, name: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Biometric / Device User ID"
              type="tel"
              value={inp.deviceUserId || ''}
              onChange={(e) => {
                const onlyNums = e.target.value.replace(/\D/g, '');
                handleChange({ ...e, target: { ...e.target, value: onlyNums } }, 'deviceUserId');
              }}
              placeholder="e.g. 101"
            />
            <Input
              label="Telegram Chat ID"
              value={inp.telegramId || ''}
              onChange={(e) => handleChange(e, 'telegramId')}
              placeholder="e.g. 987654321"
            />
          </div>

          {/* Profile Photo */}
          <div className="w-full flex justify-center my-2">
            <div className="w-fit text-center relative group">
              <input style={{ display: 'none' }} type="file" onChange={handlePhotoChange} ref={inputref} accept="image/*" id="fileInput" />
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-teal-600 shadow-sm" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                  <User size={36} />
                </div>
              )}
              <button
                type="button"
                onClick={() => inputref.current && inputref.current.click()}
                className="absolute bottom-0 right-0 rounded-full bg-teal-800 hover:bg-teal-900 text-white p-2 shadow cursor-pointer transition"
              >
                <Edit2 size={14} />
              </button>
            </div>
          </div>

          {/* Personal Details Accordion */}
          {isupdate && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-slate-50">
              <button
                type="button"
                className="w-full flex justify-between items-center px-4 py-3 bg-teal-800 text-white font-semibold text-xs tracking-wider cursor-pointer"
                onClick={() => toggleSection('personal')}
              >
                <span>PERSONAL DETAILS (OPTIONAL)</span>
                {openSection === 'personal' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {openSection === 'personal' && (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white">
                  <Input label="Phone" value={inp.phone || ''} maxLength={10} onChange={(e) => handleChange(e, 'phone')} />
                  <Input label="Emergency Phone" value={inp.Emergencyphone || ''} maxLength={10} onChange={(e) => handleChange(e, 'Emergencyphone')} />
                  <Input label="Address" value={inp.address || ''} onChange={(e) => handleChange(e, 'address')} />
                  <Input label="Blood Group" value={inp.bloodGroup || ''} onChange={(e) => handleChange(e, 'bloodGroup')} />
                  <Input label="Aadhaar No." value={inp.adhaar || ''} maxLength={12} onChange={(e) => handleChange(e, 'adhaar')} />
                  <Input label="PAN No." value={inp.pan || ''} maxLength={10} onChange={(e) => handleChange(e, 'pan')} />
                  <Input label="Date of Birth" type="date" value={inp.dob || ''} onChange={(e) => handleChange(e, 'dob')} />
                  
                  <Select
                    label="Marital Status"
                    value={inp.maritalStatus !== undefined ? String(inp.maritalStatus) : 'false'}
                    onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value === 'true' } }, 'maritalStatus')}
                  >
                    <option value="true">Married</option>
                    <option value="false">Unmarried</option>
                  </Select>

                  <Select
                    label="Gender"
                    value={inp.gender || 'male'}
                    onChange={(e) => handleChange(e, 'gender')}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Banking Details */}
          {isupdate && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-slate-50">
              <button
                type="button"
                className="w-full flex justify-between items-center px-4 py-3 bg-teal-800 text-white font-semibold text-xs tracking-wider cursor-pointer"
                onClick={() => toggleSection('banking')}
              >
                <span>BANKING DETAILS (OPTIONAL)</span>
                {openSection === 'banking' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {openSection === 'banking' && (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white">
                  <Input label="A/C Holder Name" value={inp.acHolderName || ''} onChange={(e) => handleChange(e, 'acHolderName')} />
                  <Input label="Bank Name" value={inp.bankName || ''} onChange={(e) => handleChange(e, 'bankName')} />
                  <Input label="Branch" value={inp.bankbranch || ''} onChange={(e) => handleChange(e, 'bankbranch')} />
                  <Input label="A/C No." value={inp.acnumber || ''} onChange={(e) => handleChange(e, 'acnumber')} />
                  <Input label="IFSC Code" value={inp.ifscCode || ''} onChange={(e) => handleChange(e, 'ifscCode')} />
                  <Input label="UPI ID / Number" value={inp.upi || ''} onChange={(e) => handleChange(e, 'upi')} />
                </div>
              )}
            </div>
          )}

          {/* Achievements and Education */}
          {isupdate && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-slate-50">
              <button
                type="button"
                className="w-full flex justify-between items-center px-4 py-3 bg-teal-800 text-white font-semibold text-xs tracking-wider cursor-pointer"
                onClick={() => toggleSection('document')}
              >
                <span>DOCUMENTS & SKILLS (OPTIONAL)</span>
                {openSection === 'document' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {openSection === 'document' && (
                <div className="p-4 flex flex-col gap-5 bg-white">
                  <div className="flex flex-col gap-2">
                    <p className="font-bold text-xs text-slate-800 uppercase tracking-wider">Achievements</p>
                    {inp?.achievements?.map((ach, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center border p-2.5 rounded-xl border-slate-200 bg-slate-50">
                        <input
                          placeholder="Title"
                          className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium outline-none"
                          value={ach.title || ''}
                          onChange={(e) => handleNestedChange(e, 'achievements', idx, 'title')}
                        />
                        <input
                          placeholder="Description"
                          className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium outline-none"
                          value={ach.description || ''}
                          onChange={(e) => handleNestedChange(e, 'achievements', idx, 'description')}
                        />
                        <input
                          type="date"
                          className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium outline-none"
                          value={ach.date || ''}
                          onChange={(e) => handleNestedChange(e, 'achievements', idx, 'date')}
                        />
                        <button
                          type="button"
                          className="p-2 text-rose-500 hover:text-rose-700 justify-self-center cursor-pointer"
                          onClick={() => removeItem('achievements', idx)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addItem('achievements')}
                      className="px-3 py-1.5 rounded-lg border border-teal-600 text-teal-800 text-xs font-bold hover:bg-teal-50 transition w-fit cursor-pointer"
                    >
                      + Add Achievement
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="font-bold text-xs text-slate-800 uppercase tracking-wider">Education</p>
                    {inp?.education?.map((edu, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center border p-2.5 rounded-xl border-slate-200 bg-slate-50">
                        <input
                          placeholder="Degree"
                          className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium outline-none"
                          value={edu.degree || ''}
                          onChange={(e) => handleNestedChange(e, 'education', idx, 'degree')}
                        />
                        <input
                          placeholder="Institution"
                          className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium outline-none"
                          value={edu.institution || ''}
                          onChange={(e) => handleNestedChange(e, 'education', idx, 'institution')}
                        />
                        <input
                          type="date"
                          className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium outline-none"
                          value={edu.date || ''}
                          onChange={(e) => handleNestedChange(e, 'education', idx, 'date')}
                        />
                        <button
                          type="button"
                          className="p-2 text-rose-500 hover:text-rose-700 justify-self-center cursor-pointer"
                          onClick={() => removeItem('education', idx)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addItem('education')}
                      className="px-3 py-1.5 rounded-lg border border-teal-600 text-teal-800 text-xs font-bold hover:bg-teal-50 transition w-fit cursor-pointer"
                    >
                      + Add Education
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Toggle Switches */}
          <div className="flex flex-col gap-2.5 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inp.allowSeeLedger || false}
                onChange={(e) => setInp({ ...inp, allowSeeLedger: e.target.checked })}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <span className="text-xs font-semibold text-slate-700">Allow employee to view personal Ledger</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inp.overridedefaultPolicies || false}
                onChange={() =>
                  setInp(prev => ({
                    ...prev,
                    overridedefaultPolicies: !inp.overridedefaultPolicies,
                  }))
                }
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <span className="text-xs font-semibold text-slate-700">Override Default Payroll Policies</span>
            </label>
          </div>

          {/* Override Payroll Policies */}
          {isupdate && inp.overridedefaultPolicies && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-slate-50">
              <button
                type="button"
                className="w-full flex justify-between items-center px-4 py-3 bg-teal-800 text-white font-semibold text-xs tracking-wider cursor-pointer"
                onClick={() => toggleSection('policy')}
              >
                <span>CUSTOM PAYROLL POLICIES</span>
                {openSection === 'policy' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {openSection === 'policy' && (
                <div className="p-4 flex flex-col gap-4 bg-white">
                  {['allowances', 'bonuses', 'deductions'].map((type) => {
                    const policies = inp?.[type] || [];
                    return (
                      <div key={type} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2.5">
                        <p className="text-xs font-bold text-teal-900 uppercase tracking-wider">{type}</p>
                        <div className="space-y-2">
                          {policies.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                placeholder="Component Name"
                                className="flex-1 h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium outline-none"
                                value={item.name || ''}
                                onChange={(e) => {
                                  const updated = policies.map((policy, i) =>
                                    i === idx ? { ...policy, name: e.target.value } : policy
                                  );
                                  setInp({ ...inp, [type]: updated });
                                }}
                                required
                              />
                              <select
                                className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none"
                                value={item.type || 'amount'}
                                onChange={(e) => {
                                  const updated = policies.map((policy, i) =>
                                    i === idx ? { ...policy, type: e.target.value } : policy
                                  );
                                  setInp({ ...inp, [type]: updated });
                                }}
                              >
                                <option value="amount">₹ (Fixed)</option>
                              </select>
                              <input
                                type="number"
                                placeholder="Value"
                                className="w-24 h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium outline-none"
                                value={item.value || ''}
                                onChange={(e) => {
                                  const updated = policies.map((policy, i) =>
                                    i === idx ? { ...policy, value: Number(e.target.value) } : policy
                                  );
                                  setInp({ ...inp, [type]: updated });
                                }}
                                required
                              />
                              <button
                                type="button"
                                className="p-1.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                                onClick={() => {
                                  const updated = policies.filter((_, i) => i !== idx);
                                  setInp({ ...inp, [type]: updated });
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="text-xs font-bold text-teal-800 hover:text-teal-950 cursor-pointer"
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
                          + Add {type.slice(0, -1)}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </Modalbox>
  );
};

export default EmployeeFormModal;
