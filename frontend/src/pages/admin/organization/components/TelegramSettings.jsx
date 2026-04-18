import React from 'react';
import { 
    TextField, Button, IconButton, InputAdornment, 
    Card, CardContent, Grid, Typography, Switch, 
    FormControlLabel, Box, Divider 
} from '@mui/material';
import { FaTrash, FaTelegramPlane } from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';

const TelegramSettings = ({ companyinp, setcompany, handleChange, fetchgroup, teleloading, isload, handleSubmit }) => {
    return (
        <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <FaTelegramPlane size={24} color="#0088cc" style={{ marginRight: '12px' }} />
                    <Typography variant="h6" fontWeight="600">Telegram Bot Configuration</Typography>
                </Box>
                
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <TextField
                            label="Telegram Bot Token"
                            variant="outlined"
                            size="small"
                            fullWidth
                            slotProps={{
                                input: {
                                    readOnly: true,
                                    sx: { bgcolor: '#f5f5f5' }
                                }
                            }}
                            value={companyinp?.telegram?.token || ""}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            label="Group Chat ID"
                            variant="outlined"
                            size="small"
                            fullWidth
                            placeholder="e.g. -10012345678"
                            value={companyinp?.telegram?.groupId || ""}
                            onChange={e => handleChange('telegram', 'groupId', e.target.value)}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="600">Main Notifications</Typography>
                                <Typography variant="body2" color="text.secondary">Send attendance alerts to the group</Typography>
                            </Box>
                            <Switch
                                color="primary"
                                checked={companyinp?.telegramNotifcation || false}
                                onChange={e =>
                                    setcompany(prev => ({
                                        ...prev,
                                        telegramNotifcation: e.target.checked
                                    }))
                                }
                            />
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="600">Individual Alerts</Typography>
                                <Typography variant="body2" color="text.secondary">Private messages to each employee</Typography>
                            </Box>
                            <Switch
                                color="secondary"
                                checked={companyinp?.telegram?.individualNotification || false}
                                onChange={e =>
                                    setcompany(prev => ({
                                        ...prev,
                                        telegram: {
                                            ...prev.telegram,
                                            individualNotification: e.target.checked
                                        }
                                    }))
                                }
                            />
                        </Box>
                    </Grid>

                    <Grid item xs={12} sx={{ mt: 2 }}>
                        <Button 
                            variant="contained" 
                            fullWidth={false}
                            sx={{ minWidth: 150, float: 'right' }}
                            loading={isload} 
                            onClick={handleSubmit}
                        >
                            Update Integration
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default TelegramSettings;
