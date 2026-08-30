import{s as e,t}from"./react-CS1XD-7T.js";import{t as n}from"./clsx-DB0hHKMi.js";import{I as r,_ as i,d as a,i as o,t as s,v as c}from"./DefaultPropsProvider-C-RJN3nN.js";import{r as l}from"./emotion-react.browser.esm-B1d9ZPfv.js";import{t as u}from"./jsx-runtime-YQseCJ7p.js";import{a as d,c as f,i as p,l as m,n as h,o as g,s as _}from"./useTimeout-FQStjPwe.js";var v=e(t()),y=m;function b(e){if(e===void 0)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return e}function x(e,t){var n=function(e){return t&&(0,v.isValidElement)(e)?t(e):e},r=Object.create(null);return e&&v.Children.map(e,function(e){return e}).forEach(function(e){r[e.key]=n(e)}),r}function S(e,t){e||={},t||={};function n(n){return n in t?t[n]:e[n]}var r=Object.create(null),i=[];for(var a in e)a in t?i.length&&(r[a]=i,i=[]):i.push(a);var o,s={};for(var c in t){if(r[c])for(o=0;o<r[c].length;o++){var l=r[c][o];s[r[c][o]]=n(l)}s[c]=n(c)}for(o=0;o<i.length;o++)s[i[o]]=n(i[o]);return s}function C(e,t,n){return n[t]==null?e.props[t]:n[t]}function w(e,t){return x(e.children,function(n){return(0,v.cloneElement)(n,{onExited:t.bind(null,n),in:!0,appear:C(n,`appear`,e),enter:C(n,`enter`,e),exit:C(n,`exit`,e)})})}function T(e,t,n){var r=x(e.children),i=S(t,r);return Object.keys(i).forEach(function(a){var o=i[a];if((0,v.isValidElement)(o)){var s=a in t,c=a in r,l=t[a],u=(0,v.isValidElement)(l)&&!l.props.in;c&&(!s||u)?i[a]=(0,v.cloneElement)(o,{onExited:n.bind(null,o),in:!0,exit:C(o,`exit`,e),enter:C(o,`enter`,e)}):!c&&s&&!u?i[a]=(0,v.cloneElement)(o,{in:!1}):c&&s&&(0,v.isValidElement)(l)&&(i[a]=(0,v.cloneElement)(o,{onExited:n.bind(null,o),in:l.props.in,exit:C(o,`exit`,e),enter:C(o,`enter`,e)}))}}),i}var E=Object.values||function(e){return Object.keys(e).map(function(t){return e[t]})},D={component:`div`,childFactory:function(e){return e}},O=function(e){g(t,e);function t(t,n){var r=e.call(this,t,n)||this;return r.state={contextValue:{isMounting:!0},handleExited:r.handleExited.bind(b(r)),firstRender:!0},r}var n=t.prototype;return n.componentDidMount=function(){this.mounted=!0,this.setState({contextValue:{isMounting:!1}})},n.componentWillUnmount=function(){this.mounted=!1},t.getDerivedStateFromProps=function(e,t){var n=t.children,r=t.handleExited;return{children:t.firstRender?w(e,r):T(e,n,r),firstRender:!1}},n.handleExited=function(e,t){var n=x(this.props.children);e.key in n||(e.props.onExited&&e.props.onExited(t),this.mounted&&this.setState(function(t){var n=r({},t.children);return delete n[e.key],{children:n}}))},n.render=function(){var e=this.props,t=e.component,n=e.childFactory,r=_(e,[`component`,`childFactory`]),i=this.state.contextValue,a=E(this.state.children).map(n);return delete r.appear,delete r.enter,delete r.exit,t===null?v.createElement(d.Provider,{value:i},a):v.createElement(d.Provider,{value:i},v.createElement(t,r,a))},t}(v.Component);O.propTypes={},O.defaultProps=D;function k(e){try{return e.matches(`:focus-visible`)}catch{}return!1}var A=class e{static create(){return new e}static use(){let t=p(e.create).current,[n,r]=v.useState(!1);return t.shouldMount=n,t.setShouldMount=r,v.useEffect(t.mountEffect,[n]),t}constructor(){this.ref={current:null},this.mounted=null,this.didMount=!1,this.shouldMount=!1,this.setShouldMount=null}mount(){return this.mounted||(this.mounted=j(),this.shouldMount=!0,this.setShouldMount(this.shouldMount)),this.mounted}mountEffect=()=>{this.shouldMount&&!this.didMount&&this.ref.current!==null&&(this.didMount=!0,this.mounted.resolve())};start(...e){this.mount().then(()=>this.ref.current?.start(...e))}stop(...e){this.mount().then(()=>this.ref.current?.stop(...e))}pulsate(...e){this.mount().then(()=>this.ref.current?.pulsate(...e))}};function ee(){return A.use()}function j(){let e,t,n=new Promise((n,r)=>{e=n,t=r});return n.resolve=e,n.reject=t,n}var M=u();function N(e){let{className:t,classes:r,pulsate:i=!1,rippleX:a,rippleY:o,rippleSize:s,in:c,onExited:l,timeout:u}=e,[d,f]=v.useState(!1),p=n(t,r.ripple,r.rippleVisible,i&&r.ripplePulsate),m={width:s,height:s,top:-(s/2)+o,left:-(s/2)+a},h=n(r.child,d&&r.childLeaving,i&&r.childPulsate);return!c&&!d&&f(!0),v.useEffect(()=>{if(!c&&l!=null){let e=setTimeout(l,u);return()=>{clearTimeout(e)}}},[l,c,u]),(0,M.jsx)(`span`,{className:p,style:m,children:(0,M.jsx)(`span`,{className:h})})}var P=i(`MuiTouchRipple`,[`root`,`ripple`,`rippleVisible`,`ripplePulsate`,`child`,`childLeaving`,`childPulsate`]),F=550,I=l`
  0% {
    transform: scale(0);
    opacity: 0.1;
  }

  100% {
    transform: scale(1);
    opacity: 0.3;
  }
`,L=l`
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
`,R=l`
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(0.92);
  }

  100% {
    transform: scale(1);
  }
`,z=o(`span`,{name:`MuiTouchRipple`,slot:`Root`})({overflow:`hidden`,pointerEvents:`none`,position:`absolute`,zIndex:0,top:0,right:0,bottom:0,left:0,borderRadius:`inherit`}),B=o(N,{name:`MuiTouchRipple`,slot:`Ripple`})`
  opacity: 0;
  position: absolute;

  &.${P.rippleVisible} {
    opacity: 0.3;
    transform: scale(1);
    animation-name: ${I};
    animation-duration: ${F}ms;
    animation-timing-function: ${({theme:e})=>e.transitions.easing.easeInOut};
  }

  &.${P.ripplePulsate} {
    animation-duration: ${({theme:e})=>e.transitions.duration.shorter}ms;
  }

  & .${P.child} {
    opacity: 1;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: currentColor;
  }

  & .${P.childLeaving} {
    opacity: 0;
    animation-name: ${L};
    animation-duration: ${F}ms;
    animation-timing-function: ${({theme:e})=>e.transitions.easing.easeInOut};
  }

  & .${P.childPulsate} {
    position: absolute;
    /* @noflip */
    left: 0px;
    top: 0;
    animation-name: ${R};
    animation-duration: 2500ms;
    animation-timing-function: ${({theme:e})=>e.transitions.easing.easeInOut};
    animation-iteration-count: infinite;
    animation-delay: 200ms;
  }
`,V=v.forwardRef(function(e,t){let{center:r=!1,classes:i={},className:a,...o}=s({props:e,name:`MuiTouchRipple`}),[c,l]=v.useState([]),u=v.useRef(0),d=v.useRef(null);v.useEffect(()=>{d.current&&=(d.current(),null)},[c]);let f=v.useRef(!1),p=h(),m=v.useRef(null),g=v.useRef(null),_=v.useCallback(e=>{let{pulsate:t,rippleX:r,rippleY:a,rippleSize:o,cb:s}=e;l(e=>[...e,(0,M.jsx)(B,{classes:{ripple:n(i.ripple,P.ripple),rippleVisible:n(i.rippleVisible,P.rippleVisible),ripplePulsate:n(i.ripplePulsate,P.ripplePulsate),child:n(i.child,P.child),childLeaving:n(i.childLeaving,P.childLeaving),childPulsate:n(i.childPulsate,P.childPulsate)},timeout:F,pulsate:t,rippleX:r,rippleY:a,rippleSize:o},u.current)]),u.current+=1,d.current=s},[i]),y=v.useCallback((e={},t={},n=()=>{})=>{let{pulsate:i=!1,center:a=r||t.pulsate,fakeElement:o=!1}=t;if(e?.type===`mousedown`&&f.current){f.current=!1;return}e?.type===`touchstart`&&(f.current=!0);let s=o?null:g.current,c=s?s.getBoundingClientRect():{width:0,height:0,left:0,top:0},l,u,d;if(a||e===void 0||e.clientX===0&&e.clientY===0||!e.clientX&&!e.touches)l=Math.round(c.width/2),u=Math.round(c.height/2);else{let{clientX:t,clientY:n}=e.touches&&e.touches.length>0?e.touches[0]:e;l=Math.round(t-c.left),u=Math.round(n-c.top)}if(a)d=Math.sqrt((2*c.width**2+c.height**2)/3),d%2==0&&(d+=1);else{let e=Math.max(Math.abs((s?s.clientWidth:0)-l),l)*2+2,t=Math.max(Math.abs((s?s.clientHeight:0)-u),u)*2+2;d=Math.sqrt(e**2+t**2)}e?.touches?m.current===null&&(m.current=()=>{_({pulsate:i,rippleX:l,rippleY:u,rippleSize:d,cb:n})},p.start(80,()=>{m.current&&=(m.current(),null)})):_({pulsate:i,rippleX:l,rippleY:u,rippleSize:d,cb:n})},[r,_,p]),b=v.useCallback(()=>{y({},{pulsate:!0})},[y]),x=v.useCallback((e,t)=>{if(p.clear(),e?.type===`touchend`&&m.current){m.current(),m.current=null,p.start(0,()=>{x(e,t)});return}m.current=null,l(e=>e.length>0?e.slice(1):e),d.current=t},[p]);return v.useImperativeHandle(t,()=>({pulsate:b,start:y,stop:x}),[b,y,x]),(0,M.jsx)(z,{className:n(P.root,i.root,a),ref:g,...o,children:(0,M.jsx)(O,{component:null,exit:!0,children:c})})});function H(e){return c(`MuiButtonBase`,e)}var U=i(`MuiButtonBase`,[`root`,`disabled`,`focusVisible`]),W=e=>{let{disabled:t,focusVisible:n,focusVisibleClassName:r,classes:i}=e,o=a({root:[`root`,t&&`disabled`,n&&`focusVisible`]},H,i);return n&&r&&(o.root+=` ${r}`),o},G=o(`button`,{name:`MuiButtonBase`,slot:`Root`})({display:`inline-flex`,alignItems:`center`,justifyContent:`center`,position:`relative`,boxSizing:`border-box`,WebkitTapHighlightColor:`transparent`,backgroundColor:`transparent`,outline:0,border:0,margin:0,borderRadius:0,padding:0,cursor:`pointer`,userSelect:`none`,verticalAlign:`middle`,MozAppearance:`none`,WebkitAppearance:`none`,textDecoration:`none`,color:`inherit`,"&::-moz-focus-inner":{borderStyle:`none`},[`&.${U.disabled}`]:{pointerEvents:`none`,cursor:`default`},"@media print":{colorAdjust:`exact`}}),K=v.forwardRef(function(e,t){let r=s({props:e,name:`MuiButtonBase`}),{action:i,centerRipple:a=!1,children:o,className:c,component:l=`button`,disabled:u=!1,disableRipple:d=!1,disableTouchRipple:p=!1,focusRipple:m=!1,focusVisibleClassName:h,LinkComponent:g=`a`,onBlur:_,onClick:b,onContextMenu:x,onDragLeave:S,onFocus:C,onFocusVisible:w,onKeyDown:T,onKeyUp:E,onMouseDown:D,onMouseLeave:O,onMouseUp:A,onTouchEnd:j,onTouchMove:N,onTouchStart:P,tabIndex:F=0,TouchRippleProps:I,touchRippleRef:L,type:R,...z}=r,B=v.useRef(null),H=ee(),U=f(H.ref,L),[K,J]=v.useState(!1);u&&K&&J(!1),v.useImperativeHandle(i,()=>({focusVisible:()=>{J(!0),B.current.focus()}}),[]);let Y=H.shouldMount&&!d&&!u;v.useEffect(()=>{K&&m&&!d&&H.pulsate()},[d,m,K,H]);let te=q(H,`start`,D,p),ne=q(H,`stop`,x,p),re=q(H,`stop`,S,p),ie=q(H,`stop`,A,p),ae=q(H,`stop`,e=>{K&&e.preventDefault(),O&&O(e)},p),oe=q(H,`start`,P,p),se=q(H,`stop`,j,p),ce=q(H,`stop`,N,p),le=q(H,`stop`,e=>{k(e.target)||J(!1),_&&_(e)},!1),ue=y(e=>{B.current||=e.currentTarget,k(e.target)&&(J(!0),w&&w(e)),C&&C(e)}),X=()=>{let e=B.current;return e?e.tagName!==`BUTTON`&&!(e.tagName===`A`&&e.href):l&&l!==`button`},de=y(e=>{m&&!e.repeat&&K&&e.key===` `&&H.stop(e,()=>{H.start(e)}),e.target===e.currentTarget&&X()&&e.key===` `&&e.preventDefault(),T&&T(e),e.target===e.currentTarget&&X()&&e.key===`Enter`&&!u&&(e.preventDefault(),b&&b(e))}),fe=y(e=>{m&&e.key===` `&&K&&!e.defaultPrevented&&H.stop(e,()=>{H.pulsate(e)}),E&&E(e),b&&e.target===e.currentTarget&&X()&&e.key===` `&&!e.defaultPrevented&&!u&&b(e)}),Z=l;Z===`button`&&(z.href||z.to)&&(Z=g);let Q={};if(Z===`button`){let e=!!z.formAction;Q.type=R===void 0&&!e?`button`:R,Q.disabled=u}else!z.href&&!z.to&&(Q.role=`button`),u&&(Q[`aria-disabled`]=u);let pe=f(t,B),$={...r,centerRipple:a,component:l,disabled:u,disableRipple:d,disableTouchRipple:p,focusRipple:m,tabIndex:F,focusVisible:K},me=W($);return(0,M.jsxs)(G,{as:Z,className:n(me.root,c),ownerState:$,onBlur:le,onClick:b,onContextMenu:ne,onFocus:ue,onKeyDown:de,onKeyUp:fe,onMouseDown:te,onMouseLeave:ae,onMouseUp:ie,onDragLeave:re,onTouchEnd:se,onTouchMove:ce,onTouchStart:oe,ref:pe,tabIndex:u?-1:F,type:R,...Q,...z,children:[o,Y?(0,M.jsx)(V,{ref:U,center:a,...I}):null]})});function q(e,t,n,r=!1){return y(i=>(n&&n(i),r||e[t](i),!0))}export{y as i,k as n,O as r,K as t};