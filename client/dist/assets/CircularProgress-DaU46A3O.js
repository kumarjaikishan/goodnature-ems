import{o as e,t}from"./react-0T9Avz-T.js";import{_ as n,d as r,i,n as a,r as o,t as s,v as c,y as l}from"./DefaultPropsProvider-Be9YBK7Q.js";import{n as u,r as d}from"./emotion-react.browser.esm-Dr4R8HZh.js";import{t as f}from"./jsx-runtime-BRYeo4JD.js";import{t as p}from"./createSimplePaletteValueFilter-Bt9IjErz.js";var m=e(t());function h(e){return c(`MuiCircularProgress`,e)}n(`MuiCircularProgress`,[`root`,`determinate`,`indeterminate`,`colorPrimary`,`colorSecondary`,`svg`,`track`,`circle`,`circleDeterminate`,`circleIndeterminate`,`circleDisableShrink`]);var g=f(),_=44,v=d`
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
`,y=d`
  0% {
    stroke-dasharray: 1px, 200px;
    stroke-dashoffset: 0;
  }

  50% {
    stroke-dasharray: 100px, 200px;
    stroke-dashoffset: -15px;
  }

  100% {
    stroke-dasharray: 1px, 200px;
    stroke-dashoffset: -126px;
  }
`,b=typeof v==`string`?null:u`
        animation: ${v} 1.4s linear infinite;
      `,x=typeof y==`string`?null:u`
        animation: ${y} 1.4s ease-in-out infinite;
      `,S=e=>{let{classes:t,variant:n,color:i,disableShrink:a}=e,s={root:[`root`,n,`color${o(i)}`],svg:[`svg`],track:[`track`],circle:[`circle`,`circle${o(n)}`,a&&`circleDisableShrink`]};return r(s,h,t)},C=i(`span`,{name:`MuiCircularProgress`,slot:`Root`,overridesResolver:(e,t)=>{let{ownerState:n}=e;return[t.root,t[n.variant],t[`color${o(n.color)}`]]}})(a(({theme:e})=>({display:`inline-block`,variants:[{props:{variant:`determinate`},style:{transition:e.transitions.create(`transform`)}},{props:{variant:`indeterminate`},style:b||{animation:`${v} 1.4s linear infinite`}},...Object.entries(e.palette).filter(p()).map(([t])=>({props:{color:t},style:{color:(e.vars||e).palette[t].main}}))]}))),w=i(`svg`,{name:`MuiCircularProgress`,slot:`Svg`})({display:`block`}),T=i(`circle`,{name:`MuiCircularProgress`,slot:`Circle`,overridesResolver:(e,t)=>{let{ownerState:n}=e;return[t.circle,t[`circle${o(n.variant)}`],n.disableShrink&&t.circleDisableShrink]}})(a(({theme:e})=>({stroke:`currentColor`,variants:[{props:{variant:`determinate`},style:{transition:e.transitions.create(`stroke-dashoffset`)}},{props:{variant:`indeterminate`},style:{strokeDasharray:`80px, 200px`,strokeDashoffset:0}},{props:({ownerState:e})=>e.variant===`indeterminate`&&!e.disableShrink,style:x||{animation:`${y} 1.4s ease-in-out infinite`}}]}))),E=i(`circle`,{name:`MuiCircularProgress`,slot:`Track`})(a(({theme:e})=>({stroke:`currentColor`,opacity:(e.vars||e).palette.action.activatedOpacity}))),D=m.forwardRef(function(e,t){let n=s({props:e,name:`MuiCircularProgress`}),{className:r,color:i=`primary`,disableShrink:a=!1,enableTrackSlot:o=!1,size:c=40,style:u,thickness:d=3.6,value:f=0,variant:p=`indeterminate`,...m}=n,h={...n,color:i,disableShrink:a,size:c,thickness:d,value:f,variant:p,enableTrackSlot:o},v=S(h),y={},b={},x={};if(p===`determinate`){let e=2*Math.PI*((_-d)/2);y.strokeDasharray=e.toFixed(3),x[`aria-valuenow`]=Math.round(f),y.strokeDashoffset=`${((100-f)/100*e).toFixed(3)}px`,b.transform=`rotate(-90deg)`}return(0,g.jsx)(C,{className:l(v.root,r),style:{width:c,height:c,...b,...u},ownerState:h,ref:t,role:`progressbar`,...x,...m,children:(0,g.jsxs)(w,{className:v.svg,ownerState:h,viewBox:`${_/2} ${_/2} ${_} ${_}`,children:[o?(0,g.jsx)(E,{className:v.track,ownerState:h,cx:_,cy:_,r:(_-d)/2,fill:`none`,strokeWidth:d,"aria-hidden":`true`}):null,(0,g.jsx)(T,{className:v.circle,style:y,ownerState:h,cx:_,cy:_,r:(_-d)/2,fill:`none`,strokeWidth:d})]})})});export{D as t};