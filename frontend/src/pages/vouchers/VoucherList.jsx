import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip } from "@mui/material";
import { apiClient } from "../../utils/apiClient";
import Loader from "../../utils/loader";

const VoucherList = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const data = await apiClient({ url: "vouchers" });
      setVouchers(data || []);
    } catch (err) {
      console.error("Error fetching vouchers:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Financial Vouchers</h2>
      {loading ? <Loader /> : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Voucher No</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Employee</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Reference</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vouchers.map((v) => {
                const totalAmount = v.entries.filter(e => e.type === 'DEBIT').reduce((s, e) => s + e.amount, 0);
                return (
                  <TableRow key={v._id}>
                    <TableCell className="font-mono">{v.voucherNo}</TableCell>
                    <TableCell>{new Date(v.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip label={v.type} color="primary" size="small" />
                    </TableCell>
                    <TableCell>{v.employeeId?.userid?.name || "N/A"}</TableCell>
                    <TableCell>₹ {totalAmount.toLocaleString()}</TableCell>
                    <TableCell>{v.referenceType}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
};

export default VoucherList;
