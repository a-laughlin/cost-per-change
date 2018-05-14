import {initialState} from './initial-state';
import {createStore} from 'redux';
import {setObservableConfig,createEventHandler,mapPropsStream,componentFromStream} from 'recompose';
import {
  pipe,compose,mapv,plog,get,identity,pget,pgetv,ensureArray,set,isObservable,assignAll,
  mapvToArr,isFunction,ensureFunction,groupByKey,ifElse,isString,cond,stubTrue,transformToObj,
  omitv,matches
} from './utils';
import {of$,from$,combine$,map,debug,debounce,from,combineWith,flatten,flattenConcurrently,flattenSequentially,addListener,
  addDebugListener,setDebugListener,dropRepeats,flatMapLatest,flatMap,sampleCombine,getDebugListener,
  removeListener,getListener,subscribe,fold
} from './utils$.js';
import xstreamConfig from 'recompose/xstreamObservableConfig';
setObservableConfig(xstreamConfig);


const tplRegex = /\[prop\]\.|\.?prop\./g;
const tpl = s=>prop=>s.replace(tplRegex,`[${prop}].`);
const ensureStreamGetter = cond([
  [isFunction,x=>prop=>x(prop)],
  [isObservable,x=>prop=>prop?map(get(prop))(x):x],
  [isString,x=>prop=>map(get(tpl(x)(prop)))(store$)],
  [stubTrue,x=>prop=>of$(x)],
]);
const props$ = obj=>{
  const keys = Object.keys(obj);
  const getterFns = Object.values(obj).map(ensureStreamGetter);
  return pipe(
    flatMap((data)=>combine$(...getterFns.map(fn=>fn(data)))),
    map(latestVals=>latestVals.reduce((acc,v,i)=>{acc[keys[i]]=v;return acc;},{})),
  );
}
export const mapPropHocFactory = (dataKey='data')=>obj=>mapPropsStream(pipe(
  map(get(dataKey)),
  props$(obj),
  debounce(10),
  // debug('afterMapping')
));

export const mapProp = mapPropHocFactory();
export const prop$ = (...streams)=>(...fns)=>(props)=>{
  return pipe(...fns)(combine$(of$(props.data),...streams));
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

// const tapUpdater = updater=>pipe(plog('prevState'),updater,plog('nextState')),
const store = createStore((state=initialState,{updater=identity})=>updater(state));
const store$ = from$(store[Symbol.observable]()).startWith(initialState);
const dispatch = store.dispatch.bind(store);


const setStateX = str=>({value,data=''})=>{dispatch({type:'fn',updater:state=>set(tpl(str)(data),value,state)}); return value; };
const assignToStateX = data=>{dispatch({type:'fn',updater:state=>Object.assign({},state,...ensureArray(data))});return data;}


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
export const repoNodes_repoid$ = map(mapv('repoid'))(repoNodes$);

// differently indexed
export const repoNodes_by_repoid$ = map(groupByKey('repoid'))(repoNodes$);



// file/directory edges
export const repoNodeOutEdges$ = map(get('repoNodeOutEdges'))(store$);
export const repoNodeOutEdges_by_repoid$ = map(groupByKey('repoid'))(repoNodeOutEdges$);

// user github token
export const userToken$ = map(get('userTokens.0.value'))(store$);
export const to_userToken$ = setStateX('userTokens.0.value');



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
export const to_repo_url= setStateX('repos.prop.url');

export const getChangedPropStreams = (props=['url'])=>input$=>props.map(p=>{
  return pipe(
    fold((last,n)=>{
      const [ll,ln] = last;
      if(ln[p]===n[p]){return last};
      return [ln,n];
    },[{},{}]),
    dropRepeats,
    map(([last,next])=>next)
  )(input$);
});
// with getChangedProps, only check the ones you care about, so extra collection props don't get looped.
// assumes that when state is set on a nested object, all the parent objects are also copied
// const [changed_repo_urls$]=getChangedPropStreams(['url'])(repos$);
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
//     ({repos,repoNodes,repoNodeOutEdges,id,url})=>{
//       // HACKY SECTION - need to recalc values on change instead of storing derived
//       // need reselect or observables for that
//       const repo = {...repos[id],url,costPerChangeMax:0,costPerChangeMin:Infinity}; // add url
//       let maxKey,minKey;
//       return {
//         repos:{...repos,[id]:repo},
//         repoNodeOutEdges,
//         repoNodes:mapv(node=>{
//           if(!node.code||node.hasOwnProperty('costPerChange')){return node;}
//           const {analysis,code} = analyse(node.path,node.code);
//           const n = {...node,code};
//           mapv((v,k)=>{
//             if(!isNumber(v)){return;}
//             minKey = `${k}Min`;
//             maxKey = `${k}Max`;
//             // storing these values since recalculating on large repos will be expensive.
//             // observables/selectors will make this a lot simpler, combine streams
//             // rather than only calculate on retrieving new nodes
//             if(!repo.hasOwnProperty(minKey)){repo[minKey]=v;}
//             if(!repo.hasOwnProperty(maxKey)){repo[maxKey]=v;}
//             if(repo[minKey]>v){repo[minKey]=v;}
//             if(repo[maxKey]<v){repo[maxKey]=v;}
//             n[k]=v;
//           })(analysis);
//           // this might go negative if maintainability really sucks
//           n.costPerChange = (171-n.maintainability)/1000*repo.devcost*repo.changetime;
//           n.userImpact = n.cyclomatic;//+analysis.params.length/analysis.functions.length
//           if(repo.costPerChangeMin>n.costPerChange){repo.costPerChangeMin=n.costPerChange;}
//           if(repo.costPerChangeMax<n.costPerChange){repo.costPerChangeMax=n.costPerChange;}
//           return n;
//         })(repoNodes)
//       };
//     },
//     plog(`after converge`),
//   ),
// ]),
// Promise.all.bind(Promise),
// assignPropsToArrays,
// mapv(assignAll),
// assignToState, // requires pipeAllArgs to get the publish key... can fix with observables and store publish fn.
//
// )
