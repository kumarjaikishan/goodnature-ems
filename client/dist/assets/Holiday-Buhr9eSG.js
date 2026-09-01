import{o as e,t}from"./react-0T9Avz-T.js";import{t as n}from"./toast-BhJwdb_B.js";import{ht as r,mt as i,pt as a}from"./dateViewRenderers-DEpELW7F.js";import{t as o}from"./jsx-runtime-BRYeo4JD.js";import{a as s,d as c,l,n as u,t as d}from"./TextField-Db4sAk04.js";import{t as f}from"./Button-DGpvxI1D.js";import{t as p}from"./DatePicker-D6VVmxgn.js";import{t as m}from"./MenuItem-DV6onWSN.js";import{t as h}from"./createLucideIcon-C0ROPDb9.js";import{t as ee}from"./DataTable-Cd7UT2rK.js";import{t as te}from"./calendar-8Ev014iE.js";import{t as ne}from"./circle-alert-BU_f5Xsf.js";import{t as re}from"./circle-plus-BliCxSLk.js";import{t as g}from"./file-spreadsheet-90IxQAVy.js";import{t as ie}from"./pen-CwKEiVip.js";import{g as ae,i as _,o as v,r as oe,tt as se,u as ce,y}from"./index-DzhQMYvB.js";import{i as le}from"./attandencehelper-BuSAnEf1.js";import{t as ue}from"./isSameOrBefore-CqeNLcw_.js";import{t as b}from"./Modalbox-y1_BSJQH.js";import{n as de,t as fe}from"./excelHelper-kT_wPXYO.js";import{t as pe}from"./react-to-print-C5x4_d1Z.js";import{t as me}from"./holidayCalander-DvehZGvU.js";var he=h(`refresh-cw`,[[`path`,{d:`M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8`,key:`v9h5vc`}],[`path`,{d:`M21 3v5h-5`,key:`1q7to0`}],[`path`,{d:`M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16`,key:`3uifl3`}],[`path`,{d:`M8 16H3v5`,key:`1cv678`}]]),x=h(`upload`,[[`path`,{d:`M12 3v12`,key:`1x0j5s`}],[`path`,{d:`m17 8-5-5-5 5`,key:`7q97r8`}],[`path`,{d:`M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4`,key:`ih7n3h`}]]),S=e(r(),1),C=e(ue(),1),w=e(t(),1),T=e(_(),1),E=o(),D=w.forwardRef(({holidays:e,company:t},n)=>{let r=t?.logo?`/api/logo/${t.logo}`:null;return(0,E.jsx)(`div`,{style:{display:`none`},children:(0,E.jsxs)(`div`,{ref:n,className:`print-container`,children:[(0,E.jsx)(`style`,{children:`
          @media print {
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              -webkit-print-color-adjust: exact;
            }
            .print-container {
              position: relative;
              font-family: 'Inter', sans-serif;
              color: #333;
              background: white;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 80px;
              color: rgba(0, 0, 0, 0.03);
              z-index: 0;
              pointer-events: none;
              white-space: nowrap;
              text-transform: uppercase;
              font-weight: bold;
              width: 100%;
              text-align: center;
            }
            .watermark-logo {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 400px;
              opacity: 0.04;
              z-index: 0;
              pointer-events: none;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #115e59;
              padding-bottom: 15px;
              margin-bottom: 30px;
            }
            .company-info {
              text-align: right;
              flex: 1;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #115e59;
              margin: 0;
            }
            .company-address {
              font-size: 12px;
              color: #666;
              margin: 5px 0 0;
              white-space: pre-line;
            }
            .logo {
              max-height: 70px;
              max-width: 200px;
              object-fit: contain;
            }
            .title-section {
              text-align: center;
              margin-bottom: 20px;
            }
            .document-title {
              font-size: 20px;
              font-weight: bold;
              text-decoration: underline;
              text-transform: uppercase;
            }
            .holiday-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              position: relative;
              z-index: 1;
            }
            .holiday-table th {
              background-color: #f0fdfa;
              color: #115e59;
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
              font-size: 13px;
            }
            .holiday-table td {
              border: 1px solid #ddd;
              padding: 10px;
              font-size: 12px;
            }
            .holiday-table tr:nth-child(even) {
              background-color: #fafafa;
            }
            .footer {
              margin-top: 40px;
              border-top: 1px solid #eee;
              padding-top: 10px;
              font-style: italic;
              font-size: 10px;
              color: #888;
              position: relative;
              z-index: 1;
            }
            .print-date {
              text-align: right;
              font-size: 10px;
              margin-top: 5px;
            }
          }
        `}),(0,E.jsxs)(`div`,{className:`header`,children:[r&&(0,E.jsx)(`img`,{src:r,alt:`Logo`,className:`logo`}),(0,E.jsxs)(`div`,{className:`company-info`,children:[(0,E.jsx)(`h1`,{className:`company-name`,children:t?.name||`Company Name`}),(0,E.jsxs)(`p`,{className:`company-address`,children:[t?.address||`Company Address`,(0,E.jsx)(`br`,{}),t?.contact||t?.email||``]})]})]}),(0,E.jsx)(`div`,{className:`title-section`,children:(0,E.jsxs)(`h2`,{className:`document-title`,children:[`Official Holiday List - `,(0,T.default)().year()]})}),r?(0,E.jsx)(`img`,{src:r,alt:``,className:`watermark-logo`}):(0,E.jsx)(`div`,{className:`watermark`,children:t?.name||`OFFICIAL`}),(0,E.jsxs)(`table`,{className:`holiday-table`,children:[(0,E.jsx)(`thead`,{children:(0,E.jsxs)(`tr`,{children:[(0,E.jsx)(`th`,{style:{width:`50px`},children:`S.No`}),(0,E.jsx)(`th`,{children:`Holiday Name`}),(0,E.jsx)(`th`,{style:{width:`120px`},children:`From`}),(0,E.jsx)(`th`,{style:{width:`120px`},children:`To`}),(0,E.jsx)(`th`,{style:{width:`100px`},children:`Type`}),(0,E.jsx)(`th`,{children:`Description`})]})}),(0,E.jsx)(`tbody`,{children:e.map((e,t)=>(0,E.jsxs)(`tr`,{children:[(0,E.jsx)(`td`,{style:{textAlign:`center`},children:t+1}),(0,E.jsx)(`td`,{style:{fontWeight:`bold`},children:e.name}),(0,E.jsx)(`td`,{children:(0,T.default)(e.From).format(`DD MMM, YYYY`)}),(0,E.jsx)(`td`,{children:(0,T.default)(e.till).format(`DD MMM, YYYY`)}),(0,E.jsx)(`td`,{children:e.type}),(0,E.jsx)(`td`,{children:e.description||`-`})]},t))})]}),(0,E.jsxs)(`div`,{className:`footer`,children:[(0,E.jsx)(`p`,{children:`Notes: Holidays are subject to change as per management decision. Please refer to official notices for any updates.`}),(0,E.jsxs)(`div`,{className:`print-date`,children:[`Generated on: `,(0,T.default)().format(`DD/MM/YYYY HH:mm`)]})]})]})})});D.displayName=`HolidayPrintable`,T.default.extend(C.default),T.default.extend(S.default);var O=[`DD/MM/YYYY`,`DD-MM-YYYY`,`YYYY-MM-DD`,`MM/DD/YYYY`,`D/M/YYYY`,`D-M-YYYY`,`YYYY/MM/DD`],k=e=>{if(!e)return null;if(e instanceof Date)return(0,T.default)(e);let t=String(e).trim();for(let e of O){let n=(0,T.default)(t,e,!0);if(n.isValid())return n}let n=(0,T.default)(t);return n.isValid()?n:null},A=()=>{let[e,t]=(0,w.useState)({name:``,type:``,fromDate:null,toDate:null,description:``}),[r,o]=(0,w.useState)(null),[h,_]=(0,w.useState)([]),[ue,S]=(0,w.useState)([]),[C,O]=(0,w.useState)(!1),{company:A}=se(e=>e.user),[_e,ve]=(0,w.useState)([1]),[j,M]=(0,w.useState)(`All`),[N,P]=(0,w.useState)(`All`),[F,I]=(0,w.useState)(`All`),L=(0,w.useRef)(null),R=(0,w.useRef)(null),z=(0,w.useRef)(null),[ye,B]=(0,w.useState)(!1),[be,V]=(0,w.useState)(!1),[xe,H]=(0,w.useState)(!1),[U,W]=(0,w.useState)([]),[Se,G]=(0,w.useState)(!1),[K,q]=(0,w.useState)(null),[J,Y]=(0,w.useState)(null),Ce=pe({contentRef:z,documentTitle:`Holiday_List_${(0,T.default)().year()}`}),we=e=>{q(e.currentTarget)},X=()=>{q(null)},Te=e=>{Y(e.currentTarget)},Z=()=>{Y(null)};(0,w.useEffect)(()=>{ve(A?.weeklyOffs||[1])},[A]);let Ee=()=>{e.fromDate&&!e.toDate&&(0,T.default)(e.fromDate).isValid()&&t(t=>({...t,toDate:e.fromDate}))};(0,w.useEffect)(()=>{Q()},[]);let Q=async()=>{try{let e=(await v({url:`getholidays`})).holidays,t=[];e.forEach(e=>{let n=(0,T.default)(e.fromDate),r=e.toDate?(0,T.default)(e.toDate):n;for(;n.isSameOrBefore(r,`day`);)t.push({date:n.format(`YYYY-MM-DD`),name:e.name}),n=n.add(1,`day`)});let n=e.map(e=>({name:e.name,From:e.fromDate,till:e.toDate,type:e.type,description:e?.description,action:(0,E.jsxs)(`div`,{className:`action flex gap-2.5 items-center`,children:[(0,E.jsx)(`span`,{className:`edit text-teal-600 hover:text-teal-700 cursor-pointer p-1`,title:`Edit`,onClick:()=>De(e),children:(0,E.jsx)(ie,{size:16})}),(0,E.jsx)(`span`,{className:`delete text-red-500 hover:text-red-600 cursor-pointer p-1`,title:`Delete`,onClick:()=>Oe(e._id),children:(0,E.jsx)(ce,{size:16})})]})}));(0,w.startTransition)(()=>{S(t),_(n)})}catch(e){console.error(`Error fetching holidays:`,e)}},De=e=>{O(!0),V(!0),o(e._id),t({name:e.name,type:e.type,fromDate:(0,T.default)(e.fromDate),toDate:(0,T.default)(e.toDate),description:e.description||``}),setTimeout(()=>{L.current?.focus()},0)},Oe=async e=>{oe({title:`Are you sure you want to Delete?`,icon:`warning`,buttons:!0,dangerMode:!0}).then(async t=>{if(t)try{let t=await v({url:`deleteholiday`,method:`POST`,body:{id:e}});n.success(t.message),Q()}catch(e){console.error(e)}})},ke=async()=>{if($.length===0){n.info(`No holidays to export.`);return}let e=$.map((e,t)=>({"S.No":t+1,Name:e.name,"From Date":(0,T.default)(e.From).format(`DD/MM/YYYY`),"To Date":(0,T.default)(e.till).format(`DD/MM/YYYY`),Type:e.type||``,Description:e.description||``}));try{await fe(e,`Holidays`,`holidays_${(0,T.default)().format(`YYYY-MM-DD`)}.xlsx`)}catch{n.error(`Failed to export Excel file`)}},Ae=async e=>{let t=e.target.files[0];if(t){try{let e=(await de(t,{cellDates:!0})).map(e=>{let t=e[`From Date`]??e.fromDate??e.from_date??``,n=e[`To Date`]??e.toDate??e.to_date??t,r=k(t),i=k(n)||r;return{name:e.Name||e.name||``,fromDate:r?r.format(`YYYY-MM-DD`):``,toDate:i?i.format(`YYYY-MM-DD`):``,type:e.Type||e.type||`Other`,description:e.Description||e.description||``}}).filter(e=>e.name&&e.fromDate);if(e.length===0){n.error(`No valid rows found. Make sure the file has Name, From Date, To Date, Type columns.`);return}W(e),H(!0)}catch{n.error(`Failed to read the file. Please use a valid xlsx/csv format.`)}e.target.value=``}},je=async()=>{if(U.length!==0){G(!0);try{let e=await v({url:`bulkImportHolidays`,method:`POST`,body:{holidays:U}});n.success(e.message),H(!1),W([]),Q()}catch(e){n.error(e.message||`Import failed`)}finally{G(!1)}}},Me=()=>{let e=XLSX.utils.json_to_sheet([{Name:`Saraswati Puja`,"From Date":`02-02-2026`,"To Date":`02-02-2026`,Type:`Religious`,Description:`Basant Panchami - Goddess of knowledge`},{Name:`Holi`,"From Date":`14-03-2026`,"To Date":`14-03-2026`,Type:`Religious`,Description:`Festival of colours`},{Name:`Diwali`,"From Date":`20-10-2026`,"To Date":`20-10-2026`,Type:`Religious`,Description:`Festival of lights`},{Name:`Chhath Puja`,"From Date":`28-10-2026`,"To Date":`28-10-2026`,Type:`Religious`,Description:`Chhath Puja - worship of the Sun God`}]);e[`!cols`]=[{wch:20},{wch:14},{wch:14},{wch:12},{wch:30}];let t=XLSX.utils.book_new();XLSX.utils.book_append_sheet(t,e,`Holidays`),XLSX.writeFile(t,`holidays_sample.xlsx`)},Ne=async i=>{i.preventDefault();try{let i=e.fromDate?(0,T.default)(e.fromDate).format(`YYYY-MM-DD`):null,a=e.toDate?(0,T.default)(e.toDate).format(`YYYY-MM-DD`):null,o=C?`updateholiday`:`addholiday`,s={...e,fromDate:i,toDate:a,...C?{holidayId:r}:{}},c=await v({url:o,method:`POST`,body:s});n.success(c.message),t({name:``,type:`Public`,fromDate:null,toDate:null,description:``}),O(!1),V(!1),Q()}catch(e){console.error(`Error saving holiday:`,e)}},$=(0,w.useMemo)(()=>h.filter(e=>{let t=(0,T.default)(e.From),n=j===`All`||t.year().toString()===j.toString(),r=N===`All`||t.month()===parseInt(N),i=F===`All`||e.type===F;return n&&r&&i}),[h,j,N,F]),Pe=[`Jan`,`Feb`,`Mar`,`Apr`,`May`,`Jun`,`Jul`,`Aug`,`Sep`,`Oct`,`Nov`,`Dec`],Fe=(0,w.useMemo)(()=>{if(!h||h.length===0)return[];let e=new Set;return h.forEach(t=>{let n=(0,T.default)(t.From).year();n&&e.add(n)}),Array.from(e).sort((e,t)=>t-e)},[h]);return(0,E.jsx)(`div`,{className:`max-w-7xl mx-auto`,children:(0,E.jsxs)(a,{dateAdapter:i,children:[(0,E.jsxs)(`div`,{className:`flex flex-wrap  justify-between items-center gap-3 w-full my-4`,children:[(0,E.jsxs)(`div`,{className:`flex gap-2 flex-wrap justify-between w-full md:w-fit`,children:[(0,E.jsxs)(c,{size:`small`,className:`w-[47%] md:w-[120px]`,children:[(0,E.jsx)(l,{children:`Year`}),(0,E.jsxs)(u,{label:`Year`,value:j,onChange:e=>M(e.target.value),children:[(0,E.jsx)(m,{value:`All`,children:`All`}),Fe.map(e=>(0,E.jsx)(m,{value:e,children:e},e))]})]}),(0,E.jsxs)(c,{size:`small`,className:`w-[47%] md:w-[120px]`,children:[(0,E.jsx)(l,{children:`Month`}),(0,E.jsxs)(u,{label:`Month`,value:N,onChange:e=>P(e.target.value),children:[(0,E.jsx)(m,{value:`All`,children:`All`}),Pe.map((e,t)=>(0,E.jsx)(m,{value:t,children:e},e))]})]}),(0,E.jsxs)(c,{size:`small`,className:`w-[47%] md:w-[150px]`,children:[(0,E.jsx)(l,{children:`Type`}),(0,E.jsxs)(u,{label:`Filter by Type`,value:F,onChange:e=>I(e.target.value),children:[(0,E.jsx)(m,{value:`All`,children:`All`}),[...new Set(h.map(e=>e.type))].map(e=>(0,E.jsx)(m,{value:e,children:e},e))]})]}),(0,E.jsx)(f,{variant:`outlined`,color:`secondary`,className:`w-[47%] md:w-fit`,startIcon:(0,E.jsx)(he,{size:16}),onClick:()=>{M(`All`),P(`All`),I(`All`)},children:`Reset`})]}),(0,E.jsxs)(`div`,{className:`flex flex-col sm:flex-row gap-2 w-full md:w-fit`,children:[(0,E.jsx)(f,{startIcon:(0,E.jsx)(te,{size:16}),variant:`outlined`,onClick:()=>B(!0),children:`Calendar`}),(0,E.jsx)(f,{startIcon:(0,E.jsx)(g,{size:16}),endIcon:(0,E.jsx)(y,{size:16}),variant:`outlined`,color:`primary`,onClick:we,children:`Export`}),(0,E.jsxs)(s,{anchorEl:K,open:!!K,onClose:X,children:[(0,E.jsxs)(m,{onClick:()=>{ke(),X()},children:[(0,E.jsx)(g,{size:16,style:{marginRight:`8px`,color:`#16a34a`}}),` Excel File`]}),(0,E.jsxs)(m,{onClick:()=>{Ce(),X()},children:[(0,E.jsx)(ae,{size:16,style:{marginRight:`8px`,color:`#dc2626`}}),` PDF List (Official)`]})]}),(0,E.jsx)(f,{startIcon:(0,E.jsx)(x,{size:16}),endIcon:(0,E.jsx)(y,{size:16}),variant:`outlined`,color:`inherit`,onClick:Te,children:`Import`}),(0,E.jsxs)(s,{anchorEl:J,open:!!J,onClose:Z,children:[(0,E.jsxs)(m,{onClick:()=>{R.current?.click(),Z()},children:[(0,E.jsx)(x,{size:16,style:{marginRight:`8px`}}),` Upload Excel/CSV`]}),(0,E.jsxs)(m,{onClick:()=>{Me(),Z()},children:[(0,E.jsx)(g,{size:16,style:{marginRight:`8px`,color:`#0ea5e9`}}),` Download Sample`]})]}),(0,E.jsx)(`input`,{ref:R,type:`file`,accept:`.xlsx,.xls,.csv`,style:{display:`none`},onChange:Ae}),(0,E.jsx)(f,{startIcon:(0,E.jsx)(re,{size:16}),className:`w-full md:w-fit`,variant:`contained`,onClick:()=>V(!0),children:`Add Holiday`})]})]}),(0,E.jsx)(`div`,{className:`capitalize`,children:(0,E.jsx)(ee,{columns:ge,data:$,pagination:!0,customStyles:le(),noDataComponent:(0,E.jsxs)(`div`,{className:`flex items-center gap-2 py-6 text-center text-gray-600 text-sm`,children:[(0,E.jsx)(ne,{size:18,className:`text-amber-500`}),` No records found.`]}),highlightOnHover:!0})}),(0,E.jsx)(b,{open:ye,onClose:()=>B(!1),children:(0,E.jsx)(`div`,{className:`membermodal w-[400px]`,children:(0,E.jsx)(me,{highlightedDates:ue.map(e=>({date:(0,T.default)(e.date),name:e.name})),weeklyOffs:_e})})}),(0,E.jsx)(b,{open:xe,onClose:()=>H(!1),children:(0,E.jsx)(`div`,{className:`membermodal w-[700px]`,children:(0,E.jsxs)(`div`,{className:`whole`,children:[(0,E.jsxs)(`div`,{className:`modalhead`,children:[`Import Preview (`,U.length,` records)`]}),(0,E.jsxs)(`div`,{className:`modalcontent overflow-auto max-h-[400px]`,children:[(0,E.jsx)(`p`,{className:`text-sm text-gray-500 mb-2`,children:`Review the parsed holidays below before importing.`}),(0,E.jsxs)(`table`,{className:`w-full text-sm border-collapse`,children:[(0,E.jsx)(`thead`,{children:(0,E.jsxs)(`tr`,{className:`bg-gray-100 text-left`,children:[(0,E.jsx)(`th`,{className:`p-2 border`,children:`#`}),(0,E.jsx)(`th`,{className:`p-2 border`,children:`Name`}),(0,E.jsx)(`th`,{className:`p-2 border`,children:`From`}),(0,E.jsx)(`th`,{className:`p-2 border`,children:`To`}),(0,E.jsx)(`th`,{className:`p-2 border`,children:`Type`}),(0,E.jsx)(`th`,{className:`p-2 border`,children:`Description`})]})}),(0,E.jsx)(`tbody`,{children:U.map((e,t)=>(0,E.jsxs)(`tr`,{className:`border-b hover:bg-gray-50`,children:[(0,E.jsx)(`td`,{className:`p-2 border text-gray-500`,children:t+1}),(0,E.jsx)(`td`,{className:`p-2 border font-medium`,children:e.name}),(0,E.jsx)(`td`,{className:`p-2 border`,children:e.fromDate?(0,T.default)(e.fromDate,`YYYY-MM-DD`).format(`DD MMM YYYY`):`-`}),(0,E.jsx)(`td`,{className:`p-2 border`,children:e.toDate?(0,T.default)(e.toDate,`YYYY-MM-DD`).format(`DD MMM YYYY`):`-`}),(0,E.jsx)(`td`,{className:`p-2 border`,children:e.type}),(0,E.jsx)(`td`,{className:`p-2 border text-gray-500`,children:e.description||`-`})]},t))})]})]}),(0,E.jsxs)(`div`,{className:`modalfooter`,children:[(0,E.jsx)(f,{variant:`outlined`,onClick:()=>{H(!1),W([])},children:`Cancel`}),(0,E.jsxs)(f,{variant:`contained`,loading:Se,onClick:je,children:[`Import `,U.length,` Holiday`,U.length===1?``:`s`]})]})]})})}),(0,E.jsx)(b,{open:be,onClose:()=>{V(!1)},children:(0,E.jsx)(`div`,{className:`membermodal w-[600px]`,children:(0,E.jsxs)(`form`,{onSubmit:Ne,children:[(0,E.jsxs)(`div`,{className:`modalhead`,children:[` `,C?`Edit Holiday`:`Add holiday`]}),(0,E.jsx)(`span`,{className:`modalcontent `,children:(0,E.jsxs)(`div`,{className:`flex flex-col gap-3 w-full`,children:[(0,E.jsx)(d,{required:!0,inputRef:L,label:`Holiday Name`,size:`small`,value:e.name,onChange:e=>t(t=>({...t,name:e.target.value})),fullWidth:!0}),(0,E.jsxs)(`div`,{className:`flex w-full justify-between gap-2`,children:[(0,E.jsx)(p,{required:!0,label:`From Date`,format:`DD/MM/YYYY`,value:e.fromDate,onChange:e=>t(t=>({...t,fromDate:e})),slotProps:{textField:{size:`small`,fullWidth:!0,onBlur:Ee}}}),(0,E.jsx)(p,{required:!0,label:`To Date`,format:`DD/MM/YYYY`,value:e.toDate,onChange:e=>t(t=>({...t,toDate:e})),slotProps:{textField:{size:`small`,fullWidth:!0}}})]}),(0,E.jsxs)(c,{size:`small`,required:!0,fullWidth:!0,children:[(0,E.jsx)(l,{children:`Type`}),(0,E.jsxs)(u,{value:e.type,label:`Type`,onChange:e=>t(t=>({...t,type:e.target.value})),children:[(0,E.jsx)(m,{disabled:!0,value:``,children:`Select Type`}),(0,E.jsx)(m,{value:`National`,children:`National`}),(0,E.jsx)(m,{value:`Religious`,children:`Religious`}),(0,E.jsx)(m,{value:`Public`,children:`Public`}),(0,E.jsx)(m,{value:`Other`,children:`Other`})]})]}),(0,E.jsx)(d,{label:`Description (optional)`,multiline:!0,rows:2,size:`small`,value:e.description,onChange:e=>t(t=>({...t,description:e.target.value})),fullWidth:!0})]})}),(0,E.jsxs)(`div`,{className:`modalfooter`,children:[(0,E.jsx)(f,{variant:`outlined`,onClick:()=>{O(!1),V(!1),t({name:``,type:`Public`,fromDate:null,toDate:null,description:``})},children:`Cancel`}),(0,E.jsxs)(f,{variant:`contained`,type:`submit`,children:[C?`Update`:`Add`,` Holiday`]})]})]})})}),(0,E.jsx)(D,{ref:z,holidays:$,company:A})]})})},ge=[{name:`S.no`,selector:(e,t)=>++t,width:`50px`},{name:`Name`,selector:e=>e.name},{name:`From`,selector:e=>(0,T.default)(e.From).format(`DD MMM, YYYY`),width:`110px`},{name:`Till`,selector:e=>(0,T.default)(e.till).format(`DD MMM, YYYY`),width:`110px`},{name:`Type`,selector:e=>e.type,width:`90px`},{name:`Action`,selector:e=>e.action,width:`80px`}];export{A as default};