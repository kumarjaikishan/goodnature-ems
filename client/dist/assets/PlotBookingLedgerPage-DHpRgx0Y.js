import{r as e}from"./rolldown-runtime-hePW80VL.js";import{Fn as t,H as n,Kn as r,Mn as i,P as a,Qn as o,V as s,Vt as c,fn as l,n as u,qt as d,st as f,u as p,wn as m}from"./vendor-react-4eY5XJPp.js";import{h,l as g,m as _}from"./index-F5QBcMDg.js";import{t as v}from"./axios-ClGgn6uq.js";import{t as y}from"./PageLoader-2Um_nras.js";import{t as b}from"./Button-DkFU91nR.js";import{t as x}from"./numToWord-CfsDhxw7.js";var S=e(o(),1),C=u(),w=()=>{let{id:e}=h(),o=_(),[u,w]=(0,S.useState)(!0),[T,E]=(0,S.useState)(null),[D,O]=(0,S.useState)(`statement`),[k,A]=(0,S.useState)(``),j=async()=>{if(e){w(!0);try{let t=await v.get(`/plots/bookings/${e}/ledger`);E(t.data.data)}catch(e){console.error(`Failed to load booking ledger:`,e),g.error(`Failed to load booking ledger data`)}finally{w(!1)}}};(0,S.useEffect)(()=>{j()},[e]);let M=T?.booking||{},N=T?.summary||{},P=T?.ledgerEntries||[],F=T?.installments||[],I=T?.receipts||[],L=M.customerId||{},R=M.plotId||{},z=M.projectId||{},B=M.sponsorId||{},V=Number(N.grossPlotValue??M.plotValue??0),H=Number(N.discount??M.discount??0),U=Number(N.netPlotValue??Math.max(0,V-H)),W=Number(N.totalPaid??Math.max(0,U-Number(M.remainingAmount||0))),G=Number(N.outstandingBalance??Math.max(0,U-W)),K=Number(N.lateFineAccrued??0);Number(N.totalLateFinePaid??0);let q=R.plotSize||R.area||R.areaSqFt||0,J=M.effectivePlotRate||(q>0?Math.round(V/q):0),Y=(0,S.useMemo)(()=>{if(!k.trim())return P;let e=k.toLowerCase();return P.filter(t=>t.particulars?.toLowerCase().includes(e)||t.referenceNumber?.toLowerCase().includes(e)||t.paymentMode?.toLowerCase().includes(e)||t.notes?.toLowerCase().includes(e))},[P,k]);return u?(0,C.jsx)(y,{title:`Loading Booking Ledger...`,subtitle:`Fetching real-time verified collections and financial entries`,fullScreen:!1}):!T||!M._id?(0,C.jsxs)(`div`,{className:`p-8 text-center space-y-4`,children:[(0,C.jsx)(l,{size:40,className:`text-rose-500 mx-auto`}),(0,C.jsx)(`h2`,{className:`text-lg font-bold text-slate-800`,children:`Booking Ledger Not Found`}),(0,C.jsx)(`p`,{className:`text-xs text-slate-500`,children:`The requested booking record could not be located or has been archived.`}),(0,C.jsx)(b,{variant:`secondary`,onClick:()=>o(`/dashboard/plots/booking`),children:`Back to Bookings`})]}):(0,C.jsxs)(`div`,{className:`p-4 sm:p-6 max-w-7xl mx-auto space-y-5 animate-in fade-in duration-300`,children:[(0,C.jsxs)(`div`,{className:`flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs`,children:[(0,C.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,C.jsxs)(`button`,{type:`button`,onClick:()=>o(-1),className:`p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer text-xs flex items-center gap-1 font-semibold`,children:[(0,C.jsx)(r,{size:16}),` Back`]}),(0,C.jsxs)(`div`,{children:[(0,C.jsxs)(`div`,{className:`flex items-center gap-2 flex-wrap`,children:[(0,C.jsx)(`h1`,{className:`text-lg font-extrabold text-slate-900 font-mono tracking-tight`,children:M.bookingNumber}),(0,C.jsx)(`span`,{className:`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${M.status===`ACTIVE`?`bg-emerald-50 text-emerald-700 border border-emerald-200`:M.status===`PENDING`?`bg-amber-100 text-amber-900 border border-amber-300`:M.status===`REJECTED`?`bg-rose-100 text-rose-800 border border-rose-300`:M.status===`COMPLETED`?`bg-blue-50 text-blue-700 border border-blue-200`:`bg-slate-100 text-slate-700 border border-slate-200`}`,children:M.status}),(0,C.jsx)(`span`,{className:`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-teal-50 text-teal-800 border border-teal-200`,children:M.scheme===`FULL_PAYMENT`?`One-Time Full Payment`:`Monthly EMI Scheme`})]}),(0,C.jsxs)(`p`,{className:`text-xs text-slate-500 mt-0.5`,children:[`Customer: `,(0,C.jsx)(`strong`,{className:`text-slate-800`,children:L.name||M.customerName||`N/A`}),` • Plot:`,` `,(0,C.jsxs)(`strong`,{className:`text-teal-800`,children:[`#`,R.plotNumber||`N/A`]}),` (`,q,` Sq Ft) • Project:`,` `,(0,C.jsx)(`strong`,{className:`text-slate-800`,children:z.projectName||R.seriesId?.seriesName||`Standard Layout`})]})]})]}),(0,C.jsxs)(`div`,{className:`flex items-center gap-2 flex-wrap`,children:[(0,C.jsxs)(b,{variant:`outline`,size:`sm`,onClick:()=>{let e=window.open(``,`_blank`);if(!e){g.error(`Pop-up blocked. Please allow pop-ups to print the statement.`);return}let t=new Date().toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`}),n=P.map((e,t)=>`
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 7px 8px; text-align: center; color: #64748b;">${t+1}</td>
        <td style="padding: 7px 8px; white-space: nowrap;">${new Date(e.date).toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`})}</td>
        <td style="padding: 7px 8px; font-weight: 600; color: #1e293b;">
          ${e.particulars}
          ${e.notes?`<div style="font-size: 9px; color: #64748b; font-weight: normal;">${e.notes}</div>`:``}
        </td>
        <td style="padding: 7px 8px; font-family: monospace; font-weight: bold; color: #334155;">${e.referenceNumber||`-`}</td>
        <td style="padding: 7px 8px; text-transform: uppercase; font-size: 10px; color: #475569;">${e.paymentMode||`-`}</td>
        <td style="padding: 7px 8px; text-align: right; font-family: monospace; font-weight: 600; color: ${e.debit>0?`#991b1b`:`#64748b`};">
          ${e.debit>0?`₹`+e.debit.toLocaleString(`en-IN`):`-`}
        </td>
        <td style="padding: 7px 8px; text-align: right; font-family: monospace; font-weight: 600; color: ${e.credit>0?`#047857`:`#64748b`};">
          ${e.credit>0?`₹`+e.credit.toLocaleString(`en-IN`):`-`}
        </td>
        <td style="padding: 7px 8px; text-align: right; font-family: monospace; font-weight: bold; color: #0f172a;">
          ₹${Math.abs(e.balance).toLocaleString(`en-IN`)} ${e.balance>0?`Dr`:e.balance===0?`Settled`:`Cr`}
        </td>
      </tr>
    `).join(``),r=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ledger Statement - ${M.bookingNumber||``}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 12px; }
          .header-table { width: 100%; border-bottom: 2px solid #0f766e; padding-bottom: 10px; margin-bottom: 12px; }
          .title { font-size: 18px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px; }
          .subtitle { font-size: 11px; color: #475569; margin-top: 2px; }
          .info-grid { display: table; width: 100%; margin-bottom: 14px; border-collapse: collapse; }
          .info-cell { display: table-cell; width: 50%; vertical-align: top; padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 11px; }
          .info-row { margin-bottom: 4px; }
          .info-label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; width: 110px; display: inline-block; }
          .info-val { font-weight: 700; color: #0f172a; }
          .kpi-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
          .kpi-cell { padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center; }
          .kpi-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700; }
          .kpi-value { font-size: 13px; font-weight: 800; margin-top: 2px; font-family: monospace; }
          .ledger-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          .ledger-table th { background: #0f766e; color: #ffffff; font-size: 10px; text-transform: uppercase; padding: 7px 8px; text-align: left; }
          .ledger-table th.right { text-align: right; }
          .ledger-table th.center { text-align: center; }
          .total-row { background: #f1f5f9; font-weight: 800; border-top: 2px solid #0f766e; }
          .words-banner { margin-top: 10px; padding: 8px 10px; background: #f8fafc; border: 1px dashed #cbd5e1; font-size: 11px; line-height: 1.4; }
          .footer-signs { margin-top: 40px; display: table; width: 100%; }
          .sign-cell { display: table-cell; width: 33.33%; text-align: center; font-size: 11px; color: #334155; }
          .sign-line { border-top: 1px solid #94a3b8; width: 70%; margin: 40px auto 4px auto; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td>
              <div class="title">GOOD NATURE REAL INFRA</div>
              <div class="subtitle">Plot Sales, Township Development &amp; Customer Account Ledger</div>
            </td>
            <td style="text-align: right;">
              <div style="font-size: 12px; font-weight: bold; color: #0f766e;">CUSTOMER BOOKING STATEMENT</div>
              <div style="font-size: 10px; color: #64748b;">Statement Date: ${t}</div>
            </td>
          </tr>
        </table>

        <!-- Customer & Plot Info Box -->
        <div class="info-grid">
          <div class="info-cell" style="border-right: none;">
            <div class="info-row"><span class="info-label">Customer Name:</span> <span class="info-val">${L.name||M.customerName||`N/A`}</span></div>
            <div class="info-row"><span class="info-label">Customer Code:</span> <span class="info-val">${L.customerId||L.customerCode||`N/A`}</span></div>
            <div class="info-row"><span class="info-label">Mobile Number:</span> <span class="info-val">${L.mobile||M.customerMobile||`-`}</span></div>
            <div class="info-row"><span class="info-label">Father / Spouse:</span> <span class="info-val">${L.fatherOrHusbandName||`-`}</span></div>
            <div class="info-row"><span class="info-label">Address:</span> <span class="info-val">${L.address||`-`}</span></div>
          </div>
          <div class="info-cell">
            <div class="info-row"><span class="info-label">Booking No:</span> <span class="info-val" style="font-family: monospace; color: #0f766e;">${M.bookingNumber||`-`}</span></div>
            <div class="info-row"><span class="info-label">Plot Number:</span> <span class="info-val">Plot #${R.plotNumber||`N/A`} (${q} Sq Ft)</span></div>
            <div class="info-row"><span class="info-label">Project / Series:</span> <span class="info-val">${z.projectName||R.seriesId?.seriesName||`Standard Layout`}</span></div>
            <div class="info-row"><span class="info-label">Payment Scheme:</span> <span class="info-val">${M.scheme===`FULL_PAYMENT`?`Full Payment`:`Monthly EMI`}</span></div>
            <div class="info-row"><span class="info-label">Booking Date:</span> <span class="info-val">${new Date(M.bookingDate||M.createdAt).toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`})}</span></div>
          </div>
        </div>

        <!-- KPI Summary Box -->
        <table class="kpi-table">
          <tr>
            <td class="kpi-cell" style="background: #f8fafc;">
              <div class="kpi-label">Plot Consideration</div>
              <div class="kpi-value" style="color: #0f172a;">₹${V.toLocaleString(`en-IN`)}</div>
            </td>
            <td class="kpi-cell" style="background: #f8fafc;">
              <div class="kpi-label">Discount</div>
              <div class="kpi-value" style="color: #64748b;">${H>0?`₹`+H.toLocaleString(`en-IN`):`₹0`}</div>
            </td>
            <td class="kpi-cell" style="background: #f0fdfa;">
              <div class="kpi-label" style="color: #0f766e;">Net Payable (Dr)</div>
              <div class="kpi-value" style="color: #0f766e;">₹${U.toLocaleString(`en-IN`)}</div>
            </td>
            <td class="kpi-cell" style="background: #ecfdf5;">
              <div class="kpi-label" style="color: #047857;">Total Realized (Cr)</div>
              <div class="kpi-value" style="color: #047857;">₹${W.toLocaleString(`en-IN`)}</div>
            </td>
            <td class="kpi-cell" style="background: ${G>0?`#fff1f2`:`#f0fdf4`};">
              <div class="kpi-label" style="color: ${G>0?`#b91c1c`:`#047857`};">Balance Outstanding</div>
              <div class="kpi-value" style="color: ${G>0?`#b91c1c`:`#047857`};">
                ₹${G.toLocaleString(`en-IN`)} ${G>0?`Dr`:`Nil`}
              </div>
            </td>
          </tr>
        </table>

        <!-- Running Ledger Table -->
        <table class="ledger-table">
          <thead>
            <tr>
              <th class="center" style="width: 25px;">#</th>
              <th style="width: 85px;">Date</th>
              <th>Particulars / Narration</th>
              <th style="width: 110px;">Ref / Doc #</th>
              <th style="width: 80px;">Mode</th>
              <th class="right" style="width: 90px;">Debit (₹)</th>
              <th class="right" style="width: 90px;">Credit (₹)</th>
              <th class="right" style="width: 100px;">Balance (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${n}
          </tbody>
          <tfoot>
            <tr class="total-row" style="font-size: 11px;">
              <td colspan="5" style="padding: 8px; text-transform: uppercase;">Total Ledger Account Summary</td>
              <td style="padding: 8px; text-align: right; font-family: monospace; color: #991b1b;">₹${U.toLocaleString(`en-IN`)}</td>
              <td style="padding: 8px; text-align: right; font-family: monospace; color: #047857;">₹${W.toLocaleString(`en-IN`)}</td>
              <td style="padding: 8px; text-align: right; font-family: monospace; color: ${G>0?`#b91c1c`:`#047857`};">
                ₹${G.toLocaleString(`en-IN`)} ${G>0?`Dr`:`Nil`}
              </td>
            </tr>
          </tfoot>
        </table>

        <!-- Amount In Words -->
        <div class="words-banner">
          <div><strong>Total Realized:</strong> ${x(W)}</div>
          <div style="margin-top: 3px;"><strong>Outstanding Balance:</strong> ${G>0?x(G):`Nil / Fully Settled`}</div>
        </div>

        <!-- Footer Signatures -->
        <div class="footer-signs">
          <div class="sign-cell">
            <div class="sign-line"></div>
            <strong>Customer / Allottee</strong>
          </div>
          <div class="sign-cell">
            <div class="sign-line"></div>
            <strong>Accounts Executive</strong>
          </div>
          <div class="sign-cell">
            <div class="sign-line"></div>
            <strong>Authorized Signatory</strong>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        <\/script>
      </body>
      </html>
    `;e.document.open(),e.document.write(r),e.document.close()},className:`text-xs flex items-center gap-1.5 border-teal-300 text-teal-800 hover:bg-teal-50`,children:[(0,C.jsx)(n,{size:15}),` Print Statement`]}),G>0&&(0,C.jsxs)(b,{variant:`primary`,size:`sm`,onClick:()=>{let e=M.scheme===`MONTHLY_INSTALLMENT`&&(M.downpaymentCleared||M.bookingAmount&&M.bookingAmount>0)?`/dashboard/plots/collections/emi/add?bookingId=${M._id}`:`/dashboard/plots/collections/downpayment/add?bookingId=${M._id}`;o(e)},className:`text-xs flex items-center gap-1.5`,children:[(0,C.jsx)(d,{size:15}),` Collect Payment`]}),(0,C.jsxs)(b,{variant:`secondary`,size:`sm`,onClick:()=>o(`/dashboard/plots/booking/${M._id}`),className:`text-xs flex items-center gap-1.5`,children:[(0,C.jsx)(c,{size:15}),` View Full Contract`]})]})]}),(0,C.jsxs)(`div`,{className:`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3`,children:[(0,C.jsxs)(`div`,{className:`bg-white p-4 rounded-2xl border border-slate-200 shadow-xs`,children:[(0,C.jsx)(`div`,{className:`text-[10px] uppercase font-bold text-slate-400`,children:`Gross Consideration`}),(0,C.jsxs)(`div`,{className:`text-lg font-black text-slate-900 font-mono mt-1`,children:[`₹`,V.toLocaleString(`en-IN`)]}),(0,C.jsxs)(`div`,{className:`text-[11px] text-slate-500 mt-0.5`,children:[q,` Sq Ft @ ₹`,J.toLocaleString(`en-IN`),`/SqFt`]})]}),(0,C.jsxs)(`div`,{className:`bg-white p-4 rounded-2xl border border-slate-200 shadow-xs`,children:[(0,C.jsx)(`div`,{className:`text-[10px] uppercase font-bold text-slate-400`,children:`Discount Granted`}),(0,C.jsx)(`div`,{className:`text-lg font-black text-slate-700 font-mono mt-1`,children:H>0?`₹${H.toLocaleString(`en-IN`)}`:`-`}),(0,C.jsxs)(`div`,{className:`text-[11px] text-slate-500 mt-0.5`,children:[`Net: ₹`,U.toLocaleString(`en-IN`)]})]}),(0,C.jsxs)(`div`,{className:`bg-white p-4 rounded-2xl border border-teal-200 shadow-xs bg-gradient-to-br from-teal-50/50 to-white`,children:[(0,C.jsx)(`div`,{className:`text-[10px] uppercase font-bold text-teal-800`,children:`Net Payable (Debit)`}),(0,C.jsxs)(`div`,{className:`text-lg font-black text-teal-900 font-mono mt-1`,children:[`₹`,U.toLocaleString(`en-IN`)]}),(0,C.jsx)(`div`,{className:`text-[11px] text-teal-700 mt-0.5 font-medium`,children:`Contract Consideration`})]}),(0,C.jsxs)(`div`,{className:`bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-gradient-to-br from-emerald-50/50 to-white`,children:[(0,C.jsx)(`div`,{className:`text-[10px] uppercase font-bold text-emerald-700`,children:`Total Realized (Credit)`}),(0,C.jsxs)(`div`,{className:`text-lg font-black text-emerald-800 font-mono mt-1`,children:[`₹`,W.toLocaleString(`en-IN`)]}),(0,C.jsxs)(`div`,{className:`text-[11px] text-emerald-600 mt-0.5 font-medium`,children:[I.length,` Receipt`,I.length===1?``:`s`,` Collected`]})]}),(0,C.jsxs)(`div`,{className:`p-4 rounded-2xl border shadow-xs bg-white ${G>0?`border-rose-200 bg-gradient-to-br from-rose-50/50 to-white`:`border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white`}`,children:[(0,C.jsx)(`div`,{className:`text-[10px] uppercase font-bold ${G>0?`text-rose-700`:`text-emerald-700`}`,children:`Outstanding Balance`}),(0,C.jsxs)(`div`,{className:`text-lg font-black font-mono mt-1 ${G>0?`text-rose-800`:`text-emerald-800`}`,children:[`₹`,G.toLocaleString(`en-IN`)]}),(0,C.jsx)(`div`,{className:`text-[11px] font-medium mt-0.5 ${G>0?`text-rose-600`:`text-emerald-600`}`,children:G>0?`Dr (Pending Balance)`:`Nil (Fully Cleared)`})]})]}),(0,C.jsxs)(`div`,{className:`p-3.5 bg-white border border-slate-200 rounded-2xl text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 text-slate-700 shadow-xs`,children:[(0,C.jsxs)(`div`,{children:[(0,C.jsx)(`span`,{className:`font-bold text-slate-900`,children:`Total Realized In Words: `}),(0,C.jsx)(`span`,{className:`text-emerald-800 font-semibold`,children:x(W)})]}),(0,C.jsxs)(`div`,{children:[(0,C.jsx)(`span`,{className:`font-bold text-slate-900`,children:`Outstanding In Words: `}),(0,C.jsx)(`span`,{className:G>0?`text-rose-800 font-semibold`:`text-emerald-800 font-semibold`,children:G>0?x(G):`Nil / Fully Cleared`})]})]}),(0,C.jsxs)(`div`,{className:`bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden`,children:[(0,C.jsxs)(`div`,{className:`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-200 bg-slate-50/70`,children:[(0,C.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,C.jsxs)(`button`,{type:`button`,onClick:()=>O(`statement`),className:`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${D===`statement`?`bg-teal-700 text-white shadow-2xs`:`bg-white text-slate-600 hover:bg-slate-100 border border-slate-200`}`,children:[(0,C.jsx)(t,{size:14}),` Financial Statement (`,P.length,`)`]}),F.length>0&&(0,C.jsxs)(`button`,{type:`button`,onClick:()=>O(`installments`),className:`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${D===`installments`?`bg-teal-700 text-white shadow-2xs`:`bg-white text-slate-600 hover:bg-slate-100 border border-slate-200`}`,children:[(0,C.jsx)(m,{size:14}),` Installments Schedule (`,F.length,`)`]}),(0,C.jsxs)(`button`,{type:`button`,onClick:()=>O(`specs`),className:`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${D===`specs`?`bg-teal-700 text-white shadow-2xs`:`bg-white text-slate-600 hover:bg-slate-100 border border-slate-200`}`,children:[(0,C.jsx)(i,{size:14}),` Allottee & Plot Details`]})]}),D===`statement`&&(0,C.jsxs)(`div`,{className:`relative w-full sm:w-72`,children:[(0,C.jsx)(a,{size:15,className:`absolute left-3 top-1/2 -translate-y-1/2 text-slate-400`}),(0,C.jsx)(`input`,{type:`text`,placeholder:`Search transactions or ref #...`,value:k,onChange:e=>A(e.target.value),className:`w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 shadow-2xs`})]})]}),D===`statement`&&(0,C.jsx)(`div`,{className:`overflow-x-auto`,children:(0,C.jsxs)(`table`,{className:`w-full border-collapse text-left text-xs`,children:[(0,C.jsx)(`thead`,{className:`bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none`,children:(0,C.jsxs)(`tr`,{children:[(0,C.jsx)(`th`,{className:`p-3 w-12 text-center`,children:`#`}),(0,C.jsx)(`th`,{className:`p-3 whitespace-nowrap`,children:`Date`}),(0,C.jsx)(`th`,{className:`p-3 min-w-[240px]`,children:`Particulars / Narration`}),(0,C.jsx)(`th`,{className:`p-3 whitespace-nowrap`,children:`Doc / Voucher / Receipt #`}),(0,C.jsx)(`th`,{className:`p-3 whitespace-nowrap`,children:`Payment Mode`}),(0,C.jsx)(`th`,{className:`p-3 text-right whitespace-nowrap`,children:`Debit (₹)`}),(0,C.jsx)(`th`,{className:`p-3 text-right whitespace-nowrap`,children:`Credit (₹)`}),(0,C.jsx)(`th`,{className:`p-3 text-right whitespace-nowrap`,children:`Running Balance (₹)`}),(0,C.jsx)(`th`,{className:`p-3 text-center w-20`,children:`Action`})]})}),(0,C.jsx)(`tbody`,{className:`divide-y divide-slate-100 font-medium`,children:Y.length===0?(0,C.jsx)(`tr`,{children:(0,C.jsx)(`td`,{colSpan:9,className:`p-12 text-center text-slate-400 italic`,children:`No statement transactions match your search filter.`})}):Y.map((e,t)=>{let n=e.debit>0,r=e.credit>0,i=new Date(e.date).toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`});return(0,C.jsxs)(`tr`,{className:`hover:bg-slate-50/80 transition ${n?`bg-rose-50/15`:r?`bg-emerald-50/15`:``}`,children:[(0,C.jsx)(`td`,{className:`p-3 text-center text-slate-400 font-mono text-[11px]`,children:t+1}),(0,C.jsx)(`td`,{className:`p-3 whitespace-nowrap text-slate-700`,children:i}),(0,C.jsxs)(`td`,{className:`p-3`,children:[(0,C.jsx)(`span`,{className:`font-semibold text-slate-900 block`,children:e.particulars}),e.notes&&(0,C.jsx)(`span`,{className:`text-[11px] text-slate-500 block mt-0.5`,children:e.notes})]}),(0,C.jsx)(`td`,{className:`p-3 whitespace-nowrap font-mono font-bold text-slate-800`,children:e.referenceNumber||`-`}),(0,C.jsx)(`td`,{className:`p-3 whitespace-nowrap`,children:(0,C.jsx)(`span`,{className:`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200`,children:e.paymentMode||`N/A`})}),(0,C.jsx)(`td`,{className:`p-3 text-right font-mono font-semibold text-rose-800 whitespace-nowrap`,children:n?`₹${e.debit.toLocaleString(`en-IN`)}`:`-`}),(0,C.jsx)(`td`,{className:`p-3 text-right font-mono font-bold text-emerald-800 whitespace-nowrap`,children:r?`₹${e.credit.toLocaleString(`en-IN`)}`:`-`}),(0,C.jsxs)(`td`,{className:`p-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap`,children:[`₹`,Math.abs(e.balance).toLocaleString(`en-IN`),` `,(0,C.jsx)(`span`,{className:`text-[10px] text-slate-500 font-semibold`,children:e.balance>0?`Dr`:e.balance===0?`Nil`:`Cr`})]}),(0,C.jsx)(`td`,{className:`p-3 text-center`,children:e.receiptId?(0,C.jsxs)(`button`,{type:`button`,onClick:()=>window.open(`/dashboard/plots/receipts/${e.receiptId}`,`_blank`),title:`Print Receipt`,className:`px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1 shadow-2xs`,children:[(0,C.jsx)(s,{size:13}),` Print`]}):(0,C.jsx)(`span`,{className:`text-slate-300`,children:`-`})})]},e._id||t)})}),(0,C.jsx)(`tfoot`,{className:`border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs`,children:(0,C.jsxs)(`tr`,{children:[(0,C.jsx)(`td`,{colSpan:5,className:`p-3.5 uppercase tracking-wide text-slate-700`,children:`Total Account Statement Balance`}),(0,C.jsxs)(`td`,{className:`p-3.5 text-right font-mono text-rose-800`,children:[`₹`,U.toLocaleString(`en-IN`)]}),(0,C.jsxs)(`td`,{className:`p-3.5 text-right font-mono text-emerald-800`,children:[`₹`,W.toLocaleString(`en-IN`)]}),(0,C.jsxs)(`td`,{className:`p-3.5 text-right font-mono text-slate-950`,children:[`₹`,G.toLocaleString(`en-IN`),` `,(0,C.jsx)(`span`,{className:`text-[10px] text-slate-600 font-semibold`,children:G>0?`Dr`:`Nil`})]}),(0,C.jsx)(`td`,{className:`p-3.5`})]})})]})}),D===`installments`&&(0,C.jsx)(`div`,{className:`overflow-x-auto`,children:(0,C.jsxs)(`table`,{className:`w-full border-collapse text-left text-xs`,children:[(0,C.jsx)(`thead`,{className:`bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none`,children:(0,C.jsxs)(`tr`,{children:[(0,C.jsx)(`th`,{className:`p-3 w-16 text-center`,children:`Inst #`}),(0,C.jsx)(`th`,{className:`p-3`,children:`Due Date`}),(0,C.jsx)(`th`,{className:`p-3 text-right`,children:`Principal Due`}),(0,C.jsx)(`th`,{className:`p-3 text-right`,children:`Late Fine`}),(0,C.jsx)(`th`,{className:`p-3 text-right`,children:`Total Due`}),(0,C.jsx)(`th`,{className:`p-3 text-right`,children:`Paid Amount`}),(0,C.jsx)(`th`,{className:`p-3 text-center`,children:`Status`}),(0,C.jsx)(`th`,{className:`p-3`,children:`Paid Date`}),(0,C.jsx)(`th`,{className:`p-3`,children:`Receipt #`})]})}),(0,C.jsx)(`tbody`,{className:`divide-y divide-slate-100 font-medium`,children:F.map((e,t)=>{let r=e.status===`PAID`,i=Number(e.lateFine||0),a=Number(e.dueAmount||0)+i,o=e.dueDate?new Date(e.dueDate).toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`}):`Awaiting DP`;return(0,C.jsxs)(`tr`,{className:`hover:bg-slate-50 transition ${r?`bg-emerald-50/15`:``}`,children:[(0,C.jsx)(`td`,{className:`p-3 text-center font-bold font-mono text-slate-700`,children:e.installmentNumber===0?`Downpmt`:`#${e.installmentNumber}`}),(0,C.jsx)(`td`,{className:`p-3 text-slate-800`,children:o}),(0,C.jsxs)(`td`,{className:`p-3 text-right font-mono text-slate-700`,children:[`₹`,(e.dueAmount||0).toLocaleString(`en-IN`)]}),(0,C.jsx)(`td`,{className:`p-3 text-right font-mono text-rose-700`,children:i>0?`₹${i.toLocaleString(`en-IN`)}`:`-`}),(0,C.jsxs)(`td`,{className:`p-3 text-right font-mono font-semibold text-slate-900`,children:[`₹`,a.toLocaleString(`en-IN`)]}),(0,C.jsxs)(`td`,{className:`p-3 text-right font-mono font-bold text-emerald-700`,children:[`₹`,(e.paidAmount||0).toLocaleString(`en-IN`)]}),(0,C.jsx)(`td`,{className:`p-3 text-center`,children:(0,C.jsx)(`span`,{className:`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${r?`bg-emerald-50 text-emerald-700 border border-emerald-200`:`bg-amber-50 text-amber-700 border border-amber-200`}`,children:e.status})}),(0,C.jsx)(`td`,{className:`p-3 text-slate-600`,children:e.paidDate?new Date(e.paidDate).toLocaleDateString(`en-IN`,{day:`2-digit`,month:`short`,year:`numeric`}):`-`}),(0,C.jsx)(`td`,{className:`p-3 font-mono font-bold text-slate-800`,children:e.receiptNumber?(0,C.jsxs)(`button`,{type:`button`,onClick:()=>{let t=I.find(t=>t.receiptNumber===e.receiptNumber);t&&window.open(`/dashboard/plots/receipts/${t._id}`,`_blank`)},className:`text-teal-700 hover:underline cursor-pointer flex items-center gap-1`,children:[(0,C.jsx)(`span`,{children:e.receiptNumber}),(0,C.jsx)(n,{size:12,className:`text-slate-400`})]}):`-`})]},e._id||t)})}),(0,C.jsx)(`tfoot`,{className:`border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs`,children:(0,C.jsxs)(`tr`,{children:[(0,C.jsx)(`td`,{colSpan:2,className:`p-3.5 uppercase tracking-wide text-slate-700`,children:`Total Installments Due`}),(0,C.jsxs)(`td`,{className:`p-3.5 text-right font-mono`,children:[`₹`,F.reduce((e,t)=>e+(Number(t.dueAmount)||0),0).toLocaleString(`en-IN`)]}),(0,C.jsx)(`td`,{className:`p-3.5 text-right font-mono text-rose-700`,children:K>0?`₹${K.toLocaleString(`en-IN`)}`:`-`}),(0,C.jsxs)(`td`,{className:`p-3.5 text-right font-mono`,children:[`₹`,F.reduce((e,t)=>e+(Number(t.dueAmount)||0)+(Number(t.lateFine)||0),0).toLocaleString(`en-IN`)]}),(0,C.jsxs)(`td`,{className:`p-3.5 text-right font-mono text-emerald-800`,children:[`₹`,F.reduce((e,t)=>e+(Number(t.paidAmount)||0),0).toLocaleString(`en-IN`)]}),(0,C.jsx)(`td`,{colSpan:3,className:`p-3.5`})]})})]})}),D===`specs`&&(0,C.jsxs)(`div`,{className:`p-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs`,children:[(0,C.jsxs)(`div`,{className:`p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3`,children:[(0,C.jsxs)(`div`,{className:`flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-200 pb-2`,children:[(0,C.jsx)(p,{size:16,className:`text-teal-700`}),` Customer / Allottee Master Record`]}),(0,C.jsxs)(`div`,{className:`grid grid-cols-2 gap-3 text-slate-700`,children:[(0,C.jsxs)(`div`,{children:[(0,C.jsx)(`span`,{className:`text-[10px] text-slate-400 block font-bold uppercase`,children:`Customer Name`}),(0,C.jsx)(`span`,{className:`font-bold text-slate-900 text-sm`,children:L.name||M.customerName||`N/A`})]}),(0,C.jsxs)(`div`,{children:[(0,C.jsx)(`span`,{className:`text-[10px] text-slate-400 block font-bold uppercase`,children:`Customer ID`}),(0,C.jsx)(`span`,{className:`font-mono font-bold text-slate-800`,children:L.customerId||L.customerCode||`N/A`})]}),(0,C.jsxs)(`div`,{children:[(0,C.jsx)(`span`,{className:`text-[10px] text-slate-400 block font-bold uppercase`,children:`Father / Husband`}),(0,C.jsx)(`span`,{className:`font-semibold`,children:L.fatherOrHusbandName||`-`})]}),(0,C.jsxs)(`div`,{children:[(0,C.jsx)(`span`,{className:`text-[10px] text-slate-400 block font-bold uppercase`,children:`Mobile Number`}),(0,C.jsx)(`span`,{className:`font-semibold`,children:L.mobile||M.customerMobile||`-`})]}),(0,C.jsxs)(`div`,{className:`col-span-2`,children:[(0,C.jsx)(`span`,{className:`text-[10px] text-slate-400 block font-bold uppercase`,children:`Registered Address`}),(0,C.jsx)(`span`,{className:`font-medium`,children:L.address||`-`})]}),(0,C.jsxs)(`div`,{children:[(0,C.jsx)(`span`,{className:`text-[10px] text-slate-400 block font-bold uppercase`,children:`Nominee Name`}),(0,C.jsx)(`span`,{className:`font-semibold`,children:L.nominee?.name||L.nomineeName||`-`})]}),(0,C.jsxs)(`div`,{children:[(0,C.jsx)(`span`,{className:`text-[10px] text-slate-400 block font-bold uppercase`,children:`Nominee Relation`}),(0,C.jsx)(`span`,{className:`font-semibold`,children:L.nominee?.relation||L.nomineeRelation||`-`})]})]})]}),(0,C.jsxs)(`div`,{className:`p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3`,children:[(0,C.jsxs)(`div`,{className:`flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-200 pb-2`,children:[(0,C.jsx)(f,{size:16,className:`text-teal-700`}),` Plot Specifications & Boundaries`]}),(0,C.jsxs)(`div`,{className:`grid grid-cols-2 gap-3 text-slate-700`,children:[(0,C.jsxs)(`div`,{children:[(0,C.jsx)(`span`,{className:`text-[10px] text-slate-400 block font-bold uppercase`,children:`Plot Number`}),(0,C.jsxs)(`span`,{className:`font-bold text-teal-800 text-sm`,children:[`Plot #`,R.plotNumber||`N/A`]})]}),(0,C.jsxs)(`div`,{children:[(0,C.jsx)(`span`,{className:`text-[10px] text-slate-400 block font-bold uppercase`,children:`Allocated Area`}),(0,C.jsxs)(`span`,{className:`font-bold text-slate-900`,children:[q,` Sq Ft (`,R.dismil||(q>0?(q/435.6).toFixed(2):0),` Dismil)`]})]}),(0,C.jsxs)(`div`,{children:[(0,C.jsx)(`span`,{className:`text-[10px] text-slate-400 block font-bold uppercase`,children:`Project Layout`}),(0,C.jsx)(`span`,{className:`font-semibold`,children:z.projectName||R.seriesId?.seriesName||`Standard`})]}),(0,C.jsxs)(`div`,{children:[(0,C.jsx)(`span`,{className:`text-[10px] text-slate-400 block font-bold uppercase`,children:`Sponsor / Referral`}),(0,C.jsx)(`span`,{className:`font-semibold`,children:B.name||`Direct / Company`})]}),(0,C.jsxs)(`div`,{className:`col-span-2 pt-2 border-t border-slate-200`,children:[(0,C.jsx)(`span`,{className:`text-[10px] text-slate-400 block font-bold uppercase mb-1`,children:`Plot Dimensions (North / South / East / West)`}),(0,C.jsxs)(`div`,{className:`grid grid-cols-4 gap-2 text-center font-mono text-xs`,children:[(0,C.jsxs)(`div`,{className:`bg-white p-2 rounded-lg border border-slate-200 font-bold`,children:[`N: `,R.dimensions?.north||`-`,` ft`]}),(0,C.jsxs)(`div`,{className:`bg-white p-2 rounded-lg border border-slate-200 font-bold`,children:[`S: `,R.dimensions?.south||`-`,` ft`]}),(0,C.jsxs)(`div`,{className:`bg-white p-2 rounded-lg border border-slate-200 font-bold`,children:[`E: `,R.dimensions?.east||`-`,` ft`]}),(0,C.jsxs)(`div`,{className:`bg-white p-2 rounded-lg border border-slate-200 font-bold`,children:[`W: `,R.dimensions?.west||`-`,` ft`]})]})]})]})]})]})]})]})};export{w as default};