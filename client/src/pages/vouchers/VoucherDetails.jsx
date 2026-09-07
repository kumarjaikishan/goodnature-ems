import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { apiClient } from "../../utils/apiClient";
import Loader from "../../utils/loader";
import { ArrowLeft, Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import numberToWords from "../../utils/numToWord";
import { cloudinaryUrl } from "../../utils/imageurlsetter";
import dayjs from "dayjs";
import Button from "@/components/ui/Button";

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
      setLoading(false);
    }
  };

  // Auto trigger printing if URL has ?print=true parameter
  useEffect(() => {
    if (!loading && voucher && searchParams.get("print") === "true") {
      setTimeout(() => {
        handlePrint();
      }, 500);
    }
  }, [loading, voucher, searchParams]);

  if (loading) return <Loader />;
  if (!voucher) return <div className="p-8 text-center text-slate-500 font-medium">Voucher not found</div>;

  const formatLedgerName = (name) => {
    if (!name) return "N/A";
    return name
      .toLowerCase()
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const totalDebit = voucher.entries?.filter(e => e.type === 'DEBIT').reduce((s, e) => s + e.amount, 0) || 0;
  const logoUrl = company?.logo ? cloudinaryUrl(company.logo, { format: "webp", width: 400, height: 400 }) : null;

  return (
    <div className="p-2 md:p-6 max-w-4xl mx-auto flex flex-col items-center">
      {/* Top action bar */}
      <div className="flex flex-wrap justify-between items-center w-full max-w-[794px] mb-6 gap-3 print:hidden">
        <Button
          startIcon={ArrowLeft}
          onClick={() => navigate(-1)}
          variant="outline"
          size="sm"
        >
          Back
        </Button>
        <div className="flex gap-2 flex-wrap items-center">
          <Button
            onClick={() => setActiveVariant("classic")}
            variant={activeVariant === "classic" ? "primary" : "outline"}
            size="sm"
          >
            Classic Slip
          </Button>
          <Button
            onClick={() => setActiveVariant("executive")}
            variant={activeVariant === "executive" ? "primary" : "outline"}
            size="sm"
          >
            Executive Teal
          </Button>
          <Button
            onClick={() => setActiveVariant("modern")}
            variant={activeVariant === "modern" ? "primary" : "outline"}
            size="sm"
          >
            Modern Minimal
          </Button>
        </div>
        <Button
          startIcon={Printer}
          onClick={handlePrint}
          variant="primary"
          size="sm"
          className="shadow-xs"
        >
          Print Voucher
        </Button>
      </div>

      {/* Main voucher card display */}
      <div className="print-area-wrapper w-full max-w-[794px] overflow-x-auto p-1 bg-slate-100 md:p-4 rounded-xl border border-slate-200 shadow-inner flex justify-center print:p-0 print:bg-transparent print:border-none print:shadow-none">
        {/* Printable Area Wrapper */}
        <div
          ref={printRef}
          className="print-area font-sans print:w-full print:h-[148.5mm] print:max-h-[148.5mm] print:mx-auto"
          style={{
            width: "794px",
            height: "535px",
            border: activeVariant === "classic" ? "2px solid #1e293b" : "1px solid #cbd5e1",
            borderRadius: "10px",
            overflow: "hidden",
            background: "#ffffff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "12px 14px",
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
              top: "52%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "260px",
              height: "260px",
              backgroundImage: `url(${logoUrl})`,
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              opacity: 0.06,
              zIndex: 0,
              pointerEvents: "none"
            }} />
          ) : (
            <div style={{
              position: "absolute",
              top: "52%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "300px",
              height: "300px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              opacity: 0.05,
              zIndex: 0,
              pointerEvents: "none"
            }}>
              <span style={{ fontSize: "36px", fontWeight: "900", color: "#000", transform: "rotate(-25deg)", textTransform: "uppercase", letterSpacing: "2px" }}>
                {company?.fullname || company?.name || "Good Nature"}
              </span>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VARIANT 1: CLASSIC TRADITIONAL ACCOUNTING VOUCHER
             ───────────────────────────────────────────────────────────── */}
          {activeVariant === "classic" && (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", width: "100%", position: "relative", zIndex: 1 }}>
              {/* Outer Double Border Header */}
              <div style={{ border: "2px solid #0f172a", borderRadius: "6px", padding: "6px 12px", background: "#f8fafc", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ width: "70px", display: "flex", justifyContent: "center" }}>
                    {company?.logo ? (
                      <img
                        src={cloudinaryUrl(company.logo, { format: "webp", width: 140, height: 140, crop: "fit" })}
                        alt="Logo"
                        style={{ maxHeight: "55px", maxWidth: "65px", objectFit: "contain" }}
                      />
                    ) : (
                      <div style={{ width: "45px", height: "45px", borderRadius: "50%", background: "#0f766e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "16px" }}>
                        GN
                      </div>
                    )}
                  </div>
                  
                  <div style={{ flex: 1, textAlign: "center", padding: "0 10px" }}>
                    <h1 style={{ margin: 0, fontSize: "17px", fontWeight: "900", color: "#0f172a", textTransform: "uppercase", letterSpacing: "1px" }}>
                      {company?.fullname || company?.name || "GOOD NATURE EMS PVT. LTD."}
                    </h1>
                    <p style={{ margin: "2px 0 0 0", fontSize: "10.5px", color: "#334155", fontWeight: "600" }}>
                      {company?.address || "Head Office, Good Nature Commercial Hub, Bihar"}
                    </p>
                    {company?.mobile && (
                      <p style={{ margin: "1px 0 0 0", fontSize: "9.5px", color: "#475569", fontWeight: "500" }}>
                        Phone: {company.mobile} {company.email ? ` | Email: ${company.email}` : ''}
                      </p>
                    )}
                  </div>

                  <div style={{ width: "70px" }}></div>
                </div>

                {/* Banner Badge Centered */}
                <div style={{ position: "absolute", bottom: "-11px", left: "50%", transform: "translateX(-50%)", background: "#0f172a", color: "#ffffff", padding: "1px 16px", borderRadius: "4px", fontSize: "11px", fontWeight: "800", letterSpacing: "1.5px" }}>
                  PAYMENT VOUCHER
                </div>
              </div>

              {/* Meta details bar */}
              <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1.2fr 1.2fr", gap: "8px", marginTop: "12px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "6px 10px" }}>
                <div>
                  <span style={{ fontSize: "9px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", display: "block" }}>Paid To (Ledger Account)</span>
                  <span style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a" }}>
                    {formatLedgerName(voucher.entries?.find(e => e.type === 'DEBIT')?.accountName)}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "9px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", display: "block" }}>Mode</span>
                  <span style={{ fontSize: "12px", fontWeight: "800", color: "#0f766e" }}>
                    CASH
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "9px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", display: "block" }}>Voucher No.</span>
                  <span style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a", fontFamily: "monospace" }}>
                    {voucher.voucherNo.replace(/^(GN-)?INV-/, "INV-")}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "9px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", display: "block" }}>Date</span>
                  <span style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a" }}>
                    {dayjs(voucher.date).format("DD-MMM-YYYY").toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Description & Amount Row */}
              <div style={{ display: "flex", gap: "10px", margin: "6px 0" }}>
                <div style={{ flex: 1, border: "1px solid #cbd5e1", borderRadius: "6px", padding: "8px 10px", height: "88px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#ffffff" }}>
                  <span style={{ fontSize: "9.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Particulars / Narration</span>
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: "500", color: "#1e293b", lineHeight: "1.35", overflow: "hidden" }}>
                    {voucher.remarks || "Payment disbursement against verified company ledger balance."}
                  </p>
                  <span style={{ fontSize: "9px", color: "#94a3b8", fontStyle: "italic" }}>Authorized by Finance Department</span>
                </div>

                <div style={{ width: "230px", border: "2px solid #0f172a", borderRadius: "6px", background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px", boxSizing: "border-box" }}>
                  <span style={{ fontSize: "10px", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "1px" }}>Total Amount</span>
                  <span style={{ fontSize: "28px", fontWeight: "900", color: "#0f172a", marginTop: "2px", lineHeight: "1" }}>
                    ₹ {totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Amount in Words */}
              <div style={{ border: "1px solid #cbd5e1", borderRadius: "6px", padding: "5px 10px", background: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "9.5px", fontWeight: "800", color: "#475569", textTransform: "uppercase", whiteSpace: "nowrap" }}>In Words:</span>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#0f172a" }}>
                  {totalDebit > 0 ? `${numberToWords(totalDebit)} Rupees Only`.toUpperCase() : "ZERO RUPEES"}
                </span>
              </div>

              {/* Signatures */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.3fr", gap: "25px", marginTop: "10px", padding: "0 5px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ borderBottom: "1.5px dashed #64748b", height: "36px" }}></div>
                  <span style={{ fontSize: "10px", fontWeight: "800", color: "#334155", textTransform: "uppercase", display: "block", marginTop: "3px" }}>Authorized Signatory</span>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ borderBottom: "1.5px dashed #64748b", height: "36px" }}></div>
                  <span style={{ fontSize: "10px", fontWeight: "800", color: "#334155", textTransform: "uppercase", display: "block", marginTop: "3px" }}>Cashier / Accountant</span>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ borderBottom: "1.5px dashed #64748b", height: "36px" }}></div>
                  <span style={{ fontSize: "10px", fontWeight: "800", color: "#334155", textTransform: "uppercase", display: "block", marginTop: "3px" }}>Receiver's Signature</span>
                </div>
              </div>

              {/* Footer Note */}
              <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: "4px", marginTop: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "8.5px", color: "#64748b", fontWeight: "500" }}>
                <span>* Please verify cash amount immediately upon receipt.</span>
                <span style={{ fontWeight: "700", color: "#0f172a" }}>System Generated Payment Slip</span>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VARIANT 2: EXECUTIVE TEAL CORPORATE LOOK
             ───────────────────────────────────────────────────────────── */}
          {activeVariant === "executive" && (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", width: "100%", position: "relative", zIndex: 1 }}>
              {/* Executive Header with Deep Teal Banner */}
              <div style={{ background: "linear-gradient(135deg, #134e4a 0%, #0f766e 100%)", color: "#ffffff", borderRadius: "6px", padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {company?.logo ? (
                    <img
                      src={cloudinaryUrl(company.logo, { format: "webp", width: 140, height: 140, crop: "fit" })}
                      alt="Logo"
                      style={{ maxHeight: "48px", maxWidth: "48px", objectFit: "contain", background: "#ffffff", borderRadius: "4px", padding: "2px" }}
                    />
                  ) : (
                    <div style={{ width: "38px", height: "38px", borderRadius: "4px", background: "#ffffff", color: "#0f766e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "15px" }}>
                      GN
                    </div>
                  )}
                  <div>
                    <h1 style={{ margin: 0, fontSize: "16px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1px", color: "#ffffff" }}>
                      {company?.fullname || company?.name || "GOOD NATURE PROJECTS PVT. LTD."}
                    </h1>
                    <p style={{ margin: "2px 0 0 0", fontSize: "10px", color: "#ccfbf1", fontWeight: "500" }}>
                      {company?.address || "Good Nature Commercial Complex, Main Road"}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ background: "#ffffff", color: "#0f766e", padding: "2px 8px", borderRadius: "3px", fontSize: "10px", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase" }}>
                    PAYMENT VOUCHER
                  </span>
                  <div style={{ fontSize: "10px", color: "#e6fffa", fontWeight: "700", marginTop: "4px" }}>
                    NO: <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#ffffff" }}>{voucher.voucherNo.replace(/^(GN-)?INV-/, "INV-")}</span>
                  </div>
                </div>
              </div>

              {/* 3-Column Info Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr", gap: "8px", margin: "8px 0" }}>
                <div style={{ background: "#f0fdfa", border: "1px solid #ccfbf1", borderRadius: "5px", padding: "6px 10px" }}>
                  <span style={{ fontSize: "9px", fontWeight: "700", color: "#0f766e", textTransform: "uppercase", display: "block" }}>Paid To (Ledger)</span>
                  <span style={{ fontSize: "12px", fontWeight: "800", color: "#134e4a" }}>
                    {formatLedgerName(voucher.entries?.find(e => e.type === 'DEBIT')?.accountName)}
                  </span>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "5px", padding: "6px 10px" }}>
                  <span style={{ fontSize: "9px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", display: "block" }}>Payment Mode</span>
                  <span style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a" }}>CASH</span>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "5px", padding: "6px 10px" }}>
                  <span style={{ fontSize: "9px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", display: "block" }}>Voucher Date</span>
                  <span style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a" }}>
                    {dayjs(voucher.date).format("DD MMM YYYY")}
                  </span>
                </div>
              </div>

              {/* Ledger Particulars Table */}
              <table style={{ width: "100%", borderCollapse: "collapse", margin: "2px 0" }}>
                <thead>
                  <tr style={{ background: "#134e4a", color: "#ffffff" }}>
                    <th style={{ textAlign: "left", padding: "6px 10px", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", width: "70%", borderRadius: "4px 0 0 0" }}>Particulars / Description</th>
                    <th style={{ textAlign: "right", padding: "6px 10px", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", width: "30%", borderRadius: "0 4px 0 0" }}>Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "8px 10px", fontSize: "11px", color: "#334155", verticalAlign: "top", border: "1px solid #ccfbf1", borderTop: "none", height: "70px", background: "#fcfdfe" }}>
                      <div style={{ fontWeight: "700", color: "#134e4a", marginBottom: "3px" }}>
                        Payment disbursed to {formatLedgerName(voucher.entries?.find(e => e.type === 'DEBIT')?.accountName)}
                      </div>
                      <div style={{ color: "#64748b", fontStyle: "italic" }}>
                        {voucher.remarks || "No specific narration provided."}
                      </div>
                    </td>
                    <td style={{ padding: "8px 10px", fontSize: "22px", fontWeight: "900", color: "#0f766e", textAlign: "right", verticalAlign: "middle", border: "1px solid #ccfbf1", borderTop: "none", background: "#f0fdfa" }}>
                      ₹ {totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* In words */}
              <div style={{ background: "#f0fdfa", border: "1px solid #ccfbf1", borderRadius: "5px", padding: "5px 10px", display: "flex", alignItems: "center", gap: "8px", margin: "4px 0" }}>
                <span style={{ fontSize: "9px", fontWeight: "800", color: "#0f766e", textTransform: "uppercase" }}>Amount In Words:</span>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#134e4a" }}>
                  {totalDebit > 0 ? `${numberToWords(totalDebit)} Rupees Only`.toUpperCase() : "ZERO RUPEES"}
                </span>
              </div>

              {/* Signatures */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.3fr", gap: "25px", marginTop: "12px", padding: "0 5px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ borderBottom: "1.5px solid #0f766e", height: "35px" }}></div>
                  <span style={{ fontSize: "9.5px", fontWeight: "800", color: "#134e4a", textTransform: "uppercase", display: "block", marginTop: "3px" }}>Verified By</span>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ borderBottom: "1.5px solid #0f766e", height: "35px" }}></div>
                  <span style={{ fontSize: "9.5px", fontWeight: "800", color: "#134e4a", textTransform: "uppercase", display: "block", marginTop: "3px" }}>Cashier</span>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ borderBottom: "1.5px solid #0f766e", height: "35px" }}></div>
                  <span style={{ fontSize: "9.5px", fontWeight: "800", color: "#134e4a", textTransform: "uppercase", display: "block", marginTop: "3px" }}>Receiver Signature</span>
                </div>
              </div>

              {/* Footer */}
              <div style={{ borderTop: "1px solid #ccfbf1", paddingTop: "4px", marginTop: "6px", textAlign: "center", fontSize: "8.5px", color: "#0f766e", fontWeight: "600" }}>
                ** Please check cash balance before leaving cash counter **
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              VARIANT 3: MODERN MINIMALIST LOOK
             ───────────────────────────────────────────────────────────── */}
          {activeVariant === "modern" && (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", width: "100%", position: "relative", zIndex: 1 }}>
              {/* Modern Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #0f172a", paddingBottom: "8px", height: "75px", boxSizing: "border-box" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {company?.logo ? (
                    <img
                      src={cloudinaryUrl(company.logo, { format: "webp", width: 140, height: 140, crop: "fit" })}
                      alt="Logo"
                      style={{ maxHeight: "45px", maxWidth: "100px", objectFit: "contain" }}
                    />
                  ) : (
                    <span style={{ fontSize: "20px", fontWeight: "900", color: "#0f766e" }}>GN</span>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <h1 style={{ margin: 0, fontSize: "16px", fontWeight: "900", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {company?.fullname || company?.name || "Good Nature Projects Pvt. Ltd."}
                    </h1>
                    <p style={{ margin: "2px 0 0 0", fontSize: "10px", color: "#64748b", maxWidth: "450px" }}>
                      {company?.address || "Good Nature Commercial Hub, Bihar"}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <div style={{ background: "#0f172a", color: "#ffffff", padding: "2px 10px", fontSize: "10px", fontWeight: "800", letterSpacing: "1px", borderRadius: "3px" }}>
                    PAYMENT VOUCHER
                  </div>
                  <div style={{ marginTop: "4px", fontSize: "10px", fontWeight: "700", color: "#475569" }}>
                    VOUCHER NO: <span style={{ fontFamily: "monospace", color: "#0f172a", fontSize: "11px" }}>{voucher.voucherNo.replace(/^(GN-)?INV-/, "INV-")}</span>
                  </div>
                </div>
              </div>

              {/* Modern Info Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", margin: "8px 0" }}>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "5px 8px", borderRadius: "4px" }}>
                  <span style={{ fontSize: "8.5px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", display: "block" }}>Date</span>
                  <span style={{ fontSize: "11.5px", fontWeight: "800", color: "#1e293b" }}>
                    {dayjs(voucher.date).format("DD MMMM YYYY")}
                  </span>
                </div>

                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "5px 8px", borderRadius: "4px" }}>
                  <span style={{ fontSize: "8.5px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", display: "block" }}>Paid To (Ledger)</span>
                  <span style={{ fontSize: "11.5px", fontWeight: "800", color: "#1e293b" }}>
                    {formatLedgerName(voucher.entries?.find(e => e.type === 'DEBIT')?.accountName)}
                  </span>
                </div>

                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "5px 8px", borderRadius: "4px" }}>
                  <span style={{ fontSize: "8.5px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", display: "block" }}>Payment Mode</span>
                  <span style={{ fontSize: "11.5px", fontWeight: "800", color: "#1e293b" }}>
                    CASH
                  </span>
                </div>
              </div>

              {/* Modern Particulars & Amount Table */}
              <table style={{ width: "100%", borderCollapse: "collapse", margin: "2px 0" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #cbd5e1" }}>
                    <th style={{ textAlign: "left", padding: "6px 10px", fontSize: "9.5px", fontWeight: "700", color: "#475569", textTransform: "uppercase", width: "70%" }}>Particulars / Description</th>
                    <th style={{ textAlign: "right", padding: "6px 10px", fontSize: "9.5px", fontWeight: "700", color: "#475569", textTransform: "uppercase", width: "30%" }}>Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "8px 10px", fontSize: "11px", color: "#334155", verticalAlign: "top", borderBottom: "1px solid #e2e8f0", height: "65px" }}>
                      <div style={{ fontWeight: "700", marginBottom: "2px" }}>
                        Debit Entry to {formatLedgerName(voucher.entries?.find(e => e.type === 'DEBIT')?.accountName)}
                      </div>
                      <div style={{ color: "#64748b", fontStyle: "italic" }}>
                        {voucher.remarks || "No narration provided."}
                      </div>
                    </td>
                    <td style={{ padding: "8px 10px", fontSize: "18px", fontWeight: "900", color: "#0f172a", textAlign: "right", verticalAlign: "middle", borderBottom: "1px solid #e2e8f0", background: "#fafafa" }}>
                      ₹ {totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Modern Amount in Words Section */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "5px 8px", borderRadius: "4px", margin: "4px 0" }}>
                <span style={{ fontSize: "8.5px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" }}>In Words:</span>
                <span style={{ fontSize: "10.5px", fontWeight: "800", color: "#334155" }}>
                  {totalDebit > 0 ? `${numberToWords(totalDebit)} Rupees Only`.toUpperCase() : "NO RUPEES"}
                </span>
              </div>

              {/* Modern Signatures Grid */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: "25px", marginTop: "10px" }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ borderBottom: "1px solid #cbd5e1", height: "30px" }}></div>
                  <span style={{ fontSize: "8.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginTop: "3px", display: "block" }}>Approved By</span>
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ borderBottom: "1px solid #cbd5e1", height: "30px" }}></div>
                  <span style={{ fontSize: "8.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginTop: "3px", display: "block" }}>Cashier</span>
                </div>
                <div style={{ flex: 1.5, textAlign: "center" }}>
                  <div style={{ borderBottom: "1px solid #cbd5e1", height: "30px" }}></div>
                  <span style={{ fontSize: "8.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginTop: "3px", display: "block" }}>Receiver Signature</span>
                </div>
              </div>

              {/* Modern Footer Section */}
              <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: "4px", marginTop: "8px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "8px", color: "#64748b", textAlign: "center" }}>
                  * Verify cash before leaving counter. Company is not responsible for discrepancies later.
                </span>
                <span style={{ fontSize: "8.5px", fontWeight: "700", color: "#475569", marginTop: "1px" }}>
                  **Thanks**
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoucherDetails;
