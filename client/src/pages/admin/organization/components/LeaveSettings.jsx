import React from 'react';
import { Box, FormControlLabel, Checkbox, Button, Typography, CircularProgress } from '@mui/material';

const LeaveSettings = ({ data, onChange, onSubmit, isload }) => {
    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 3 }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={data?.leaveSettings?.allowEmployeeToSeeLedger || false}
                            onChange={(e) => onChange('leaveSettings', 'allowEmployeeToSeeLedger', e.target.checked)}
                        />
                    }
                    label="Allow Employees to see their Leave Ledger"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    When enabled, employees can view their full leave history and balance in their portal.
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                    variant="contained"
                    onClick={onSubmit}
                    disabled={isload}
                    sx={{ minWidth: 120 }}
                >
                    {isload ? <CircularProgress size={24} color="inherit" /> : 'Save Settings'}
                </Button>
            </Box>
        </Box>
    );
};

export default LeaveSettings;
