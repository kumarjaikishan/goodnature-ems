import { useEffect, useState } from "react";
import { 
  TextField, Button, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Modal, Box, Typography, Checkbox, FormControlLabel,
  FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import { apiClient } from "../../../utils/apiClient";
import { toast } from "../../../utils/toast";

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
    if (!window.confirm("Are you sure you want to delete this leave policy?")) return;
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

  const handleSave = async () => {
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
    <div className="p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Leave Policies</h2>
        <Button variant="contained" onClick={handleCreateNew}>Create Policy</Button>
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Allocation</TableCell>
              <TableCell>Total Days</TableCell>
              <TableCell>Carry Forward</TableCell>
              <TableCell>Encashable</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {policies.map((p) => (
              <TableRow key={p._id}>
                <TableCell>{p.name}</TableCell>
                <TableCell className="capitalize">{p.allocationType}</TableCell>
                <TableCell>{p.totalLeaves}</TableCell>
                <TableCell>
                  {p.carryForward?.enabled
                    ? p.carryForward?.carryForwardAll
                      ? "Enabled (All)"
                      : `Enabled (Max ${p.carryForward?.maxLimit || 0})`
                    : "Disabled"}
                </TableCell>
                <TableCell>{p.encashable ? "Yes" : "No"}</TableCell>
                <TableCell align="right">
                  <Button size="small" variant="outlined" color="primary" onClick={() => handleEdit(p)} sx={{ mr: 1 }}>
                    Edit
                  </Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(p._id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={{ 
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 420, bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 24,
          maxHeight: '90vh', overflowY: 'auto'
        }}>
          <Typography variant="h6" className="mb-4">
            {editingPolicyId ? "Edit Leave Policy" : "Create New Leave Policy"}
          </Typography>
          
          <TextField 
            fullWidth label="Policy Name" className="mb-3" margin="dense" size="small"
            value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          
          <FormControl fullWidth margin="dense" size="small" className="mb-3">
            <InputLabel>Allocation Type</InputLabel>
            <Select
              label="Allocation Type"
              value={formData.allocationType}
              onChange={(e) => setFormData({...formData, allocationType: e.target.value})}
            >
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>

          <TextField 
            fullWidth label="Total Leaves" type="number" className="mb-3" margin="dense" size="small"
            value={formData.totalLeaves} onChange={(e) => setFormData({...formData, totalLeaves: Number(e.target.value) || 0})}
          />
          
          <Box className="flex flex-col gap-2 mt-2">
            <FormControlLabel 
              control={
                <Checkbox 
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
                />
              }
              label="Enable Carry Forward"
            />
            {formData.carryForward.enabled && (
              <Box className="flex flex-col gap-2 pl-4 border-l-2 border-slate-200 ml-2">
                <FormControlLabel 
                  control={
                    <Checkbox 
                      checked={formData.carryForward.carryForwardAll} 
                      onChange={(e) => setFormData({
                        ...formData, 
                        carryForward: {
                          ...formData.carryForward, 
                          carryForwardAll: e.target.checked,
                          maxLimit: e.target.checked ? 0 : formData.carryForward.maxLimit
                        }
                      })} 
                    />
                  }
                  label="Carry Forward All Remaining Leaves"
                />
                {!formData.carryForward.carryForwardAll && (
                  <TextField 
                    label="Max Limit (Number of Leaves)" 
                    type="number" 
                    size="small" 
                    margin="dense"
                    inputProps={{ min: 0 }}
                    value={formData.carryForward.maxLimit} 
                    onChange={(e) => setFormData({
                      ...formData, 
                      carryForward: {
                        ...formData.carryForward, 
                        maxLimit: Number(e.target.value) || 0
                      }
                    })}
                  />
                )}
              </Box>
            )}
            
            <FormControlLabel 
              control={<Checkbox checked={formData.encashable} onChange={(e) => setFormData({...formData, encashable: e.target.checked})} />}
              label="Encashable"
            />
          </Box>
          <Button fullWidth variant="contained" className="mt-4" onClick={handleSave}>
            {editingPolicyId ? "Save Changes" : "Create Policy"}
          </Button>
        </Box>
      </Modal>
    </div>
  );
};

export default LeavePolicyManager;
