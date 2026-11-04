import{r as e}from"./rolldown-runtime-hePW80VL.js";import{Xn as t,t as n}from"./vendor-react-CA3ZLqa8.js";var r=e(t(),1),i=n(),a=[{value:`S/o`,label:`S/o`},{value:`D/o`,label:`D/o`},{value:`W/o`,label:`W/o`},{value:`H/o`,label:`H/o`},{value:`C/o`,label:`C/o`}],o={father:`S/o`,"son of":`S/o`,"s/o":`S/o`,so:`S/o`,"daughter of":`D/o`,"d/o":`D/o`,do:`D/o`,mother:`S/o`,"wife of":`W/o`,"w/o":`W/o`,wo:`W/o`,"husband of":`H/o`,"h/o":`H/o`,ho:`H/o`,"care of":`C/o`,"c/o":`C/o`,co:`C/o`},s=(0,r.forwardRef)(({label:e=`Guardian / Father Name`,required:t=!1,relation:n,onRelationChange:r,value:s,onChange:c,placeholder:l=`Father / Guardian full name`,options:u=a,size:d=`md`,disabled:f=!1,className:p=``,containerClassName:m=``,id:h,...g},_)=>{let v=s&&typeof s==`object`,y=v?s.relation:n,b=y&&o[String(y).trim().toLowerCase()]||y||`S/o`,x=v?s.name||``:typeof s==`string`?s:``,S={sm:`h-8 text-xs`,md:`h-9 text-sm`,lg:`h-10 text-base`},C={sm:`px-2 text-xs`,md:`px-2.5 text-xs`,lg:`px-3 text-sm`},w={sm:`px-2.5 text-xs`,md:`px-3 text-sm`,lg:`px-3.5 text-base`},T=e=>{let t=e.target.value;r&&r(t),v&&c&&c({relation:t,name:x})},E=e=>{let t=e.target.value;v&&c?c({relation:b,name:t}):c&&c(e)},D=h||(e?e.toLowerCase().replace(/\s+/g,`-`):void 0),O=[...u];return b&&!O.some(e=>(typeof e==`string`?e:e.value)===b)&&O.unshift({value:b,label:b}),(0,i.jsxs)(`div`,{className:`flex flex-col gap-1 w-full ${m}`,children:[e&&(0,i.jsxs)(`label`,{htmlFor:D,className:`text-xs font-semibold text-slate-700 tracking-wide flex items-center gap-1 select-none`,children:[e,t&&(0,i.jsx)(`span`,{className:`text-red-500 font-bold`,children:`*`})]}),(0,i.jsxs)(`div`,{className:`
          flex items-center rounded-lg border border-slate-300 bg-white
          focus-within:ring-2 focus-within:ring-teal-600 focus-within:border-teal-600
          transition-all overflow-hidden shadow-2xs
          ${f?`opacity-60 bg-slate-50 cursor-not-allowed`:``}
          ${S[d]||S.md}
          ${p}
        `,children:[(0,i.jsx)(`select`,{value:b,onChange:T,disabled:f,className:`
            h-full bg-slate-50 border-r border-slate-200 font-bold text-slate-700
            hover:bg-slate-100 focus:bg-white outline-none cursor-pointer transition select-none shrink-0
            ${C[d]||C.md}
          `,children:O.map(e=>{let t=typeof e==`string`?e:e.value,n=typeof e==`string`?e:e.label;return(0,i.jsx)(`option`,{value:t,children:n},t)})}),(0,i.jsx)(`input`,{ref:_,id:D,type:`text`,value:x,onChange:E,placeholder:l,disabled:f,required:t,className:`
            flex-1 w-full h-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400 font-medium
            ${w[d]||w.md}
          `,...g})]})]})});s.displayName=`GuardianInput`;export{s as t};