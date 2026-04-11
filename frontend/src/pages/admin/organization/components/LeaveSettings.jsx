import React from 'react';
import { Box, Typography, Switch, FormControlLabel, Paper, Divider, Button } from '@mui/material';
import { MdSettingsSuggest } from 'react-icons/md';

const LeaveSettings = ({ data, onChange, onSubmit, isload }) => {
    const handleChange = (e) => {
        onChange('leaveSettings', {
            ...data?.leaveSettings,
            [e.target.name]: e.target.checked
        });
    };

    return (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e4e8', bgcolor: '#fff' }}>
           
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={data?.leaveSettings?.allowEmployeeToSeeLedger || false}
                            onChange={handleChange}
                            name="allowEmployeeToSeeLedger"
                            color="primary"
                        />
                    }
                    label={
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                Allow Employees to see Ledger
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                If enabled, employees can view their leave credits, debits, and balance trends in their portal.
                            </Typography>
                        </Box>
                    }
                />
            </Box>

            <Box sx={{ textAlign: 'right', mt: 3 }}>
                <Button 
                    variant="contained" 
                    size="small"
                    onClick={onSubmit}
                    disabled={isload}
                >
                    {isload ? 'Updating...' : 'Update Leave Settings'}
                </Button>
            </Box>
        </Paper>
    );
};

export default LeaveSettings;
