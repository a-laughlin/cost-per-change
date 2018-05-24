import {
  ma,dpipe,identity,ensureArray,isObservable,split,pipe,isPlainObject,mo,ife,isString,
} from './utils.js'
import { map,dropRepeats,remember,of$,combine$,throw$ } from './utils$.js'

/***
Are there any libs which fill the gap between the observable redux store, and React component integration, in a similar way to Mobx?

store$ -> `   ---gap---    ` -> React Component Integration

Scope is small... something like:

- creating observables from collections in initialState object
- enabling manual creation of derived collections
- efficiently pushing updates for all collections to observables

Ideally, something which is truly functional, thus works with compose/pipe operators from other libs.  Like 3 functions. Initialize State, Observe, and Derive.

Note: The scope intentionally excludes:

- Updating the store. Redux, Mobx, and many other solutions already provide options for that.
- Wiring observables into components.  Functions like Recompose's [mapPropsStream](https://github.com/acdlite/recompose/blob/master/docs/API.md#mappropsstream)) already handle that.
**/


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
