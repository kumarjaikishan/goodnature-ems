import{r as n,j as e,a as j,y as m}from"./index-BeClL1wO.js";/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=(...a)=>a.filter((r,s,o)=>!!r&&r.trim()!==""&&o.indexOf(r)===s).join(" ").trim();/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=a=>a.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=a=>a.replace(/^([A-Z])|[\s-_]+(\w)/g,(r,s,o)=>o?o.toUpperCase():s.toLowerCase());/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=a=>{const r=k(a);return r.charAt(0).toUpperCase()+r.slice(1)};/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var E={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S=a=>{for(const r in a)if(r.startsWith("aria-")||r==="role"||r==="title")return!0;return!1};/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const P=n.forwardRef(({color:a="currentColor",size:r=24,strokeWidth:s=2,absoluteStrokeWidth:o,className:l="",children:i,iconNode:p,...t},d)=>n.createElement("svg",{ref:d,...E,width:r,height:r,stroke:a,strokeWidth:o?Number(s)*24/Number(r):s,className:N("lucide",l),...!i&&!S(t)&&{"aria-hidden":"true"},...t},[...p.map(([c,x])=>n.createElement(c,x)),...Array.isArray(i)?i:[i]]));/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=(a,r)=>{const s=n.forwardRef(({className:o,...l},i)=>n.createElement(P,{ref:i,iconNode:r,className:N(`lucide-${w(v(a))}`,`lucide-${a}`,o),...l}));return s.displayName=v(a),s};/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=[["path",{d:"M10 12h4",key:"a56b0p"}],["path",{d:"M10 8h4",key:"1sr2af"}],["path",{d:"M14 21v-3a2 2 0 0 0-4 0v3",key:"1rgiei"}],["path",{d:"M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2",key:"secmi2"}],["path",{d:"M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16",key:"16ra0t"}]],A=u("building-2",C);/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],M=u("circle-check",R);/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const O=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]],$=u("globe",O);/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T=[["path",{d:"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",key:"zw3jo"}],["path",{d:"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",key:"1wduqc"}],["path",{d:"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",key:"kqbvx6"}]],_=u("layers",T);/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]],I=u("loader-circle",z);/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],U=u("shield-check",L),D=()=>{const[a,r]=n.useState(!1),s=n.useRef();return n.useEffect(()=>{const o=new IntersectionObserver(i=>{i.forEach(p=>r(p.isIntersecting))},{threshold:.1}),l=s.current;return l&&o.observe(l),()=>{l&&o.unobserve(l)}},[]),[s,a]},f=({children:a,className:r=""})=>{const[s,o]=D();return e.jsx("div",{ref:s,className:`transition-all duration-1000 transform ${o?"opacity-100 translate-y-0":"opacity-0 translate-y-12"} ${r}`,children:a})},B=()=>{const[a,r]=n.useState(!1),s=j(),[o,l]=n.useState(3);n.useEffect(()=>{const t=document.createElement("script");return t.src="https://checkout.razorpay.com/v1/checkout.js",t.async=!0,document.body.appendChild(t),()=>{document.body.contains(t)&&document.body.removeChild(t)}},[]);const i=async t=>{if(t.price==="Custom"){m.info("Please contact sales for enterprise plan");return}r(!0);try{const c=await(await fetch("/api/create-order",{method:"POST",headers:{Authorization:`Bearer ${localStorage.getItem("emstoken")}`,"Content-Type":"application/json"},body:JSON.stringify({plan:t.name.includes("STARTUP")?"STARTUP":"PRO"})})).json();if(console.log("🧾 ORDER CREATED:",c),!(c!=null&&c.id))throw new Error("Order creation failed");const x={key:"rzp_live_SSEdhM9TsH0zjZ",amount:c.amount,currency:"INR",name:"EMS Pro Solutions",description:t.name,order_id:c.id,handler:async function(h){console.log("✅ PAYMENT SUCCESS:",h);try{const y=await(await fetch("/api/verify-payment",{method:"POST",headers:{Authorization:`Bearer ${localStorage.getItem("emstoken")}`,"Content-Type":"application/json"},body:JSON.stringify(h)})).json();console.log("🔐 VERIFY RESPONSE:",y),y.success?(m.success("Payment Successful 🎉"),setTimeout(()=>s("/payment-success"),3e3)):m.error("Verification Failed ❌")}catch(b){console.error("❌ VERIFY ERROR:",b),m.error("Server verification failed")}r(!1)},modal:{ondismiss:function(){console.log("🚫 USER CANCELLED PAYMENT"),m.info("Payment Cancelled"),r(!1)}},prefill:{name:"Client Name",email:"admin@company.com"},theme:{color:"#f97316"}},g=new window.Razorpay(x);g.on("payment.failed",function(h){console.error("❌ PAYMENT FAILED:",h.error),m.error(h.error.description||"Payment Failed ❌"),r(!1)}),g.open()}catch(d){console.error("❌ PAYMENT INIT ERROR:",d),m.error("Something went wrong while initiating payment"),r(!1)}},p=[{name:"STARTUP HUB",price:"₹1",duration:"/MO",features:["Up to 25 Employees","Basic Attendance Tracking","Automated Leave Management","Digital Document Storage","Mobile App Access"],isPopular:!1,icon:e.jsx(A,{size:18})},{name:"BUSINESS PRO",price:"₹1",duration:"/MO",features:["Unlimited Employees","Advanced Payroll Engine","Performance Analytics","Biometric Integration","Custom Approval Workflows","Priority Support"],isPopular:!0,tag:"MOST DEPLOYED",icon:e.jsx(_,{size:18})},{name:"ENTERPRISE",price:"Custom",duration:"",features:["Global Multi-Office Sync","Dedicated Account Manager","Full API Access","Custom Feature Development","White-labeling Options","SLA Guarantees"],isPopular:!1,icon:e.jsx($,{size:18})}];return e.jsxs("section",{className:"py-24 px-6 bg-black text-white relative overflow-hidden min-h-screen flex items-center font-sans",children:[e.jsx("div",{className:"absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"}),e.jsx("div",{className:"absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none"}),e.jsxs("div",{className:"max-w-7xl mx-auto relative z-10 w-full",children:[e.jsx("div",{className:"text-center mb-20",children:e.jsxs(f,{children:[e.jsxs("div",{className:"inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold tracking-widest uppercase mb-6",children:[e.jsx(U,{size:14})," Enterprise-Grade Security"]}),e.jsxs("h2",{className:"text-5xl md:text-7xl font-black mb-6 tracking-tighter italic leading-none",children:["SCALE YOUR ",e.jsx("span",{className:"text-orange-500",children:"OPERATIONS"})]}),e.jsxs("p",{className:"text-gray-400 max-w-2xl mx-auto text-lg font-light leading-relaxed",children:["Deploy the ultimate workforce infrastructure. Engineered for precision management, data-driven insights, and seamless employee experiences.",e.jsx("span",{className:"block mt-2 font-medium text-gray-300",children:"Choose the engine that drives your growth."})]})]})}),e.jsx("div",{className:"grid md:grid-cols-3 gap-8 items-stretch",children:p.map((t,d)=>e.jsx(f,{className:`delay-${d*150}`,children:e.jsxs("div",{className:`relative h-full p-10 rounded-[2.5rem] border transition-all duration-500 group flex flex-col ${t.isPopular?"bg-[#0a0a0a] border-orange-500 shadow-[0_0_50px_rgba(249,115,22,0.1)] scale-105 z-10":"bg-neutral-900/40 border-neutral-800 hover:border-neutral-700"}`,children:[t.isPopular&&e.jsx("div",{className:"absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-black text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full shadow-lg whitespace-nowrap",children:t.tag}),e.jsxs("div",{className:"mb-8",children:[e.jsx("div",{className:`w-12 h-12 rounded-2xl mb-6 flex items-center justify-center border ${t.isPopular?"bg-orange-500/10 border-orange-500/50 text-orange-500":"bg-neutral-800 border-neutral-700 text-gray-400"}`,children:t.icon}),e.jsx("p",{className:`text-xs font-bold tracking-[0.2em] uppercase mb-4 ${t.isPopular?"text-orange-500":"text-gray-500"}`,children:t.name}),e.jsxs("div",{className:"flex items-baseline gap-1",children:[e.jsx("span",{className:"text-5xl font-black tracking-tighter",children:t.price}),t.duration&&e.jsx("span",{className:"text-gray-500 font-bold text-sm tracking-widest uppercase",children:t.duration})]})]}),e.jsx("ul",{className:"space-y-5 mb-12 flex-grow",children:t.features.map((c,x)=>e.jsxs("li",{className:"flex items-start gap-4 text-sm",children:[e.jsx("div",{className:`mt-0.5 rounded-full p-0.5 border ${t.isPopular?"border-orange-500/50 text-orange-500":"border-neutral-700 text-neutral-600"}`,children:e.jsx(M,{size:12,strokeWidth:3})}),e.jsx("span",{className:`${t.isPopular?"text-gray-200":"text-gray-400"} font-medium`,children:c})]},x))}),e.jsx("button",{onClick:()=>i(t),disabled:a,className:`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${t.isPopular?"bg-orange-500 text-black hover:bg-orange-400 shadow-[0_10px_30px_rgba(249,115,22,0.2)]":"bg-neutral-800/80 border border-neutral-700 text-white hover:bg-neutral-700"} disabled:opacity-50 disabled:cursor-not-allowed`,children:a?e.jsx(I,{className:"animate-spin",size:16}):t.price==="Custom"?"Contact Solutions":"Upgrade Now"})]})},d))}),e.jsx(f,{className:"mt-24",children:e.jsxs("div",{className:"p-8 md:p-12 rounded-[3rem] bg-gradient-to-r from-neutral-900 to-black border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-8",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-2xl font-bold mb-2",children:"Need a tailored office solution?"}),e.jsx("p",{className:"text-gray-400",children:"Our consultants can build a custom workspace environment for your specific needs."})]}),e.jsxs("div",{className:"flex gap-4",children:[e.jsx("div",{className:"flex -space-x-3",children:[1,2,3,4].map(t=>e.jsx("div",{className:"w-10 h-10 rounded-full border-2 border-black bg-neutral-800 overflow-hidden",children:e.jsx("img",{src:`https://api.dicebear.com/7.x/avataaars/svg?seed=${t+10}`,alt:"Expert"})},t))}),e.jsxs("div",{className:"text-sm",children:[e.jsx("p",{className:"font-bold",children:"24/7 Support"}),e.jsx("p",{className:"text-blue-400",children:"Join 500+ Companies"})]})]})]})})]})]})};function Y(){return e.jsx(B,{})}export{Y as default};
