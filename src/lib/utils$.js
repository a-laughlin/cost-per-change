import * as xsfp from './xstream-fp.js';
import {
  pipe,isObservable,isArray,isPromise,isFunction,isPlainObject,mo,ma, unzip, ifElse,stubTrue,cond
} from './utils.js';
import {setObservableConfig,shallowEquals} from 'recompose';
import xstreamConfig from 'recompose/xstreamObservableConfig';
setObservableConfig(xstreamConfig);
export const {
of$,
from$,
create$,
never$,
empty$,
throw$,
periodic$,
merge$,
combine$,
concat$,
fromDiagram$,
fromEvent$,
tween$,
imitate,
getListener,
getDebugListener,
setDebugListener,
addDebugListener,
addListener,
debug,
drop,
endWhen,
filter,
flatten,
fold,
last,
map,
mapTo,
remember,
removeListener,
replaceError,
shamefullySendComplete,
shamefullySendError,
shamefullySendNext,
startWith,
subscribe,
take,
mergeWith,
combineWith,
buffer,
debounce,
delay,
dropRepeats,
dropUntil,
flattenConcurrently,
flattenSequentially,
pairwise,
sampleCombine,
sampleCombine:withLatestFrom,
split,
throttle,
flatMap,
concatMap,
flatMapLatest,
toArray
} = xsfp;

export const ensureObservable = arg=>isObservable(arg)?arg:of$(arg);
export const flattenDeep = flatMap(x=>{
  return isObservable(x)?flattenDeep(x):of$(x);
});
//
// export const combineArray$ = (...streams) =>{
//   const vals=[];
//   const firstValsReceived=[];
//   let initialValsRemaining = streams.length;
//   let completesRemaining = streams.length;
//   const ins=[];
//   const outs = {};
//   const getCombineListener = (stream$, i)=>{
//     let o;
//     const listener = {
//       next:v=>{
//         if(!completesRemaining){return;}
//         vals[i]=v;
//         if(initialValsRemaining){
//           if(!firstValsReceived[i]){
//             firstValsReceived[i]=true;
//             --initialValsRemaining;
//           }
//           if(initialValsRemaining){return;}
//         }
//         for (o in outs) {outs[o].next(vals)};
//       },
//       error:e=>{
//         if(!completesRemaining){return;}
//         for (o in outs) {outs[o].error(e)};
//       },
//       complete:()=>{
//         if(--completesRemaining){return;}
//         // all streams complete.  cleanup.
//         for (o in outs) {outs[o].complete();delete outs[o];}
//         let unsub;
//         for (unsub of ins) {unsub();}
//         ins.length=0;
//         vals.length=0;
//         firstValsReceived.length=0;
//       },
//     };
//     stream$.addListener(listener);
//     return ()=>{stream$.removeListener(listener)}
//   };
//
//   let outId = 0;
//   const producer = {
//     start:out=>{
//       if(!completesRemaining){return;}
//       outs[outId++]=out;
//       if(!ins.length){ins.push(...streams.map(getCombineListener));}
//     },
//     stop:x=>undefined
//   };
//   return create$(producer);
// };



// dropShallowEquals
// dropDeepEquals
// dropPropEquals
// dropif(shallowEquals)
// const collection$ = $(shallowEquals)


export const filterChangedItems = (prop='')=>changedColl$=>pipe(
  fold((lastObj={},nextObj={})=>{
    let changedItems = {};
    let changes=0;
    if(lastObj === nextObj){return nextObj;}// no changes
    let k;
    for (k in nextObj){
      if(!(k in lastObj)){ // last didn't have this prop, so changed
        changes++;
        changedItems[k]=nextObj[k];
        continue;
      }
      if(nextObj[k]===lastObj[k]){continue;}// no changes
      if(prop===''){ // obj changed if no prop, count the change
        changes++;
        changedItems[k]=nextObj[k];
        continue;
      }
      if(nextObj[k][prop]===lastObj[k][prop]){continue;} // no prop change
      changedItems[k]=nextObj[k];
      changes++;
    }
    for (k in lastObj){
      if(!(k in nextObj)){changes++;continue;}
      if(nextObj[k]===lastObj[k]){continue;}// no changes
      if(prop===''){ // obj changed if no prop, count the change
        changes++;
        continue;
      }
      if(nextObj[k][prop]===lastObj[k][prop]){continue;} // no prop change
      changes++;
    }
    console.log(`changes,changedItems`, changes,changedItems);
    return changes > 0 ? changedItems : lastObj;
  },{}),
  drop(1),
  dropRepeats,
)(changedColl$);

export const takeWhenPropChanged = (propName='url')=>pipe(
  fold((last,nextObj)=>{
    // console.log(`last,nextObj`, last,nextObj);
    if(!last[1]){return [{},nextObj];}
    const [ll,lastObj] = last;
    if(lastObj[propName]===nextObj[propName]){return last};
    return [lastObj,nextObj];
  },[]),
  drop(1),
  dropRepeats,
  map(([last,next]=[])=>next)
);
