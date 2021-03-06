/* eslint-disable no-unused-vars */
import {Component,isValidElement,cloneElement,createElement as Elem,Children,Fragment} from 'react';
import PropTypes from 'prop-types';
import {mapProps, withReducer, isClassComponent,withProps,shouldUpdate,
  withHandlers,mapPropsStream,shallowEqual,componentFromStream,createEventHandler
} from 'recompose';
// import {styleObjectToClasses,mergeStyles} from './styles.js';
import {merge,mergeWith} from 'lodash';
import {
  pipe, identity, isString, isPlainObject, isFunction, isNull, isUndefined,stubTrue,isUndefOrNull,
  get, transform,flatten,find,mapValues,flattenDeep,flatMap, compose,reduce,cond,pipeAsync,pick,
  omit,ensureArray,plog,isNumber,isFalsy,stubNull,len0,len1,first,over,set,condNoExec,not,mapv,
  argsToArray,arrayToArgs,acceptsArgsOrArray,curry,isArray,unset,toEmptyCopy,isObservable,
  mapvToObjv,ensureFunction,constant,omitv,pipeAllArgsAsync,and,isProductionEnv,ifElse,has,every,ra,
  partition,spread,pget,or,isPromise,isObjectLike,mo,unzip,zipObject,last
} from './utils';
import {of$,from$,take,combine$,map,toArray,periodic$,flatMap as $flatMap,combineWith,
  flattenSequentially,flatMapLatest,flattenConcurrently,buffer,never$,addDebugListener,debug,
  flattenDeep as flattenDeep$,ensureObservable,drop,dropRepeats,fold,fromPromise$,debounce
} from './utils$.js';


/**
 * HTML Node names as HOC composers e.g., Div(...HOCs)
 * these are identical:
 * - const Div = toHOCComposer('div');
 * - const Div = (...fns)=>compose(...fns)('div')
 */

export const toHOCComposer = (str)=>(...fns)=>compose(...fns)(str);
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
 * childrenHOCFactory
 * creates a flatted array of React elements from anything
 * see the xToElements for 'anything'
 * sets keys when needed
 */
export const childrenHOCFactory = (function() {
  const hasKey = elem=>elem.key !== null;
  const cloneWithKey = (elem,key)=>cloneElement(elem,{key});
  const ensureKeys = ifElse(not(hasKey),cloneWithKey);
  const unwrapSingles = cond([
    [len0,stubNull],
    [len1,first],
    [stubTrue,mapv(ensureKeys)],
  ]);
  const unwrap = ra((acc,next)=>{if(!isUndefOrNull(next)){acc.push(...ensureArray(next));}});

  const xToElements = cond([
    [isUndefOrNull,stubNull],
    [isValidElement,identity],//(elem,props)=>cloneElement(elem,props)],
    [isFunction,ifElse(isClassComponent,Elem,(x,prps)=>xToElements(x(prps),prps))],
    [isObservable,identity],
    [isString,(x,props)=>Elem(Fragment,null,x)],
    [isNumber,(x,props)=>Elem(Fragment,null,x)],
    [isArray,(arr,props)=>flatMap(x=>xToElements(x,props))(arr)],
    [stubTrue,(x,props)=>console.log(`unknown:`,x)||Elem('pre',props,`unknown item type passed - received: ${JSON.stringify(x,null,2)}`)],
  ]);


  const normalizePipes = childrenProps=>mapv(pipe(
    x=>xToElements(x,childrenProps),// unwrap functions, including any that return observables
    ensureObservable,
    flattenDeep$,
    map(x=>xToElements(x,childrenProps))
  ));
  return ({
    mapAllChildrenProps = ()=>({}),
  }={}) => (...pipes)=>pipes.length===0
    ? identity
    : BaseComponent=>shouldUpdate(x=>false)(componentFromStream(pipe(
      map(props=>pipe(
        normalizePipes(mapAllChildrenProps(props||{})),
        spread(combine$),
        map(children=>Elem(BaseComponent,props,pipe(unwrap,unwrapSingles)(children)))
      )(pipes)),
      flattenConcurrently,
    )))
}());


// mergeableHocFactory cases
// hoc(component)(props)
// hoc(args)(component)(props)
// hoc(args)(args)(component)(props)
const customPrefix = 'customMerge';
export const mergeableHocFactory = ({
  onArgs = (_merged,args)=>({...(_merged||{}),...args}),
  onComponent,
  _merged,
}={})=>(arg,...args)=>(
  arg===customPrefix
    ? mergeableHocFactory({onArgs,onComponent,_merged:args[0](_merged)})
    : isComponent(arg)
        ? props=>Elem(arg,onComponent(_merged,props))
        : mergeableHocFactory({onArgs,onComponent,_merged:onArgs(_merged,arg,...args)})
);


/**
 * HOCs
 */
export const withItems = childrenHOCFactory();
export const withItemsAllProps = childrenHOCFactory({mapAllChildrenProps:identity});



export const handlerPipeHOCFactory = ({
  on='Click',
  pipeFn = pipeAllArgsAsync,
  mergePropsWithEvent=(p,e)=>({...p, target:e.target}),
}={})=>{
  return (...fnsArray)=>withHandlers({[`on${on}`]:p=>event=>{
    const mergedProps = mergePropsWithEvent(p,event);
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

export const toChildren = (dataKey='data')=>(...Components)=>(ownProps)=>Components.map((C,i)=>(props)=>(
  Elem(C,{key:(ownProps[dataKey]||'')+i,...props,...ownProps})
));
export const toItemProps = toChildren();



export const simpleStore = (initialState={})=>{
  const {stream,handler}=createEventHandler();
  const store$ = stream.fold((state,{updater=identity})=>updater(state),initialState);
  const dispatch = fn=>handler({type:'fn',updater:fn});// mock redux dispatch for compatibility
  return {store$,dispatch};
}

export const $get = cond(
  [or(isString,isNumber),s=>props=>of$((s in props)?props[s]:s)],
  [isObservable,obs$=>props=>obs$],
  [isArray,arr=>props=>combine$(of$(props),...arr.map(v=>$get(v)(props)))],
  [isFunction, fn=>props=>$get(fn(props))(props)],
  [isPromise, prom=>props=>fromPromise$(prom)],
  [isObjectLike, obj=>props=>{
    const mapped = mo(v=>$get(v)(props))(obj);
    const [keys,vals$] = unzip(Object.entries(mapped));
    return combine$(...vals$).map(vals=>Object.assign(zipObject(keys,vals),props));
  }],
  [stubTrue,x=>props=>ensureObservable(x)],
);
export const hget$ = compose(mapPropsStream,$flatMap,$get);
// hget$(coll,prop) - could automatically create an observable for each prop


// phases (prototyping)
//  store and streams in dataflow
//  styles connected directly to components
//  streams connected directly to components
//  set directly to state
//  business logic - on components (only one add todo button, why not?, the architecture makes it dead simple to move later)
// phases (prototyping +1)
//  team communication
//  typing becomes important - the collections get too complex to hold in your head


// things for a talk
// explain Div()
// explain each of the basic HOCs - show simple example of how each is used.
// show a sidebar with the definitions for each part
// only one type
// explain fns are often one-lieners
// almost never dependencies between them.

// changeability & reliability FTW
//   - minimizing dependency graphs
//   - single responsibility
//   - loc
// string components FTW
//   - one responsibility - semantic
//   - one prop ftw (only one type)
//   - pipes ftw
// streams FTW
//   - state only matters when it changes props.  It eliminates dependency graphs to make everything stateful, and don't update the things that don't need to change
//   - mapstatetoprops, mapParentprops to props,
// Store only contains collections.  Everything else is derived+memoized.
// collections named like repo,repofile - id property matches the collection
// conditionals only happen on parents
// conditionals never happen within a component - it adds responsibilities.

// Clicks|Changes can be a synchronous pipe, letting the data streams handle async stuff
// encourages moving logic out of component pipes (how pass data)
// eliminates second pipe arg, which removes the need for pipeAllArgs
// so much simpler...
// no need for this templating function
// no strings means typing systems are happier
// one prop passed
// everything else is joins
// minimal elements
// minimal streams


/**
 * HTML Node names as HOC composers e.g., Div(...HOCs)
 * - encourages single, composable nodes
 * - discourages nested (i.e., coupled) nodes (HOC composers don't nest) #pitOfSuccess
 * - cons... many, but the tradeoffs are worth it
 */





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
