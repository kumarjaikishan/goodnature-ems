import{r as e}from"./rolldown-runtime-hePW80VL.js";import{B as t,Wn as n,Xn as r,t as i}from"./vendor-react-CA3ZLqa8.js";import{M as a,j as o}from"./index-Dnha9qjG.js";import{t as s}from"./toast-Ssafpnkn.js";import{t as c}from"./axios-Decy9ZM8.js";import{t as l}from"./PlotAgreementEnglish-plB3cpKh.js";var u=e(r(),1),d=i(),f=e=>{if(!e||e===0)return`Zero Rupees Only`;let t=[``,`One`,`Two`,`Three`,`Four`,`Five`,`Six`,`Seven`,`Eight`,`Nine`,`Ten`,`Eleven`,`Twelve`,`Thirteen`,`Fourteen`,`Fifteen`,`Sixteen`,`Seventeen`,`Eighteen`,`Nineteen`],n=[``,``,`Twenty`,`Thirty`,`Forty`,`Fifty`,`Sixty`,`Seventy`,`Eighty`,`Ninety`],r=e=>{if(e===0)return``;let r=``;return e>=100&&(r+=t[Math.floor(e/100)]+` Hundred `,e%=100),e>0&&(r&&(r+=`and `),r+=e<20?t[e]:n[Math.floor(e/10)]+(e%10?`-`+t[e%10]:``)),r.trim()},i=e=>{if(e===0)return``;let t=``;return e>=1e7&&(t+=i(Math.floor(e/1e7))+` Crore `,e%=1e7),e>=1e5&&(t+=r(Math.floor(e/1e5))+` Lakh `,e%=1e5),e>=1e3&&(t+=r(Math.floor(e/1e3))+` Thousand `,e%=1e3),e>0&&(t+=r(e)),t.trim()},a=Math.floor(e),o=Math.round((e-a)*100),s=i(a);if(o>0){let e=o<20?t[o]:n[Math.floor(o/10)]+(o%10?`-`+t[o%10]:``);s+=` and `+e+` Paise`}return s?`${s} Rupees Only`:`Zero Rupees Only`},p=()=>{let{id:e}=a(),r=o(),[i,p]=(0,u.useState)(null),[m,h]=(0,u.useState)([]),[g,_]=(0,u.useState)([]),[v,y]=(0,u.useState)(!0);(0,u.useEffect)(()=>{e&&Promise.all([c.get(`/plots/bookings/${e}`),c.get(`/plots/bookings/${e}/installments`).catch(()=>({data:{data:[]}})),c.get(`/plots/receipts/list?bookingId=${e}`).catch(()=>({data:{data:[]}}))]).then(([e,t,n])=>{p(e.data.data),h(t.data.data||[]),_(n.data?.data||[]),y(!1)}).catch(()=>{c.get(`/plots/product-bookings/${e}`).then(e=>{let t=e.data?.data;p(t),h(t?.installments||[]),_(t?.collections||[]),y(!1)}).catch(e=>{console.error(`Failed to load agreement booking details:`,e),s.error(`Failed to load agreement details`),y(!1)})})},[e]),(0,u.useEffect)(()=>{if(i){let e=(i.customerId||{}).name||i.customerName||`Customer`,t=document.title;return document.title=`${e} Agreement`,()=>{document.title=t}}},[i]);let b=()=>{window.print()};if(v)return(0,d.jsx)(`div`,{className:`flex items-center justify-center min-h-screen bg-slate-50`,children:(0,d.jsx)(`div`,{className:`w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin`})});if(!i)return(0,d.jsxs)(`div`,{className:`flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4`,children:[(0,d.jsx)(`p`,{className:`text-sm font-bold text-slate-500`,children:`Booking details not found or permission denied.`}),(0,d.jsx)(`button`,{onClick:()=>r(`/dashboard/plots/reports`),className:`px-4 py-2 bg-slate-800 text-white rounded text-xs font-bold`,children:`Go Back`})]});let x=i.customerId||{},S=i.dimensionsSnapshot||i.productId?.dimensions||{},C=Number(i.plotId?.plotSize||i.plotId?.area||i.totalAreaSqFt||S.totalAreaSqFt||i.productId?.areaSqFt||0),w=i.landSourcing&&i.landSourcing.length>0?i.landSourcing[0]:{},T=i.landSourcing&&i.landSourcing.length>0?Array.from(new Set(i.landSourcing.map(e=>e.khataNumber||e.agreementId?.khataNumber).filter(Boolean))).join(`, `):``,E=i.landSourcing&&i.landSourcing.length>0?Array.from(new Set(i.landSourcing.map(e=>e.khesraNumber||e.agreementId?.khesraNumber).filter(Boolean))).join(`, `):``,D=w.mauja||w.agreementId?.mauja||i.mauza||`Samsera`,O=i.plotId||{plotNumber:S.dimensionLabel||i.productId?.productCode||i.productId?.productName||i.planName||i.bookingNumber||`N/A`,plotSize:C,area:C,areaSqFt:C,dimensions:S,khataNo:T||w.khataNumber||w.agreementId?.khataNumber||`56`,khesraNo:E||w.khesraNumber||w.agreementId?.khesraNumber||`358`,mauza:D,city:i.projectId?.location?.city||`Rajgir`,district:i.projectId?.location?.district||`Nalanda`,state:i.projectId?.location?.state||`Bihar`},k=i.plotId?.seriesId||{seriesName:i.projectName||i.projectId?.name||`Nalanda New City`,projectArea:`19.5 Acres Approx.`,city:i.projectId?.location?.city||`Rajgir`,district:i.projectId?.location?.district||`Nalanda`,state:i.projectId?.location?.state||`Bihar`,khataNo:O.khataNo},A=e=>{if(e>3&&e<21)return`${e}th`;switch(e%10){case 1:return`${e}st`;case 2:return`${e}nd`;case 3:return`${e}rd`;default:return`${e}th`}},j=Math.max(0,Number(i.plotValue||i.totalAmount||0)-Number(i.discount||0)),M=i.scheme===`FULL_PAYMENT`||i.paymentType===`FULL_PAYMENT`,N=i.totalPaid===void 0?Math.max(0,j-Number(i.remainingAmount||0)):Number(i.totalPaid||0),P=(m||[]).find(e=>e.installmentNumber===0),F=M?j:i.downPayment||i.downpaymentAmount||i.bookingAmount||P?.dueAmount||(i.downpaymentRate&&C>0?i.downpaymentRate*C:Math.round(j*.4)),I=N>=F-1,L=null;if(i.agreementDate)L=new Date(i.agreementDate);else{let e=(g||[]).filter(e=>(e.status||`APPROVED`).toUpperCase()!==`REJECTED`).sort((e,t)=>new Date(e.paymentDate||e.createdAt)-new Date(t.paymentDate||t.createdAt)),t=0;for(let n of e)if(t+=Number(n.amount||0),t>=F-1){L=new Date(n.paymentDate||n.createdAt);break}if(!L){if(P&&P.paidDate)L=new Date(P.paidDate);else if(e.length>0){let t=e[e.length-1];L=new Date(t.paymentDate||t.createdAt)}else L=new Date(i.bookingDate||i.createdAt)}}let R=L.getDate(),z=L.toLocaleDateString(`en-IN`,{month:`long`}),B=L.getFullYear(),V=`${A(R)} Day of ${z} ${B}`;if(!I)return(0,d.jsx)(`div`,{className:`flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6`,children:(0,d.jsxs)(`div`,{className:`bg-white border border-amber-200 shadow-xl rounded-2xl p-8 max-w-lg w-full text-center space-y-4`,children:[(0,d.jsx)(`div`,{className:`w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold`,children:`⚠️`}),(0,d.jsx)(`h2`,{className:`text-xl font-black text-slate-800`,children:`Agreement Locked`}),(0,d.jsxs)(`p`,{className:`text-xs text-slate-600 leading-relaxed`,children:[`The legal plot agreement for Booking `,(0,d.jsxs)(`strong`,{className:`font-mono text-slate-900`,children:[`#`,i.bookingNumber]}),` (Plot `,(0,d.jsxs)(`strong`,{className:`text-slate-900`,children:[`#`,O.plotNumber]}),`) can only be generated and printed `,(0,d.jsx)(`strong`,{className:`text-emerald-700`,children:`after the downpayment is fully completed`}),`.`]}),(0,d.jsxs)(`div`,{className:`bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2 text-left`,children:[(0,d.jsxs)(`div`,{className:`flex justify-between`,children:[(0,d.jsx)(`span`,{className:`text-slate-500`,children:`Scheme:`}),(0,d.jsx)(`span`,{className:`font-bold text-slate-800`,children:M?`One Time (Full Payment)`:`EMI (Monthly Installment)`})]}),(0,d.jsxs)(`div`,{className:`flex justify-between`,children:[(0,d.jsx)(`span`,{className:`text-slate-500`,children:`Downpayment Required:`}),(0,d.jsxs)(`span`,{className:`font-bold text-amber-700`,children:[`₹`,F.toLocaleString(`en-IN`)]})]}),(0,d.jsxs)(`div`,{className:`flex justify-between`,children:[(0,d.jsx)(`span`,{className:`text-slate-500`,children:`Amount Paid So Far:`}),(0,d.jsxs)(`span`,{className:`font-bold text-slate-800`,children:[`₹`,N.toLocaleString(`en-IN`)]})]}),(0,d.jsxs)(`div`,{className:`flex justify-between border-t border-slate-200 pt-2`,children:[(0,d.jsx)(`span`,{className:`text-slate-500`,children:`Pending Downpayment:`}),(0,d.jsxs)(`span`,{className:`font-bold text-rose-600`,children:[`₹`,Math.max(0,F-N).toLocaleString(`en-IN`)]})]})]}),(0,d.jsxs)(`div`,{className:`flex items-center justify-center gap-3 pt-2`,children:[(0,d.jsx)(`button`,{onClick:()=>r(-1),className:`px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer`,children:`Back`}),(0,d.jsx)(`button`,{onClick:()=>r(i.paymentType?`/dashboard/plots/collections/products/add?bookingId=${i._id}`:`/dashboard/plots/collections/downpayment/add?bookingId=${i._id}`),className:`px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer`,children:`Collect Downpayment`})]})]})});let H=x.name||i.customerName||`Allottee`,U=F,W=Math.max(0,j-U),G=(m||[]).filter(e=>e.installmentNumber>0),K=G.length||i.installmentCount||i.tenureMonths||+!!M,q=i.monthlyEmi||i.installmentAmount||i.emiAmount||G[0]?.dueAmount||(K>0?Math.round(W/K):0),J=G.length>0?G[G.length-1]:null,Y=J?J.dueAmount||J.principalDue:q,X=q===Y,Z=G.length>1?G.filter(e=>(e.dueAmount||e.principalDue)===q).length:K-+!X,Q=q*5e-4,$={booking:{...i,scheme:M?`FULL_PAYMENT`:`INSTALLMENT`,paymentMode:i.collections?.[0]?.paymentMode||i.paymentMode||`WIRE TRANSFER / CHEQUE / DD`,agreementNumber:i.agreementNumber||i.bookingNumber,plotNumber:O.plotNumber,plotAreaSqFt:O.plotSize,landSourcing:i.landSourcing||[]},customer:x,plot:O,series:k,formattedDate:V,netPlotValue:j,customerName:H,downpaymentAmount:U,downpaymentRequired:F,paidAmount:N,remainingBalanceAmount:W,installmentCount:K,standardEmiAmt:q,lastEmiAmt:Y,isEmiUniform:X,regularEmiCount:Z,dailyLateFineAmt:Q,numberToWords:f};return(0,d.jsxs)(`div`,{className:`min-h-screen bg-slate-100 p-4 sm:p-8 flex flex-col items-center select-none print:p-0 print:bg-white print:min-h-0 print:h-auto print:block`,children:[(0,d.jsx)(`style`,{children:`
        @media screen {
          .agreement-print-container {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .agreement-page {
            width: 210mm;
            min-height: 297mm;
            margin-bottom: 24px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border: 1px solid #e2e8f0;
            background: white;
            padding: 10mm 14mm 10mm 14mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }

          html, body, #root {
            background: white !important;
            color: black !important;
            font-family: Arial, 'Segoe UI', Inter, sans-serif !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            overflow-x: visible !important;
            overflow-y: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            position: static !important;
          }

          div {
            max-height: none !important;
          }

          .no-print, nav, header, aside, .navbar, .sidebar {
            display: none !important;
          }

          .agreement-print-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }

          .agreement-page {
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            padding: 8mm 14mm 8mm 14mm !important;
            box-sizing: border-box !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            overflow: hidden !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
          }

          .agreement-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}),(0,d.jsxs)(`div`,{className:`w-full max-w-[210mm] flex items-center justify-between gap-4 mb-6 print:hidden`,children:[(0,d.jsxs)(`button`,{onClick:()=>r(-1),className:`flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 transition cursor-pointer shadow-sm`,children:[(0,d.jsx)(n,{size:16}),` Back`]}),(0,d.jsxs)(`button`,{onClick:b,className:`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer border-none`,children:[(0,d.jsx)(t,{size:16}),` Print / Save PDF (`,H,` Agreement)`]})]}),(0,d.jsx)(`div`,{className:`agreement-print-container w-full`,children:(0,d.jsx)(l,{...$})}),(0,d.jsx)(`div`,{className:`w-full max-w-[210mm] flex items-center justify-center gap-4 mt-8 mb-4 print:hidden`,children:(0,d.jsxs)(`button`,{onClick:b,className:`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer border-none`,children:[(0,d.jsx)(t,{size:16}),` Print / Save PDF (`,H,` Agreement)`]})})]})};export{p as default};