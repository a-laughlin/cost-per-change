/* eslint-disable no-unused-vars */
import {Component,isValidElement,cloneElement,createElement,Children,createFactory,Fragment} from 'react';
import PropTypes from 'prop-types';
import {getContext, mapProps, withContext,withReducer, isClassComponent,withProps,withHandlers} from 'recompose';
// import {styleObjectToClasses,mergeStyles} from './styles.js';
import {merge,mergeWith} from 'lodash';
import {
  pipe, identity, isString, isPlainObject, isFunction, isNull, isUndefined,stubTrue,isUndefOrNull,
  get, transform,flatten,find,mapValues,flattenDeep,flatMap, compose,reduce,cond,pipeAsync,pick,
  omit,ensureArray,plog,isNumber,isFalsy,stubNull,len0,len1,first,over,set,condNoExec,not,mapv,
  argsToArray,arrayToArgs,acceptsArgsOrArray,ensureArgsArray,curry,isArray,unset,toEmptyCopy,
  mapvToObjv,ensureFunction,constant,omitv,pipeAllArgsAsync,and,isProductionEnv,ifElse,has
} from './utils';

// reference https://medium.com/@leathcooper/roll-your-own-provider-and-connect-with-recompose-ceb73ba29dd3
// "it’s important to note that the component wrapped by withContext should render it’s children"


/**
 * HTML Node names as HOC composers e.g., Div(...HOCs)
 * - encourages single, composable nodes
 * - discourages nested (i.e., coupled) nodes (HOC composers don't nest) #pitOfSuccess
 * - Makes HOC composition easy
 * - hides React's rule about lowercased strings being valid components.
 *
 * these are identical:
 * - const Div = toHOCComposer('div');
 * - const Div = (...fns)=>compose(...fns)('div')
 */

// React should not warn about invalid data props, but it currently does.
// https://reactjs.org/blog/2017/09/08/dom-attributes-in-react-16.html#data-and-aria-attributes
// However, this is not a use case they want to support at this time, so making a workaround
// https://github.com/facebook/react/issues/12614
let omitHOCHandlerFns = identity;
if(!isProductionEnv()){
  const invalidPropFilter = omitv(and(isFunction,(v,k)=>k.startsWith('data-')));
  omitHOCHandlerFns = str=>props=>createElement(str,invalidPropFilter(props));
}

export const toHOCComposer = (str)=>(...fns)=>compose(...fns,omitHOCHandlerFns)(str);
export const [Div,Span,Ul,Ol,Dt,Dd,Dl,Article,P,H1,H2,H3,H4,H5,H6,Li,Input,A,Label,Pre,Textarea,Button,Img,Header,Svg,G,Path,Circle,Text,Table,Td,Th,Tr] = (
  'div,span,ul,ol,dt,dd,dl,article,p,h1,h2,h3,h4,h5,h6,li,input,a,label,pre,textarea,button,img,header,svg,g,path,circle,text,table,td,th,tr'
  .split(',').map(toHOCComposer));
export const TextInput = (...fns)=>Input(withProps({type:'text'}),...fns);

/**
 * predicates
 */
export const isComponentString = c=>/^(h[0-9]|[a-z]+)$/.test(c);
export const isComponent = c =>(isFunction(c)||isComponentString(c));

/**
 * HOC Factories (and their util functions)
 */

 /**
 * withItems Factory
 * creates a flatted array of React elements from anything
 * see the itemToElements for 'anything'
 * sets keys when needed
 */
export const withItemsHOCFactory = (function() {
  const isPropComponentCombo = and(has('Component'),has('props'));
  const hasKey = elem=>elem.key !== null;
  const cloneWithKey = (elem,key)=>cloneElement(elem,{key});
  const ensureKeys = ifElse(not(hasKey),cloneWithKey);
  const unwrapWhenPossible = cond([
    [len0,stubNull],
    [len1,first],
    [stubTrue,mapv(ensureKeys)],
  ]);

  const itemToElements = cond([
    [isUndefOrNull,stubNull],
    // [isValidElement,(elem,props)=>elem],
    [isValidElement,(elem,props)=>cloneElement(elem,props)],
    [isPropComponentCombo,(itm,props)=>createElement(itm.Component,{...props,...itm.props})],
    [isClassComponent,(itm,props)=>createElement(itm,props)],
    // passing child props as the first arg enables passing plain components
    // passing parent props as the second arg enables fromParent function to get props in pipes
    // recurse to enable pipes, but switch parentProps to child props on recursion to prevent accidental parent prop copying
    [isFunction,(itm,props,parentProps)=>itemToElements(itm(props,parentProps),props,props)],
    [isComponentString,(itm,props)=>createElement(itm,props)],
    [isString,(itm,props)=>createElement(Fragment,null,itm)],
    [isNumber,(itm,props)=>createElement(Fragment,null,itm)],
    [isArray,(arr,props)=>flatMap(itm=>itemToElements(itm,props,props))(arr)],
    [stubTrue,(itm,props)=>console.log(`unknown:`,itm)||createElement('pre',props,`unknown item type passed - received: ${JSON.stringify(itm,null,2)}`)],
  ]);

  return ({
    mapAllChildrenProps = ()=>({}),
    pipeInputTransform = identity,
  }={}) => argsToArray(ifElse(len0,identity, pipes=>BaseComponent=>props=>{
    const parentProps = pipeInputTransform(props);
    return pipe(
      mapv(itm=>itemToElements(itm,mapAllChildrenProps(parentProps||{}),parentProps)),
      flattenDeep,
      omitv(isNull),
      unwrapWhenPossible,
      (children)=>createElement(BaseComponent,props,children)
    )(pipes);
  }));
}());



// mergeableHocFactory cases
// hoc(component)(props)
// hoc(args)(component)(props)
// hoc(args)(args)(component)(props)
export const mergeableHocFactory = ({onArgsPassed,onPropsPassed,_merged})=>(...args)=>(
  isComponent(args[0])
    ? props=>createElement(args[0],onPropsPassed(_merged,props))
    : mergeableHocFactory({onArgsPassed,onPropsPassed,_merged:{...(_merged||{}),...onArgsPassed(...args)}})
)


/**
 * HOCs
 */
export const withItems = withItemsHOCFactory();



export const handlerPipeHOCFactory = ({
  on='Click',
  pipeFn = pipeAllArgsAsync,
  pipeInputTransform = identity,
  mergePropsWithEvent=(p,e)=>({...p, target:e.target}),
}={})=>{
  return (...fnsArray)=>withHandlers({[`on${on}`]:p=>event=>{
    const mergedProps = pipeInputTransform(mergePropsWithEvent(p,event));
    pipeFn(...fnsArray)(mergedProps,mergedProps);
  }});
}

export const pipeClicks = handlerPipeHOCFactory({on:'Click'});
export const pipeChanges = handlerPipeHOCFactory({on:'Change'});
export const pipeMouseEnter = handlerPipeHOCFactory({on:'MouseEnter'});
export const pipeMouseLeave = handlerPipeHOCFactory({on:'MouseLeave'});


/**
 * Pipe Utils
 */
export const tpl = curry((s,data)=>s.replace(/\[(.+?)\]/g,(_,key)=>`[${get(key)(data)}]`),2);


const replacedGet = curry((s,props)=>get(tpl(s,props),props),2);
const replacedPick = curry((arr,props)=>pick(arr.map(s=>tpl(s,props)))(props),2);
export const polyGet = cond([
  [isFunction,identity],
  [isString,replacedGet],
  [isArray,replacedPick],
  [isPlainObject, fnsObj=>targetObj=>mapv((fn,k)=>(polyGet(fn))(targetObj))(fnsObj)],
]);


export const toItemProps = (...Components)=>(data)=>Components.map(C=>({Component:C,props:data}))
export const toPropFn = key=>(data,props)=>props[key](data);


/**
 * optional Lightweight global state handling - replaceable with redux, graphql, etc.
 */
export const statePropKey = 'data-s';
export const statePublishKey = 'data-pub';
export const mergeStateProps = (props)=>({...props[statePropKey],...props});
const PK = statePublishKey;
export const withGlobalState = ({initialState={},
  // tapUpdater=identity,
  tapUpdater=updater=>pipe(plog('prevState'),updater,plog('nextState')),
}={})=>withReducer(statePropKey,PK,(prev,updater)=>tapUpdater(updater)(prev),initialState);

export const toStateWith = (fn)=>(d,p)=>{
  p[PK](state=>({...state,...fn(state,d,p)})); return d;
}
export const assignToState = (d,p)=>{
  p[PK](state=>Object.assign({},state,...ensureArray(d)));
  return d;
}
export const toState = str=>(d,p)=>{p[PK](state=>set(tpl(str,p),d,state)); return d; };
export const unsetState = str=>(d,p)=>{ p[PK](state=>unset(tpl(str,p),state)); return d; };
export const mergeState = (mergeFn=(dv,sv)=>(isPlainObject(dv) ? {...dv,...sv} : sv))=>(d,p)=>{
  p[PK](state=>mergeWith({},state,d,mergeFn));
  return d;
};
export const clearState = str=>(d,p)=>{ const s = tpl(str,p);
  p[PK](state=>set(s,toEmptyCopy(get(s,state)),state));
  return d;
}

// non-dom-mutating d3 modules
// d3-array
// d3-chord
// d3-collection
// d3-color
// d3-dispatch
// d3-dsv
// d3-ease
// d3-force
// d3-format
// d3-hierarchy
// d3-interpolate
// d3-path
// d3-polygon
// d3-quadtree
// d3-queue
// d3-random
// d3-request
// d3-scale
// d3-time
// d3-time-format
// d3-timer
// d3-voronoi

//
// const withTransitionGroup = transitionProps=>BaseComponent=>{
//   return (props)=>{
//     return <TransitionGroup {...transitionProps}>
//       <BaseComponent {...props} />
//     </TransitionGroup>
//   }
// }
// const withTransition = (
//   enterTimeout=(props)=>300,
//   exitTimeout=(props)=>300,
//   defaultStyle=(props)=>({}),
//   transitionStyle=(props)=>({}),
//   shouldStartTransition=(props)=>false
// )=>BaseComponent=>{
//   return (props)=>{
//     return <Transition
//       timeout={{enter:enterTimeout(),exit:exitTimeout()}}
//       in={shouldStartTransition}
//       style={{
//         ...defaultStyle(props),
//         ...transitionStyle(props),
//       }}
//       >
//       <BaseComponent {...props} />
//     </Transition>
//   }
// }


// lifecycle
// shallowEqual

// enterBlankStart
// enterBlankComplete
// enterBlankTransitionStyles (can likely calculate, or pass d3 interpolation function)
// enterExistingStart
// enterExistingComplete
// enterExistingTransitionStyles obj, or d3 interpolation function
// exitStart
// exitComplete
// enterExistingTransitionStyles obj, or d3 interpolation function
