import {createStore} from 'redux';
import {hierarchy} from 'd3';
import {createEventHandler} from 'recompose';
import {pipe,identity,ensureArray,set,groupByKey,ox,matches,isNumber,ro,mo,fa,fo,ma,dpipe} from './lib/utils';
import {from$,of$,combine$,map,debounce,from,addListener,dropRepeats,sampleCombine,fold,drop,filter,remember} from './lib/utils$.js';
// import {initCache,tpl,/*tpl*/} from './lib/dataflow-cache.js'
import {analyse} from './analyse';
import {loadRepoGraph} from './api'
import {initialState} from './static/initial-state';

// testing
import {plog} from './lib/utils';
import {initCache2} from './lib/dataflow-cache.js'
import {addDebugListener} from './lib/utils$.js';

/**
  State Setup
**/
initialState.userTokens['0'].value = process.env.REACT_APP_GITHUB_TOKEN;
// const tapUpdater = identity
const tapUpdater = updater=>pipe(plog('prevState'),updater,plog('nextState'));
const store = createStore((state,{updater=identity})=>tapUpdater(updater)(state),initialState);
const store$ = from$(store[Symbol.observable]()).remember();
const dispatch = store.dispatch.bind(store);
// const cache = initCache(store$,initialState); // Cache only auto-reads store. No mutations.

const {get:cget,set:cset}  = initCache2(store$,initialState);
// for use in react components
export const cache$ = cget;
const tplRegex = /\[(.+?)\]\.|\.(.+?)\./g;
const tplReplacer = string=>data=>string.replace(tplRegex,`[${data}].`);
export const tpl = (s,props)=>s.replace(tplRegex,(_,key)=>`.${(key in props)?props[key]:key}.`);
export const pcacheOne$ = (str)=>pipe( props=>tpl(str,props), cache$);
export const pcache$ = (...strs)=>props=>{
  return strs.length===0
    ? of$(undefined)
    : strs.length > 1
      ? combine$(...strs.map(s=>pcacheOne$(s)(props)))
      : pcacheOne$(strs[0])(props);
};

// dpipe(
//   cache$('repos.repo0'),
//   map(plog(`repos`),),
//   addDebugListener
// )
// dpipe(
//   cache$('userTokens.0.value'),
//   map(plog(`userTokens.0.value`),),
//   addDebugListener
// )


/**
  Derived Collections
  (eventually migrate to cache$ once it supports them)
**/
export const [repos$, repoNodes$, repoNodeOutEdges$, userTokens$, analysisMods$] = [
      'repos','repoNodes','repoNodeOutEdges','userTokens','analysisMods'].map(s=>cache$(s));

export const codeAnalysesRaw$ = dpipe(
  cache$('repoNodes'),
  fold((prevAnalyses,repoNodes)=>{
    let changes = 0,nextLen=0;
    const analyses = mo((n,id)=>{
      if(prevAnalyses[id]){return prevAnalyses[id];}
      changes++;
      return {id,...analyse(n.path,n.code)};
    })(repoNodes);
    return changes===0 ? prevAnalyses : analyses;
  },{}),
  drop(1),
  dropRepeats,
  remember,
);

// Derived Collections
export const nodeAnalyses$ = dpipe(
  combine$(codeAnalysesRaw$,analysisMods$),
  sampleCombine(repoNodes$),
  fold((prevAnalyses,[[analyses,mods],repoNodes])=>{
    const repoData = {costPerChangeMax:0,costPerChangeMin:Infinity};
    let minKey,maxKey;
    const result = ro((acc,node,nodeid)=>{
      if(!node.code){return;}
      repoData.devcost = mods[node.repoid].devcost;
      repoData.changetime = mods[node.repoid].changetime;
      const {analysis, code} = analyses[nodeid];
      const n = {...node,code};

      mo((v,k)=>{
        if(!isNumber(v)){return;}
        minKey = `${k}Min`;
        maxKey = `${k}Max`;
        if(!repoData.hasOwnProperty(minKey)){repoData[minKey]=v;}
        if(!repoData.hasOwnProperty(maxKey)){repoData[maxKey]=v;}
        if(repoData[minKey]>v){repoData[minKey]=v;}
        if(repoData[maxKey]<v){repoData[maxKey]=v;}
        n[k]=v;
      })(analysis);
      // this might go negative if maintainability really sucks
      n.costPerChange = (171-n.maintainability)/1000*repoData.devcost*repoData.changetime;
      n.userImpact = n.cyclomatic;//+analysis.params.length/analysis.functions.length
      if(repoData.costPerChangeMin>n.costPerChange){repoData.costPerChangeMin=n.costPerChange;}
      if(repoData.costPerChangeMax<n.costPerChange){repoData.costPerChangeMax=n.costPerChange;}
      acc[n.id] = Object.assign(n,repoData,{id:n.id,repoid:n.repoid});
    })(repoNodes);
    return result;
  },{}),
  drop(1),
  dropRepeats,
  remember,
);

export const d3TreeStructure_by_repoid$ = pipe(
  ()=>repoNodeOutEdges$,
  sampleCombine(repoNodes$),
  fold((prev,[repoNodeOutEdges,repoNodes])=>{
    const rootNodes = {...repoNodes};
    const adjList = mo((outEdgeObj,nodeKey)=>outEdgeObj.edges.map((edgeKey)=>{
      delete rootNodes[edgeKey];
      return repoNodes[edgeKey];
    }))(repoNodeOutEdges);
    let changes=0;
    const result = ro((acc,rootNode,id)=>{
      // map nodes to tree object with parent, children, height, depth properties
      const prevRoot = prev[rootNode.repoid];
      if(prevRoot && prevRoot.id===id){acc[rootNode.repoid]=prevRoot;return;}
      changes++;
      acc[rootNode.repoid] = hierarchy(rootNode,n=>adjList[n.id]);
    })(rootNodes);
    return changes?result:prev;
  },{}),
  drop(1),
  dropRepeats,
  remember,
)();





/**
  Joins
  (eventually migrate to cache$ once it supports them)
**/
export const repos_by_repoNode_id$ = dpipe(
  combine$(repos$,repoNodes$),
  map(([r,nodes])=>mo(n=>r[n.repoid])(nodes)),
  remember,
);

export const repoNodes_by_repoid$ = pipe(map(groupByKey('repoid')), remember )(repoNodes$);
export const nodeAnalyses_by_repoid$ = pipe(map(groupByKey('repoid')), remember )(nodeAnalyses$);
export const repoNodeOutEdges_by_repoid$ = pipe(map(groupByKey('repoid')), remember )(repoNodeOutEdges$)






/**
  Store Updating Utils (simple state shape ftw)
  cases are:
  collections item props updating one - toStore
  collections item props updating many - assignToState
  collections items removing (one,many) - assignToState
  collections items adding (one, many) - assignToState

  Collections are defined in initialState, so no need to add/remove those from store.

  exporting toStore because indirection only adds complexity when setting single props
  not exporting assignToStore. data logic in components increases coupling and complexity
    ... use getHandler for that
**/
export const toStore = str=>({value,data=''})=>{
  dispatch({type:'fn',updater:state=>set(tpl(str,{data}),value,state)}); return {value,data};};

const assignToStore = data=>{dispatch({type:'fn',updater:state=>Object.assign({},state,...ensureArray(data))});}

const getHandler = (...fns)=>{ // for more complex action creators
  const {stream,handler} = createEventHandler();
  pipe( ...fns, addListener() )(stream);
  return handler;
};




/**
  Store Updaters
**/

export const to_repo_copy = getHandler(
  sampleCombine(repos$,repoNodes$,repoNodeOutEdges$,analysisMods$),
  map(([id,repos,repoNodes,repoNodeOutEdges,mods])=>{
    let repoid=id+'_1';
    while(repos[repoid]){ repoid+='_1'; }
    const re = new RegExp(id,'g');
    const sRepo=(str)=>str.replace(re,repoid);
    const transformRepo = (acc,v,k)=>{ acc[k]=v; if(k===id){acc[repoid]={...v,id:repoid,repoid}}};
    const transformMods = transformRepo;
    const transformNode = (acc,v,k)=>{
      acc[k]=v;
      if (v.repoid===id) {
        const fid = sRepo(k);
        acc[fid]={...v,id:fid,repoid};
        if(v.edges){acc[fid].edges=v.edges.map(sRepo);}
      };
    };
    assignToStore({
      repos:ro(transformRepo)(repos),
      repoNodes:ro(transformNode)(repoNodes),
      analysisMods:ro(transformMods)(mods),
      repoNodeOutEdges:ro(transformNode)(repoNodeOutEdges),
    });
  })
);

export const to_repo_remove = getHandler(
  sampleCombine(repos$,repoNodes$,repoNodeOutEdges$,analysisMods$),
  map(([id,repos,repoNodes,repoNodeOutEdges,mods])=>{
    assignToStore({
      repos:ox(matches({id}))(repos),
      repoNodes:ox(matches({repoid:id}))(repoNodes),
      analysisMods:ox(matches({id}))(mods),
      repoNodeOutEdges:ox(matches({repoid:id}))(repoNodeOutEdges),
    });
  })
);


export const to_repo_url = getHandler(
  debounce(500),
  filter(({value})=>!!value),
  sampleCombine(repos$,repoNodes$,repoNodeOutEdges$,cache$('userTokens.0.value')),
  map(([props,allRepos,allrepoNodes,allRepoNodeOutEdges,token])=>{
    const {data:id,value:url} = props;
    console.log(`requesting`,{url,id,token});
    loadRepoGraph({url,id,token})
    .then(({repoNodes:newNodes,repoNodeOutEdges:newEdges})=>{
      console.log(`received`,newNodes,newEdges);
      let maxKey,minKey;
      const repo = {...allRepos[id],url}; // add url
      const repos = {...allRepos,[id]:repo};
      // const omittedNodes = ox(matches({repoid:id}))(allrepoNodes);
      // console.log(`omittedNodes`, omittedNodes);
      const repoNodeOutEdges = {...ox(matches({repoid:id}))(allRepoNodeOutEdges),...newEdges};
      const repoNodes = {...ox(matches({repoid:id}))(allrepoNodes), ...newNodes};
      assignToStore({repos,repoNodes,repoNodeOutEdges})
    });
  })
);
