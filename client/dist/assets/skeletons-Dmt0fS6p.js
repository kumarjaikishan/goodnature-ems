import{s as e,t}from"./react-CS1XD-7T.js";import{t as n}from"./clsx-DB0hHKMi.js";import{_ as r,d as i,i as a,n as o,t as s,v as c}from"./DefaultPropsProvider-C-RJN3nN.js";import{n as l,r as u}from"./emotion-react.browser.esm-B1d9ZPfv.js";import{t as d}from"./jsx-runtime-YQseCJ7p.js";function f(e){return String(e).match(/[\d.\-+]*\s*(.*)/)[1]||``}function p(e){return parseFloat(e)}var m=e(t());function h(e){return c(`MuiSkeleton`,e)}r(`MuiSkeleton`,[`root`,`text`,`rectangular`,`rounded`,`circular`,`pulse`,`wave`,`withChildren`,`fitContent`,`heightAuto`]);var g=d(),_=e=>{let{classes:t,variant:n,animation:r,hasChildren:a,width:o,height:s}=e;return i({root:[`root`,n,r,a&&`withChildren`,a&&!o&&`fitContent`,a&&!s&&`heightAuto`]},h,t)},v=u`
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }

  100% {
    opacity: 1;
  }
`,y=u`
  0% {
    transform: translateX(-100%);
  }

  50% {
    /* +0.5s of delay between each loop */
    transform: translateX(100%);
  }

  100% {
    transform: translateX(100%);
  }
`,b=typeof v==`string`?null:l`
        animation: ${v} 2s ease-in-out 0.5s infinite;
      `,x=typeof y==`string`?null:l`
        &::after {
          animation: ${y} 2s linear 0.5s infinite;
        }
      `,S=a(`span`,{name:`MuiSkeleton`,slot:`Root`,overridesResolver:(e,t)=>{let{ownerState:n}=e;return[t.root,t[n.variant],n.animation!==!1&&t[n.animation],n.hasChildren&&t.withChildren,n.hasChildren&&!n.width&&t.fitContent,n.hasChildren&&!n.height&&t.heightAuto]}})(o(({theme:e})=>{let t=f(e.shape.borderRadius)||`px`,n=p(e.shape.borderRadius);return{display:`block`,backgroundColor:e.vars?e.vars.palette.Skeleton.bg:e.alpha(e.palette.text.primary,e.palette.mode===`light`?.11:.13),height:`1.2em`,variants:[{props:{variant:`text`},style:{marginTop:0,marginBottom:0,height:`auto`,transformOrigin:`0 55%`,transform:`scale(1, 0.60)`,borderRadius:`${n}${t}/${Math.round(n/.6*10)/10}${t}`,"&:empty:before":{content:`"\\00a0"`}}},{props:{variant:`circular`},style:{borderRadius:`50%`}},{props:{variant:`rounded`},style:{borderRadius:(e.vars||e).shape.borderRadius}},{props:({ownerState:e})=>e.hasChildren,style:{"& > *":{visibility:`hidden`}}},{props:({ownerState:e})=>e.hasChildren&&!e.width,style:{maxWidth:`fit-content`}},{props:({ownerState:e})=>e.hasChildren&&!e.height,style:{height:`auto`}},{props:{animation:`pulse`},style:b||{animation:`${v} 2s ease-in-out 0.5s infinite`}},{props:{animation:`wave`},style:{position:`relative`,overflow:`hidden`,WebkitMaskImage:`-webkit-radial-gradient(white, black)`,"&::after":{background:`linear-gradient(
                90deg,
                transparent,
                ${(e.vars||e).palette.action.hover},
                transparent
              )`,content:`""`,position:`absolute`,transform:`translateX(-100%)`,bottom:0,left:0,right:0,top:0}}},{props:{animation:`wave`},style:x||{"&::after":{animation:`${y} 2s linear 0.5s infinite`}}}]}})),C=m.forwardRef(function(e,t){let r=s({props:e,name:`MuiSkeleton`}),{animation:i=`pulse`,className:a,component:o=`span`,height:c,style:l,variant:u=`text`,width:d,...f}=r,p={...r,animation:i,component:o,variant:u,hasChildren:!!f.children},m=_(p);return(0,g.jsx)(S,{as:o,ref:t,className:n(m.root,a),ownerState:p,...f,style:{width:d,height:c,...l}})}),w=({count:e=15})=>(0,g.jsx)(`div`,{className:`px-1 md:px-3 grid grid-cols-5 md:grid-cols-10 lg:grid-cols-13 gap-2 md:gap-4 animate-pulse`,children:Array.from({length:e}).map((e,t)=>(0,g.jsxs)(`div`,{className:`flex flex-col items-center gap-1 py-1`,children:[(0,g.jsx)(`div`,{className:`p-[2px] border-2 border-slate-200 rounded-full`,children:(0,g.jsx)(C,{variant:`circular`,width:46,height:46,animation:`wave`,sx:{bgcolor:`grey.200`}})}),(0,g.jsx)(C,{variant:`text`,width:55,height:16,animation:`wave`,sx:{bgcolor:`grey.200`,borderRadius:`4px`}})]},t))}),T=({rows:e=8,columns:t=7})=>(0,g.jsxs)(`div`,{className:`w-full bg-white rounded-lg border border-slate-200 overflow-hidden animate-pulse`,children:[(0,g.jsx)(`div`,{className:`bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-4`,children:Array.from({length:t}).map((e,t)=>(0,g.jsx)(C,{variant:`text`,width:t===0?`15%`:t===1?`20%`:`10%`,height:20,animation:`wave`,sx:{bgcolor:`grey.300`}},t))}),(0,g.jsx)(`div`,{className:`divide-y divide-slate-100`,children:Array.from({length:e}).map((e,t)=>(0,g.jsxs)(`div`,{className:`px-4 py-3 flex items-center justify-between gap-4 hover:bg-slate-50`,children:[(0,g.jsxs)(`div`,{className:`flex items-center gap-2.5 w-[22%]`,children:[(0,g.jsx)(C,{variant:`circular`,width:32,height:32,animation:`wave`,sx:{bgcolor:`grey.200`}}),(0,g.jsx)(C,{variant:`text`,width:`70%`,height:18,animation:`wave`,sx:{bgcolor:`grey.200`}})]}),(0,g.jsx)(`div`,{className:`w-[15%]`,children:(0,g.jsx)(C,{variant:`text`,width:`80%`,height:18,animation:`wave`,sx:{bgcolor:`grey.200`}})}),(0,g.jsx)(`div`,{className:`w-[12%]`,children:(0,g.jsx)(C,{variant:`text`,width:`75%`,height:18,animation:`wave`,sx:{bgcolor:`grey.200`}})}),(0,g.jsx)(`div`,{className:`w-[12%]`,children:(0,g.jsx)(C,{variant:`text`,width:`75%`,height:18,animation:`wave`,sx:{bgcolor:`grey.200`}})}),(0,g.jsx)(`div`,{className:`w-[14%]`,children:(0,g.jsx)(C,{variant:`rectangular`,width:70,height:24,animation:`wave`,sx:{bgcolor:`grey.200`,borderRadius:`12px`}})}),(0,g.jsx)(`div`,{className:`w-[12%]`,children:(0,g.jsx)(C,{variant:`text`,width:`60%`,height:18,animation:`wave`,sx:{bgcolor:`grey.200`}})}),(0,g.jsxs)(`div`,{className:`flex justify-end gap-2 w-[13%]`,children:[(0,g.jsx)(C,{variant:`circular`,width:26,height:26,animation:`wave`,sx:{bgcolor:`grey.200`}}),(0,g.jsx)(C,{variant:`circular`,width:26,height:26,animation:`wave`,sx:{bgcolor:`grey.200`}})]})]},t))})]});export{w as n,T as t};