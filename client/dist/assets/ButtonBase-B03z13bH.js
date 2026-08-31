import{o as e,t}from"./react-0T9Avz-T.js";import{L as n,R as r,_ as i,d as a,i as o,s,t as c,v as l,y as u}from"./DefaultPropsProvider-Be9YBK7Q.js";import{r as d}from"./emotion-react.browser.esm-Dr4R8HZh.js";import{t as f}from"./jsx-runtime-BRYeo4JD.js";import{a as p,c as m,d as h,i as g,l as _,n as v,o as y,s as b}from"./useTimeout-CtzKroW8.js";import{t as x}from"./extendSxProp-DodtxqU_.js";var S=f();function C(e){return(0,S.jsx)(h,{...e,defaultTheme:s,themeId:r})}var w=e(t());function T(e){return function(t){return(0,S.jsx)(C,{styles:typeof e==`function`?n=>e({theme:n,...t}):e})}}function E(){return x}var D=_;function ee(e){if(e===void 0)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return e}function O(e,t){var n=function(e){return t&&(0,w.isValidElement)(e)?t(e):e},r=Object.create(null);return e&&w.Children.map(e,function(e){return e}).forEach(function(e){r[e.key]=n(e)}),r}function k(e,t){e||={},t||={};function n(n){return n in t?t[n]:e[n]}var r=Object.create(null),i=[];for(var a in e)a in t?i.length&&(r[a]=i,i=[]):i.push(a);var o,s={};for(var c in t){if(r[c])for(o=0;o<r[c].length;o++){var l=r[c][o];s[r[c][o]]=n(l)}s[c]=n(c)}for(o=0;o<i.length;o++)s[i[o]]=n(i[o]);return s}function A(e,t,n){return n[t]==null?e.props[t]:n[t]}function j(e,t){return O(e.children,function(n){return(0,w.cloneElement)(n,{onExited:t.bind(null,n),in:!0,appear:A(n,`appear`,e),enter:A(n,`enter`,e),exit:A(n,`exit`,e)})})}function M(e,t,n){var r=O(e.children),i=k(t,r);return Object.keys(i).forEach(function(a){var o=i[a];if((0,w.isValidElement)(o)){var s=a in t,c=a in r,l=t[a],u=(0,w.isValidElement)(l)&&!l.props.in;c&&(!s||u)?i[a]=(0,w.cloneElement)(o,{onExited:n.bind(null,o),in:!0,exit:A(o,`exit`,e),enter:A(o,`enter`,e)}):!c&&s&&!u?i[a]=(0,w.cloneElement)(o,{in:!1}):c&&s&&(0,w.isValidElement)(l)&&(i[a]=(0,w.cloneElement)(o,{onExited:n.bind(null,o),in:l.props.in,exit:A(o,`exit`,e),enter:A(o,`enter`,e)}))}}),i}var N=Object.values||function(e){return Object.keys(e).map(function(t){return e[t]})},P={component:`div`,childFactory:function(e){return e}},F=function(e){y(t,e);function t(t,n){var r=e.call(this,t,n)||this;return r.state={contextValue:{isMounting:!0},handleExited:r.handleExited.bind(ee(r)),firstRender:!0},r}var r=t.prototype;return r.componentDidMount=function(){this.mounted=!0,this.setState({contextValue:{isMounting:!1}})},r.componentWillUnmount=function(){this.mounted=!1},t.getDerivedStateFromProps=function(e,t){var n=t.children,r=t.handleExited;return{children:t.firstRender?j(e,r):M(e,n,r),firstRender:!1}},r.handleExited=function(e,t){var r=O(this.props.children);e.key in r||(e.props.onExited&&e.props.onExited(t),this.mounted&&this.setState(function(t){var r=n({},t.children);return delete r[e.key],{children:r}}))},r.render=function(){var e=this.props,t=e.component,n=e.childFactory,r=b(e,[`component`,`childFactory`]),i=this.state.contextValue,a=N(this.state.children).map(n);return delete r.appear,delete r.enter,delete r.exit,t===null?w.createElement(p.Provider,{value:i},a):w.createElement(p.Provider,{value:i},w.createElement(t,r,a))},t}(w.Component);F.propTypes={},F.defaultProps=P;function I(e){try{return e.matches(`:focus-visible`)}catch{}return!1}var L=class e{static create(){return new e}static use(){let t=g(e.create).current,[n,r]=w.useState(!1);return t.shouldMount=n,t.setShouldMount=r,w.useEffect(t.mountEffect,[n]),t}constructor(){this.ref={current:null},this.mounted=null,this.didMount=!1,this.shouldMount=!1,this.setShouldMount=null}mount(){return this.mounted||(this.mounted=R(),this.shouldMount=!0,this.setShouldMount(this.shouldMount)),this.mounted}mountEffect=()=>{this.shouldMount&&!this.didMount&&this.ref.current!==null&&(this.didMount=!0,this.mounted.resolve())};start(...e){this.mount().then(()=>this.ref.current?.start(...e))}stop(...e){this.mount().then(()=>this.ref.current?.stop(...e))}pulsate(...e){this.mount().then(()=>this.ref.current?.pulsate(...e))}};function te(){return L.use()}function R(){let e,t,n=new Promise((n,r)=>{e=n,t=r});return n.resolve=e,n.reject=t,n}function z(e){let{className:t,classes:n,pulsate:r=!1,rippleX:i,rippleY:a,rippleSize:o,in:s,onExited:c,timeout:l}=e,[d,f]=w.useState(!1),p=u(t,n.ripple,n.rippleVisible,r&&n.ripplePulsate),m={width:o,height:o,top:-(o/2)+a,left:-(o/2)+i},h=u(n.child,d&&n.childLeaving,r&&n.childPulsate);return!s&&!d&&f(!0),w.useEffect(()=>{if(!s&&c!=null){let e=setTimeout(c,l);return()=>{clearTimeout(e)}}},[c,s,l]),(0,S.jsx)(`span`,{className:p,style:m,children:(0,S.jsx)(`span`,{className:h})})}var B=i(`MuiTouchRipple`,[`root`,`ripple`,`rippleVisible`,`ripplePulsate`,`child`,`childLeaving`,`childPulsate`]),V=550,H=d`
  0% {
    transform: scale(0);
    opacity: 0.1;
  }

  100% {
    transform: scale(1);
    opacity: 0.3;
  }
`,U=d`
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
`,W=d`
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(0.92);
  }

  100% {
    transform: scale(1);
  }
`,G=o(`span`,{name:`MuiTouchRipple`,slot:`Root`})({overflow:`hidden`,pointerEvents:`none`,position:`absolute`,zIndex:0,top:0,right:0,bottom:0,left:0,borderRadius:`inherit`}),K=o(z,{name:`MuiTouchRipple`,slot:`Ripple`})`
  opacity: 0;
  position: absolute;

  &.${B.rippleVisible} {
    opacity: 0.3;
    transform: scale(1);
    animation-name: ${H};
    animation-duration: ${V}ms;
    animation-timing-function: ${({theme:e})=>e.transitions.easing.easeInOut};
  }

  &.${B.ripplePulsate} {
    animation-duration: ${({theme:e})=>e.transitions.duration.shorter}ms;
  }

  & .${B.child} {
    opacity: 1;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: currentColor;
  }

  & .${B.childLeaving} {
    opacity: 0;
    animation-name: ${U};
    animation-duration: ${V}ms;
    animation-timing-function: ${({theme:e})=>e.transitions.easing.easeInOut};
  }

  & .${B.childPulsate} {
    position: absolute;
    /* @noflip */
    left: 0px;
    top: 0;
    animation-name: ${W};
    animation-duration: 2500ms;
    animation-timing-function: ${({theme:e})=>e.transitions.easing.easeInOut};
    animation-iteration-count: infinite;
    animation-delay: 200ms;
  }
`,ne=w.forwardRef(function(e,t){let{center:n=!1,classes:r={},className:i,...a}=c({props:e,name:`MuiTouchRipple`}),[o,s]=w.useState([]),l=w.useRef(0),d=w.useRef(null);w.useEffect(()=>{d.current&&=(d.current(),null)},[o]);let f=w.useRef(!1),p=v(),m=w.useRef(null),h=w.useRef(null),g=w.useCallback(e=>{let{pulsate:t,rippleX:n,rippleY:i,rippleSize:a,cb:o}=e;s(e=>[...e,(0,S.jsx)(K,{classes:{ripple:u(r.ripple,B.ripple),rippleVisible:u(r.rippleVisible,B.rippleVisible),ripplePulsate:u(r.ripplePulsate,B.ripplePulsate),child:u(r.child,B.child),childLeaving:u(r.childLeaving,B.childLeaving),childPulsate:u(r.childPulsate,B.childPulsate)},timeout:V,pulsate:t,rippleX:n,rippleY:i,rippleSize:a},l.current)]),l.current+=1,d.current=o},[r]),_=w.useCallback((e={},t={},r=()=>{})=>{let{pulsate:i=!1,center:a=n||t.pulsate,fakeElement:o=!1}=t;if(e?.type===`mousedown`&&f.current){f.current=!1;return}e?.type===`touchstart`&&(f.current=!0);let s=o?null:h.current,c=s?s.getBoundingClientRect():{width:0,height:0,left:0,top:0},l,u,d;if(a||e===void 0||e.clientX===0&&e.clientY===0||!e.clientX&&!e.touches)l=Math.round(c.width/2),u=Math.round(c.height/2);else{let{clientX:t,clientY:n}=e.touches&&e.touches.length>0?e.touches[0]:e;l=Math.round(t-c.left),u=Math.round(n-c.top)}if(a)d=Math.sqrt((2*c.width**2+c.height**2)/3),d%2==0&&(d+=1);else{let e=Math.max(Math.abs((s?s.clientWidth:0)-l),l)*2+2,t=Math.max(Math.abs((s?s.clientHeight:0)-u),u)*2+2;d=Math.sqrt(e**2+t**2)}e?.touches?m.current===null&&(m.current=()=>{g({pulsate:i,rippleX:l,rippleY:u,rippleSize:d,cb:r})},p.start(80,()=>{m.current&&=(m.current(),null)})):g({pulsate:i,rippleX:l,rippleY:u,rippleSize:d,cb:r})},[n,g,p]),y=w.useCallback(()=>{_({},{pulsate:!0})},[_]),b=w.useCallback((e,t)=>{if(p.clear(),e?.type===`touchend`&&m.current){m.current(),m.current=null,p.start(0,()=>{b(e,t)});return}m.current=null,s(e=>e.length>0?e.slice(1):e),d.current=t},[p]);return w.useImperativeHandle(t,()=>({pulsate:y,start:_,stop:b}),[y,_,b]),(0,S.jsx)(G,{className:u(B.root,r.root,i),ref:h,...a,children:(0,S.jsx)(F,{component:null,exit:!0,children:o})})});function q(e){return l(`MuiButtonBase`,e)}var J=i(`MuiButtonBase`,[`root`,`disabled`,`focusVisible`]),re=e=>{let{disabled:t,focusVisible:n,focusVisibleClassName:r,classes:i}=e,o=a({root:[`root`,t&&`disabled`,n&&`focusVisible`]},q,i);return n&&r&&(o.root+=` ${r}`),o},ie=o(`button`,{name:`MuiButtonBase`,slot:`Root`})({display:`inline-flex`,alignItems:`center`,justifyContent:`center`,position:`relative`,boxSizing:`border-box`,WebkitTapHighlightColor:`transparent`,backgroundColor:`transparent`,outline:0,border:0,margin:0,borderRadius:0,padding:0,cursor:`pointer`,userSelect:`none`,verticalAlign:`middle`,MozAppearance:`none`,WebkitAppearance:`none`,textDecoration:`none`,color:`inherit`,"&::-moz-focus-inner":{borderStyle:`none`},[`&.${J.disabled}`]:{pointerEvents:`none`,cursor:`default`},"@media print":{colorAdjust:`exact`}}),Y=w.forwardRef(function(e,t){let n=c({props:e,name:`MuiButtonBase`}),{action:r,centerRipple:i=!1,children:a,className:o,component:s=`button`,disabled:l=!1,disableRipple:d=!1,disableTouchRipple:f=!1,focusRipple:p=!1,focusVisibleClassName:h,LinkComponent:g=`a`,onBlur:_,onClick:v,onContextMenu:y,onDragLeave:b,onFocus:x,onFocusVisible:C,onKeyDown:T,onKeyUp:E,onMouseDown:ee,onMouseLeave:O,onMouseUp:k,onTouchEnd:A,onTouchMove:j,onTouchStart:M,tabIndex:N=0,TouchRippleProps:P,touchRippleRef:F,type:L,...R}=n,z=w.useRef(null),B=te(),V=m(B.ref,F),[H,U]=w.useState(!1);l&&H&&U(!1),w.useImperativeHandle(r,()=>({focusVisible:()=>{U(!0),z.current.focus()}}),[]);let W=B.shouldMount&&!d&&!l;w.useEffect(()=>{H&&p&&!d&&B.pulsate()},[d,p,H,B]);let G=X(B,`start`,ee,f),K=X(B,`stop`,y,f),q=X(B,`stop`,b,f),J=X(B,`stop`,k,f),Y=X(B,`stop`,e=>{H&&e.preventDefault(),O&&O(e)},f),ae=X(B,`start`,M,f),oe=X(B,`stop`,A,f),se=X(B,`stop`,j,f),ce=X(B,`stop`,e=>{I(e.target)||U(!1),_&&_(e)},!1),le=D(e=>{z.current||=e.currentTarget,I(e.target)&&(U(!0),C&&C(e)),x&&x(e)}),Z=()=>{let e=z.current;return e?e.tagName!==`BUTTON`&&!(e.tagName===`A`&&e.href):s&&s!==`button`},ue=D(e=>{p&&!e.repeat&&H&&e.key===` `&&B.stop(e,()=>{B.start(e)}),e.target===e.currentTarget&&Z()&&e.key===` `&&e.preventDefault(),T&&T(e),e.target===e.currentTarget&&Z()&&e.key===`Enter`&&!l&&(e.preventDefault(),v&&v(e))}),de=D(e=>{p&&e.key===` `&&H&&!e.defaultPrevented&&B.stop(e,()=>{B.pulsate(e)}),E&&E(e),v&&e.target===e.currentTarget&&Z()&&e.key===` `&&!e.defaultPrevented&&!l&&v(e)}),Q=s;Q===`button`&&(R.href||R.to)&&(Q=g);let $={};if(Q===`button`){let e=!!R.formAction;$.type=L===void 0&&!e?`button`:L,$.disabled=l}else!R.href&&!R.to&&($.role=`button`),l&&($[`aria-disabled`]=l);let fe=m(t,z),pe={...n,centerRipple:i,component:s,disabled:l,disableRipple:d,disableTouchRipple:f,focusRipple:p,tabIndex:N,focusVisible:H},me=re(pe);return(0,S.jsxs)(ie,{as:Q,className:u(me.root,o),ownerState:pe,onBlur:ce,onClick:v,onContextMenu:K,onFocus:le,onKeyDown:ue,onKeyUp:de,onMouseDown:G,onMouseLeave:Y,onMouseUp:J,onDragLeave:q,onTouchEnd:oe,onTouchMove:se,onTouchStart:ae,ref:fe,tabIndex:l?-1:N,type:L,...$,...R,children:[a,W?(0,S.jsx)(ne,{ref:V,center:i,...P}):null]})});function X(e,t,n,r=!1){return D(i=>(n&&n(i),r||e[t](i),!0))}export{T as a,D as i,I as n,E as o,F as r,Y as t};