import{o as e,t}from"./react-0T9Avz-T.js";import{ht as n,mt as r,pt as i}from"./dateViewRenderers-DtpCjVF9.js";import{t as a}from"./jsx-runtime-BRYeo4JD.js";import{a as o,d as s,l as c,n as l,t as u}from"./TextField-8YKSwy5r.js";import{t as d}from"./Button-dE9B6t2y.js";import{t as f}from"./DatePicker-DcA5YJwN.js";import{t as p}from"./MenuItem-DL-QM2Ea.js";import{t as m}from"./createLucideIcon-C0ROPDb9.js";import{t as ee}from"./calendar-8Ev014iE.js";import{t as te}from"./circle-alert-BU_f5Xsf.js";import{t as ne}from"./circle-plus-BliCxSLk.js";import{t as h}from"./file-spreadsheet-90IxQAVy.js";import{t as re}from"./pen-CwKEiVip.js";import{Q as g,g as ie,i as _,nt as ae,o as v,r as y,u as oe,y as b}from"./index-DxGRsDyU.js";import{t as se}from"./DataTable-BgQlk_vg.js";import{i as ce}from"./attandencehelper-BCh4jBcl.js";import{t as x}from"./isSameOrBefore-CqeNLcw_.js";import{t as S}from"./Modalbox-DS711HS8.js";import{n as le,t as ue}from"./excelHelper-kT_wPXYO.js";import{t as de}from"./react-to-print-C5x4_d1Z.js";import{t as fe}from"./holidayCalander-BKTkJLVn.js";var pe=m(`refresh-cw`,[[`path`,{d:`M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8`,key:`v9h5vc`}],[`path`,{d:`M21 3v5h-5`,key:`1q7to0`}],[`path`,{d:`M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16`,key:`3uifl3`}],[`path`,{d:`M8 16H3v5`,key:`1cv678`}]]),C=m(`upload`,[[`path`,{d:`M12 3v12`,key:`1x0j5s`}],[`path`,{d:`m17 8-5-5-5 5`,key:`7q97r8`}],[`path`,{d:`M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4`,key:`ih7n3h`}]]),me=e(y(),1),w=e(n(),1),T=e(x(),1),E=e(t(),1),D=e(_(),1),O=a(),k=E.forwardRef(({holidays:e,company:t},n)=>{let r=t?.logo?`/api/logo/${t.logo}`:null;return(0,O.jsx)(`div`,{style:{display:`none`},children:(0,O.jsxs)(`div`,{ref:n,className:`print-container`,children:[(0,O.jsx)(`style`,{children:`
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
        `}),(0,O.jsxs)(`div`,{className:`header`,children:[r&&(0,O.jsx)(`img`,{src:r,alt:`Logo`,className:`logo`}),(0,O.jsxs)(`div`,{className:`company-info`,children:[(0,O.jsx)(`h1`,{className:`company-name`,children:t?.name||`Company Name`}),(0,O.jsxs)(`p`,{className:`company-address`,children:[t?.address||`Company Address`,(0,O.jsx)(`br`,{}),t?.contact||t?.email||``]})]})]}),(0,O.jsx)(`div`,{className:`title-section`,children:(0,O.jsxs)(`h2`,{className:`document-title`,children:[`Official Holiday List - `,(0,D.default)().year()]})}),r?(0,O.jsx)(`img`,{src:r,alt:``,className:`watermark-logo`}):(0,O.jsx)(`div`,{className:`watermark`,children:t?.name||`OFFICIAL`}),(0,O.jsxs)(`table`,{className:`holiday-table`,children:[(0,O.jsx)(`thead`,{children:(0,O.jsxs)(`tr`,{children:[(0,O.jsx)(`th`,{style:{width:`50px`},children:`S.No`}),(0,O.jsx)(`th`,{children:`Holiday Name`}),(0,O.jsx)(`th`,{style:{width:`120px`},children:`From`}),(0,O.jsx)(`th`,{style:{width:`120px`},children:`To`}),(0,O.jsx)(`th`,{style:{width:`100px`},children:`Type`}),(0,O.jsx)(`th`,{children:`Description`})]})}),(0,O.jsx)(`tbody`,{children:e.map((e,t)=>(0,O.jsxs)(`tr`,{children:[(0,O.jsx)(`td`,{style:{textAlign:`center`},children:t+1}),(0,O.jsx)(`td`,{style:{fontWeight:`bold`},children:e.name}),(0,O.jsx)(`td`,{children:(0,D.default)(e.From).format(`DD MMM, YYYY`)}),(0,O.jsx)(`td`,{children:(0,D.default)(e.till).format(`DD MMM, YYYY`)}),(0,O.jsx)(`td`,{children:e.type}),(0,O.jsx)(`td`,{children:e.description||`-`})]},t))})]}),(0,O.jsxs)(`div`,{className:`footer`,children:[(0,O.jsx)(`p`,{children:`Notes: Holidays are subject to change as per management decision. Please refer to official notices for any updates.`}),(0,O.jsxs)(`div`,{className:`print-date`,children:[`Generated on: `,(0,D.default)().format(`DD/MM/YYYY HH:mm`)]})]})]})})});k.displayName=`HolidayPrintable`,D.default.extend(T.default),D.default.extend(w.default);var A=[`DD/MM/YYYY`,`DD-MM-YYYY`,`YYYY-MM-DD`,`MM/DD/YYYY`,`D/M/YYYY`,`D-M-YYYY`,`YYYY/MM/DD`],j=e=>{if(!e)return null;if(e instanceof Date)return(0,D.default)(e);let t=String(e).trim();for(let e of A){let n=(0,D.default)(t,e,!0);if(n.isValid())return n}let n=(0,D.default)(t);return n.isValid()?n:null},M=()=>{let[e,t]=(0,E.useState)({name:``,type:``,fromDate:null,toDate:null,description:``}),[n,a]=(0,E.useState)(null),[m,_]=(0,E.useState)([]),[y,x]=(0,E.useState)([]),[w,T]=(0,E.useState)(!1),{company:A}=ae(e=>e.user),[M,ge]=(0,E.useState)([1]),[N,P]=(0,E.useState)(`All`),[F,I]=(0,E.useState)(`All`),[L,R]=(0,E.useState)(`All`),z=(0,E.useRef)(null),B=(0,E.useRef)(null),V=(0,E.useRef)(null),[_e,H]=(0,E.useState)(!1),[ve,U]=(0,E.useState)(!1),[ye,W]=(0,E.useState)(!1),[G,K]=(0,E.useState)([]),[be,q]=(0,E.useState)(!1),[J,xe]=(0,E.useState)(null),[Se,Y]=(0,E.useState)(null),Ce=de({contentRef:V,documentTitle:`Holiday_List_${(0,D.default)().year()}`}),we=e=>{xe(e.currentTarget)},X=()=>{xe(null)},Te=e=>{Y(e.currentTarget)},Z=()=>{Y(null)};(0,E.useEffect)(()=>{ge(A?.weeklyOffs||[1])},[A]);let Ee=()=>{e.fromDate&&!e.toDate&&(0,D.default)(e.fromDate).isValid()&&t(t=>({...t,toDate:e.fromDate}))};(0,E.useEffect)(()=>{Q()},[]);let Q=async()=>{try{let e=(await v({url:`getholidays`})).holidays,t=[];e.forEach(e=>{let n=(0,D.default)(e.fromDate),r=e.toDate?(0,D.default)(e.toDate):n;for(;n.isSameOrBefore(r,`day`);)t.push({date:n.format(`YYYY-MM-DD`),name:e.name}),n=n.add(1,`day`)});let n=e.map(e=>({name:e.name,From:e.fromDate,till:e.toDate,type:e.type,description:e?.description,action:(0,O.jsxs)(`div`,{className:`action flex gap-2.5 items-center`,children:[(0,O.jsx)(`span`,{className:`edit text-teal-600 hover:text-teal-700 cursor-pointer p-1`,title:`Edit`,onClick:()=>De(e),children:(0,O.jsx)(re,{size:16})}),(0,O.jsx)(`span`,{className:`delete text-red-500 hover:text-red-600 cursor-pointer p-1`,title:`Delete`,onClick:()=>Oe(e._id),children:(0,O.jsx)(oe,{size:16})})]})}));(0,E.startTransition)(()=>{x(t),_(n)})}catch(e){console.error(`Error fetching holidays:`,e)}},De=e=>{T(!0),U(!0),a(e._id),t({name:e.name,type:e.type,fromDate:(0,D.default)(e.fromDate),toDate:(0,D.default)(e.toDate),description:e.description||``}),setTimeout(()=>{z.current?.focus()},0)},Oe=async e=>{(0,me.default)({title:`Are you sure you want to Delete?`,icon:`warning`,buttons:!0,dangerMode:!0}).then(async t=>{if(t)try{let t=await v({url:`deleteholiday`,method:`POST`,body:{id:e}});g.success(t.message),Q()}catch(e){console.error(e)}})},ke=async()=>{if($.length===0){g.info(`No holidays to export.`);return}let e=$.map((e,t)=>({"S.No":t+1,Name:e.name,"From Date":(0,D.default)(e.From).format(`DD/MM/YYYY`),"To Date":(0,D.default)(e.till).format(`DD/MM/YYYY`),Type:e.type||``,Description:e.description||``}));try{await ue(e,`Holidays`,`holidays_${(0,D.default)().format(`YYYY-MM-DD`)}.xlsx`)}catch{g.error(`Failed to export Excel file`)}},Ae=async e=>{let t=e.target.files[0];if(t){try{let e=(await le(t,{cellDates:!0})).map(e=>{let t=e[`From Date`]??e.fromDate??e.from_date??``,n=e[`To Date`]??e.toDate??e.to_date??t,r=j(t),i=j(n)||r;return{name:e.Name||e.name||``,fromDate:r?r.format(`YYYY-MM-DD`):``,toDate:i?i.format(`YYYY-MM-DD`):``,type:e.Type||e.type||`Other`,description:e.Description||e.description||``}}).filter(e=>e.name&&e.fromDate);if(e.length===0){g.error(`No valid rows found. Make sure the file has Name, From Date, To Date, Type columns.`);return}K(e),W(!0)}catch{g.error(`Failed to read the file. Please use a valid xlsx/csv format.`)}e.target.value=``}},je=async()=>{if(G.length!==0){q(!0);try{let e=await v({url:`bulkImportHolidays`,method:`POST`,body:{holidays:G}});g.success(e.message),W(!1),K([]),Q()}catch(e){g.error(e.message||`Import failed`)}finally{q(!1)}}},Me=()=>{let e=XLSX.utils.json_to_sheet([{Name:`Saraswati Puja`,"From Date":`02-02-2026`,"To Date":`02-02-2026`,Type:`Religious`,Description:`Basant Panchami - Goddess of knowledge`},{Name:`Holi`,"From Date":`14-03-2026`,"To Date":`14-03-2026`,Type:`Religious`,Description:`Festival of colours`},{Name:`Diwali`,"From Date":`20-10-2026`,"To Date":`20-10-2026`,Type:`Religious`,Description:`Festival of lights`},{Name:`Chhath Puja`,"From Date":`28-10-2026`,"To Date":`28-10-2026`,Type:`Religious`,Description:`Chhath Puja - worship of the Sun God`}]);e[`!cols`]=[{wch:20},{wch:14},{wch:14},{wch:12},{wch:30}];let t=XLSX.utils.book_new();XLSX.utils.book_append_sheet(t,e,`Holidays`),XLSX.writeFile(t,`holidays_sample.xlsx`)},Ne=async r=>{r.preventDefault();try{let r=e.fromDate?(0,D.default)(e.fromDate).format(`YYYY-MM-DD`):null,i=e.toDate?(0,D.default)(e.toDate).format(`YYYY-MM-DD`):null,a=w?`updateholiday`:`addholiday`,o={...e,fromDate:r,toDate:i,...w?{holidayId:n}:{}},s=await v({url:a,method:`POST`,body:o});g.success(s.message),t({name:``,type:`Public`,fromDate:null,toDate:null,description:``}),T(!1),U(!1),Q()}catch(e){console.error(`Error saving holiday:`,e)}},$=(0,E.useMemo)(()=>m.filter(e=>{let t=(0,D.default)(e.From),n=N===`All`||t.year().toString()===N.toString(),r=F===`All`||t.month()===parseInt(F),i=L===`All`||e.type===L;return n&&r&&i}),[m,N,F,L]),Pe=[`Jan`,`Feb`,`Mar`,`Apr`,`May`,`Jun`,`Jul`,`Aug`,`Sep`,`Oct`,`Nov`,`Dec`],Fe=(0,E.useMemo)(()=>{if(!m||m.length===0)return[];let e=new Set;return m.forEach(t=>{let n=(0,D.default)(t.From).year();n&&e.add(n)}),Array.from(e).sort((e,t)=>t-e)},[m]);return(0,O.jsx)(`div`,{className:`max-w-7xl mx-auto`,children:(0,O.jsxs)(i,{dateAdapter:r,children:[(0,O.jsxs)(`div`,{className:`flex flex-wrap  justify-between items-center gap-3 w-full my-4`,children:[(0,O.jsxs)(`div`,{className:`flex gap-2 flex-wrap justify-between w-full md:w-fit`,children:[(0,O.jsxs)(s,{size:`small`,className:`w-[47%] md:w-[120px]`,children:[(0,O.jsx)(c,{children:`Year`}),(0,O.jsxs)(l,{label:`Year`,value:N,onChange:e=>P(e.target.value),children:[(0,O.jsx)(p,{value:`All`,children:`All`}),Fe.map(e=>(0,O.jsx)(p,{value:e,children:e},e))]})]}),(0,O.jsxs)(s,{size:`small`,className:`w-[47%] md:w-[120px]`,children:[(0,O.jsx)(c,{children:`Month`}),(0,O.jsxs)(l,{label:`Month`,value:F,onChange:e=>I(e.target.value),children:[(0,O.jsx)(p,{value:`All`,children:`All`}),Pe.map((e,t)=>(0,O.jsx)(p,{value:t,children:e},e))]})]}),(0,O.jsxs)(s,{size:`small`,className:`w-[47%] md:w-[150px]`,children:[(0,O.jsx)(c,{children:`Type`}),(0,O.jsxs)(l,{label:`Filter by Type`,value:L,onChange:e=>R(e.target.value),children:[(0,O.jsx)(p,{value:`All`,children:`All`}),[...new Set(m.map(e=>e.type))].map(e=>(0,O.jsx)(p,{value:e,children:e},e))]})]}),(0,O.jsx)(d,{variant:`outlined`,color:`secondary`,className:`w-[47%] md:w-fit`,startIcon:(0,O.jsx)(pe,{size:16}),onClick:()=>{P(`All`),I(`All`),R(`All`)},children:`Reset`})]}),(0,O.jsxs)(`div`,{className:`flex flex-col sm:flex-row gap-2 w-full md:w-fit`,children:[(0,O.jsx)(d,{startIcon:(0,O.jsx)(ee,{size:16}),variant:`outlined`,onClick:()=>H(!0),children:`Calendar`}),(0,O.jsx)(d,{startIcon:(0,O.jsx)(h,{size:16}),endIcon:(0,O.jsx)(b,{size:16}),variant:`outlined`,color:`primary`,onClick:we,children:`Export`}),(0,O.jsxs)(o,{anchorEl:J,open:!!J,onClose:X,children:[(0,O.jsxs)(p,{onClick:()=>{ke(),X()},children:[(0,O.jsx)(h,{size:16,style:{marginRight:`8px`,color:`#16a34a`}}),` Excel File`]}),(0,O.jsxs)(p,{onClick:()=>{Ce(),X()},children:[(0,O.jsx)(ie,{size:16,style:{marginRight:`8px`,color:`#dc2626`}}),` PDF List (Official)`]})]}),(0,O.jsx)(d,{startIcon:(0,O.jsx)(C,{size:16}),endIcon:(0,O.jsx)(b,{size:16}),variant:`outlined`,color:`inherit`,onClick:Te,children:`Import`}),(0,O.jsxs)(o,{anchorEl:Se,open:!!Se,onClose:Z,children:[(0,O.jsxs)(p,{onClick:()=>{B.current?.click(),Z()},children:[(0,O.jsx)(C,{size:16,style:{marginRight:`8px`}}),` Upload Excel/CSV`]}),(0,O.jsxs)(p,{onClick:()=>{Me(),Z()},children:[(0,O.jsx)(h,{size:16,style:{marginRight:`8px`,color:`#0ea5e9`}}),` Download Sample`]})]}),(0,O.jsx)(`input`,{ref:B,type:`file`,accept:`.xlsx,.xls,.csv`,style:{display:`none`},onChange:Ae}),(0,O.jsx)(d,{startIcon:(0,O.jsx)(ne,{size:16}),className:`w-full md:w-fit`,variant:`contained`,onClick:()=>U(!0),children:`Add Holiday`})]})]}),(0,O.jsx)(`div`,{className:`capitalize`,children:(0,O.jsx)(se,{columns:he,data:$,pagination:!0,customStyles:ce(),noDataComponent:(0,O.jsxs)(`div`,{className:`flex items-center gap-2 py-6 text-center text-gray-600 text-sm`,children:[(0,O.jsx)(te,{size:18,className:`text-amber-500`}),` No records found.`]}),highlightOnHover:!0})}),(0,O.jsx)(S,{open:_e,onClose:()=>H(!1),children:(0,O.jsx)(`div`,{className:`membermodal w-[400px]`,children:(0,O.jsx)(fe,{highlightedDates:y.map(e=>({date:(0,D.default)(e.date),name:e.name})),weeklyOffs:M})})}),(0,O.jsx)(S,{open:ye,onClose:()=>W(!1),children:(0,O.jsx)(`div`,{className:`membermodal w-[700px]`,children:(0,O.jsxs)(`div`,{className:`whole`,children:[(0,O.jsxs)(`div`,{className:`modalhead`,children:[`Import Preview (`,G.length,` records)`]}),(0,O.jsxs)(`div`,{className:`modalcontent overflow-auto max-h-[400px]`,children:[(0,O.jsx)(`p`,{className:`text-sm text-gray-500 mb-2`,children:`Review the parsed holidays below before importing.`}),(0,O.jsxs)(`table`,{className:`w-full text-sm border-collapse`,children:[(0,O.jsx)(`thead`,{children:(0,O.jsxs)(`tr`,{className:`bg-gray-100 text-left`,children:[(0,O.jsx)(`th`,{className:`p-2 border`,children:`#`}),(0,O.jsx)(`th`,{className:`p-2 border`,children:`Name`}),(0,O.jsx)(`th`,{className:`p-2 border`,children:`From`}),(0,O.jsx)(`th`,{className:`p-2 border`,children:`To`}),(0,O.jsx)(`th`,{className:`p-2 border`,children:`Type`}),(0,O.jsx)(`th`,{className:`p-2 border`,children:`Description`})]})}),(0,O.jsx)(`tbody`,{children:G.map((e,t)=>(0,O.jsxs)(`tr`,{className:`border-b hover:bg-gray-50`,children:[(0,O.jsx)(`td`,{className:`p-2 border text-gray-500`,children:t+1}),(0,O.jsx)(`td`,{className:`p-2 border font-medium`,children:e.name}),(0,O.jsx)(`td`,{className:`p-2 border`,children:e.fromDate?(0,D.default)(e.fromDate,`YYYY-MM-DD`).format(`DD MMM YYYY`):`-`}),(0,O.jsx)(`td`,{className:`p-2 border`,children:e.toDate?(0,D.default)(e.toDate,`YYYY-MM-DD`).format(`DD MMM YYYY`):`-`}),(0,O.jsx)(`td`,{className:`p-2 border`,children:e.type}),(0,O.jsx)(`td`,{className:`p-2 border text-gray-500`,children:e.description||`-`})]},t))})]})]}),(0,O.jsxs)(`div`,{className:`modalfooter`,children:[(0,O.jsx)(d,{variant:`outlined`,onClick:()=>{W(!1),K([])},children:`Cancel`}),(0,O.jsxs)(d,{variant:`contained`,loading:be,onClick:je,children:[`Import `,G.length,` Holiday`,G.length===1?``:`s`]})]})]})})}),(0,O.jsx)(S,{open:ve,onClose:()=>{U(!1)},children:(0,O.jsx)(`div`,{className:`membermodal w-[600px]`,children:(0,O.jsxs)(`form`,{onSubmit:Ne,children:[(0,O.jsxs)(`div`,{className:`modalhead`,children:[` `,w?`Edit Holiday`:`Add holiday`]}),(0,O.jsx)(`span`,{className:`modalcontent `,children:(0,O.jsxs)(`div`,{className:`flex flex-col gap-3 w-full`,children:[(0,O.jsx)(u,{required:!0,inputRef:z,label:`Holiday Name`,size:`small`,value:e.name,onChange:e=>t(t=>({...t,name:e.target.value})),fullWidth:!0}),(0,O.jsxs)(`div`,{className:`flex w-full justify-between gap-2`,children:[(0,O.jsx)(f,{required:!0,label:`From Date`,format:`DD/MM/YYYY`,value:e.fromDate,onChange:e=>t(t=>({...t,fromDate:e})),slotProps:{textField:{size:`small`,fullWidth:!0,onBlur:Ee}}}),(0,O.jsx)(f,{required:!0,label:`To Date`,format:`DD/MM/YYYY`,value:e.toDate,onChange:e=>t(t=>({...t,toDate:e})),slotProps:{textField:{size:`small`,fullWidth:!0}}})]}),(0,O.jsxs)(s,{size:`small`,required:!0,fullWidth:!0,children:[(0,O.jsx)(c,{children:`Type`}),(0,O.jsxs)(l,{value:e.type,label:`Type`,onChange:e=>t(t=>({...t,type:e.target.value})),children:[(0,O.jsx)(p,{disabled:!0,value:``,children:`Select Type`}),(0,O.jsx)(p,{value:`National`,children:`National`}),(0,O.jsx)(p,{value:`Religious`,children:`Religious`}),(0,O.jsx)(p,{value:`Public`,children:`Public`}),(0,O.jsx)(p,{value:`Other`,children:`Other`})]})]}),(0,O.jsx)(u,{label:`Description (optional)`,multiline:!0,rows:2,size:`small`,value:e.description,onChange:e=>t(t=>({...t,description:e.target.value})),fullWidth:!0})]})}),(0,O.jsxs)(`div`,{className:`modalfooter`,children:[(0,O.jsx)(d,{variant:`outlined`,onClick:()=>{T(!1),U(!1),t({name:``,type:`Public`,fromDate:null,toDate:null,description:``})},children:`Cancel`}),(0,O.jsxs)(d,{variant:`contained`,type:`submit`,children:[w?`Update`:`Add`,` Holiday`]})]})]})})}),(0,O.jsx)(k,{ref:V,holidays:$,company:A})]})})},he=[{name:`S.no`,selector:(e,t)=>++t,width:`50px`},{name:`Name`,selector:e=>e.name},{name:`From`,selector:e=>(0,D.default)(e.From).format(`DD MMM, YYYY`),width:`110px`},{name:`Till`,selector:e=>(0,D.default)(e.till).format(`DD MMM, YYYY`),width:`110px`},{name:`Type`,selector:e=>e.type,width:`90px`},{name:`Action`,selector:e=>e.action,width:`80px`}];export{M as default};