import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Box, Divider, Chip } from "@mui/material";
import { apiClient } from "../../utils/apiClient";
import Loader from "../../utils/loader";
import { MdArrowBack } from "react-icons/md";

const VoucherDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVoucher();
  }, [id]);

  const fetchVoucher = async () => {
    try {
      const data = await apiClient({ url: `vouchers/${id}` });
      setVoucher(data);
    } catch (err) {
      console.error("Error fetching voucher details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (!voucher) return <Typography>Voucher not found</Typography>;

  return (
    <Box className="p-4 max-w-4xl mx-auto">
      <Button startIcon={<MdArrowBack />} onClick={() => navigate(-1)} className="mb-4">Back to Vouchers</Button>
      
      <Paper className="p-6 shadow-md border-t-4 border-teal-600">
        <Box className="flex justify-between items-start mb-6">
          <Box>
            <Typography variant="h4" className="font-bold text-teal-800">VOUCHER</Typography>
            <Typography variant="subtitle1" className="text-gray-500 font-mono">#{voucher.voucherNo}</Typography>
          </Box>
          <Box className="text-right">
            <Chip label={voucher.type} color="primary" className="mb-2" />
            <Typography variant="body2">{new Date(voucher.date).toLocaleDateString(undefined, { dateStyle: 'full' })}</Typography>
          </Box>
        </Box>

        <Divider className="my-4" />

        <Box className="mb-6 grid grid-cols-2 gap-4">
          <Box>
            <Typography variant="overline" className="text-gray-500">Employee Details</Typography>
            <Typography variant="body1" className="font-semibold">{voucher.employeeId?.userid?.name || "N/A"}</Typography>
            <Typography variant="body2">{voucher.employeeId?.designation}</Typography>
          </Box>
          <Box>
            <Typography variant="overline" className="text-gray-500">Reference</Typography>
            <Typography variant="body1" className="capitalize">{voucher.referenceType} ({voucher.referenceId})</Typography>
          </Box>
        </Box>

        <TableContainer component={Box} className="mb-6 border rounded">
          <Table>
            <TableHead className="bg-gray-50">
              <TableRow>
                <TableCell className="font-bold">Account Name</TableCell>
                <TableCell className="font-bold" align="right">Debit (Dr)</TableCell>
                <TableCell className="font-bold" align="right">Credit (Cr)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {voucher.entries.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>{entry.accountName}</TableCell>
                  <TableCell align="right">{entry.type === 'DEBIT' ? `₹ ${entry.amount.toLocaleString()}` : '-'}</TableCell>
                  <TableCell align="right">{entry.type === 'CREDIT' ? `₹ ${entry.amount.toLocaleString()}` : '-'}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-gray-50">
                <TableCell className="font-bold">TOTAL</TableCell>
                <TableCell align="right" className="font-bold text-teal-700">
                  ₹ {voucher.entries.filter(e => e.type === 'DEBIT').reduce((s, e) => s + e.amount, 0).toLocaleString()}
                </TableCell>
                <TableCell align="right" className="font-bold text-teal-700">
                  ₹ {voucher.entries.filter(e => e.type === 'CREDIT').reduce((s, e) => s + e.amount, 0).toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {voucher.remarks && (
          <Box className="p-3 bg-amber-50 border-l-4 border-amber-400 rounded">
            <Typography variant="caption" className="text-amber-800 font-bold uppercase block">Remarks</Typography>
            <Typography variant="body2">{voucher.remarks}</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default VoucherDetails;
