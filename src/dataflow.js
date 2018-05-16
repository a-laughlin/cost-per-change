import {initialState} from './initial-state';
import {createStore} from 'redux';
import {setObservableConfig,createEventHandler,mapPropsStream,componentFromStream,shallowEqual} from 'recompose';
import {
  pipe,compose,mapv,plog,get,identity,pget,pgetv,ensureArray,set,isObservable,assignAll,
  mapvToArr,isFunction,ensureFunction,groupByKey,ifElse,isString,cond,stubTrue,transformToObj,
  omitv,matches,fltrvToObj,isPlainObject,isNumber,tranToObj
} from './utils';
import {of$,from$,combine$,map,debug,debounce,from,combineWith,flatten,flattenConcurrently,flattenSequentially,addListener,
  addDebugListener,setDebugListener,dropRepeats,flatMapLatest,flatMap,sampleCombine,getDebugListener,
  removeListener,getListener,subscribe,fold,drop,periodic$,filterChangedItems,takeWhenPropChanged,filter
} from './utils$.js';
import {analyse} from './code-analysis';
import {asyncRepoUrlToGraph} from './api'

export const simpleStore = (initialState={})=>{
  const {stream,handler}=createEventHandler();
  const store$ = stream.fold((state,{updater=identity})=>updater(state),initialState);
  const dispatch = fn=>handler({type:'fn',updater:fn});// mock redux dispatch for compatibility
  return {store$,dispatch};
}


const tplRegex = /\[prop\]\.|\.?prop\./g;
const tpl = string=>prop=>string.replace(tplRegex,`[${prop}].`);
const ensureObservable = ifElse(isObservable,identity,of$);
const ensureStreamGetter = cond([
  [isFunction,fn=>prop=>ensureObservable(fn(prop))],
  [isObservable,s$=>prop=>s$.map(get(prop))],
  [isString,string=>prop=>map(get(tpl(string)(prop)))(store$)],// can cache these
  [stubTrue,x=>prop=>of$(x)],
]);
const mapPropFactory = (dataKey='data')=>obj=>{
  const keys=[dataKey];
  const getters=[prop=>of$(prop)];
  for(let k in obj){
    keys[keys.length] = k;
    getters[getters.length] = ensureStreamGetter(obj[k]);
  };
  return mapPropsStream(pipe(
    flatMap(props=>combine$(...getters.map(fn=>fn(props[dataKey])))),
    map(latestVals=>latestVals.reduce((acc,v,i)=>{acc[keys[i]]=v;return acc;},{})),
  ));
}
export const mapProp = mapPropFactory();

export const pipeProp$ = (...streams)=>(...fns)=>(props)=>{
  return pipe(...fns)(combine$(of$(props.data),...streams));
};
export const pipeIndex = (...streams$)=>(...fns)=>props=>{
  return combine$(of$(props.data),...streams$).map(
    ([prop,...streams])=>pipe(...fns)(...streams.map(s=>s[prop]))
  );
};
export const from_target_value = pget({value:'target.value',data:'data'});

const getHandler = (...fns)=>{
  const {stream,handler} = createEventHandler();
  pipe( ...fns, addListener() )(stream);
  return handler;
}

// Store only contains collections.  Everything else is derived.
// collections named like repo,repofile - id property matches the collection

// streams (there are a number of cases in the code where these separate concerns better)
// event.merge(store).merge(sideload).merge(props).dostuff().to(store$).publish()
// const isClickedProducer$ = Producer();
// map(merge(props$,isClicked$,store$)));
// streamClicks(merge(event$,props$,state$),dostuff,to$(isClickedProducer$,state$)))) // publishes an observable to store
// event.merge(storeInfo).select(storeSlice).map(toNextSlice).merge(storeInfo).publish()

// possible fns
// set, merge, remove
// const setMatchingItems (str,matcher)(value)=>
// const setMatchingItems (str)(value)=>
// setProp
// mergeProp
// setColls
// mergeColls
// removeColls
// setCollection
// setCollectionProp
// setCollectionItem
// setCollectionItemProp
// mergeCollection
// mergeCollectionProp
// mergeCollectionItem
// mergeCollectionItemProp
// removeCollection
// removeCollectionProp
// removeCollectionItem
// removeCollectionItemProp
// setItemsMatchingId
// mergeItemsMatchingId
// removeItemsWithMatchingId
// const t0 = {id:'t0',val:'0'};
// const t01 = {id:'t0',val:'01'};
// const t1 = {id:'t1',val:'1'};
// const tColl={tColl:{t0}};
const tapUpdater = updater=>pipe(plog('prevState'),updater,plog('nextState'));
// const tapUpdater = identity;
// const store = createStore((state=initialState,{updater=identity})=>updater(state));
Object.assign(initialState.userTokens,{'1':{id:'1',value:'a'}});
const store = createStore((state,{updater=identity})=>tapUpdater(updater)(state),initialState);
const store$ = from$(store[Symbol.observable]()).drop(1).startWith(initialState);
const dispatch = store.dispatch.bind(store);

// data is props.data
const setStateX = str=>({value,data=''})=>{dispatch({type:'fn',updater:state=>set(tpl(str)(data),value,state)}); return value; };
const assignToStateX = data=>{
  console.log(`data`, data);
  dispatch({type:'fn',updater:state=>Object.assign({},state,...ensureArray(data))});return data;
}

// coll changed
// const coll =
// const objs = from$([a0,a0,a0,a1,a1,a1]);


// assumes collections will not be added or removed
// assumes collection items will be added and removed

export const repos$ = map(get('repos'))(store$);
export const repos_id$ = map(mapv('id'))(repos$);
// why are these dropRepeats necessary?
export const repos_devcost_by_id$ = pipe(dropRepeats,map(mapv('devcost')))(repos$);
export const repos_changetime_by_id$ = pipe(dropRepeats,map(mapv('changetime')))(repos$);
export const repos_url_by_id$ = pipe(dropRepeats,map(mapv('url')))(repos$);
export const to_repos$ = setStateX('repos');
export const to_repo_devcost$ = setStateX('repos.prop.devcost');
export const to_repo_changetime$ = setStateX('repos.prop.changetime');
export const to_repo_url$ = setStateX('repos.prop.url');



// files/directory nodes
export const [repoNodes$,to_repoNodes$] = [map(get('repoNodes'))(store$),setStateX('repoNodes')];
export const repoNodes_costPerChange$ = map(mapv('costPerChange'))(repoNodes$);
export const repoNodes_userImpact$ = map(mapv('userImpact'))(repoNodes$);
export const repoNodes_path$ = map(mapv('path'))(repoNodes$);

// file/directory edges
export const repoNodeOutEdges$ = map(get('repoNodeOutEdges'))(store$);

// user github token
export const userToken$ = map(get('userTokens.0.value'))(store$);
export const to_userToken$ = setStateX('userTokens.0.value');




// joins
export const repos_by_repoNode_id$ = store$
// why didn't it work to use combine$ or combineWith?  Why directly from the store$?
.map(({repoNodes,repos})=>mapv(n=>repos[n.repoid])(repoNodes));

export const repoNodes_by_repoid$ = map(tranToObj((acc,n,nid)=>{
  const {repoid,id} = n
  acc[repoid] || (acc[repoid] = {});
  acc[repoid][id]=n;
}))(repoNodes$);

export const repoNodeOutEdges_by_repoid$ = map(tranToObj((acc,edge)=>{
  const {repoid,id} = edge;
  acc[repoid] || (acc[repoid] = {});
  acc[repoid][id]=edge;
}))(repoNodeOutEdges$);




// multi-actions
export const to_repo_copy = getHandler(
  sampleCombine(repos$,repoNodes$,repoNodeOutEdges$),
  map(([id,repos,repoNodes,repoNodeOutEdges])=>{
    const repoid=id+'_1';
    const re = new RegExp(id,'g');
    const sRepo=(str)=>str.replace(re,repoid);
    const transformRepo = (acc,v,k)=>{ acc[k]=v; if(k===id){acc[repoid]={...v,id:repoid,repoid}}};
    const transformNode = (acc,v,k)=>{
      acc[k]=v;
      if (v.repoid===id) {
        const fid = sRepo(k);
        acc[fid]={...v,id:fid,repoid};
        if(v.edges){acc[fid].edges=v.edges.map(sRepo);}
      };
    };
    return assignToStateX({
      repos:transformToObj(transformRepo)(repos),
      repoNodes:transformToObj(transformNode)(repoNodes),
      repoNodeOutEdges:transformToObj(transformNode)(repoNodeOutEdges),
    });
  })
);

export const to_repo_remove = getHandler(
  sampleCombine(repos$,repoNodes$,repoNodeOutEdges$),
  map(([id,repos,repoNodes,repoNodeOutEdges])=>{
    assignToStateX({
      repos:omitv(matches({id}))(repos),
      repoNodes:omitv(matches({repoid:id}))(repoNodes),
      repoNodeOutEdges:omitv(matches({repoid:id}))(repoNodeOutEdges),
    });
  })
);
// export const to_repo_url= setStateX('repos.prop.url');
export const to_repo_url = getHandler(
  debounce(500),
  filter(({value})=>!!value),
  sampleCombine(repos$,repoNodes$,repoNodeOutEdges$,userToken$),
  map(([props,allRepos,allrepoNodes,allRepoNodeOutEdges,token])=>{
    const {data:id,value:url} = props;
    console.log(`requesting`,{url,id,token});
    asyncRepoUrlToGraph({url,id,token})
    .then(({repoNodes:newNodes,repoNodeOutEdges:newEdges})=>{
      console.log(`received`,newNodes,newEdges);
      let maxKey,minKey;
      const repo = {...allRepos[id],url,costPerChangeMax:0,costPerChangeMin:Infinity}; // add url
      const repos = {...allRepos,[id]:repo};
      // const omittedNodes = omitv(matches({repoid:id}))(allrepoNodes);
      // console.log(`omittedNodes`, omittedNodes);
      const repoNodeOutEdges = {...omitv(matches({repoid:id}))(allRepoNodeOutEdges),...newEdges};
      const repoNodes = {
        ...omitv(matches({repoid:id}))(allrepoNodes),
        ...mapv(node=>{
          if(!node.code||node.hasOwnProperty('costPerChange')){return node;}
          const {analysis,code} = analyse(node.path,node.code);
          const n = {...node,code};
          mapv((v,k)=>{
            if(!isNumber(v)){return;}
            minKey = `${k}Min`;
            maxKey = `${k}Max`;
            // storing these values since recalculating on large repos will be expensive.
            // observables/selectors will make this a lot simpler, combine streams
            // rather than only calculate on retrieving new nodes
            if(!repo.hasOwnProperty(minKey)){repo[minKey]=v;}
            if(!repo.hasOwnProperty(maxKey)){repo[maxKey]=v;}
            if(repo[minKey]>v){repo[minKey]=v;}
            if(repo[maxKey]<v){repo[maxKey]=v;}
            n[k]=v;
          })(analysis);
          // this might go negative if maintainability really sucks
          n.costPerChange = (171-n.maintainability)/1000*repo.devcost*repo.changetime;
          n.userImpact = n.cyclomatic;//+analysis.params.length/analysis.functions.length
          if(repo.costPerChangeMin>n.costPerChange){repo.costPerChangeMin=n.costPerChange;}
          if(repo.costPerChangeMax<n.costPerChange){repo.costPerChangeMax=n.costPerChange;}
          return n;
        })(newNodes)
      };
      assignToStateX({repos,repoNodes,repoNodeOutEdges})
    });
  })
);

// with takeWhenPropChanged, only check the ones you care about, so extra collection props don't get looped.
// assumes that when state is set on a nested object, all the parent objects are also copied
// const [changed_repo_urls$]=takeWhenPropChangedStreams(['url'])(repos$);
// pipe(
//   x=>changed_repo_urls$,
//
//   sampleCombine(repos$repoNodes$,repoNodeOutEdges$)
//   sampleCombine()
//
// )();
//
//   sampleCombine(repos$,repoNodes$,repoNodeOutEdges$),
//   converge([ // needs debouncing
//     mapColl({// remove the current url's nodes
//     repoNodes:compose(omitv,matches,polyGet({repoid:'id'})),
//     repoNodeOutEdges:compose(omitv,matches,polyGet({repoid:'id'})),
//   }),
//   pipeAllArgsAsync( // get new nodes, set new nodes + new url
//     map(([url,repos,repoNodes,repoNodeOutEdges])=>{
//
//     })
//     from({url:'target.value',id:'id',token:'userTokens.0.value'}),
//     plog(`allArgsAsync`),
//     asyncRepoUrlToGraph, // get new repoNodes and repoNodeOutEdges for this repo
//     converge({
//       repoNodes:get('repoNodes'),
//       repoNodeOutEdges:get('repoNodeOutEdges'),
//       repos:from('repos'),
//       url:from('target.value'),
//       id:from('id')
//     }),

//
// )
