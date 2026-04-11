import React, { useState, useEffect } from 'react';
import {
    Box, TextField, Button, Typography, Grid, IconButton,
    Switch, FormControlLabel, Select, MenuItem, InputLabel, FormControl,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Card, CardContent, Divider, Tooltip
} from '@mui/material';
import { MdEdit, MdDelete, MdAddCircle, MdCheckCircle, MdCancel } from 'react-icons/md';
import { apiClient } from '../../../../utils/apiClient';
import { toast } from 'react-toastify';
import swal from 'sweetalert';

const LeavePolicyManager = () => {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        name: '',
        allocationType: 'monthly',
        totalLeaves: 0,
        carryForward: {
            enabled: false,
            maxLimit: 0
        },
        encashable: false,
        probationRule: {
            allowed: false,
            afterDays: 0
        }
    });

    const fetchPolicies = async () => {
        setLoading(true);
        try {
            const data = await apiClient({ url: 'leave-policies' });
            setPolicies(data);
        } catch (error) {
            console.error('Error fetching policies:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolicies();
    }, []);

    const handleReset = () => {
        setForm({
            name: '',
            allocationType: 'monthly',
            totalLeaves: 0,
            carryForward: { enabled: false, maxLimit: 0 },
            encashable: false,
            probationRule: { allowed: false, afterDays: 0 }
        });
        setEditingPolicy(null);
        setShowForm(false);
    };

    const handleEdit = (policy) => {
        setEditingPolicy(policy);
        setForm({
            name: policy.name,
            allocationType: policy.allocationType,
            totalLeaves: policy.totalLeaves,
            carryForward: policy.carryForward || { enabled: false, maxLimit: 0 },
            encashable: policy.encashable || false,
            probationRule: policy.probationRule || { allowed: false, afterDays: 0 }
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        swal({
            title: "Are you sure?",
            text: "Once deleted, you will not be able to recover this policy!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then(async (willDelete) => {
            if (willDelete) {
                try {
                    await apiClient({
                        url: `leave-policies/${id}`,
                        method: 'DELETE'
                    });
                    toast.success('Policy Deleted');
                    fetchPolicies();
                } catch (error) {
                    console.error('Error deleting policy:', error);
                }
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const method = editingPolicy ? 'PUT' : 'POST';
            const url = editingPolicy ? `leave-policies/${editingPolicy._id}` : 'leave-policies';
            
            await apiClient({
                url,
                method,
                body: form
            });

            toast.success(editingPolicy ? 'Policy Updated' : 'Policy Created');
            handleReset();
            fetchPolicies();
        } catch (error) {
            console.error('Error saving policy:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Leave Policies</Typography>
                {!showForm && (
                    <Button 
                        variant="contained" 
                        startIcon={<MdAddCircle />} 
                        onClick={() => setShowForm(true)}
                    >
                        Add New Policy
                    </Button>
                )}
            </Box>

            {showForm && (
                <Card sx={{ mb: 4, border: '1px dashed #ccc' }}>
                    <CardContent>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                            {editingPolicy ? 'Edit Leave Policy' : 'Create New Leave Policy'}
                        </Typography>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Policy Name (e.g. Earned Leave, Sick Leave)"
                                        size="small"
                                        required
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Allocation Type</InputLabel>
                                        <Select
                                            value={form.allocationType}
                                            label="Allocation Type"
                                            onChange={(e) => setForm({ ...form, allocationType: e.target.value })}
                                        >
                                            <MenuItem value="monthly">Monthly</MenuItem>
                                            <MenuItem value="yearly">Yearly</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Total Leaves"
                                        size="small"
                                        required
                                        value={form.totalLeaves}
                                        onChange={(e) => setForm({ ...form, totalLeaves: Number(e.target.value) })}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ p: 1 }}>
                                        <FormControlLabel
                                            control={
                                                <Switch 
                                                    checked={form.carryForward.enabled} 
                                                    onChange={(e) => setForm({ 
                                                        ...form, 
                                                        carryForward: { ...form.carryForward, enabled: e.target.checked } 
                                                    })} 
                                                />
                                            }
                                            label="Enable Carry Forward"
                                        />
                                        {form.carryForward.enabled && (
                                            <TextField
                                                sx={{ mt: 1 }}
                                                fullWidth
                                                type="number"
                                                label="Max Carry Forward Limit"
                                                size="small"
                                                value={form.carryForward.maxLimit}
                                                onChange={(e) => setForm({ 
                                                    ...form, 
                                                    carryForward: { ...form.carryForward, maxLimit: Number(e.target.value) } 
                                                })}
                                            />
                                        )}
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ p: 1 }}>
                                        <FormControlLabel
                                            control={
                                                <Switch 
                                                    checked={form.probationRule.allowed} 
                                                    onChange={(e) => setForm({ 
                                                        ...form, 
                                                        probationRule: { ...form.probationRule, allowed: e.target.checked } 
                                                    })} 
                                                />
                                            }
                                            label="Allowed during Probation"
                                        />
                                        {form.probationRule.allowed && (
                                            <TextField
                                                sx={{ mt: 1 }}
                                                fullWidth
                                                type="number"
                                                label="Applicable After (Days)"
                                                size="small"
                                                value={form.probationRule.afterDays}
                                                onChange={(e) => setForm({ 
                                                    ...form, 
                                                    probationRule: { ...form.probationRule, afterDays: Number(e.target.value) } 
                                                })}
                                            />
                                        )}
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <FormControlLabel
                                        control={
                                            <Switch 
                                                checked={form.encashable} 
                                                onChange={(e) => setForm({ ...form, encashable: e.target.checked })} 
                                            />
                                        }
                                        label="Encashable"
                                    />
                                </Grid>

                                <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                    <Button 
                                        variant="outlined" 
                                        color="error" 
                                        startIcon={<MdCancel />} 
                                        onClick={handleReset}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        variant="contained" 
                                        color="primary" 
                                        disabled={loading}
                                        startIcon={<MdCheckCircle />}
                                    >
                                        {editingPolicy ? 'Update Policy' : 'Create Policy'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </Card>
            )}

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee' }}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: '#f9f9f9' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Policy Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Allocation</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Qty</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Carry Fwd</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Probation</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Encash</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {policies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3, color: '#888' }}>
                                    No leave policies defined.
                                </TableCell>
                            </TableRow>
                        ) : (
                            policies.map((policy) => (
                                <TableRow key={policy._id} hover>
                                    <TableCell sx={{ fontWeight: 500 }}>{policy.name}</TableCell>
                                    <TableCell sx={{ textTransform: 'capitalize' }}>{policy.allocationType}</TableCell>
                                    <TableCell>{policy.totalLeaves}</TableCell>
                                    <TableCell>
                                        {policy.carryForward?.enabled ? `Yes (Max: ${policy.carryForward.maxLimit})` : 'No'}
                                    </TableCell>
                                    <TableCell>
                                        {policy.probationRule?.allowed ? `After ${policy.probationRule.afterDays}d` : 'Immediate'}
                                    </TableCell>
                                    <TableCell>{policy.encashable ? 'Yes' : 'No'}</TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={() => handleEdit(policy)} color="primary">
                                                    <MdEdit />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" onClick={() => handleDelete(policy._id)} color="error">
                                                    <MdDelete />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default LeavePolicyManager;
