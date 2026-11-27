import React from 'react';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Trash2,
  User,
  Building2,
  Landmark,
  Award,
  SlidersHorizontal,
  IdCard,
  Plus,
} from 'lucide-react';
import Modalbox from '../../../components/custommodal/Modalbox';
import Input from '../../../components/ui/Input';
import DateInput from '../../../components/ui/DateInput';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import GuardianInput from '../../../components/ui/GuardianInput';

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
  handleRemovePhoto,
  inputref,
  openSection,
  toggleSection,
  branch,
  department,
  profile,
  adddepartcall,
  isload,
}) => {
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [photoPreview]);

  const filteredDepartments = department?.filter(
    (d) => String(d.branchId?._id || d.branchId || '') === String(inp.branchId || '')
  ) || [];

  const availableBranches =
    profile?.role === 'manager'
      ? branch?.filter((b) => profile?.branchIds?.includes(b._id)) || []
      : branch || [];

  return (
    <Modalbox
      open={open}
      onClose={onClose}
      title={isupdate ? 'Update Employee' : 'Add Employee'}
      subtitle={
        isupdate
          ? 'Modify employee profile, compensation, and payroll policies'
          : 'Create a new employee record in the directory'
      }
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="employee-form" variant="primary" loading={isload}>
            {isupdate ? 'Update Employee' : 'Add Employee'}
          </Button>
        </>
      }
    >
      <form id="employee-form" onSubmit={adddepartcall} className="space-y-4">
        {/* Profile Photo Bar */}
        <div className="flex items-center gap-4 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
          <div className="relative shrink-0">
            <input
              style={{ display: 'none' }}
              type="file"
              onChange={handlePhotoChange}
              ref={inputref}
              accept="image/*"
              id="fileInput"
            />
            {photoPreview && !imgError ? (
              <img
                src={photoPreview}
                alt="Employee"
                onError={() => setImgError(true)}
                className="w-16 h-16 rounded-full object-cover border border-slate-200 bg-white"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                <User size={26} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800">Profile Photo</p>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => inputref.current && inputref.current.click()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition cursor-pointer"
              >
                <Camera size={13} className="text-teal-700" />
                {photoPreview ? 'Change Photo' : 'Upload Photo'}
              </button>
              {photoPreview && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-rose-200 bg-white hover:bg-rose-50 text-xs font-medium text-rose-600 transition cursor-pointer"
                >
                  <Trash2 size={13} />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Organization & Role */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center gap-2">
            <Building2 size={14} className="text-teal-700" />
            <h3 className="text-xs font-semibold text-slate-800 tracking-wide uppercase">
              Organization &amp; Status
            </h3>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Branch"
              required
              value={inp.branchId || ''}
              onChange={(e) => handleChange(e, 'branchId')}
            >
              <option value="">Select Branch</option>
              {availableBranches.map((list) => (
                <option key={list._id} value={list._id}>
                  {list.name}
                </option>
              ))}
            </Select>

            <Select
              label="Department"
              required
              disabled={!inp.branchId}
              value={inp.department || ''}
              onChange={(e) => handleChange(e, 'department')}
            >
              <option value="">Select Department</option>
              {filteredDepartments.map((list) => (
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
              onChange={(e) =>
                handleChange({ ...e, target: { ...e.target, value: e.target.value === 'true' } }, 'status')
              }
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </div>
        </div>

        {/* Core Identity & Compensation */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center gap-2">
            <User size={14} className="text-teal-700" />
            <h3 className="text-xs font-semibold text-slate-800 tracking-wide uppercase">
              Identity &amp; Compensation
            </h3>
          </div>
          <div className="p-4 space-y-3">
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
              <Input
                label="Employee ID (3 digits)"
                type="number"
                value={inp.empId || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.length <= 3) {
                    handleChange(e, 'empId');
                  }
                }}
                placeholder="e.g. 001"
                helperText={`Generated ID: EMP${String(inp?.empId || '').padStart(3, '0')}`}
              />

              <GuardianInput
                label="Guardian Details"
                placeholder="Guardian name"
                value={{
                  relation: inp?.guardian?.relation || 'S/o',
                  name: inp?.guardian?.name || '',
                }}
                onChange={({ relation, name }) =>
                  setInp((prev) => ({
                    ...prev,
                    guardian: { ...prev.guardian, relation, name },
                  }))
                }
              />
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
          </div>
        </div>

        {/* Optional Collapsible Sections */}
        <div className="space-y-2.5">
          {/* Personal Details */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <button
                type="button"
                className="w-full flex justify-between items-center px-4 py-2.5 bg-slate-50/80 hover:bg-slate-100/70 text-slate-800 transition cursor-pointer"
                onClick={() => toggleSection('personal')}
              >
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                  <IdCard size={14} className="text-teal-700" />
                  Personal Details
                  <span className="text-[10px] font-normal normal-case text-slate-400">(Optional)</span>
                </span>
                {openSection === 'personal' ? (
                  <ChevronUp size={16} className="text-slate-500" />
                ) : (
                  <ChevronDown size={16} className="text-slate-500" />
                )}
              </button>

              {openSection === 'personal' && (
                <div className="p-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Phone" value={inp.phone || ''} maxLength={10} onChange={(e) => handleChange(e, 'phone')} />
                  <Input label="Emergency Phone" value={inp.Emergencyphone || ''} maxLength={10} onChange={(e) => handleChange(e, 'Emergencyphone')} />
                  <Input label="Address" value={inp.address || ''} onChange={(e) => handleChange(e, 'address')} />
                  <Input label="Blood Group" value={inp.bloodGroup || ''} onChange={(e) => handleChange(e, 'bloodGroup')} />
                  <Input label="Aadhaar No." value={inp.adhaar || ''} maxLength={12} onChange={(e) => handleChange(e, 'adhaar')} />
                  <Input label="PAN No." value={inp.pan || ''} maxLength={10} onChange={(e) => handleChange(e, 'pan')} />
                  <DateInput
                    label="Date of Birth"
                    value={inp.dob || ''}
                    onChange={(e) => {
                      const val = e?.target?.value !== undefined ? e.target.value : e;
                      handleChange({ target: { value: val } }, 'dob');
                    }}
                  />
                  <Select
                    label="Marital Status"
                    value={inp.maritalStatus !== undefined ? String(inp.maritalStatus) : 'false'}
                    onChange={(e) =>
                      handleChange({ ...e, target: { ...e.target, value: e.target.value === 'true' } }, 'maritalStatus')
                    }
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

            {/* Banking Details */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <button
                type="button"
                className="w-full flex justify-between items-center px-4 py-2.5 bg-slate-50/80 hover:bg-slate-100/70 text-slate-800 transition cursor-pointer"
                onClick={() => toggleSection('banking')}
              >
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                  <Landmark size={14} className="text-teal-700" />
                  Banking Details
                  <span className="text-[10px] font-normal normal-case text-slate-400">(Optional)</span>
                </span>
                {openSection === 'banking' ? (
                  <ChevronUp size={16} className="text-slate-500" />
                ) : (
                  <ChevronDown size={16} className="text-slate-500" />
                )}
              </button>

              {openSection === 'banking' && (
                <div className="p-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="A/C Holder Name" value={inp.acHolderName || ''} onChange={(e) => handleChange(e, 'acHolderName')} />
                  <Input label="Bank Name" value={inp.bankName || ''} onChange={(e) => handleChange(e, 'bankName')} />
                  <Input label="Branch" value={inp.bankbranch || ''} onChange={(e) => handleChange(e, 'bankbranch')} />
                  <Input label="A/C No." value={inp.acnumber || ''} onChange={(e) => handleChange(e, 'acnumber')} />
                  <Input label="IFSC Code" value={inp.ifscCode || ''} onChange={(e) => handleChange(e, 'ifscCode')} />
                  <Input label="UPI ID / Number" value={inp.upi || ''} onChange={(e) => handleChange(e, 'upi')} />
                </div>
              )}
            </div>

            {/* Documents & Skills */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <button
                type="button"
                className="w-full flex justify-between items-center px-4 py-2.5 bg-slate-50/80 hover:bg-slate-100/70 text-slate-800 transition cursor-pointer"
                onClick={() => toggleSection('document')}
              >
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                  <Award size={14} className="text-teal-700" />
                  Documents &amp; Skills
                  <span className="text-[10px] font-normal normal-case text-slate-400">(Optional)</span>
                </span>
                {openSection === 'document' ? (
                  <ChevronUp size={16} className="text-slate-500" />
                ) : (
                  <ChevronDown size={16} className="text-slate-500" />
                )}
              </button>

              {openSection === 'document' && (
                <div className="p-4 border-t border-slate-200 flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <p className="font-semibold text-xs text-slate-700 uppercase tracking-wider">Achievements</p>
                    {inp?.achievements?.map((ach, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_140px_36px] gap-2 items-center p-2 rounded-lg border border-slate-200 bg-slate-50/60">
                        <input
                          placeholder="Title"
                          className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium outline-none focus:border-teal-600"
                          value={ach.title || ''}
                          onChange={(e) => handleNestedChange(e, 'achievements', idx, 'title')}
                        />
                        <input
                          placeholder="Description"
                          className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium outline-none focus:border-teal-600"
                          value={ach.description || ''}
                          onChange={(e) => handleNestedChange(e, 'achievements', idx, 'description')}
                        />
                        <DateInput
                          size="sm"
                          value={ach.date || ''}
                          onChange={(e) => handleNestedChange(e, 'achievements', idx, 'date')}
                        />
                        <button
                          type="button"
                          title="Remove"
                          className="h-9 w-9 flex items-center justify-center rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                          onClick={() => removeItem('achievements', idx)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addItem('achievements')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition w-fit cursor-pointer"
                    >
                      <Plus size={13} className="text-teal-700" /> Add Achievement
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="font-semibold text-xs text-slate-700 uppercase tracking-wider">Education</p>
                    {inp?.education?.map((edu, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_140px_36px] gap-2 items-center p-2 rounded-lg border border-slate-200 bg-slate-50/60">
                        <input
                          placeholder="Degree"
                          className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium outline-none focus:border-teal-600"
                          value={edu.degree || ''}
                          onChange={(e) => handleNestedChange(e, 'education', idx, 'degree')}
                        />
                        <input
                          placeholder="Institution"
                          className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium outline-none focus:border-teal-600"
                          value={edu.institution || ''}
                          onChange={(e) => handleNestedChange(e, 'education', idx, 'institution')}
                        />
                        <DateInput
                          size="sm"
                          value={edu.date || ''}
                          onChange={(e) => handleNestedChange(e, 'education', idx, 'date')}
                        />
                        <button
                          type="button"
                          title="Remove"
                          className="h-9 w-9 flex items-center justify-center rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                          onClick={() => removeItem('education', idx)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addItem('education')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition w-fit cursor-pointer"
                    >
                      <Plus size={13} className="text-teal-700" /> Add Education
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        {/* Access & Policy Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/70 transition cursor-pointer select-none">
            <input
              type="checkbox"
              checked={inp.allowSeeLedger || false}
              onChange={(e) => setInp({ ...inp, allowSeeLedger: e.target.checked })}
              className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-600"
            />
            <span className="text-xs font-medium text-slate-700">Allow employee to view personal Ledger</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/70 transition cursor-pointer select-none">
            <input
              type="checkbox"
              checked={inp.overridedefaultPolicies || false}
              onChange={() =>
                setInp((prev) => ({
                  ...prev,
                  overridedefaultPolicies: !inp.overridedefaultPolicies,
                }))
              }
              className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-600"
            />
            <span className="text-xs font-medium text-slate-700">Override Default Payroll Policies</span>
          </label>
        </div>

        {/* Override Payroll Policies */}
        {inp.overridedefaultPolicies && (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <button
              type="button"
              className="w-full flex justify-between items-center px-4 py-2.5 bg-slate-50/80 hover:bg-slate-100/70 text-slate-800 transition cursor-pointer"
              onClick={() => toggleSection('policy')}
            >
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                <SlidersHorizontal size={14} className="text-teal-700" />
                Custom Payroll Policies
              </span>
              {openSection === 'policy' ? (
                <ChevronUp size={16} className="text-slate-500" />
              ) : (
                <ChevronDown size={16} className="text-slate-500" />
              )}
            </button>

            {openSection === 'policy' && (
              <div className="p-4 border-t border-slate-200 flex flex-col gap-3.5">
                {['allowances', 'bonuses', 'deductions'].map((type) => {
                  const policies = inp?.[type] || [];
                  return (
                    <div key={type} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2">
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{type}</p>
                      <div className="space-y-2">
                        {policies.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              placeholder="Component Name"
                              className="flex-1 h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium outline-none focus:border-teal-600"
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
                              className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none focus:border-teal-600"
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
                              className="w-24 h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium outline-none focus:border-teal-600"
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
                              title="Remove"
                              className="h-9 w-9 flex items-center justify-center rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                              onClick={() => {
                                const updated = policies.filter((_, i) => i !== idx);
                                setInp({ ...inp, [type]: updated });
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 cursor-pointer"
                        onClick={() =>
                          setInp({
                            ...inp,
                            [type]: [...policies, { name: '', type: 'amount', value: 0 }],
                          })
                        }
                      >
                        <Plus size={13} /> Add {type.slice(0, -1)}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </form>
    </Modalbox>
  );
};

export default EmployeeFormModal;
