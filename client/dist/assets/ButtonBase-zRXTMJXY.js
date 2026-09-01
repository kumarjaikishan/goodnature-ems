import{o as e,t}from"./react-0T9Avz-T.js";import{C as n,E as r,L as i,R as a,_ as o,d as s,i as c,s as l,t as u,v as d,y as f}from"./DefaultPropsProvider-Be9YBK7Q.js";import{r as p}from"./emotion-react.browser.esm-Dr4R8HZh.js";import{t as m}from"./jsx-runtime-BRYeo4JD.js";import{a as h,c as g,d as _,i as v,l as y,n as b,o as x,s as S}from"./useTimeout-BMKbxTQN.js";var C=e=>{let t={systemProps:{},otherProps:{}},r=e?.theme?.unstable_sxConfig??n;return Object.keys(e).forEach(n=>{r[n]?t.systemProps[n]=e[n]:t.otherProps[n]=e[n]}),t};function w(e){let{sx:t,...n}=e,{systemProps:i,otherProps:a}=C(n),o;return o=Array.isArray(t)?[i,...t]:typeof t==`function`?(...e)=>{let n=t(...e);return r(n)?{...i,...n}:i}:{...i,...t},{...a,sx:o}}var T=m();function E(e){return(0,T.jsx)(_,{...e,defaultTheme:l,themeId:a})}var D=e(t());function O(e){return function(t){return(0,T.jsx)(E,{styles:typeof e==`function`?n=>e({theme:n,...t}):e})}}function k(){return w}var A=y;function ee(e){if(e===void 0)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return e}function j(e,t){var n=function(e){return t&&(0,D.isValidElement)(e)?t(e):e},r=Object.create(null);return e&&D.Children.map(e,function(e){return e}).forEach(function(e){r[e.key]=n(e)}),r}function M(e,t){e||={},t||={};function n(n){return n in t?t[n]:e[n]}var r=Object.create(null),i=[];for(var a in e)a in t?i.length&&(r[a]=i,i=[]):i.push(a);var o,s={};for(var c in t){if(r[c])for(o=0;o<r[c].length;o++){var l=r[c][o];s[r[c][o]]=n(l)}s[c]=n(c)}for(o=0;o<i.length;o++)s[i[o]]=n(i[o]);return s}function N(e,t,n){return n[t]==null?e.props[t]:n[t]}function te(e,t){return j(e.children,function(n){return(0,D.cloneElement)(n,{onExited:t.bind(null,n),in:!0,appear:N(n,`appear`,e),enter:N(n,`enter`,e),exit:N(n,`exit`,e)})})}function P(e,t,n){var r=j(e.children),i=M(t,r);return Object.keys(i).forEach(function(a){var o=i[a];if((0,D.isValidElement)(o)){var s=a in t,c=a in r,l=t[a],u=(0,D.isValidElement)(l)&&!l.props.in;c&&(!s||u)?i[a]=(0,D.cloneElement)(o,{onExited:n.bind(null,o),in:!0,exit:N(o,`exit`,e),enter:N(o,`enter`,e)}):!c&&s&&!u?i[a]=(0,D.cloneElement)(o,{in:!1}):c&&s&&(0,D.isValidElement)(l)&&(i[a]=(0,D.cloneElement)(o,{onExited:n.bind(null,o),in:l.props.in,exit:N(o,`exit`,e),enter:N(o,`enter`,e)}))}}),i}var F=Object.values||function(e){return Object.keys(e).map(function(t){return e[t]})},I={component:`div`,childFactory:function(e){return e}},L=function(e){x(t,e);function t(t,n){var r=e.call(this,t,n)||this;return r.state={contextValue:{isMounting:!0},handleExited:r.handleExited.bind(ee(r)),firstRender:!0},r}var n=t.prototype;return n.componentDidMount=function(){this.mounted=!0,this.setState({contextValue:{isMounting:!1}})},n.componentWillUnmount=function(){this.mounted=!1},t.getDerivedStateFromProps=function(e,t){var n=t.children,r=t.handleExited;return{children:t.firstRender?te(e,r):P(e,n,r),firstRender:!1}},n.handleExited=function(e,t){var n=j(this.props.children);e.key in n||(e.props.onExited&&e.props.onExited(t),this.mounted&&this.setState(function(t){var n=i({},t.children);return delete n[e.key],{children:n}}))},n.render=function(){var e=this.props,t=e.component,n=e.childFactory,r=S(e,[`component`,`childFactory`]),i=this.state.contextValue,a=F(this.state.children).map(n);return delete r.appear,delete r.enter,delete r.exit,t===null?D.createElement(h.Provider,{value:i},a):D.createElement(h.Provider,{value:i},D.createElement(t,r,a))},t}(D.Component);L.propTypes={},L.defaultProps=I;function R(e){try{return e.matches(`:focus-visible`)}catch{}return!1}var z=class e{static create(){return new e}static use(){let t=v(e.create).current,[n,r]=D.useState(!1);return t.shouldMount=n,t.setShouldMount=r,D.useEffect(t.mountEffect,[n]),t}constructor(){this.ref={current:null},this.mounted=null,this.didMount=!1,this.shouldMount=!1,this.setShouldMount=null}mount(){return this.mounted||(this.mounted=re(),this.shouldMount=!0,this.setShouldMount(this.shouldMount)),this.mounted}mountEffect=()=>{this.shouldMount&&!this.didMount&&this.ref.current!==null&&(this.didMount=!0,this.mounted.resolve())};start(...e){this.mount().then(()=>this.ref.current?.start(...e))}stop(...e){this.mount().then(()=>this.ref.current?.stop(...e))}pulsate(...e){this.mount().then(()=>this.ref.current?.pulsate(...e))}};function ne(){return z.use()}function re(){let e,t,n=new Promise((n,r)=>{e=n,t=r});return n.resolve=e,n.reject=t,n}function B(e){let{className:t,classes:n,pulsate:r=!1,rippleX:i,rippleY:a,rippleSize:o,in:s,onExited:c,timeout:l}=e,[u,d]=D.useState(!1),p=f(t,n.ripple,n.rippleVisible,r&&n.ripplePulsate),m={width:o,height:o,top:-(o/2)+a,left:-(o/2)+i},h=f(n.child,u&&n.childLeaving,r&&n.childPulsate);return!s&&!u&&d(!0),D.useEffect(()=>{if(!s&&c!=null){let e=setTimeout(c,l);return()=>{clearTimeout(e)}}},[c,s,l]),(0,T.jsx)(`span`,{className:p,style:m,children:(0,T.jsx)(`span`,{className:h})})}var V=o(`MuiTouchRipple`,[`root`,`ripple`,`rippleVisible`,`ripplePulsate`,`child`,`childLeaving`,`childPulsate`]),H=550,U=p`
  0% {
    transform: scale(0);
    opacity: 0.1;
  }

  100% {
    transform: scale(1);
    opacity: 0.3;
  }
`,W=p`
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
`,G=p`
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(0.92);
  }

  100% {
    transform: scale(1);
  }
`,K=c(`span`,{name:`MuiTouchRipple`,slot:`Root`})({overflow:`hidden`,pointerEvents:`none`,position:`absolute`,zIndex:0,top:0,right:0,bottom:0,left:0,borderRadius:`inherit`}),q=c(B,{name:`MuiTouchRipple`,slot:`Ripple`})`
  opacity: 0;
  position: absolute;

  &.${V.rippleVisible} {
    opacity: 0.3;
    transform: scale(1);
    animation-name: ${U};
    animation-duration: ${H}ms;
    animation-timing-function: ${({theme:e})=>e.transitions.easing.easeInOut};
  }

  &.${V.ripplePulsate} {
    animation-duration: ${({theme:e})=>e.transitions.duration.shorter}ms;
  }

  & .${V.child} {
    opacity: 1;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: currentColor;
  }

  & .${V.childLeaving} {
    opacity: 0;
    animation-name: ${W};
    animation-duration: ${H}ms;
    animation-timing-function: ${({theme:e})=>e.transitions.easing.easeInOut};
  }

  & .${V.childPulsate} {
    position: absolute;
    /* @noflip */
    left: 0px;
    top: 0;
    animation-name: ${G};
    animation-duration: 2500ms;
    animation-timing-function: ${({theme:e})=>e.transitions.easing.easeInOut};
    animation-iteration-count: infinite;
    animation-delay: 200ms;
  }
`,ie=D.forwardRef(function(e,t){let{center:n=!1,classes:r={},className:i,...a}=u({props:e,name:`MuiTouchRipple`}),[o,s]=D.useState([]),c=D.useRef(0),l=D.useRef(null);D.useEffect(()=>{l.current&&=(l.current(),null)},[o]);let d=D.useRef(!1),p=b(),m=D.useRef(null),h=D.useRef(null),g=D.useCallback(e=>{let{pulsate:t,rippleX:n,rippleY:i,rippleSize:a,cb:o}=e;s(e=>[...e,(0,T.jsx)(q,{classes:{ripple:f(r.ripple,V.ripple),rippleVisible:f(r.rippleVisible,V.rippleVisible),ripplePulsate:f(r.ripplePulsate,V.ripplePulsate),child:f(r.child,V.child),childLeaving:f(r.childLeaving,V.childLeaving),childPulsate:f(r.childPulsate,V.childPulsate)},timeout:H,pulsate:t,rippleX:n,rippleY:i,rippleSize:a},c.current)]),c.current+=1,l.current=o},[r]),_=D.useCallback((e={},t={},r=()=>{})=>{let{pulsate:i=!1,center:a=n||t.pulsate,fakeElement:o=!1}=t;if(e?.type===`mousedown`&&d.current){d.current=!1;return}e?.type===`touchstart`&&(d.current=!0);let s=o?null:h.current,c=s?s.getBoundingClientRect():{width:0,height:0,left:0,top:0},l,u,f;if(a||e===void 0||e.clientX===0&&e.clientY===0||!e.clientX&&!e.touches)l=Math.round(c.width/2),u=Math.round(c.height/2);else{let{clientX:t,clientY:n}=e.touches&&e.touches.length>0?e.touches[0]:e;l=Math.round(t-c.left),u=Math.round(n-c.top)}if(a)f=Math.sqrt((2*c.width**2+c.height**2)/3),f%2==0&&(f+=1);else{let e=Math.max(Math.abs((s?s.clientWidth:0)-l),l)*2+2,t=Math.max(Math.abs((s?s.clientHeight:0)-u),u)*2+2;f=Math.sqrt(e**2+t**2)}e?.touches?m.current===null&&(m.current=()=>{g({pulsate:i,rippleX:l,rippleY:u,rippleSize:f,cb:r})},p.start(80,()=>{m.current&&=(m.current(),null)})):g({pulsate:i,rippleX:l,rippleY:u,rippleSize:f,cb:r})},[n,g,p]),v=D.useCallback(()=>{_({},{pulsate:!0})},[_]),y=D.useCallback((e,t)=>{if(p.clear(),e?.type===`touchend`&&m.current){m.current(),m.current=null,p.start(0,()=>{y(e,t)});return}m.current=null,s(e=>e.length>0?e.slice(1):e),l.current=t},[p]);return D.useImperativeHandle(t,()=>({pulsate:v,start:_,stop:y}),[v,_,y]),(0,T.jsx)(K,{className:f(V.root,r.root,i),ref:h,...a,children:(0,T.jsx)(L,{component:null,exit:!0,children:o})})});function J(e){return d(`MuiButtonBase`,e)}var Y=o(`MuiButtonBase`,[`root`,`disabled`,`focusVisible`]),ae=e=>{let{disabled:t,focusVisible:n,focusVisibleClassName:r,classes:i}=e,a=s({root:[`root`,t&&`disabled`,n&&`focusVisible`]},J,i);return n&&r&&(a.root+=` ${r}`),a},oe=c(`button`,{name:`MuiButtonBase`,slot:`Root`})({display:`inline-flex`,alignItems:`center`,justifyContent:`center`,position:`relative`,boxSizing:`border-box`,WebkitTapHighlightColor:`transparent`,backgroundColor:`transparent`,outline:0,border:0,margin:0,borderRadius:0,padding:0,cursor:`pointer`,userSelect:`none`,verticalAlign:`middle`,MozAppearance:`none`,WebkitAppearance:`none`,textDecoration:`none`,color:`inherit`,"&::-moz-focus-inner":{borderStyle:`none`},[`&.${Y.disabled}`]:{pointerEvents:`none`,cursor:`default`},"@media print":{colorAdjust:`exact`}}),se=D.forwardRef(function(e,t){let n=u({props:e,name:`MuiButtonBase`}),{action:r,centerRipple:i=!1,children:a,className:o,component:s=`button`,disabled:c=!1,disableRipple:l=!1,disableTouchRipple:d=!1,focusRipple:p=!1,focusVisibleClassName:m,LinkComponent:h=`a`,onBlur:_,onClick:v,onContextMenu:y,onDragLeave:b,onFocus:x,onFocusVisible:S,onKeyDown:C,onKeyUp:w,onMouseDown:E,onMouseLeave:O,onMouseUp:k,onTouchEnd:ee,onTouchMove:j,onTouchStart:M,tabIndex:N=0,TouchRippleProps:te,touchRippleRef:P,type:F,...I}=n,L=D.useRef(null),z=ne(),re=g(z.ref,P),[B,V]=D.useState(!1);c&&B&&V(!1),D.useImperativeHandle(r,()=>({focusVisible:()=>{V(!0),L.current.focus()}}),[]);let H=z.shouldMount&&!l&&!c;D.useEffect(()=>{B&&p&&!l&&z.pulsate()},[l,p,B,z]);let U=X(z,`start`,E,d),W=X(z,`stop`,y,d),G=X(z,`stop`,b,d),K=X(z,`stop`,k,d),q=X(z,`stop`,e=>{B&&e.preventDefault(),O&&O(e)},d),J=X(z,`start`,M,d),Y=X(z,`stop`,ee,d),se=X(z,`stop`,j,d),ce=X(z,`stop`,e=>{R(e.target)||V(!1),_&&_(e)},!1),le=A(e=>{L.current||=e.currentTarget,R(e.target)&&(V(!0),S&&S(e)),x&&x(e)}),Z=()=>{let e=L.current;return e?e.tagName!==`BUTTON`&&!(e.tagName===`A`&&e.href):s&&s!==`button`},ue=A(e=>{p&&!e.repeat&&B&&e.key===` `&&z.stop(e,()=>{z.start(e)}),e.target===e.currentTarget&&Z()&&e.key===` `&&e.preventDefault(),C&&C(e),e.target===e.currentTarget&&Z()&&e.key===`Enter`&&!c&&(e.preventDefault(),v&&v(e))}),de=A(e=>{p&&e.key===` `&&B&&!e.defaultPrevented&&z.stop(e,()=>{z.pulsate(e)}),w&&w(e),v&&e.target===e.currentTarget&&Z()&&e.key===` `&&!e.defaultPrevented&&!c&&v(e)}),Q=s;Q===`button`&&(I.href||I.to)&&(Q=h);let $={};if(Q===`button`){let e=!!I.formAction;$.type=F===void 0&&!e?`button`:F,$.disabled=c}else!I.href&&!I.to&&($.role=`button`),c&&($[`aria-disabled`]=c);let fe=g(t,L),pe={...n,centerRipple:i,component:s,disabled:c,disableRipple:l,disableTouchRipple:d,focusRipple:p,tabIndex:N,focusVisible:B},me=ae(pe);return(0,T.jsxs)(oe,{as:Q,className:f(me.root,o),ownerState:pe,onBlur:ce,onClick:v,onContextMenu:W,onFocus:le,onKeyDown:ue,onKeyUp:de,onMouseDown:U,onMouseLeave:q,onMouseUp:K,onDragLeave:G,onTouchEnd:Y,onTouchMove:se,onTouchStart:J,ref:fe,tabIndex:c?-1:N,type:F,...$,...I,children:[a,H?(0,T.jsx)(ie,{ref:re,center:i,...te}):null]})});function X(e,t,n,r=!1){return A(i=>(n&&n(i),r||e[t](i),!0))}export{O as a,A as i,R as n,k as o,L as r,w as s,se as t};