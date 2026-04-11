import { useEffect, useState } from "react";
import { 
  TextField, Button, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Modal, Box, Typography, Checkbox, FormControlLabel 
} from "@mui/material";
import { apiClient } from "../../../utils/apiClient";
import { toast } from "react-toastify";

const LeavePolicyManager = () => {
  const [policies, setPolicies] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    allocationType: "yearly",
    totalLeaves: 0,
    carryForward: { enabled: false, maxLimit: 0 },
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

  const handleSave = async () => {
    try {
      await apiClient({
        url: "leave-policies",
        method: "POST",
        body: formData
      });
      toast.success("Policy Created");
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
        <Button variant="contained" onClick={() => setOpen(true)}>Create Policy</Button>
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
            </TableRow>
          </TableHead>
          <TableBody>
            {policies.map((p) => (
              <TableRow key={p._id}>
                <TableCell>{p.name}</TableCell>
                <TableCell className="capitalize">{p.allocationType}</TableCell>
                <TableCell>{p.totalLeaves}</TableCell>
                <TableCell>{p.carryForward.enabled ? `Enabled (Max ${p.carryForward.maxLimit})` : "Disabled"}</TableCell>
                <TableCell>{p.encashable ? "Yes" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={{ 
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 400, bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 24
        }}>
          <Typography variant="h6" className="mb-4">Create New Leave Policy</Typography>
          <TextField 
            fullWidth label="Policy Name" className="mb-3" margin="dense"
            value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <TextField 
            fullWidth label="Total Leaves" type="number" className="mb-3" margin="dense"
            value={formData.totalLeaves} onChange={(e) => setFormData({...formData, totalLeaves: e.target.value})}
          />
          <Box className="flex flex-col gap-2 mt-2">
            <FormControlLabel 
              control={<Checkbox checked={formData.carryForward.enabled} onChange={(e) => setFormData({...formData, carryForward: {...formData.carryForward, enabled: e.target.checked}})} />}
              label="Enable Carry Forward"
            />
            {formData.carryForward.enabled && (
              <TextField 
                label="Max Limit" type="number" size="small" margin="dense"
                value={formData.carryForward.maxLimit} onChange={(e) => setFormData({...formData, carryForward: {...formData.carryForward, maxLimit: e.target.value}})}
              />
            )}
            <FormControlLabel 
              control={<Checkbox checked={formData.encashable} onChange={(e) => setFormData({...formData, encashable: e.target.checked})} />}
              label="Encashable"
            />
          </Box>
          <Button fullWidth variant="contained" className="mt-4" onClick={handleSave}>Save Policy</Button>
        </Box>
      </Modal>
    </div>
  );
};

export default LeavePolicyManager;
