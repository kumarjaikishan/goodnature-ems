import React, { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { apiClient } from '../../../../utils/apiClient';
import dayjs from 'dayjs';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const EsslEventLog = ({ companyId }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchEvents = async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const data = await apiClient({
                url: `getEsslEvents/${companyId}`
            });
            setEvents(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching ESSL events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
        const interval = setInterval(fetchEvents, 30000);
        return () => clearInterval(interval);
    }, [companyId]);

    const getBadgeVariant = (type) => {
        switch (type) {
            case 'Success': return 'success';
            case 'Warning': return 'warning';
            case 'Error': return 'danger';
            case 'Ignored': return 'neutral';
            default: return 'primary';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                        Recent Biometric Device Logs
                    </h3>
                    <p className="text-xs text-slate-500">Live sync stream received from eSSL biometric hardware</p>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    startIcon={RotateCcw}
                    loading={loading}
                    onClick={fetchEvents}
                >
                    Refresh
                </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200/80">
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                            <th className="py-2.5 px-3">Device SN</th>
                            <th className="py-2.5 px-3">User ID / PIN</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Message</th>
                            <th className="py-2.5 px-3">Punch Time</th>
                            <th className="py-2.5 px-3">Received At</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {events.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-slate-500">
                                    {loading ? 'Fetching logs...' : 'No biometric device events logged yet.'}
                                </td>
                            </tr>
                        ) : (
                            events.map((evt, idx) => (
                                <tr key={evt._id || idx} className="hover:bg-slate-50/60 transition">
                                    <td className="py-2.5 px-3 font-mono text-slate-800 font-semibold">{evt.deviceSN || '-'}</td>
                                    <td className="py-2.5 px-3 font-medium text-slate-800">{evt.userId || '-'}</td>
                                    <td className="py-2.5 px-3">
                                        <Badge size="sm" variant={getBadgeVariant(evt.type)}>
                                            {evt.type || 'Info'}
                                        </Badge>
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-600">{evt.message || '-'}</td>
                                    <td className="py-2.5 px-3 text-slate-700">
                                        {evt.punchTime ? dayjs(evt.punchTime).format('DD/MM/YY, hh:mm A') : '-'}
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-500">
                                        {evt.createdAt ? dayjs(evt.createdAt).format('DD/MM/YY, hh:mm:ss A') : '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EsslEventLog;
