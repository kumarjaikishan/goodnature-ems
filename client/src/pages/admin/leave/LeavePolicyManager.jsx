import { useEffect, useState } from "react";
import { apiClient } from "../../../utils/apiClient";
import { toast } from "../../../utils/toast";
import { confirmDialog } from "../../../utils/confirmDialog";
import { PlusCircle, Edit2, Trash2, X, CheckCircle } from "lucide-react";

// Custom UI Components
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import NumberInput from "../../../components/ui/NumberInput";
import Select from "../../../components/ui/Select";
import Modalbox from "../../../components/custommodal/Modalbox";

const LeavePolicyManager = () => {
  const [policies, setPolicies] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    allocationType: "yearly",
    totalLeaves: 0,
    carryForward: { enabled: false, carryForwardAll: false, maxLimit: 0 },
    encashable: false,
    probationRule: { allowed: false, afterDays: 0 }
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const data = await apiClient({ url: "leave-policies" });
      setPolicies(data || []);
    } catch (err) {
      console.error("Error fetching policies:", err);
    }
  };

  const handleCreateNew = () => {
    setFormData({
      name: "",
      allocationType: "yearly",
      totalLeaves: 0,
      carryForward: { enabled: false, carryForwardAll: false, maxLimit: 0 },
      encashable: false,
      probationRule: { allowed: false, afterDays: 0 }
    });
    setEditingPolicyId(null);
    setOpen(true);
  };

  const handleEdit = (policy) => {
    setFormData({
      name: policy.name,
      allocationType: policy.allocationType || "yearly",
      totalLeaves: policy.totalLeaves || 0,
      carryForward: {
        enabled: policy.carryForward?.enabled || false,
        carryForwardAll: policy.carryForward?.carryForwardAll || false,
        maxLimit: policy.carryForward?.maxLimit || 0
      },
      encashable: policy.encashable || false,
      probationRule: {
        allowed: policy.probationRule?.allowed || false,
        afterDays: policy.probationRule?.afterDays || 0
      }
    });
    setEditingPolicyId(policy._id);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    const proceed = await confirmDialog({
      title: "Delete Leave Policy?",
      text: "Are you sure you want to delete this leave policy?",
      confirmText: "Delete",
      cancelText: "Cancel",
      isDanger: true,
    });
    if (!proceed) return;
    try {
      await apiClient({
        url: `leave-policies/${id}`,
        method: "DELETE"
      });
      toast.success("Policy Deleted");
      fetchPolicies();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      if (editingPolicyId) {
        await apiClient({
          url: `leave-policies/${editingPolicyId}`,
          method: "PUT",
          body: formData
        });
        toast.success("Policy Updated");
      } else {
        await apiClient({
          url: "leave-policies",
          method: "POST",
          body: formData
        });
        toast.success("Policy Created");
      }
      setOpen(false);
      fetchPolicies();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-900">Leave Policies</h2>
        <Button 
          variant="primary" 
          size="sm"
          icon={<PlusCircle size={15} />}
          onClick={handleCreateNew}
        >
          Create Policy
        </Button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Allocation</th>
              <th className="p-3">Total Days</th>
              <th className="p-3">Carry Forward</th>
              <th className="p-3">Encashable</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {policies.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-400">
                  No leave policies defined.
                </td>
              </tr>
            ) : (
              policies.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-semibold text-slate-800">{p.name}</td>
                  <td className="p-3 capitalize text-slate-600">{p.allocationType}</td>
                  <td className="p-3 font-bold text-slate-900">{p.totalLeaves}</td>
                  <td className="p-3">
                    {p.carryForward?.enabled ? (
                      <span className="text-emerald-700 font-medium">
                        {p.carryForward?.carryForwardAll
                          ? "Enabled (All)"
                          : `Enabled (Max ${p.carryForward?.maxLimit || 0})`}
                      </span>
                    ) : (
                      <span className="text-slate-400">Disabled</span>
                    )}
                  </td>
                  <td className="p-3">
                    {p.encashable ? (
                      <span className="text-emerald-700 font-medium">Yes</span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEdit(p)}
                        className="p-1 rounded text-teal-600 hover:text-teal-800 hover:bg-teal-50 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p._id)}
                        className="p-1 rounded text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modalbox open={open} onClose={() => setOpen(false)}>
        <div className="w-full max-w-md p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              {editingPolicyId ? "Edit Leave Policy" : "Create New Leave Policy"}
            </h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-3.5">
            <Input
              size="sm"
              label="Policy Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Casual Leave, Annual Leave"
            />

            <Select
              size="sm"
              label="Allocation Type"
              value={formData.allocationType}
              onChange={(e) => setFormData({ ...formData, allocationType: e.target.value })}
              options={[
                { value: "monthly", label: "Monthly" },
                { value: "yearly", label: "Yearly" }
              ]}
            />

            <NumberInput
              size="sm"
              label="Total Leaves"
              required
              min={0}
              value={formData.totalLeaves}
              onChange={(val) => setFormData({ ...formData, totalLeaves: val })}
            />

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.carryForward.enabled}
                  onChange={(e) => setFormData({
                    ...formData,
                    carryForward: {
                      ...formData.carryForward,
                      enabled: e.target.checked,
                      carryForwardAll: e.target.checked ? formData.carryForward.carryForwardAll : false,
                      maxLimit: e.target.checked ? formData.carryForward.maxLimit : 0
                    }
                  })}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 border-slate-300"
                />
                <span>Enable Carry Forward</span>
              </label>

              {formData.carryForward.enabled && (
                <div className="flex flex-col gap-2 pl-6 pt-1 border-l-2 border-teal-200 ml-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={formData.carryForward.carryForwardAll}
                      onChange={(e) => setFormData({
                        ...formData,
                        carryForward: {
                          ...formData.carryForward,
                          carryForwardAll: e.target.checked,
                          maxLimit: e.target.checked ? 0 : formData.carryForward.maxLimit
                        }
                      })}
                      className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5 border-slate-300"
                    />
                    <span>Carry Forward All Remaining Leaves</span>
                  </label>

                  {!formData.carryForward.carryForwardAll && (
                    <div className="w-full">
                      <NumberInput
                        size="sm"
                        label="Max Limit (Number of Leaves)"
                        min={0}
                        value={formData.carryForward.maxLimit}
                        onChange={(val) => setFormData({
                          ...formData,
                          carryForward: {
                            ...formData.carryForward,
                            maxLimit: val
                          }
                        })}
                      />
                    </div>
                  )}
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 pt-1">
                <input
                  type="checkbox"
                  checked={formData.encashable}
                  onChange={(e) => setFormData({ ...formData, encashable: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 border-slate-300"
                />
                <span>Encashable</span>
              </label>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
              >
                {editingPolicyId ? "Save Changes" : "Create Policy"}
              </Button>
            </div>
          </form>
        </div>
      </Modalbox>
    </div>
  );
};

export default LeavePolicyManager;
