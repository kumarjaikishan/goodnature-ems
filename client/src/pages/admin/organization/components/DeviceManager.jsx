import React, { useState, useEffect } from 'react';
import {
    TextField, Button, IconButton, Box, Typography, Card,
    CardContent, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Tooltip, Chip, Divider
} from '@mui/material';
import { FaWifi, FaTrash, FaDesktop } from 'react-icons/fa';
import { MdOutlineWifiOff, MdAddCircle } from "react-icons/md";
import { FiRefreshCw } from 'react-icons/fi';
import dayjs from 'dayjs';
import EsslEventLog from './EsslEventLog';

const DeviceManager = ({ companyinp, setcompany, isOnline, deviceRefresh, refreshload, removeDevice, addDevice, handleSubmit, isload }) => {

    const updateDevice = (index, field, value) => {
        const newDevices = [...companyinp.devices];
        newDevices[index][field] = value;
        setcompany({ ...companyinp, devices: newDevices });
    };

    useEffect(() => {
        companyinp?.devices?.forEach((elem) => deviceRefresh(elem?.SN))
    }, []);

    return (
        <Box sx={{ spaceY: 4 }}>
            <Card variant="outlined" sx={{ borderRadius: 2, mb: 4, pb: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FaDesktop size={24} color="#1976d2" style={{ marginRight: '12px' }} />
                            <Typography variant="h6" fontWeight="600">Registered Devices</Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            startIcon={<MdAddCircle />}
                            onClick={addDevice}
                            size="small"
                        >
                            Add Device
                        </Button>
                    </Box>

                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', mb: 3 }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#f9f9f9' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Device Name</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Serial Number</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Last Heartbeat</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {companyinp?.devices?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                            No devices registered yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    companyinp?.devices?.map((device, index) => {
                                        const online = isOnline(device?.lastHeartbeat);
                                        return (
                                            <TableRow key={index} hover>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>
                                                    <TextField
                                                        variant="standard"
                                                        size="small"
                                                        value={device.name}
                                                        onChange={(e) => updateDevice(index, "name", e.target.value)}
                                                        sx={{ width: 150 }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        variant="standard"
                                                        size="small"
                                                        value={device.SN}
                                                        onChange={(e) => updateDevice(index, "SN", e.target.value)}
                                                        sx={{ width: 150 }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Tooltip title={online ? "Device Online" : "Device Offline"}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            {online ? (
                                                                <Chip
                                                                    icon={<FaWifi size={14} />}
                                                                    label="Online"
                                                                    size="small"
                                                                    color="success"
                                                                    variant="outlined"
                                                                />
                                                            ) : (
                                                                <Chip
                                                                    icon={<MdOutlineWifiOff size={14} />}
                                                                    label="Offline"
                                                                    size="small"
                                                                    color="error"
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                        </Box>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {!device?.lastHeartbeat ? 'Never' : dayjs(device?.lastHeartbeat).format("DD/MM/YY, hh:mm A")}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                        <Tooltip title="Refresh Device">
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => deviceRefresh(device?.SN)}
                                                            >
                                                                <FiRefreshCw className={refreshload ? "animate-spin" : ""} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete Device">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => removeDevice(index)}
                                                            >
                                                                <FaTrash size={14} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Button
                        variant="contained"
                        loading={isload}
                        onClick={handleSubmit}
                        sx={{ float: 'right', minWidth: 150 }}
                    >
                        Save Configuration
                    </Button>
                </CardContent>
            </Card>

            <EsslEventLog companyId={companyinp?._id} />
        </Box>
    );
};

export default DeviceManager;
