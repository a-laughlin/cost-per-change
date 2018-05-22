import * as xsfp from './xstream-fp.js';
import {
  pipe,isObservable,isArray,isPromise,isFunction,isPlainObject,mo,ma,unzip,get,ife,stubTrue,cond,ro
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
fromArray$,
fromPromise$,
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
export const flattenDeep = flatMapLatest(ife(isObservable,flattenDeep,of$));
const noop=()=>{};
const identity=x=>x;
export const operatorFactory = ({
  statusInit = inputArr=>{
    let initialValsRemaining = inputArr.length;
    let completesRemaining = inputArr.length;
    const firstValsReceived = [];
    return {
      inputNextReceived:(i)=>{
        if(initialValsRemaining===0){return;}
        if(!firstValsReceived[i]){
          firstValsReceived[i]=true;
          --initialValsRemaining;
        }
      },
      inputCompleteReceived:()=>{
        if(--completesRemaining<1){return;}
        firstValsReceived.length=0;
      },
      isComplete:()=>completesRemaining===0,
      isNotComplete:()=>completesRemaining!==0,
      isAllInputActive:()=>initialValsRemaining===0,
    };
  },
  onStop = noop,
  setMemoryOnComplete = identity,
  onNextAfterAll = (v,mem,send)=>{send(v);return v;},
  onNextAfterAllInit = (v,mem,send)=>{send(v);return v;},
  onNextBeforeAll = identity,
  onNextBeforeAllInit = identity,
  onErrorBeforeAll = (e,lastv,send)=>{send(e);},
  onErrorAfterAll = (e,lastv,send)=>{send(e);},
  onStartNew = (inputArr,getListener)=>inputArr.map(getListener),
  onStartAfterComplete = (mem,out)=>{out.next(mem);out.complete();},
}={})=> (...streams) =>{
  // lazy function definitions eliminate conditionals in next/error/complete fns
  let nextb4All = (...args)=>{nextb4All = onNextBeforeAll;return onNextBeforeAllInit(...args);};
  let nextAfterAll = (...args)=>{onNextFn = onNextAfterAll;return onNextAfterAllInit(...args);};
  let onNextFn = (...args)=>(isAllInputActive()?nextAfterAll:nextb4All)(...args);
  let onErrFn = (...args)=>(isAllInputActive()?(onErrFn = onErrorAfterAll):onErrorBeforeAll)(...args);

  let mem,inputSubscriptions,sendNext,sendErr,sendComplete;
  const {isComplete,isAllInputActive,inputNextReceived,inputCompleteReceived}=statusInit(streams);
  const getCombineListener = (stream$, i)=>{
    // console.log(`getCombineListener`, stream$,i);
    const listener = {
      next:v=>{
        inputNextReceived(i);
        mem = onNextFn(v,mem,sendNext);
      },
      error:e=>{onErrFn(e,mem,sendErr)},
      complete:()=>{
        inputCompleteReceived(i);
        if(!isComplete()){return;}
        console.log(`complete`);
        // all input streams complete.  cleanup.
        mem = setMemoryOnComplete(mem);
        let L=inputSubscriptions.length;
        while (--L) {inputSubscriptions[L]();}
        inputSubscriptions.length=0;
        inputSubscriptions=null;
        sendNext=null;
        sendErr=null;
        sendComplete();
        sendComplete=null;
      },
    };
    stream$.addListener(listener);
    return ()=>{stream$.removeListener(listener)}
  };
  let outs=[];
  const producer = {
    start:out=>{
      if(isComplete()){onStartAfterComplete(mem,out);return;}
      sendNext=out.next.bind(out); // oo lib...
      sendErr=out.error.bind(out);
      sendComplete=out.complete.bind(out);
      inputSubscriptions = onStartNew(streams,getCombineListener);
    },
    stop:onStop
  };
  return create$(producer);
};

export const collection$ = (getter=identity)=>operatorFactory({
  onNextAfterAllInit : (next,mem,send)=>{
    const coll = getter(next);
    send(coll);
    return coll;
  },
  onNextAfterAll : (next,last,send)=>{
    const coll = getter(next);
    if(coll!==last){send(coll);}
    return coll;
  },
});


// dropShallowEquals
// dropDeepEquals
// dropPropEquals
// dropif(shallowEquals)
// const collection$ = $(shallowEquals)
export const $if = (predicate=stubTrue)=>operatorFactory({
  onNextAfterAllInit : (last,next)=>({last,next}),
  onNextAfterAll : (next,mem,send)=>{
    if(predicate(mem.next,next)){send(next);}
    mem.last=mem.next;
    mem.next=next;
    return mem;
  },
  onStartAfterComplete:({last,next},out)=>{predicate(last,next) && out.next(next); out.complete();},
});
export const $ifnot = pipe(fn=>(...args)=>!fn(...args),$if);

// const randomVal$ = pipe(
//   ()=>periodic$(500),
//   map(v=>['a','a','b','c','c'][v]),
//   take(5),
//   $if((last,next)=>last!==next),
//   addDebugListener('abug'),
// )();
// addDebugListener('abug')(randomVal$);
// setTimeout(()=>{
//   addDebugListener('cbug')(randomVal$);
// },5000)


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
    // console.log(`changes,changedItems`, changes,changedItems);
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
