import React from "react";
import { 
    Box, 
    Typography, 
    Grid, 
    Card, 
    CardContent, 
    Divider,
    Paper
} from "@mui/material";
import { MdEventAvailable } from "react-icons/md";

const LeaveBalanceCards = ({ balances = [] }) => {
    if (!balances || balances.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc', border: '1px dashed #cbd5e0', mb: 3 }}>
                <Typography color="textSecondary">No leave balances found.</Typography>
            </Paper>
        );
    }

    return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
            {balances.map((bal) => (
                <Grid item xs={12} sm={6} md={3} key={bal._id}>
                    <Card sx={{ 
                        borderRadius: 3, 
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        border: '1px solid #edf2f7',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '4px',
                            height: '100%',
                            bgcolor: '#3182ce'
                        }
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4a5568', textTransform: 'uppercase' }}>
                                    {bal.policyId?.name}
                                </Typography>
                                <MdEventAvailable size={20} color="#3182ce" />
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#2d3748' }}>
                                {bal.remaining} <small style={{ fontSize: '0.5em', color: '#718096' }}>Days</small>
                            </Typography>
                            <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Typography variant="caption" sx={{ color: '#718096' }}>
                                    Allotted: <b>{bal.totalAllocated}</b>
                                </Typography>
                                <Divider orientation="vertical" flexItem sx={{ height: '12px' }} />
                                <Typography variant="caption" sx={{ color: '#718096' }}>
                                    Used: <b>{bal.used}</b>
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

export default LeaveBalanceCards;
