import{o as e,t}from"./react-0T9Avz-T.js";import{pt as n}from"./dateViewRenderers-BXUyqwJ2.js";import{t as r}from"./jsx-runtime-BRYeo4JD.js";import{a as i,d as a,l as o,n as s,t as c}from"./TextField-DwNGS3Bb.js";import{t as l}from"./Button-DlSUyGsL.js";import{t as u}from"./DatePicker-C77-YXL4.js";import{t as d}from"./MenuItem-D5kHLsZh.js";import{t as f}from"./createLucideIcon-C0ROPDb9.js";import{t as ee}from"./calendar-8Ev014iE.js";import{t as te}from"./circle-alert-BU_f5Xsf.js";import{t as ne}from"./circle-plus-BliCxSLk.js";import{t as p}from"./file-spreadsheet-90IxQAVy.js";import{t as re}from"./pen-CwKEiVip.js";import{X as m,et as ie,g as h,i as g,m as ae,o as _,r as v,u as oe}from"./index-_d7kVACR.js";import{t as se}from"./DataTable-BgQlk_vg.js";import{i as ce}from"./attandencehelper-DT8zp0SY.js";import{n as y,t as le}from"./AdapterDayjs-CC6ari5i.js";import{t as b}from"./isSameOrBefore-CqeNLcw_.js";import{t as x}from"./Modalbox-R2lW19UX.js";import{n as ue,t as de}from"./excelHelper-kT_wPXYO.js";import{t as fe}from"./react-to-print-C5x4_d1Z.js";import{t as pe}from"./holidayCalander-CPCA-syG.js";var me=f(`refresh-cw`,[[`path`,{d:`M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8`,key:`v9h5vc`}],[`path`,{d:`M21 3v5h-5`,key:`1q7to0`}],[`path`,{d:`M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16`,key:`3uifl3`}],[`path`,{d:`M8 16H3v5`,key:`1cv678`}]]),S=f(`upload`,[[`path`,{d:`M12 3v12`,key:`1x0j5s`}],[`path`,{d:`m17 8-5-5-5 5`,key:`7q97r8`}],[`path`,{d:`M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4`,key:`ih7n3h`}]]),he=e(v(),1),C=e(y(),1),w=e(b(),1),T=e(t(),1),E=e(g(),1),D=r(),O=T.forwardRef(({holidays:e,company:t},n)=>{let r=t?.logo?`/api/logo/${t.logo}`:null;return(0,D.jsx)(`div`,{style:{display:`none`},children:(0,D.jsxs)(`div`,{ref:n,className:`print-container`,children:[(0,D.jsx)(`style`,{children:`
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
        `}),(0,D.jsxs)(`div`,{className:`header`,children:[r&&(0,D.jsx)(`img`,{src:r,alt:`Logo`,className:`logo`}),(0,D.jsxs)(`div`,{className:`company-info`,children:[(0,D.jsx)(`h1`,{className:`company-name`,children:t?.name||`Company Name`}),(0,D.jsxs)(`p`,{className:`company-address`,children:[t?.address||`Company Address`,(0,D.jsx)(`br`,{}),t?.contact||t?.email||``]})]})]}),(0,D.jsx)(`div`,{className:`title-section`,children:(0,D.jsxs)(`h2`,{className:`document-title`,children:[`Official Holiday List - `,(0,E.default)().year()]})}),r?(0,D.jsx)(`img`,{src:r,alt:``,className:`watermark-logo`}):(0,D.jsx)(`div`,{className:`watermark`,children:t?.name||`OFFICIAL`}),(0,D.jsxs)(`table`,{className:`holiday-table`,children:[(0,D.jsx)(`thead`,{children:(0,D.jsxs)(`tr`,{children:[(0,D.jsx)(`th`,{style:{width:`50px`},children:`S.No`}),(0,D.jsx)(`th`,{children:`Holiday Name`}),(0,D.jsx)(`th`,{style:{width:`120px`},children:`From`}),(0,D.jsx)(`th`,{style:{width:`120px`},children:`To`}),(0,D.jsx)(`th`,{style:{width:`100px`},children:`Type`}),(0,D.jsx)(`th`,{children:`Description`})]})}),(0,D.jsx)(`tbody`,{children:e.map((e,t)=>(0,D.jsxs)(`tr`,{children:[(0,D.jsx)(`td`,{style:{textAlign:`center`},children:t+1}),(0,D.jsx)(`td`,{style:{fontWeight:`bold`},children:e.name}),(0,D.jsx)(`td`,{children:(0,E.default)(e.From).format(`DD MMM, YYYY`)}),(0,D.jsx)(`td`,{children:(0,E.default)(e.till).format(`DD MMM, YYYY`)}),(0,D.jsx)(`td`,{children:e.type}),(0,D.jsx)(`td`,{children:e.description||`-`})]},t))})]}),(0,D.jsxs)(`div`,{className:`footer`,children:[(0,D.jsx)(`p`,{children:`Notes: Holidays are subject to change as per management decision. Please refer to official notices for any updates.`}),(0,D.jsxs)(`div`,{className:`print-date`,children:[`Generated on: `,(0,E.default)().format(`DD/MM/YYYY HH:mm`)]})]})]})})});O.displayName=`HolidayPrintable`,E.default.extend(w.default),E.default.extend(C.default);var k=[`DD/MM/YYYY`,`DD-MM-YYYY`,`YYYY-MM-DD`,`MM/DD/YYYY`,`D/M/YYYY`,`D-M-YYYY`,`YYYY/MM/DD`],A=e=>{if(!e)return null;if(e instanceof Date)return(0,E.default)(e);let t=String(e).trim();for(let e of k){let n=(0,E.default)(t,e,!0);if(n.isValid())return n}let n=(0,E.default)(t);return n.isValid()?n:null},j=()=>{let[e,t]=(0,T.useState)({name:``,type:``,fromDate:null,toDate:null,description:``}),[r,f]=(0,T.useState)(null),[g,v]=(0,T.useState)([]),[y,b]=(0,T.useState)([]),[C,w]=(0,T.useState)(!1),{company:k}=ie(e=>e.user),[j,_e]=(0,T.useState)([1]),[M,N]=(0,T.useState)(`All`),[P,F]=(0,T.useState)(`All`),[I,L]=(0,T.useState)(`All`),R=(0,T.useRef)(null),z=(0,T.useRef)(null),B=(0,T.useRef)(null),[ve,V]=(0,T.useState)(!1),[ye,H]=(0,T.useState)(!1),[be,U]=(0,T.useState)(!1),[W,G]=(0,T.useState)([]),[xe,K]=(0,T.useState)(!1),[q,J]=(0,T.useState)(null),[Y,Se]=(0,T.useState)(null),Ce=fe({contentRef:B,documentTitle:`Holiday_List_${(0,E.default)().year()}`}),we=e=>{J(e.currentTarget)},X=()=>{J(null)},Te=e=>{Se(e.currentTarget)},Z=()=>{Se(null)};(0,T.useEffect)(()=>{_e(k?.weeklyOffs||[1])},[k]);let Ee=()=>{e.fromDate&&!e.toDate&&(0,E.default)(e.fromDate).isValid()&&t(t=>({...t,toDate:e.fromDate}))};(0,T.useEffect)(()=>{Q()},[]);let Q=async()=>{try{let e=(await _({url:`getholidays`})).holidays,t=[];e.forEach(e=>{let n=(0,E.default)(e.fromDate),r=e.toDate?(0,E.default)(e.toDate):n;for(;n.isSameOrBefore(r,`day`);)t.push({date:n.format(`YYYY-MM-DD`),name:e.name}),n=n.add(1,`day`)});let n=e.map(e=>({name:e.name,From:e.fromDate,till:e.toDate,type:e.type,description:e?.description,action:(0,D.jsxs)(`div`,{className:`action flex gap-2.5 items-center`,children:[(0,D.jsx)(`span`,{className:`edit text-teal-600 hover:text-teal-700 cursor-pointer p-1`,title:`Edit`,onClick:()=>De(e),children:(0,D.jsx)(re,{size:16})}),(0,D.jsx)(`span`,{className:`delete text-red-500 hover:text-red-600 cursor-pointer p-1`,title:`Delete`,onClick:()=>Oe(e._id),children:(0,D.jsx)(oe,{size:16})})]})}));(0,T.startTransition)(()=>{b(t),v(n)})}catch(e){console.error(`Error fetching holidays:`,e)}},De=e=>{w(!0),H(!0),f(e._id),t({name:e.name,type:e.type,fromDate:(0,E.default)(e.fromDate),toDate:(0,E.default)(e.toDate),description:e.description||``}),setTimeout(()=>{R.current?.focus()},0)},Oe=async e=>{(0,he.default)({title:`Are you sure you want to Delete?`,icon:`warning`,buttons:!0,dangerMode:!0}).then(async t=>{if(t)try{let t=await _({url:`deleteholiday`,method:`POST`,body:{id:e}});m.success(t.message),Q()}catch(e){console.error(e)}})},ke=async()=>{if($.length===0){m.info(`No holidays to export.`);return}let e=$.map((e,t)=>({"S.No":t+1,Name:e.name,"From Date":(0,E.default)(e.From).format(`DD/MM/YYYY`),"To Date":(0,E.default)(e.till).format(`DD/MM/YYYY`),Type:e.type||``,Description:e.description||``}));try{await de(e,`Holidays`,`holidays_${(0,E.default)().format(`YYYY-MM-DD`)}.xlsx`)}catch{m.error(`Failed to export Excel file`)}},Ae=async e=>{let t=e.target.files[0];if(t){try{let e=(await ue(t,{cellDates:!0})).map(e=>{let t=e[`From Date`]??e.fromDate??e.from_date??``,n=e[`To Date`]??e.toDate??e.to_date??t,r=A(t),i=A(n)||r;return{name:e.Name||e.name||``,fromDate:r?r.format(`YYYY-MM-DD`):``,toDate:i?i.format(`YYYY-MM-DD`):``,type:e.Type||e.type||`Other`,description:e.Description||e.description||``}}).filter(e=>e.name&&e.fromDate);if(e.length===0){m.error(`No valid rows found. Make sure the file has Name, From Date, To Date, Type columns.`);return}G(e),U(!0)}catch{m.error(`Failed to read the file. Please use a valid xlsx/csv format.`)}e.target.value=``}},je=async()=>{if(W.length!==0){K(!0);try{let e=await _({url:`bulkImportHolidays`,method:`POST`,body:{holidays:W}});m.success(e.message),U(!1),G([]),Q()}catch(e){m.error(e.message||`Import failed`)}finally{K(!1)}}},Me=()=>{let e=XLSX.utils.json_to_sheet([{Name:`Saraswati Puja`,"From Date":`02-02-2026`,"To Date":`02-02-2026`,Type:`Religious`,Description:`Basant Panchami - Goddess of knowledge`},{Name:`Holi`,"From Date":`14-03-2026`,"To Date":`14-03-2026`,Type:`Religious`,Description:`Festival of colours`},{Name:`Diwali`,"From Date":`20-10-2026`,"To Date":`20-10-2026`,Type:`Religious`,Description:`Festival of lights`},{Name:`Chhath Puja`,"From Date":`28-10-2026`,"To Date":`28-10-2026`,Type:`Religious`,Description:`Chhath Puja - worship of the Sun God`}]);e[`!cols`]=[{wch:20},{wch:14},{wch:14},{wch:12},{wch:30}];let t=XLSX.utils.book_new();XLSX.utils.book_append_sheet(t,e,`Holidays`),XLSX.writeFile(t,`holidays_sample.xlsx`)},Ne=async n=>{n.preventDefault();try{let n=e.fromDate?(0,E.default)(e.fromDate).format(`YYYY-MM-DD`):null,i=e.toDate?(0,E.default)(e.toDate).format(`YYYY-MM-DD`):null,a=C?`updateholiday`:`addholiday`,o={...e,fromDate:n,toDate:i,...C?{holidayId:r}:{}},s=await _({url:a,method:`POST`,body:o});m.success(s.message),t({name:``,type:`Public`,fromDate:null,toDate:null,description:``}),w(!1),H(!1),Q()}catch(e){console.error(`Error saving holiday:`,e)}},$=(0,T.useMemo)(()=>g.filter(e=>{let t=(0,E.default)(e.From),n=M===`All`||t.year().toString()===M.toString(),r=P===`All`||t.month()===parseInt(P),i=I===`All`||e.type===I;return n&&r&&i}),[g,M,P,I]),Pe=[`Jan`,`Feb`,`Mar`,`Apr`,`May`,`Jun`,`Jul`,`Aug`,`Sep`,`Oct`,`Nov`,`Dec`],Fe=(0,T.useMemo)(()=>{if(!g||g.length===0)return[];let e=new Set;return g.forEach(t=>{let n=(0,E.default)(t.From).year();n&&e.add(n)}),Array.from(e).sort((e,t)=>t-e)},[g]);return(0,D.jsx)(`div`,{className:`max-w-7xl mx-auto`,children:(0,D.jsxs)(n,{dateAdapter:le,children:[(0,D.jsxs)(`div`,{className:`flex flex-wrap  justify-between items-center gap-3 w-full my-4`,children:[(0,D.jsxs)(`div`,{className:`flex gap-2 flex-wrap justify-between w-full md:w-fit`,children:[(0,D.jsxs)(a,{size:`small`,className:`w-[47%] md:w-[120px]`,children:[(0,D.jsx)(o,{children:`Year`}),(0,D.jsxs)(s,{label:`Year`,value:M,onChange:e=>N(e.target.value),children:[(0,D.jsx)(d,{value:`All`,children:`All`}),Fe.map(e=>(0,D.jsx)(d,{value:e,children:e},e))]})]}),(0,D.jsxs)(a,{size:`small`,className:`w-[47%] md:w-[120px]`,children:[(0,D.jsx)(o,{children:`Month`}),(0,D.jsxs)(s,{label:`Month`,value:P,onChange:e=>F(e.target.value),children:[(0,D.jsx)(d,{value:`All`,children:`All`}),Pe.map((e,t)=>(0,D.jsx)(d,{value:t,children:e},e))]})]}),(0,D.jsxs)(a,{size:`small`,className:`w-[47%] md:w-[150px]`,children:[(0,D.jsx)(o,{children:`Type`}),(0,D.jsxs)(s,{label:`Filter by Type`,value:I,onChange:e=>L(e.target.value),children:[(0,D.jsx)(d,{value:`All`,children:`All`}),[...new Set(g.map(e=>e.type))].map(e=>(0,D.jsx)(d,{value:e,children:e},e))]})]}),(0,D.jsx)(l,{variant:`outlined`,color:`secondary`,className:`w-[47%] md:w-fit`,startIcon:(0,D.jsx)(me,{size:16}),onClick:()=>{N(`All`),F(`All`),L(`All`)},children:`Reset`})]}),(0,D.jsxs)(`div`,{className:`flex flex-col sm:flex-row gap-2 w-full md:w-fit`,children:[(0,D.jsx)(l,{startIcon:(0,D.jsx)(ee,{size:16}),variant:`outlined`,onClick:()=>V(!0),children:`Calendar`}),(0,D.jsx)(l,{startIcon:(0,D.jsx)(p,{size:16}),endIcon:(0,D.jsx)(h,{size:16}),variant:`outlined`,color:`primary`,onClick:we,children:`Export`}),(0,D.jsxs)(i,{anchorEl:q,open:!!q,onClose:X,children:[(0,D.jsxs)(d,{onClick:()=>{ke(),X()},children:[(0,D.jsx)(p,{size:16,style:{marginRight:`8px`,color:`#16a34a`}}),` Excel File`]}),(0,D.jsxs)(d,{onClick:()=>{Ce(),X()},children:[(0,D.jsx)(ae,{size:16,style:{marginRight:`8px`,color:`#dc2626`}}),` PDF List (Official)`]})]}),(0,D.jsx)(l,{startIcon:(0,D.jsx)(S,{size:16}),endIcon:(0,D.jsx)(h,{size:16}),variant:`outlined`,color:`inherit`,onClick:Te,children:`Import`}),(0,D.jsxs)(i,{anchorEl:Y,open:!!Y,onClose:Z,children:[(0,D.jsxs)(d,{onClick:()=>{z.current?.click(),Z()},children:[(0,D.jsx)(S,{size:16,style:{marginRight:`8px`}}),` Upload Excel/CSV`]}),(0,D.jsxs)(d,{onClick:()=>{Me(),Z()},children:[(0,D.jsx)(p,{size:16,style:{marginRight:`8px`,color:`#0ea5e9`}}),` Download Sample`]})]}),(0,D.jsx)(`input`,{ref:z,type:`file`,accept:`.xlsx,.xls,.csv`,style:{display:`none`},onChange:Ae}),(0,D.jsx)(l,{startIcon:(0,D.jsx)(ne,{size:16}),className:`w-full md:w-fit`,variant:`contained`,onClick:()=>H(!0),children:`Add Holiday`})]})]}),(0,D.jsx)(`div`,{className:`capitalize`,children:(0,D.jsx)(se,{columns:ge,data:$,pagination:!0,customStyles:ce(),noDataComponent:(0,D.jsxs)(`div`,{className:`flex items-center gap-2 py-6 text-center text-gray-600 text-sm`,children:[(0,D.jsx)(te,{size:18,className:`text-amber-500`}),` No records found.`]}),highlightOnHover:!0})}),(0,D.jsx)(x,{open:ve,onClose:()=>V(!1),children:(0,D.jsx)(`div`,{className:`membermodal w-[400px]`,children:(0,D.jsx)(pe,{highlightedDates:y.map(e=>({date:(0,E.default)(e.date),name:e.name})),weeklyOffs:j})})}),(0,D.jsx)(x,{open:be,onClose:()=>U(!1),children:(0,D.jsx)(`div`,{className:`membermodal w-[700px]`,children:(0,D.jsxs)(`div`,{className:`whole`,children:[(0,D.jsxs)(`div`,{className:`modalhead`,children:[`Import Preview (`,W.length,` records)`]}),(0,D.jsxs)(`div`,{className:`modalcontent overflow-auto max-h-[400px]`,children:[(0,D.jsx)(`p`,{className:`text-sm text-gray-500 mb-2`,children:`Review the parsed holidays below before importing.`}),(0,D.jsxs)(`table`,{className:`w-full text-sm border-collapse`,children:[(0,D.jsx)(`thead`,{children:(0,D.jsxs)(`tr`,{className:`bg-gray-100 text-left`,children:[(0,D.jsx)(`th`,{className:`p-2 border`,children:`#`}),(0,D.jsx)(`th`,{className:`p-2 border`,children:`Name`}),(0,D.jsx)(`th`,{className:`p-2 border`,children:`From`}),(0,D.jsx)(`th`,{className:`p-2 border`,children:`To`}),(0,D.jsx)(`th`,{className:`p-2 border`,children:`Type`}),(0,D.jsx)(`th`,{className:`p-2 border`,children:`Description`})]})}),(0,D.jsx)(`tbody`,{children:W.map((e,t)=>(0,D.jsxs)(`tr`,{className:`border-b hover:bg-gray-50`,children:[(0,D.jsx)(`td`,{className:`p-2 border text-gray-500`,children:t+1}),(0,D.jsx)(`td`,{className:`p-2 border font-medium`,children:e.name}),(0,D.jsx)(`td`,{className:`p-2 border`,children:e.fromDate?(0,E.default)(e.fromDate,`YYYY-MM-DD`).format(`DD MMM YYYY`):`-`}),(0,D.jsx)(`td`,{className:`p-2 border`,children:e.toDate?(0,E.default)(e.toDate,`YYYY-MM-DD`).format(`DD MMM YYYY`):`-`}),(0,D.jsx)(`td`,{className:`p-2 border`,children:e.type}),(0,D.jsx)(`td`,{className:`p-2 border text-gray-500`,children:e.description||`-`})]},t))})]})]}),(0,D.jsxs)(`div`,{className:`modalfooter`,children:[(0,D.jsx)(l,{variant:`outlined`,onClick:()=>{U(!1),G([])},children:`Cancel`}),(0,D.jsxs)(l,{variant:`contained`,loading:xe,onClick:je,children:[`Import `,W.length,` Holiday`,W.length===1?``:`s`]})]})]})})}),(0,D.jsx)(x,{open:ye,onClose:()=>{H(!1)},children:(0,D.jsx)(`div`,{className:`membermodal w-[600px]`,children:(0,D.jsxs)(`form`,{onSubmit:Ne,children:[(0,D.jsxs)(`div`,{className:`modalhead`,children:[` `,C?`Edit Holiday`:`Add holiday`]}),(0,D.jsx)(`span`,{className:`modalcontent `,children:(0,D.jsxs)(`div`,{className:`flex flex-col gap-3 w-full`,children:[(0,D.jsx)(c,{required:!0,inputRef:R,label:`Holiday Name`,size:`small`,value:e.name,onChange:e=>t(t=>({...t,name:e.target.value})),fullWidth:!0}),(0,D.jsxs)(`div`,{className:`flex w-full justify-between gap-2`,children:[(0,D.jsx)(u,{required:!0,label:`From Date`,format:`DD/MM/YYYY`,value:e.fromDate,onChange:e=>t(t=>({...t,fromDate:e})),slotProps:{textField:{size:`small`,fullWidth:!0,onBlur:Ee}}}),(0,D.jsx)(u,{required:!0,label:`To Date`,format:`DD/MM/YYYY`,value:e.toDate,onChange:e=>t(t=>({...t,toDate:e})),slotProps:{textField:{size:`small`,fullWidth:!0}}})]}),(0,D.jsxs)(a,{size:`small`,required:!0,fullWidth:!0,children:[(0,D.jsx)(o,{children:`Type`}),(0,D.jsxs)(s,{value:e.type,label:`Type`,onChange:e=>t(t=>({...t,type:e.target.value})),children:[(0,D.jsx)(d,{disabled:!0,value:``,children:`Select Type`}),(0,D.jsx)(d,{value:`National`,children:`National`}),(0,D.jsx)(d,{value:`Religious`,children:`Religious`}),(0,D.jsx)(d,{value:`Public`,children:`Public`}),(0,D.jsx)(d,{value:`Other`,children:`Other`})]})]}),(0,D.jsx)(c,{label:`Description (optional)`,multiline:!0,rows:2,size:`small`,value:e.description,onChange:e=>t(t=>({...t,description:e.target.value})),fullWidth:!0})]})}),(0,D.jsxs)(`div`,{className:`modalfooter`,children:[(0,D.jsx)(l,{variant:`outlined`,onClick:()=>{w(!1),H(!1),t({name:``,type:`Public`,fromDate:null,toDate:null,description:``})},children:`Cancel`}),(0,D.jsxs)(l,{variant:`contained`,type:`submit`,children:[C?`Update`:`Add`,` Holiday`]})]})]})})}),(0,D.jsx)(O,{ref:B,holidays:$,company:k})]})})},ge=[{name:`S.no`,selector:(e,t)=>++t,width:`50px`},{name:`Name`,selector:e=>e.name},{name:`From`,selector:e=>(0,E.default)(e.From).format(`DD MMM, YYYY`),width:`110px`},{name:`Till`,selector:e=>(0,E.default)(e.till).format(`DD MMM, YYYY`),width:`110px`},{name:`Type`,selector:e=>e.type,width:`90px`},{name:`Action`,selector:e=>e.action,width:`80px`}];export{j as default};