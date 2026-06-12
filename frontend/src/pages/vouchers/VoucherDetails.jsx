import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Button,
  Box,
  Chip
} from "@mui/material";
import { apiClient } from "../../utils/apiClient";
import Loader from "../../utils/loader";
import { MdArrowBack, MdPrint } from "react-icons/md";
import { useReactToPrint } from "react-to-print";
import numberToWords from "../../utils/numToWord";
import { cloudinaryUrl } from "../../utils/imageurlsetter";
import dayjs from "dayjs";

const VoucherDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const printRef = useRef(null);

  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeVariant, setActiveVariant] = useState("classic");

  const { company } = useSelector((state) => state.user);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Voucher_${voucher?.voucherNo || "details"}`,
    removeAfterPrint: true,
  });

  useEffect(() => {
    fetchVoucher();
  }, [id]);

  const fetchVoucher = async () => {
    try {
      setLoading(true);
      const data = await apiClient({ url: `vouchers/${id}` });
      setVoucher(data);
    } catch (err) {
      console.error("Error fetching voucher details:", err);
    } finally {
      loading && setLoading(false);
    }
  };

  // Auto trigger printing if URL has ?print=true parameter
  useEffect(() => {
    if (!loading && voucher && searchParams.get("print") === "true") {
      // Small timeout to ensure DOM is fully rendered
      setTimeout(() => {
        handlePrint();
      }, 500);
    }
  }, [loading, voucher, searchParams]);

  if (loading) return <Loader />;
  if (!voucher) return <Typography className="p-4 text-center">Voucher not found</Typography>;

  const formatLedgerName = (name) => {
    if (!name) return "N/A";
    return name
      .toLowerCase()
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const totalDebit = voucher.entries?.filter(e => e.type === 'DEBIT').reduce((s, e) => s + e.amount, 0) || 0;
  const totalCredit = voucher.entries?.filter(e => e.type === 'CREDIT').reduce((s, e) => s + e.amount, 0) || 0;
  const logoUrl = company?.logo ? cloudinaryUrl(company.logo, { format: "webp", width: 400, height: 400 }) : null;

  return (
    <Box className="p-1 md:p-4 max-w-4xl mx-auto flex flex-col items-center">
      {/* Top action bar */}
      <Box className="flex justify-between items-center w-full max-w-[794px] mb-6 print:hidden">
        <Button startIcon={<MdArrowBack />} onClick={() => navigate(-1)} variant="outlined" color="inherit">
          Back
        </Button>
        <Box className="flex gap-2">
          <Button
            onClick={() => setActiveVariant("classic")}
            variant={activeVariant === "classic" ? "contained" : "outlined"}
            color="primary"
            size="small"
          >
            Classic Look
          </Button>
          <Button
            onClick={() => setActiveVariant("modern")}
            variant={activeVariant === "modern" ? "contained" : "outlined"}
            color="primary"
            size="small"
          >
            Modern Look
          </Button>
        </Box>
        <Button
          startIcon={<MdPrint />}
          onClick={handlePrint}
          variant="contained"
          color="primary"
          className="shadow-md"
        >
          Print Voucher
        </Button>
      </Box>

      {/* Main voucher card display */}
      <div className="print-area-wrapper w-full max-w-[794px] overflow-x-auto p-1 bg-slate-100 md:p-4 rounded-lg border border-slate-200 shadow-inner flex justify-center print:p-0 print:bg-transparent print:border-none print:shadow-none">
        {/* Printable Area Wrapper */}
        <div
          ref={printRef}
          className="print-area font-sans print:w-full print:h-[148.5mm] print:max-h-[148.5mm] print:mx-auto"
          style={{
            width: "794px",
            height: "535px",
            border: "1px solid #cbd5e1",
            borderRadius: "12px",
            overflow: "hidden",
            background: "#ffffff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "10px",
            boxSizing: "border-box",
            position: "relative"
          }}
        >
          <style>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 5mm 5mm;
              }
              body {
                margin: 0 !important;
                padding: 0 !important;
                background: #fff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body, #root, main, section, article, div:not(.print-area):not(.print-area *) {
                background: transparent !important;
                background-color: transparent !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
              }
              .print-area, .print-area * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `}</style>

          {/* Watermark Logo */}
          {logoUrl ? (
            <div style={{
              position: "absolute",
              top: "55%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "280px",
              height: "280px",
              backgroundImage: `url(${logoUrl})`,
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              opacity: 0.08,
              zIndex: 0,
              pointerEvents: "none"
            }} />
          ) : (
            <div style={{
              position: "absolute",
              top: "55%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "300px",
              height: "300px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              opacity: 0.06,
              zIndex: 0,
              pointerEvents: "none"
            }}>
              <span style={{ fontSize: "40px", fontWeight: "900", color: "#000", transform: "rotate(-30deg)", textTransform: "uppercase", letterSpacing: "2px" }}>
                {company?.fullname || company?.name || "Good Feel"}
              </span>
            </div>
          )}

          {activeVariant === "classic" ? (
            /* Classic Variant Content Wrapper */
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", width: "100%", position: "relative", zIndex: 1 }}>
              {/* Letterhead Header */}
              <div style={{ display: "flex", border: "1px solid #cbd5e1", borderRadius: "8px", overflow: "hidden", background: "#E8F2E2", height: "80px", boxSizing: "border-box" }}>


                <div style={{ width: "85px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", borderRight: "1px solid #cbd5e1", padding: "5px", boxSizing: "border-box" }}>
                  {company?.logo ? (
                    <img
                      src={cloudinaryUrl(company.logo, { format: "webp", width: 150, height: 150, crop: "fit" })}
                      alt="Logo"
                      style={{ maxHeight: "75px", maxWidth: "75px", objectFit: "contain" }}
                    />
                  ) : (
                    <div style={{
                      width: "45px",
                      height: "45px",
                      borderRadius: "50%",
                      background: "#22c55e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "18px",
                      fontWeight: "bold"
                    }}>
                      {company?.fullname || company?.name ? (company?.fullname || company?.name).split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "GF"}
                    </div>
                  )}
                </div>

                {/* Center Info */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "5px", boxSizing: "border-box" }}>
                  <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "900", color: "#000", letterSpacing: "1.5px", textAlign: "center" }}>
                    {(company?.fullname || company?.name)?.toUpperCase() || "GOODFEEL MERCHANDISE PRIVATE LIMITED"}
                  </h1>
                  <p style={{ margin: "2px 0 0 0", fontSize: "11px", fontWeight: "bold", color: "#000", letterSpacing: "0.5px", textAlign: "center" }}>
                    {company?.address || "Vimla Market - 1, Nala Road, Ramchandra Pur, Biharsharif, Bihar-803101"}
                  </p>
                </div>

              </div>

              {/* Payment Voucher Title */}
              <div style={{ textAlign: "center", margin: "2px 0" }}>
                <span style={{ fontSize: "14px", fontWeight: "bold", textDecoration: "underline", letterSpacing: "1px", color: "#000" }}>
                  PAYMENT VOUCHER
                </span>
              </div>

              {/* Ledger details row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 10px", margin: "2px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "bold", color: "#000" }}>Ledger</span>
                  <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "3px 10px", fontSize: "13px", fontWeight: "bold", color: "#000", minWidth: "250px", height: "24px", display: "flex", alignItems: "center", boxSizing: "border-box" }}>
                    {formatLedgerName(voucher.entries?.find(e => e.type === 'DEBIT')?.accountName)}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "bold", color: "#000" }}>Mode</span>
                  <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "3px 10px", fontSize: "13px", fontWeight: "bold", color: "#000", width: "80px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
                    CASH
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {/* V.No. Row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "11px", fontWeight: "bold", color: "#000", width: "35px", textAlign: "right" }}>V.No.</span>
                    <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "1px 8px", fontSize: "12px", fontWeight: "bold", color: "#000", width: "120px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
                      {voucher.voucherNo.replace("GN-INV-", "")}
                    </div>
                  </div>

                  {/* Date Row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "11px", fontWeight: "bold", color: "#000", width: "35px", textAlign: "right" }}>Date</span>
                    <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", color: "#000", width: "120px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
                      {dayjs(voucher.date).format("DD-MMM-YYYY").toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Narration & Amount Box */}
              <div style={{ display: "flex", gap: "15px", padding: "0 10px", margin: "3px 0" }}>
                {/* Narration Left */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: "#000", textAlign: "center", display: "block" }}>
                    Narration
                  </span>
                  <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "8px", height: "85px", fontSize: "12px", color: "#000", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", boxSizing: "border-box", display: "flex", alignItems: "center" }}>
                    {voucher.remarks || "-"}
                  </div>
                </div>

                {/* Amount Right */}
                <div style={{ width: "220px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ display: "block", height: "18px" }}></span> {/* empty spacer to align with Narration label */}
                  <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: "6px", height: "85px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", fontWeight: "900", color: "#000", boxSizing: "border-box" }}>
                    ₹ {totalDebit.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Amount in Words Bar */}
              <div style={{ padding: "0 10px", margin: "2px 0" }}>
                <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", fontWeight: "bold", color: "#000", display: "flex", alignItems: "center", minHeight: "22px", boxSizing: "border-box" }}>
                  In Words - {totalDebit > 0 ? `${numberToWords(totalDebit)} Rupees Only`.toUpperCase() : "NO RUPEES"}
                </div>
              </div>

              {/* Signatures Row */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: "30px", padding: "0 10px", margin: "12px 0 8px 0" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "50px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "#000", textAlign: "center", borderBottom: "1px solid #cbd5e1", paddingBottom: "3px" }}>
                    Approved By
                  </span>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "50px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "#000", textAlign: "center", borderBottom: "1px solid #cbd5e1", paddingBottom: "3px" }}>
                    Cashier
                  </span>
                </div>
                <div style={{ flex: 1.5, display: "flex", flexDirection: "column", height: "50px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "#000", textAlign: "center", borderBottom: "1px solid #cbd5e1", paddingBottom: "3px" }}>
                    Receiver Signature
                  </span>
                </div>
              </div>

              {/* Footer text */}
              <div style={{ borderTop: "1px solid #cbd5e1", padding: "3px 10px 0 10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "8.5px", fontWeight: "bold", color: "#555", textAlign: "center" }}>
                  *Note:- Check your cash carefully before leaving the cash counter. All your responsibility after leaving cash counter.
                </span>
                <span style={{ fontSize: "9px", fontWeight: "bold", color: "#333", marginTop: "2px" }}>
                  **Thanks**
                </span>
              </div>
            </div>
          ) : (
            /* Modern Variant Content Wrapper */
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", width: "100%", position: "relative", zIndex: 1 }}>
              {/* Modern Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #1e293b", paddingBottom: "10px", height: "85px", boxSizing: "border-box" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {company?.logo ? (
                    <img
                      src={cloudinaryUrl(company.logo, { format: "webp", width: 150, height: 150, crop: "fit" })}
                      alt="Logo"
                      style={{ maxHeight: "40px", maxWidth: "120px", objectFit: "contain" }}
                    />
                  ) : (
                    <span style={{ fontSize: "22px", fontWeight: "bold", color: "#1e3a8a" }}>GF</span>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <h1 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#1e293b", textTransform: "uppercase", letterSpacing: "1px", lineHeight: "1.2" }}>
                      {company?.fullname || company?.name || "GoodFeel Merchandise Pvt. Ltd."}
                    </h1>
                    <p style={{ margin: "2px 0 0 0", fontSize: "10px", color: "#64748b", maxWidth: "450px", lineHeight: "1.3", letterSpacing: "0.5px" }}>
                      {company?.address || "Vimla Market - 1, Nala Road, Ramchandra Pur, Biharsharif, Bihar-803101"}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <div style={{ background: "#1e293b", color: "#ffffff", padding: "2px 10px", fontSize: "11px", fontWeight: "bold", letterSpacing: "1px", borderRadius: "2px" }}>
                    PAYMENT VOUCHER
                  </div>
                  <div style={{ marginTop: "6px", fontSize: "10px", fontWeight: "bold", color: "#475569" }}>
                    VOUCHER NO: <span style={{ fontFamily: "monospace", color: "#0f172a", fontSize: "11px" }}>{voucher.voucherNo.replace("GN-INV-", "")}</span>
                  </div>
                </div>
              </div>

              {/* Modern Info Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", margin: "10px 0" }}>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "6px 10px", borderRadius: "4px" }}>
                  <span style={{ fontSize: "9px", fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>Date</span>
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: "#1e293b" }}>
                    {dayjs(voucher.date).format("DD MMMM YYYY")}
                  </span>
                </div>

                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "6px 10px", borderRadius: "4px" }}>
                  <span style={{ fontSize: "9px", fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>Paid To (Ledger)</span>
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: "#1e293b" }}>
                    {formatLedgerName(voucher.entries?.find(e => e.type === 'DEBIT')?.accountName)}
                  </span>
                </div>

                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "6px 10px", borderRadius: "4px" }}>
                  <span style={{ fontSize: "9px", fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>Payment Mode</span>
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: "#1e293b" }}>
                    CASH
                  </span>
                </div>
              </div>

              {/* Modern Particulars & Amount Table */}
              <table style={{ width: "100%", borderCollapse: "collapse", margin: "5px 0" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #cbd5e1" }}>
                    <th style={{ textAlign: "left", padding: "6px 10px", fontSize: "10px", fontWeight: "bold", color: "#475569", textTransform: "uppercase", width: "70%" }}>Particulars / Description</th>
                    <th style={{ textAlign: "right", padding: "6px 10px", fontSize: "10px", fontWeight: "bold", color: "#475569", textTransform: "uppercase", width: "30%" }}>Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "10px", fontSize: "11px", color: "#334155", verticalAlign: "top", borderBottom: "1px solid #e2e8f0", height: "70px" }}>
                      <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                        Debit Entry to {formatLedgerName(voucher.entries?.find(e => e.type === 'DEBIT')?.accountName)}
                      </div>
                      <div style={{ color: "#64748b", fontStyle: "italic" }}>
                        {voucher.remarks || "No narration provided."}
                      </div>
                    </td>
                    <td style={{ padding: "10px", fontSize: "18px", fontWeight: "900", color: "#0f172a", textAlign: "right", verticalAlign: "middle", borderBottom: "1px solid #e2e8f0", background: "#fafafa" }}>
                      ₹ {totalDebit.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Modern Amount in Words Section */}
              <div style={{ display: "flex", gap: "10px", alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "6px 10px", borderRadius: "4px", margin: "5px 0" }}>
                <span style={{ fontSize: "9px", fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase" }}>Amount in Words:</span>
                <span style={{ fontSize: "11px", fontWeight: "bold", color: "#334155" }}>
                  {totalDebit > 0 ? `${numberToWords(totalDebit)} Rupees Only`.toUpperCase() : "NO RUPEES"}
                </span>
              </div>

              {/* Modern Signatures Grid */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: "30px", marginTop: "15px" }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ borderBottom: "1px solid #cbd5e1", height: "35px" }}></div>
                  <span style={{ fontSize: "9px", fontWeight: "bold", color: "#64748b", textTransform: "uppercase", marginTop: "4px", display: "block" }}>Approved By</span>
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ borderBottom: "1px solid #cbd5e1", height: "35px" }}></div>
                  <span style={{ fontSize: "9px", fontWeight: "bold", color: "#64748b", textTransform: "uppercase", marginTop: "4px", display: "block" }}>Cashier</span>
                </div>
                <div style={{ flex: 1.5, textAlign: "center" }}>
                  <div style={{ borderBottom: "1px solid #cbd5e1", height: "35px" }}></div>
                  <span style={{ fontSize: "9px", fontWeight: "bold", color: "#64748b", textTransform: "uppercase", marginTop: "4px", display: "block" }}>Receiver Signature</span>
                </div>
              </div>

              {/* Modern Footer Section */}
              <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: "5px", marginTop: "10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "8.5px", color: "#64748b", textAlign: "center" }}>
                  * Verify cash before leaving counter. Company is not responsible for discrepancies later.
                </span>
                <span style={{ fontSize: "9px", fontWeight: "bold", color: "#475569", marginTop: "2px" }}>
                  **Thanks**
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Box>
  );
};

export default VoucherDetails;
