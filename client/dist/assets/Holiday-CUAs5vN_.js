import{s as e,t}from"./react-CS1XD-7T.js";import{pt as n}from"./dateViewRenderers-gLVQE5P7.js";import{t as r}from"./jsx-runtime-YQseCJ7p.js";import{a as i,d as a,l as o,n as s,t as c}from"./TextField-dLYoKQgc.js";import{t as l}from"./Button-B85hl4ex.js";import{t as u}from"./DatePicker-WIFMCEWI.js";import{t as d}from"./MenuItem-wMTqqzMv.js";import{t as f}from"./iconBase-DWuwI-hW.js";import{Mn as p,P as ee,at as te,b as m,g as h,j as g,jn as ne,k as re,n as ie,ut as ae,v as _}from"./index-Np9gAR9Z.js";import{i as oe}from"./attandencehelper-CUD3tJ0G.js";import{n as se}from"./ai-Dut1cwJW.js";import{n as v,t as ce}from"./AdapterDayjs-C-eboXWU.js";import{r as le}from"./bi-jClemMSd.js";import{t as y}from"./isSameOrBefore-UQY0eLjw.js";import{t as b}from"./Modalbox-ZeX1Aw-G.js";import{n as x,r as ue,t as de}from"./xlsx-7MY0kaW9.js";import{t as fe}from"./react-to-print-DWTCFKTx.js";import{t as pe}from"./holidayCalander-B5yQjfG5.js";var S=e(t(),1),C=e(_(),1),w=e(v(),1),T=e(y(),1);function E(e){return f({tag:`svg`,attr:{viewBox:`0 0 24 24`,fill:`currentColor`},child:[{tag:`path`,attr:{d:`M4 19H20V12H22V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V12H4V19ZM13 9V16H11V9H6L12 3L18 9H13Z`},child:[]}]})(e)}function me(e){return f({tag:`svg`,attr:{viewBox:`0 0 24 24`,fill:`currentColor`},child:[{tag:`path`,attr:{d:`M5 4H15V8H19V20H5V4ZM3.9985 2C3.44749 2 3 2.44405 3 2.9918V21.0082C3 21.5447 3.44476 22 3.9934 22H20.0066C20.5551 22 21 21.5489 21 20.9925L20.9997 7L16 2H3.9985ZM10.4999 7.5C10.4999 9.07749 10.0442 10.9373 9.27493 12.6534C8.50287 14.3757 7.46143 15.8502 6.37524 16.7191L7.55464 18.3321C10.4821 16.3804 13.7233 15.0421 16.8585 15.49L17.3162 13.5513C14.6435 12.6604 12.4999 9.98994 12.4999 7.5H10.4999ZM11.0999 13.4716C11.3673 12.8752 11.6042 12.2563 11.8037 11.6285C12.2753 12.3531 12.8553 13.0182 13.5101 13.5953C12.5283 13.7711 11.5665 14.0596 10.6352 14.4276C10.7999 14.1143 10.9551 13.7948 11.0999 13.4716Z`},child:[]}]})(e)}function D(e){return f({tag:`svg`,attr:{viewBox:`0 0 24 24`,fill:`currentColor`},child:[{tag:`path`,attr:{d:`M2.85858 2.87732L15.4293 1.0815C15.7027 1.04245 15.9559 1.2324 15.995 1.50577C15.9983 1.52919 16 1.55282 16 1.57648V22.4235C16 22.6996 15.7761 22.9235 15.5 22.9235C15.4763 22.9235 15.4527 22.9218 15.4293 22.9184L2.85858 21.1226C2.36593 21.0522 2 20.6303 2 20.1327V3.86727C2 3.36962 2.36593 2.9477 2.85858 2.87732ZM4 4.73457V19.2654L14 20.694V3.30599L4 4.73457ZM17 19H20V4.99997H17V2.99997H21C21.5523 2.99997 22 3.44769 22 3.99997V20C22 20.5523 21.5523 21 21 21H17V19ZM10.2 12L13 16H10.6L9 13.7143L7.39999 16H5L7.8 12L5 7.99997H7.39999L9 10.2857L10.6 7.99997H13L10.2 12Z`},child:[]}]})(e)}var he=e(h(),1),O=r(),k=S.forwardRef(({holidays:e,company:t},n)=>{let r=t?.logo?`/api/logo/${t.logo}`:null;return(0,O.jsx)(`div`,{style:{display:`none`},children:(0,O.jsxs)(`div`,{ref:n,className:`print-container`,children:[(0,O.jsx)(`style`,{children:`
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
        `}),(0,O.jsxs)(`div`,{className:`header`,children:[r&&(0,O.jsx)(`img`,{src:r,alt:`Logo`,className:`logo`}),(0,O.jsxs)(`div`,{className:`company-info`,children:[(0,O.jsx)(`h1`,{className:`company-name`,children:t?.name||`Company Name`}),(0,O.jsxs)(`p`,{className:`company-address`,children:[t?.address||`Company Address`,(0,O.jsx)(`br`,{}),t?.contact||t?.email||``]})]})]}),(0,O.jsx)(`div`,{className:`title-section`,children:(0,O.jsxs)(`h2`,{className:`document-title`,children:[`Official Holiday List - `,(0,C.default)().year()]})}),r?(0,O.jsx)(`img`,{src:r,alt:``,className:`watermark-logo`}):(0,O.jsx)(`div`,{className:`watermark`,children:t?.name||`OFFICIAL`}),(0,O.jsxs)(`table`,{className:`holiday-table`,children:[(0,O.jsx)(`thead`,{children:(0,O.jsxs)(`tr`,{children:[(0,O.jsx)(`th`,{style:{width:`50px`},children:`S.No`}),(0,O.jsx)(`th`,{children:`Holiday Name`}),(0,O.jsx)(`th`,{style:{width:`120px`},children:`From`}),(0,O.jsx)(`th`,{style:{width:`120px`},children:`To`}),(0,O.jsx)(`th`,{style:{width:`100px`},children:`Type`}),(0,O.jsx)(`th`,{children:`Description`})]})}),(0,O.jsx)(`tbody`,{children:e.map((e,t)=>(0,O.jsxs)(`tr`,{children:[(0,O.jsx)(`td`,{style:{textAlign:`center`},children:t+1}),(0,O.jsx)(`td`,{style:{fontWeight:`bold`},children:e.name}),(0,O.jsx)(`td`,{children:(0,C.default)(e.From).format(`DD MMM, YYYY`)}),(0,O.jsx)(`td`,{children:(0,C.default)(e.till).format(`DD MMM, YYYY`)}),(0,O.jsx)(`td`,{children:e.type}),(0,O.jsx)(`td`,{children:e.description||`-`})]},t))})]}),(0,O.jsxs)(`div`,{className:`footer`,children:[(0,O.jsx)(`p`,{children:`Notes: Holidays are subject to change as per management decision. Please refer to official notices for any updates.`}),(0,O.jsxs)(`div`,{className:`print-date`,children:[`Generated on: `,(0,C.default)().format(`DD/MM/YYYY HH:mm`)]})]})]})})});k.displayName=`HolidayPrintable`,C.default.extend(T.default),C.default.extend(w.default);var A=[`DD/MM/YYYY`,`DD-MM-YYYY`,`YYYY-MM-DD`,`MM/DD/YYYY`,`D/M/YYYY`,`D-M-YYYY`,`YYYY/MM/DD`],j=e=>{if(!e)return null;if(e instanceof Date)return(0,C.default)(e);let t=String(e).trim();for(let e of A){let n=(0,C.default)(t,e,!0);if(n.isValid())return n}let n=(0,C.default)(t);return n.isValid()?n:null},M=()=>{let[e,t]=(0,S.useState)({name:``,type:``,fromDate:null,toDate:null,description:``}),[r,f]=(0,S.useState)(null),[h,_]=(0,S.useState)([]),[v,y]=(0,S.useState)([]),[w,T]=(0,S.useState)(!1),{company:A}=ne(e=>e.user),[M,_e]=(0,S.useState)([1]),[N,P]=(0,S.useState)(`All`),[F,I]=(0,S.useState)(`All`),[L,R]=(0,S.useState)(`All`),z=(0,S.useRef)(null),B=(0,S.useRef)(null),V=(0,S.useRef)(null),[ve,H]=(0,S.useState)(!1),[ye,U]=(0,S.useState)(!1),[be,W]=(0,S.useState)(!1),[G,K]=(0,S.useState)([]),[xe,q]=(0,S.useState)(!1),[J,Y]=(0,S.useState)(null),[Se,Ce]=(0,S.useState)(null),we=fe({contentRef:V,documentTitle:`Holiday_List_${(0,C.default)().year()}`}),Te=e=>{Y(e.currentTarget)},X=()=>{Y(null)},Ee=e=>{Ce(e.currentTarget)},Z=()=>{Ce(null)};(0,S.useEffect)(()=>{_e(A?.weeklyOffs||[1])},[A]);let De=()=>{e.fromDate&&!e.toDate&&(0,C.default)(e.fromDate).isValid()&&t(t=>({...t,toDate:e.fromDate}))};(0,S.useEffect)(()=>{Q()},[]);let Q=async()=>{try{let e=(await m({url:`getholidays`})).holidays,t=[];e.forEach(e=>{let n=(0,C.default)(e.fromDate),r=e.toDate?(0,C.default)(e.toDate):n;for(;n.isSameOrBefore(r,`day`);)t.push({date:n.format(`YYYY-MM-DD`),name:e.name}),n=n.add(1,`day`)});let n=e.map(e=>({name:e.name,From:e.fromDate,till:e.toDate,type:e.type,description:e?.description,action:(0,O.jsxs)(`div`,{className:`action flex gap-2.5`,children:[(0,O.jsx)(`span`,{className:`edit text-[18px] text-blue-500 cursor-pointer`,title:`Edit`,onClick:()=>Oe(e),children:(0,O.jsx)(te,{})}),(0,O.jsx)(`span`,{className:`delete text-[18px] text-red-500 cursor-pointer`,onClick:()=>ke(e._id),children:(0,O.jsx)(se,{})})]})}));(0,S.startTransition)(()=>{y(t),_(n)})}catch(e){console.error(`Error fetching holidays:`,e)}},Oe=e=>{T(!0),U(!0),f(e._id),t({name:e.name,type:e.type,fromDate:(0,C.default)(e.fromDate),toDate:(0,C.default)(e.toDate),description:e.description||``}),setTimeout(()=>{z.current?.focus()},0)},ke=async e=>{(0,he.default)({title:`Are you sure you want to Delete?`,icon:`warning`,buttons:!0,dangerMode:!0}).then(async t=>{if(t)try{let t=await m({url:`deleteholiday`,method:`POST`,body:{id:e}});p.success(t.message),Q()}catch(e){console.error(e)}})},Ae=()=>{if($.length===0){p.info(`No holidays to export.`);return}let e=$.map((e,t)=>({"S.No":t+1,Name:e.name,"From Date":(0,C.default)(e.From).format(`DD/MM/YYYY`),"To Date":(0,C.default)(e.till).format(`DD/MM/YYYY`),Type:e.type||``,Description:e.description||``})),t=x.json_to_sheet(e),n=x.book_new();x.book_append_sheet(n,t,`Holidays`),ue(n,`holidays_${(0,C.default)().format(`YYYY-MM-DD`)}.xlsx`)},je=e=>{let t=e.target.files[0];if(!t)return;let n=new FileReader;n.onload=e=>{try{let t=de(e.target.result,{type:`binary`,cellDates:!0}),n=t.Sheets[t.SheetNames[0]],r=x.sheet_to_json(n,{defval:``}).map(e=>{let t=e[`From Date`]??e.fromDate??e.from_date??``,n=e[`To Date`]??e.toDate??e.to_date??t,r=j(t),i=j(n)||r;return{name:e.Name||e.name||``,fromDate:r?r.format(`YYYY-MM-DD`):``,toDate:i?i.format(`YYYY-MM-DD`):``,type:e.Type||e.type||`Other`,description:e.Description||e.description||``}}).filter(e=>e.name&&e.fromDate);if(r.length===0){p.error(`No valid rows found. Make sure the file has Name, From Date, To Date, Type columns.`);return}K(r),W(!0)}catch{p.error(`Failed to read the file. Please use a valid xlsx/csv format.`)}},n.readAsBinaryString(t),e.target.value=``},Me=async()=>{if(G.length!==0){q(!0);try{let e=await m({url:`bulkImportHolidays`,method:`POST`,body:{holidays:G}});p.success(e.message),W(!1),K([]),Q()}catch(e){p.error(e.message||`Import failed`)}finally{q(!1)}}},Ne=()=>{let e=x.json_to_sheet([{Name:`Saraswati Puja`,"From Date":`02-02-2026`,"To Date":`02-02-2026`,Type:`Religious`,Description:`Basant Panchami - Goddess of knowledge`},{Name:`Holi`,"From Date":`14-03-2026`,"To Date":`14-03-2026`,Type:`Religious`,Description:`Festival of colours`},{Name:`Diwali`,"From Date":`20-10-2026`,"To Date":`20-10-2026`,Type:`Religious`,Description:`Festival of lights`},{Name:`Chhath Puja`,"From Date":`28-10-2026`,"To Date":`28-10-2026`,Type:`Religious`,Description:`Chhath Puja - worship of the Sun God`}]);e[`!cols`]=[{wch:20},{wch:14},{wch:14},{wch:12},{wch:30}];let t=x.book_new();x.book_append_sheet(t,e,`Holidays`),ue(t,`holidays_sample.xlsx`)},Pe=async n=>{n.preventDefault();try{let n=e.fromDate?(0,C.default)(e.fromDate).format(`YYYY-MM-DD`):null,i=e.toDate?(0,C.default)(e.toDate).format(`YYYY-MM-DD`):null,a=w?`updateholiday`:`addholiday`,o={...e,fromDate:n,toDate:i,...w?{holidayId:r}:{}},s=await m({url:a,method:`POST`,body:o});p.success(s.message),t({name:``,type:`Public`,fromDate:null,toDate:null,description:``}),T(!1),U(!1),Q()}catch(e){console.error(`Error saving holiday:`,e)}},$=(0,S.useMemo)(()=>h.filter(e=>{let t=(0,C.default)(e.From),n=N===`All`||t.year().toString()===N.toString(),r=F===`All`||t.month()===parseInt(F),i=L===`All`||e.type===L;return n&&r&&i}),[h,N,F,L]),Fe=[`Jan`,`Feb`,`Mar`,`Apr`,`May`,`Jun`,`Jul`,`Aug`,`Sep`,`Oct`,`Nov`,`Dec`],Ie=(0,S.useMemo)(()=>{if(!h||h.length===0)return[];let e=new Set;return h.forEach(t=>{let n=(0,C.default)(t.From).year();n&&e.add(n)}),Array.from(e).sort((e,t)=>t-e)},[h]);return(0,O.jsx)(`div`,{className:`max-w-7xl mx-auto`,children:(0,O.jsxs)(n,{dateAdapter:ce,children:[(0,O.jsxs)(`div`,{className:`flex flex-wrap  justify-between items-center gap-3 w-full my-4`,children:[(0,O.jsxs)(`div`,{className:`flex gap-2 flex-wrap justify-between w-full md:w-fit`,children:[(0,O.jsxs)(a,{size:`small`,className:`w-[47%] md:w-[120px]`,children:[(0,O.jsx)(o,{children:`Year`}),(0,O.jsxs)(s,{label:`Year`,value:N,onChange:e=>P(e.target.value),children:[(0,O.jsx)(d,{value:`All`,children:`All`}),Ie.map(e=>(0,O.jsx)(d,{value:e,children:e},e))]})]}),(0,O.jsxs)(a,{size:`small`,className:`w-[47%] md:w-[120px]`,children:[(0,O.jsx)(o,{children:`Month`}),(0,O.jsxs)(s,{label:`Month`,value:F,onChange:e=>I(e.target.value),children:[(0,O.jsx)(d,{value:`All`,children:`All`}),Fe.map((e,t)=>(0,O.jsx)(d,{value:t,children:e},e))]})]}),(0,O.jsxs)(a,{size:`small`,className:`w-[47%] md:w-[150px]`,children:[(0,O.jsx)(o,{children:`Type`}),(0,O.jsxs)(s,{label:`Filter by Type`,value:L,onChange:e=>R(e.target.value),children:[(0,O.jsx)(d,{value:`All`,children:`All`}),[...new Set(h.map(e=>e.type))].map(e=>(0,O.jsx)(d,{value:e,children:e},e))]})]}),(0,O.jsx)(l,{variant:`outlined`,color:`secondary`,className:`w-[47%] md:w-fit`,startIcon:(0,O.jsx)(ae,{}),onClick:()=>{P(`All`),I(`All`),R(`All`)},children:`Reset`})]}),(0,O.jsxs)(`div`,{className:`flex flex-col sm:flex-row gap-2 w-full md:w-fit`,children:[(0,O.jsx)(l,{startIcon:(0,O.jsx)(ee,{}),variant:`outlined`,onClick:()=>H(!0),children:`Calendar`}),(0,O.jsx)(l,{startIcon:(0,O.jsx)(D,{}),endIcon:(0,O.jsx)(g,{}),variant:`outlined`,color:`primary`,onClick:Te,children:`Export`}),(0,O.jsxs)(i,{anchorEl:J,open:!!J,onClose:X,children:[(0,O.jsxs)(d,{onClick:()=>{Ae(),X()},children:[(0,O.jsx)(D,{style:{marginRight:`8px`,color:`#16a34a`}}),` Excel File`]}),(0,O.jsxs)(d,{onClick:()=>{we(),X()},children:[(0,O.jsx)(me,{style:{marginRight:`8px`,color:`#dc2626`}}),` PDF List (Official)`]})]}),(0,O.jsx)(l,{startIcon:(0,O.jsx)(E,{}),endIcon:(0,O.jsx)(g,{}),variant:`outlined`,color:`inherit`,onClick:Ee,children:`Import`}),(0,O.jsxs)(i,{anchorEl:Se,open:!!Se,onClose:Z,children:[(0,O.jsxs)(d,{onClick:()=>{B.current?.click(),Z()},children:[(0,O.jsx)(E,{style:{marginRight:`8px`}}),` Upload Excel/CSV`]}),(0,O.jsxs)(d,{onClick:()=>{Ne(),Z()},children:[(0,O.jsx)(D,{style:{marginRight:`8px`,color:`#0ea5e9`}}),` Download Sample`]})]}),(0,O.jsx)(`input`,{ref:B,type:`file`,accept:`.xlsx,.xls,.csv`,style:{display:`none`},onChange:je}),(0,O.jsx)(l,{startIcon:(0,O.jsx)(re,{}),variant:`contained`,onClick:()=>U(!0),children:`Add Holiday`})]})]}),(0,O.jsx)(`div`,{className:`capitalize`,children:(0,O.jsx)(ie,{columns:ge,data:$,pagination:!0,customStyles:oe(),noDataComponent:(0,O.jsxs)(`div`,{className:`flex items-center gap-2 py-6 text-center text-gray-600 text-sm`,children:[(0,O.jsx)(le,{className:`text-xl`}),` No records found.`]}),highlightOnHover:!0})}),(0,O.jsx)(b,{open:ve,onClose:()=>H(!1),children:(0,O.jsx)(`div`,{className:`membermodal w-[400px]`,children:(0,O.jsx)(pe,{highlightedDates:v.map(e=>({date:(0,C.default)(e.date),name:e.name})),weeklyOffs:M})})}),(0,O.jsx)(b,{open:be,onClose:()=>W(!1),children:(0,O.jsx)(`div`,{className:`membermodal w-[700px]`,children:(0,O.jsxs)(`div`,{className:`whole`,children:[(0,O.jsxs)(`div`,{className:`modalhead`,children:[`Import Preview (`,G.length,` records)`]}),(0,O.jsxs)(`div`,{className:`modalcontent overflow-auto max-h-[400px]`,children:[(0,O.jsx)(`p`,{className:`text-sm text-gray-500 mb-2`,children:`Review the parsed holidays below before importing.`}),(0,O.jsxs)(`table`,{className:`w-full text-sm border-collapse`,children:[(0,O.jsx)(`thead`,{children:(0,O.jsxs)(`tr`,{className:`bg-gray-100 text-left`,children:[(0,O.jsx)(`th`,{className:`p-2 border`,children:`#`}),(0,O.jsx)(`th`,{className:`p-2 border`,children:`Name`}),(0,O.jsx)(`th`,{className:`p-2 border`,children:`From`}),(0,O.jsx)(`th`,{className:`p-2 border`,children:`To`}),(0,O.jsx)(`th`,{className:`p-2 border`,children:`Type`}),(0,O.jsx)(`th`,{className:`p-2 border`,children:`Description`})]})}),(0,O.jsx)(`tbody`,{children:G.map((e,t)=>(0,O.jsxs)(`tr`,{className:`border-b hover:bg-gray-50`,children:[(0,O.jsx)(`td`,{className:`p-2 border text-gray-500`,children:t+1}),(0,O.jsx)(`td`,{className:`p-2 border font-medium`,children:e.name}),(0,O.jsx)(`td`,{className:`p-2 border`,children:e.fromDate?(0,C.default)(e.fromDate,`YYYY-MM-DD`).format(`DD MMM YYYY`):`-`}),(0,O.jsx)(`td`,{className:`p-2 border`,children:e.toDate?(0,C.default)(e.toDate,`YYYY-MM-DD`).format(`DD MMM YYYY`):`-`}),(0,O.jsx)(`td`,{className:`p-2 border`,children:e.type}),(0,O.jsx)(`td`,{className:`p-2 border text-gray-500`,children:e.description||`-`})]},t))})]})]}),(0,O.jsxs)(`div`,{className:`modalfooter`,children:[(0,O.jsx)(l,{variant:`outlined`,onClick:()=>{W(!1),K([])},children:`Cancel`}),(0,O.jsxs)(l,{variant:`contained`,loading:xe,onClick:Me,children:[`Import `,G.length,` Holiday`,G.length===1?``:`s`]})]})]})})}),(0,O.jsx)(b,{open:ye,onClose:()=>{U(!1)},children:(0,O.jsx)(`div`,{className:`membermodal w-[600px]`,children:(0,O.jsxs)(`form`,{onSubmit:Pe,children:[(0,O.jsxs)(`div`,{className:`modalhead`,children:[` `,w?`Edit Holiday`:`Add holiday`]}),(0,O.jsx)(`span`,{className:`modalcontent `,children:(0,O.jsxs)(`div`,{className:`flex flex-col gap-3 w-full`,children:[(0,O.jsx)(c,{required:!0,inputRef:z,label:`Holiday Name`,size:`small`,value:e.name,onChange:e=>t(t=>({...t,name:e.target.value})),fullWidth:!0}),(0,O.jsxs)(`div`,{className:`flex w-full justify-between gap-2`,children:[(0,O.jsx)(u,{required:!0,label:`From Date`,format:`DD/MM/YYYY`,value:e.fromDate,onChange:e=>t(t=>({...t,fromDate:e})),slotProps:{textField:{size:`small`,fullWidth:!0,onBlur:De}}}),(0,O.jsx)(u,{required:!0,label:`To Date`,format:`DD/MM/YYYY`,value:e.toDate,onChange:e=>t(t=>({...t,toDate:e})),slotProps:{textField:{size:`small`,fullWidth:!0}}})]}),(0,O.jsxs)(a,{size:`small`,required:!0,fullWidth:!0,children:[(0,O.jsx)(o,{children:`Type`}),(0,O.jsxs)(s,{value:e.type,label:`Type`,onChange:e=>t(t=>({...t,type:e.target.value})),children:[(0,O.jsx)(d,{disabled:!0,value:``,children:`Select Type`}),(0,O.jsx)(d,{value:`National`,children:`National`}),(0,O.jsx)(d,{value:`Religious`,children:`Religious`}),(0,O.jsx)(d,{value:`Public`,children:`Public`}),(0,O.jsx)(d,{value:`Other`,children:`Other`})]})]}),(0,O.jsx)(c,{label:`Description (optional)`,multiline:!0,rows:2,size:`small`,value:e.description,onChange:e=>t(t=>({...t,description:e.target.value})),fullWidth:!0})]})}),(0,O.jsxs)(`div`,{className:`modalfooter`,children:[(0,O.jsx)(l,{variant:`outlined`,onClick:()=>{T(!1),U(!1),t({name:``,type:`Public`,fromDate:null,toDate:null,description:``})},children:`Cancel`}),(0,O.jsxs)(l,{variant:`contained`,type:`submit`,children:[w?`Update`:`Add`,` Holiday`]})]})]})})}),(0,O.jsx)(k,{ref:V,holidays:$,company:A})]})})},ge=[{name:`S.no`,selector:(e,t)=>++t,width:`50px`},{name:`Name`,selector:e=>e.name},{name:`From`,selector:e=>(0,C.default)(e.From).format(`DD MMM, YYYY`),width:`110px`},{name:`Till`,selector:e=>(0,C.default)(e.till).format(`DD MMM, YYYY`),width:`110px`},{name:`Type`,selector:e=>e.type,width:`90px`},{name:`Action`,selector:e=>e.action,width:`80px`}];export{M as default};