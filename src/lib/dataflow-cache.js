import {
  ma,dpipe,identity,ensureArray,isObservable,split,pipe,isPlainObject,mo,ife,isString,
} from './utils.js'
import { map,dropRepeats,remember,of$,combine$,throw$ } from './utils$.js'

// inspired by mobx and redux, but more fp and immutable,
// not opinionated about state structure
// Does not handle state updating - only reads updates from store.
// its like a diffing engine, like react, but not bound to dom components.
// why? managing state updates, observerable updates, combining streams, is challgenging to get right
// Cache auto-reads store and renders updateswhen dependencies change.


// initialization
let cache; // temporary to get this code out of the dataflow file.  Needs a real api.
export const initCache = function(store$,initialState){
  cache = {
    o:store$,
    latest:initialState,
    c:{},
  };
  return cache;
};




// All the main logic - 2 functions
export const toLevelMappersDefault = ma(part=>(lvl,mapAllOutput)=>lvl.c[part]||(lvl.c[part]={
  o:dpipe(lvl.o,map(parentLatest=>(lvl.c[part].latest = parentLatest[part])),mapAllOutput),
  latest:'',
  c:{}
}));
const getCached = ({
  mapAllOutput = identity,
  toLevelMappers = pipe(ensureArray,toLevelMappersDefault)
}={})=>pipe(
  toLevelMappers,
  lm=>lm.reduce((lvl,fn)=>fn(lvl,mapAllOutput),cache)
)



// api experiments
// low level
export const getCached$ = (args)=>pipe(getCached(args),({o})=>o);
export const getCachedUnique$ = getCached$({mapAllOutput:pipe(dropRepeats,remember)});



// higher level
export const cache$ = (...strs)=>{
  return strs.length===0
    ? throw$('NO STRINGS PASSED TO CACHE')
    : strs.length > 1
      ? combine$(...strs.map(s=>getCachedUnique$(s.split('.'))))
      : getCachedUnique$(strs[0].split('.'));
};



// for use in react components
const tplRegex = /\[(.+?)\]\.|\.(.+?)\./g;
const tplReplacer = string=>data=>string.replace(tplRegex,`[${data}].`);
export const tpl = (s,props)=>s.replace(tplRegex,(_,key)=>`.${(key in props)?props[key]:key}.`);
export const pcacheOne$ = (str)=>pipe( props=>tpl(str,props).split('.'), getCachedUnique$);
export const pcache$ = (...strs)=>props=>{
  return strs.length===0
    ? of$(undefined)
    : strs.length > 1
      ? combine$(...strs.map(s=>pcacheOne$(s)(props)))
      : pcacheOne$(strs[0])(props);
};




// debugging
export const logoutput = msg=>(out)=>(isObservable(out)?map:identity)(logCache(msg))(out);
export const logCache = msg=>(output)=>{
  console.log(msg,`output`, output);
  const inner = (lvl=cache,mapped={})=>{
    if(!isPlainObject(lvl.latest)){return lvl.latest;}
    if(lvl._){
      mapped._ = mo(ife(isString),identity,v=>typeof v)(lvl._.latest);
    }
    let k;
    for(k in lvl.c){
      mapped[k]=inner(lvl.c[k]);
    }
    return mapped;
  };
  console.log(msg,`cache`, JSON.stringify(inner(cache),null,1));
  console.log(msg,`raw cache`, cache);
  return output;
}
