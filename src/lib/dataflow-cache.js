import {
  ma,dpipe,identity,ensureArray,isObservable,split,pipe,isObjectLike,mo,ife,isString,
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

export const initCache2 = function(store$,initialState={}){
  // for O(1) lookups after first reference (and simpler debugging initially)
  const cacheRoot = { o:store$, c:{}, path:'' };
  const pathIndex = {'':cacheRoot};

  const setSingleParent = (path='',parentPath='',fn=pipe(map(v=>v[path]),dropRepeats,remember))=>{
    const childPath = parentPath+path;
    if(pathIndex[childPath]){return pathIndex[childPath];}
    const parent = pathIndex[parentPath];
    return pathIndex[childPath] = parent.c[path] = {
      o:fn(parent.o).map(v=>pathIndex[childPath].debug=v),// debugging
      path:childPath,
      parents:[parentPath],
      c:{}
    };
  };
  const set = (path='', parentPaths=[], fn=pipe(map(v=>v[path]),dropRepeats,remember)) => {
    parentPaths = ensureArray(parentPaths);
    if(parentPaths.length<2){ return setSingleParent(path,parentPaths[0],fn);}
    // on dynamically defined collections, recalculate the transitive reduction for each collection
    // need to think through that more.  It's late, and multiple inheritance gets trickier.
    // but... we're not inheriting.  ...later.
    throw Error('TBD - multiple parent paths');
  };


  // cases
  // coll
  // coll.coll
  // coll[itemkey].prop
  // coll.coll[itemkey].prop
  const get = (path='')=>{
    if (!isString(path)) {throw Error(`get requires a collection path string. Received: "${path}".`)}
    if(pathIndex[path]){return pathIndex[path];}
    const parts = path.split('.');
    const lenminus1 = parts.length-1;
    return parts.reduce((parent,part,i)=>{
      // existing branch/leaf - return it
      if(parent.c[part]){return parent.c[part];}
      if(cacheRoot.c[part]){// (coll.coll)
        throw new Error('define collection indices beforehand with setCollection, for now');
      }
      // if(i<lenminus1){child.c = {};} // new branch
      // else new leaf coll[key] || coll[key].prop
      return setSingleParent(part,parent.path,pipe(map(v=>v[part]),dropRepeats,remember));
    },cacheRoot);
  };
  const geto = path=>get(path).o;
  return {get:geto,set};
};
