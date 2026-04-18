import{au as _,ap as ke,j as e,f as o,r as l,g as Ie,d as F,S as Re,U as Le,y as f,av as Pe,aw as Ee,ax as re,ay as ze,X as Ve}from"./index-Bo5DnxLv.js";import{i as _e}from"./isSameOrBefore-czUyX0Q3.js";import{A as Oe,c as Be}from"./AdapterDayjs-DXAkKUm4.js";import{A as Ze}from"./index-D2nSJZ0K.js";import{l as Ue}from"./index-CDqTi8fD.js";import{u as We}from"./attandencehelper-5zcwedGb.js";import{H as qe}from"./holidayCalander-D10RHul8.js";import{a as Ge}from"./index-BOGfns5M.js";import{M as z}from"./Modalbox-51IpmJEf.js";import{u as j,w as le,r as $e}from"./xlsx-BBWTpfDg.js";import{F as T,I as A,S as k,a as oe}from"./Select-BJtkQwOv.js";import{M as m}from"./MenuItem-DxmW8jgC.js";import{B as h}from"./Button-CdMde27V.js";import{T as ie}from"./TextField-CECMSY-l.js";import{D as ne}from"./DatePicker-CDhNuYo4.js";import{L as Je}from"./dateViewRenderers-BkudeFph.js";import"./isBetween-A2Ejymf9.js";import"./Box-XI4ZqjyT.js";import"./index-agninb2s.js";import"./Tooltip-BShbKUV_.js";import"./Popper-De0PCvun.js";import"./createSimplePaletteValueFilter-D5zpE19F.js";import"./isMuiElement-9c9wUjHT.js";import"./dividerClasses-C9l5akg_.js";import"./index-CoDtTDfS.js";import"./useThemeProps-D83gy_MO.js";import"./InputAdornment-D7a0kjT-.js";import"./Typography-DZ-LbczY.js";import"./IconButton-Cj3VjeH4.js";import"./DialogContent-nZiBcG9n.js";import"./DialogActions-C9TBkdT4.js";import"./Chip-SQC8w8_v.js";function V(s){return _({attr:{viewBox:"0 0 24 24",fill:"currentColor"},child:[{tag:"path",attr:{d:"M2.85858 2.87732L15.4293 1.0815C15.7027 1.04245 15.9559 1.2324 15.995 1.50577C15.9983 1.52919 16 1.55282 16 1.57648V22.4235C16 22.6996 15.7761 22.9235 15.5 22.9235C15.4763 22.9235 15.4527 22.9218 15.4293 22.9184L2.85858 21.1226C2.36593 21.0522 2 20.6303 2 20.1327V3.86727C2 3.36962 2.36593 2.9477 2.85858 2.87732ZM4 4.73457V19.2654L14 20.694V3.30599L4 4.73457ZM17 19H20V4.99997H17V2.99997H21C21.5523 2.99997 22 3.44769 22 3.99997V20C22 20.5523 21.5523 21 21 21H17V19ZM10.2 12L13 16H10.6L9 13.7143L7.39999 16H5L7.8 12L5 7.99997H7.39999L9 10.2857L10.6 7.99997H13L10.2 12Z"},child:[]}]})(s)}function Xe(s){return _({attr:{viewBox:"0 0 24 24",fill:"currentColor"},child:[{tag:"path",attr:{d:"M5 4H15V8H19V20H5V4ZM3.9985 2C3.44749 2 3 2.44405 3 2.9918V21.0082C3 21.5447 3.44476 22 3.9934 22H20.0066C20.5551 22 21 21.5489 21 20.9925L20.9997 7L16 2H3.9985ZM10.4999 7.5C10.4999 9.07749 10.0442 10.9373 9.27493 12.6534C8.50287 14.3757 7.46143 15.8502 6.37524 16.7191L7.55464 18.3321C10.4821 16.3804 13.7233 15.0421 16.8585 15.49L17.3162 13.5513C14.6435 12.6604 12.4999 9.98994 12.4999 7.5H10.4999ZM11.0999 13.4716C11.3673 12.8752 11.6042 12.2563 11.8037 11.6285C12.2753 12.3531 12.8553 13.0182 13.5101 13.5953C12.5283 13.7711 11.5665 14.0596 10.6352 14.4276C10.7999 14.1143 10.9551 13.7948 11.0999 13.4716Z"},child:[]}]})(s)}function de(s){return _({attr:{viewBox:"0 0 24 24",fill:"currentColor"},child:[{tag:"path",attr:{d:"M4 19H20V12H22V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V12H4V19ZM13 9V16H11V9H6L12 3L18 9H13Z"},child:[]}]})(s)}const me=ke.forwardRef(({holidays:s,company:r},y)=>{const x=r!=null&&r.logo?`/api/logo/${r.logo}`:null;return e.jsx("div",{style:{display:"none"},children:e.jsxs("div",{ref:y,className:"print-container",children:[e.jsx("style",{children:`
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
        `}),e.jsxs("div",{className:"header",children:[x&&e.jsx("img",{src:x,alt:"Logo",className:"logo"}),e.jsxs("div",{className:"company-info",children:[e.jsx("h1",{className:"company-name",children:(r==null?void 0:r.name)||"Company Name"}),e.jsxs("p",{className:"company-address",children:[(r==null?void 0:r.address)||"Company Address",e.jsx("br",{}),(r==null?void 0:r.contact)||(r==null?void 0:r.email)||""]})]})]}),e.jsx("div",{className:"title-section",children:e.jsxs("h2",{className:"document-title",children:["Official Holiday List - ",o().year()]})}),x?e.jsx("img",{src:x,alt:"",className:"watermark-logo"}):e.jsx("div",{className:"watermark",children:(r==null?void 0:r.name)||"OFFICIAL"}),e.jsxs("table",{className:"holiday-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{style:{width:"50px"},children:"S.No"}),e.jsx("th",{children:"Holiday Name"}),e.jsx("th",{style:{width:"120px"},children:"From"}),e.jsx("th",{style:{width:"120px"},children:"To"}),e.jsx("th",{style:{width:"100px"},children:"Type"}),e.jsx("th",{children:"Description"})]})}),e.jsx("tbody",{children:s.map((d,Y)=>e.jsxs("tr",{children:[e.jsx("td",{style:{textAlign:"center"},children:Y+1}),e.jsx("td",{style:{fontWeight:"bold"},children:d.name}),e.jsx("td",{children:o(d.From).format("DD MMM, YYYY")}),e.jsx("td",{children:o(d.till).format("DD MMM, YYYY")}),e.jsx("td",{children:d.type}),e.jsx("td",{children:d.description||"-"})]},Y))})]}),e.jsxs("div",{className:"footer",children:[e.jsx("p",{children:"Notes: Holidays are subject to change as per management decision. Please refer to official notices for any updates."}),e.jsxs("div",{className:"print-date",children:["Generated on: ",o().format("DD/MM/YYYY HH:mm")]})]})]})})});me.displayName="HolidayPrintable";o.extend(_e);o.extend(Be);const Ke=["DD/MM/YYYY","DD-MM-YYYY","YYYY-MM-DD","MM/DD/YYYY","D/M/YYYY","D-M-YYYY","YYYY/MM/DD"],ce=s=>{if(!s)return null;if(s instanceof Date)return o(s);const r=String(s).trim();for(const x of Ke){const d=o(r,x,!0);if(d.isValid())return d}const y=o(r);return y.isValid()?y:null},At=()=>{const[s,r]=l.useState({name:"",type:"",fromDate:null,toDate:null,description:""}),[y,x]=l.useState(null),[d,Y]=l.useState([]),[pe,he]=l.useState([]),[b,I]=l.useState(!1),{company:D}=Ie(t=>t.user),[xe,ue]=l.useState([1]),[M,O]=l.useState("All"),[v,B]=l.useState("All"),[N,Z]=l.useState("All"),U=l.useRef(null),W=l.useRef(null),q=l.useRef(null),[fe,G]=l.useState(!1),[je,w]=l.useState(!1),[ye,C]=l.useState(!1),[g,R]=l.useState([]),[ge,$]=l.useState(!1),[J,X]=l.useState(null),[K,Q]=l.useState(null),De=Ue.useReactToPrint({contentRef:q,documentTitle:`Holiday_List_${o().year()}`}),we=t=>{X(t.currentTarget)},L=()=>{X(null)},Ye=t=>{Q(t.currentTarget)},P=()=>{Q(null)};l.useEffect(()=>{ue((D==null?void 0:D.weeklyOffs)||[1])},[D]),l.useEffect(()=>{if(s.fromDate&&!s.toDate){const t=o(s.fromDate);t.isValid()&&r(a=>({...a,toDate:t}))}},[s.fromDate]),l.useEffect(()=>{S()},[]);const S=async()=>{try{const a=(await F({url:"getholidays"})).holidays,i=[];a.forEach(n=>{let u=o(n.fromDate);const ee=n.toDate?o(n.toDate):u;for(;u.isSameOrBefore(ee,"day");)i.push({date:u.format("YYYY-MM-DD"),name:n.name}),u=u.add(1,"day")});const p=a.map(n=>({name:n.name,From:n.fromDate,till:n.toDate,type:n.type,description:n==null?void 0:n.description,action:e.jsxs("div",{className:"action flex gap-2.5",children:[e.jsx("span",{className:"edit text-[18px] text-blue-500 cursor-pointer",title:"Edit",onClick:()=>be(n),children:e.jsx(Re,{})}),e.jsx("span",{className:"delete text-[18px] text-red-500 cursor-pointer",onClick:()=>Me(n._id),children:e.jsx(Ze,{})})]})}));l.startTransition(()=>{he(i),Y(p)})}catch(t){console.error("Error fetching holidays:",t)}},be=t=>{I(!0),w(!0),x(t._id),r({name:t.name,type:t.type,fromDate:o(t.fromDate),toDate:o(t.toDate),description:t.description||""}),setTimeout(()=>{var a;(a=U.current)==null||a.focus()},0)},Me=async t=>{Le({title:"Are you sure you want to Delete?",icon:"warning",buttons:!0,dangerMode:!0}).then(async a=>{if(a)try{const i=await F({url:"deleteholiday",method:"POST",body:{id:t}});f.success(i.message),S()}catch(i){console.error(i)}})},ve=()=>{if(H.length===0){f.info("No holidays to export.");return}const t=H.map((p,n)=>({"S.No":n+1,Name:p.name,"From Date":o(p.From).format("DD/MM/YYYY"),"To Date":o(p.till).format("DD/MM/YYYY"),Type:p.type||"",Description:p.description||""})),a=j.json_to_sheet(t),i=j.book_new();j.book_append_sheet(i,a,"Holidays"),le(i,`holidays_${o().format("YYYY-MM-DD")}.xlsx`)},Ne=t=>{const a=t.target.files[0];if(!a)return;const i=new FileReader;i.onload=p=>{try{const n=$e(p.target.result,{type:"binary",cellDates:!0}),u=n.Sheets[n.SheetNames[0]],te=j.sheet_to_json(u,{defval:""}).map(c=>{const ae=c["From Date"]??c.fromDate??c.from_date??"",Ae=c["To Date"]??c.toDate??c.to_date??ae,E=ce(ae),se=ce(Ae)||E;return{name:c.Name||c.name||"",fromDate:E?E.format("YYYY-MM-DD"):"",toDate:se?se.format("YYYY-MM-DD"):"",type:c.Type||c.type||"Other",description:c.Description||c.description||""}}).filter(c=>c.name&&c.fromDate);if(te.length===0){f.error("No valid rows found. Make sure the file has Name, From Date, To Date, Type columns.");return}R(te),C(!0)}catch{f.error("Failed to read the file. Please use a valid xlsx/csv format.")}},i.readAsBinaryString(a),t.target.value=""},Ce=async()=>{if(g.length!==0){$(!0);try{const t=await F({url:"bulkImportHolidays",method:"POST",body:{holidays:g}});f.success(t.message),C(!1),R([]),S()}catch(t){f.error(t.message||"Import failed")}finally{$(!1)}}},Se=()=>{const t=[{Name:"Saraswati Puja","From Date":"02-02-2026","To Date":"02-02-2026",Type:"Religious",Description:"Basant Panchami - Goddess of knowledge"},{Name:"Holi","From Date":"14-03-2026","To Date":"14-03-2026",Type:"Religious",Description:"Festival of colours"},{Name:"Diwali","From Date":"20-10-2026","To Date":"20-10-2026",Type:"Religious",Description:"Festival of lights"},{Name:"Chhath Puja","From Date":"28-10-2026","To Date":"28-10-2026",Type:"Religious",Description:"Chhath Puja - worship of the Sun God"}],a=j.json_to_sheet(t);a["!cols"]=[{wch:20},{wch:14},{wch:14},{wch:12},{wch:30}];const i=j.book_new();j.book_append_sheet(i,a,"Holidays"),le(i,"holidays_sample.xlsx")},He=async t=>{t.preventDefault();try{const a=b?"updateholiday":"addholiday",i=b?{...s,holidayId:y}:s,p=await F({url:a,method:"POST",body:i});f.success(p.message),r({name:"",type:"Public",fromDate:null,toDate:null,description:""}),I(!1),w(!1),S()}catch(a){console.error("Error saving holiday:",a)}},H=l.useMemo(()=>d.filter(t=>{const a=o(t.From),i=M==="All"||a.year().toString()===M.toString(),p=v==="All"||a.month()===parseInt(v),n=N==="All"||t.type===N;return i&&p&&n}),[d,M,v,N]),Fe=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],Te=l.useMemo(()=>{if(!d||d.length===0)return[];const t=new Set;return d.forEach(a=>{const i=o(a.From).year();i&&t.add(i)}),Array.from(t).sort((a,i)=>i-a)},[d]);return e.jsx("div",{className:"max-w-7xl mx-auto",children:e.jsxs(Je,{dateAdapter:Oe,children:[e.jsxs("div",{className:"flex flex-wrap  justify-between items-center gap-3 w-full my-4",children:[e.jsxs("div",{className:"flex gap-2 flex-wrap justify-between w-full md:w-fit",children:[e.jsxs(T,{size:"small",className:"w-[47%] md:w-[120px]",children:[e.jsx(A,{children:"Year"}),e.jsxs(k,{label:"Year",value:M,onChange:t=>O(t.target.value),children:[e.jsx(m,{value:"All",children:"All"}),Te.map(t=>e.jsx(m,{value:t,children:t},t))]})]}),e.jsxs(T,{size:"small",className:"w-[47%] md:w-[120px]",children:[e.jsx(A,{children:"Month"}),e.jsxs(k,{label:"Month",value:v,onChange:t=>B(t.target.value),children:[e.jsx(m,{value:"All",children:"All"}),Fe.map((t,a)=>e.jsx(m,{value:a,children:t},t))]})]}),e.jsxs(T,{size:"small",className:"w-[47%] md:w-[150px]",children:[e.jsx(A,{children:"Type"}),e.jsxs(k,{label:"Filter by Type",value:N,onChange:t=>Z(t.target.value),children:[e.jsx(m,{value:"All",children:"All"}),[...new Set(d.map(t=>t.type))].map(t=>e.jsx(m,{value:t,children:t},t))]})]}),e.jsx(h,{variant:"outlined",color:"secondary",className:"w-[47%] md:w-fit",startIcon:e.jsx(Pe,{}),onClick:()=>{O("All"),B("All"),Z("All")},children:"Reset"})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-2 w-full md:w-fit",children:[e.jsx(h,{startIcon:e.jsx(Ee,{}),variant:"outlined",onClick:()=>G(!0),children:"Calendar"}),e.jsx(h,{startIcon:e.jsx(V,{}),endIcon:e.jsx(re,{}),variant:"outlined",color:"primary",onClick:we,children:"Export"}),e.jsxs(oe,{anchorEl:J,open:!!J,onClose:L,children:[e.jsxs(m,{onClick:()=>{ve(),L()},children:[e.jsx(V,{style:{marginRight:"8px",color:"#16a34a"}})," Excel File"]}),e.jsxs(m,{onClick:()=>{De(),L()},children:[e.jsx(Xe,{style:{marginRight:"8px",color:"#dc2626"}})," PDF List (Official)"]})]}),e.jsx(h,{startIcon:e.jsx(de,{}),endIcon:e.jsx(re,{}),variant:"outlined",color:"inherit",onClick:Ye,children:"Import"}),e.jsxs(oe,{anchorEl:K,open:!!K,onClose:P,children:[e.jsxs(m,{onClick:()=>{var t;(t=W.current)==null||t.click(),P()},children:[e.jsx(de,{style:{marginRight:"8px"}})," Upload Excel/CSV"]}),e.jsxs(m,{onClick:()=>{Se(),P()},children:[e.jsx(V,{style:{marginRight:"8px",color:"#0ea5e9"}})," Download Sample"]})]}),e.jsx("input",{ref:W,type:"file",accept:".xlsx,.xls,.csv",style:{display:"none"},onChange:Ne}),e.jsx(h,{startIcon:e.jsx(ze,{}),variant:"contained",onClick:()=>w(!0),children:"Add Holiday"})]})]}),e.jsx("div",{className:"capitalize",children:e.jsx(Ve,{columns:Qe,data:H,pagination:!0,customStyles:We(),noDataComponent:e.jsxs("div",{className:"flex items-center gap-2 py-6 text-center text-gray-600 text-sm",children:[e.jsx(Ge,{className:"text-xl"})," No records found."]}),highlightOnHover:!0})}),e.jsx(z,{open:fe,onClose:()=>G(!1),children:e.jsx("div",{className:"membermodal w-[400px]",children:e.jsx(qe,{highlightedDates:pe.map(t=>({date:o(t.date),name:t.name})),weeklyOffs:xe})})}),e.jsx(z,{open:ye,onClose:()=>C(!1),children:e.jsx("div",{className:"membermodal w-[700px]",children:e.jsxs("div",{className:"whole",children:[e.jsxs("div",{className:"modalhead",children:["Import Preview (",g.length," records)"]}),e.jsxs("div",{className:"modalcontent overflow-auto max-h-[400px]",children:[e.jsx("p",{className:"text-sm text-gray-500 mb-2",children:"Review the parsed holidays below before importing."}),e.jsxs("table",{className:"w-full text-sm border-collapse",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-gray-100 text-left",children:[e.jsx("th",{className:"p-2 border",children:"#"}),e.jsx("th",{className:"p-2 border",children:"Name"}),e.jsx("th",{className:"p-2 border",children:"From"}),e.jsx("th",{className:"p-2 border",children:"To"}),e.jsx("th",{className:"p-2 border",children:"Type"}),e.jsx("th",{className:"p-2 border",children:"Description"})]})}),e.jsx("tbody",{children:g.map((t,a)=>e.jsxs("tr",{className:"border-b hover:bg-gray-50",children:[e.jsx("td",{className:"p-2 border text-gray-500",children:a+1}),e.jsx("td",{className:"p-2 border font-medium",children:t.name}),e.jsx("td",{className:"p-2 border",children:t.fromDate?o(t.fromDate,"YYYY-MM-DD").format("DD MMM YYYY"):"-"}),e.jsx("td",{className:"p-2 border",children:t.toDate?o(t.toDate,"YYYY-MM-DD").format("DD MMM YYYY"):"-"}),e.jsx("td",{className:"p-2 border",children:t.type}),e.jsx("td",{className:"p-2 border text-gray-500",children:t.description||"-"})]},a))})]})]}),e.jsxs("div",{className:"modalfooter",children:[e.jsx(h,{variant:"outlined",onClick:()=>{C(!1),R([])},children:"Cancel"}),e.jsxs(h,{variant:"contained",loading:ge,onClick:Ce,children:["Import ",g.length," Holiday",g.length!==1?"s":""]})]})]})})}),e.jsx(z,{open:je,onClose:()=>{w(!1)},children:e.jsx("div",{className:"membermodal w-[600px]",children:e.jsxs("form",{onSubmit:He,children:[e.jsxs("div",{className:"modalhead",children:[" ",b?"Edit Holiday":"Add holiday"]}),e.jsx("span",{className:"modalcontent ",children:e.jsxs("div",{className:"flex flex-col gap-3 w-full",children:[e.jsx(ie,{required:!0,inputRef:U,label:"Holiday Name",size:"small",value:s.name,onChange:t=>r(a=>({...a,name:t.target.value})),fullWidth:!0}),e.jsxs("div",{className:"flex w-full justify-between gap-2",children:[e.jsx(ne,{required:!0,label:"From Date",format:"DD/MM/YYYY",value:s.fromDate,onChange:t=>r(a=>({...a,fromDate:t})),slotProps:{textField:{size:"small",fullWidth:!0}}}),e.jsx(ne,{required:!0,label:"To Date",format:"DD/MM/YYYY",value:s.toDate,onChange:t=>r(a=>({...a,toDate:t})),slotProps:{textField:{size:"small",fullWidth:!0}}})]}),e.jsxs(T,{size:"small",required:!0,fullWidth:!0,children:[e.jsx(A,{children:"Type"}),e.jsxs(k,{value:s.type,label:"Type",onChange:t=>r(a=>({...a,type:t.target.value})),children:[e.jsx(m,{disabled:!0,value:"",children:"Select Type"}),e.jsx(m,{value:"National",children:"National"}),e.jsx(m,{value:"Religious",children:"Religious"}),e.jsx(m,{value:"Public",children:"Public"}),e.jsx(m,{value:"Other",children:"Other"})]})]}),e.jsx(ie,{label:"Description (optional)",multiline:!0,rows:2,size:"small",value:s.description,onChange:t=>r(a=>({...a,description:t.target.value})),fullWidth:!0})]})}),e.jsxs("div",{className:"modalfooter",children:[e.jsx(h,{variant:"outlined",onClick:()=>{I(!1),w(!1),r({name:"",type:"Public",fromDate:null,toDate:null,description:""})},children:"Cancel"}),e.jsxs(h,{variant:"contained",type:"submit",children:[b?"Update":"Add"," Holiday"]})]})]})})}),e.jsx(me,{ref:q,holidays:H,company:D})]})})},Qe=[{name:"S.no",selector:(s,r)=>++r,width:"50px"},{name:"Name",selector:s=>s.name},{name:"From",selector:s=>o(s.From).format("DD MMM, YYYY"),width:"110px"},{name:"Till",selector:s=>o(s.till).format("DD MMM, YYYY"),width:"110px"},{name:"Type",selector:s=>s.type,width:"90px"},{name:"Action",selector:s=>s.action,width:"80px"}];export{At as default};
