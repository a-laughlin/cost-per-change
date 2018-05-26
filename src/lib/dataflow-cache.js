import {
  ma,dpipe,identity,ensureArray,isObservable,split,pipe,isObjectLike,mo,ife,isString,isArray
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

export const initCache = function(store$){
  const cacheRoot = { o:store$, path:'' };
  const nodes = {'':cacheRoot}; // for O(1) lookups after first reference (+simpler debugging)
  const outEdges = {};
  const inEdges = {};
  const set = ({
    indexPath='',
    dependencies=[cacheRoot],
    fn=identity,
  })=>{
    if(nodes[indexPath]){return nodes[indexPath];}
    inEdges[indexPath]=dependencies;
    nodes[indexPath] = {path:indexPath};
    nodes[indexPath].o = fn(...dependencies.map(d=>{
      (outEdges[d.path]||(outEdges[d.path]={}));
      outEdges[d.path][indexPath]=nodes[indexPath];
      return d.o;
    }));
    return nodes[indexPath];
  };
  const mapPathsToNode = (dependsOn=[''],indexPath='',fn=pipe(map(pv=>pv[indexPath]),dropRepeats,remember)) => {
    return set({fn,indexPath,dependencies:dependsOn.map(depPath=>nodes[depPath])});
  };


  // cases
  // coll
  // coll.coll
  // coll[itemkey].prop
  // coll.coll[itemkey].prop
  const get = (path='')=>{
    if (!isString(path)) {throw Error(`get requires a collection path string. Received: "${path}".`)}
    if(nodes[path]){return nodes[path];}
    let indexPath;
    return path.split('.').reduce((parent,relPath,i)=>{
      // existing branch/leaf - return it
      indexPath=relPath;
      if(parent!==cacheRoot){
        indexPath = `${parent.path}.${relPath}`;
        if(outEdges[''][indexPath]){// (coll.coll)
          throw new Error('define collection indices beforehand with setCollection, for now');
        }
      }
      if(nodes[indexPath]){return nodes[indexPath];}
      // if(i<lenminus1){} // new branch
      // else new leaf coll[key] || coll[key].prop
      return set({indexPath, dependencies:[parent],fn:pipe(map(pv=>pv[relPath]),dropRepeats,remember)});
    },cacheRoot);
  };
  return {get:path=>get(path).o, set:pipe(mapPathsToNode,x=>x.o)};
};
