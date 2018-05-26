import {createStore} from 'redux';
// import {devToolsEnhancer} from 'redux-devtools-extension'
import {hierarchy} from 'd3';
import {createEventHandler} from 'recompose';
import {pipe,identity,ensureArray,set,groupByKey,ox,matches,isNumber,ro,mo,fa,fo,ma,dpipe,rest,cond,
        len,stubTrue} from './lib/utils';
import {from$,of$,combine$,map,debounce,from,addListener,dropRepeats,sampleCombine,fold,drop,filter,remember} from './lib/utils$.js';
// import {initCache,tpl,/*tpl*/} from './lib/dataflow-cache.js'
import {analyse} from './analyse';
import {loadRepoGraph} from './api'
import {initialState} from './static/initial-state';
// testing
import {plog} from './lib/utils';
import {initCache} from './lib/dataflow-cache.js'
import {addDebugListener,debug} from './lib/utils$.js';



/**
  State Setup
**/
initialState.userTokens['0'].value = process.env.REACT_APP_GITHUB_TOKEN;
// const tapUpdater = identity
const tapUpdater = updater=>pipe(plog('prevState'),updater,plog('nextState'));
const store = createStore((state,{updater=identity})=>tapUpdater(updater)(state),initialState);
const store$ = from$(store[Symbol.observable]()).remember();
const dispatch = store.dispatch.bind(store);
const cache = initCache(store$);
const tplRegex = /\[(.+?)\]\.?/g;
const tpl = s=>props=>s.replace(tplRegex,(_,k)=>`.${(k in props)?props[k]:k}.`).replace(/\.$/,'');
export const cache$ = cache.get;
export const pcache$ = (str,...fns)=>pipe(tpl(str),cache$,(fns[0]?map(pipe(...fns)):identity));



/**
  Derived Collections
  (eventually migrate to cache$ once it supports them)
**/
export const [repos$, repoNodes$, rootNodes$,repoNodeOutEdges$, userTokens$, analysisMods$] = [
      'repos','repoNodes','rootNodes','repoNodeOutEdges','userTokens','analysisMods'].map(cache$);

const derivedColl = ({prev={},pred=pv=>!!pv,mapNew=x=>x}={})=>{
  const meta={prev,len:0};
  return pipe(
    debounce(0),
    map(input=>{
      let nextLen=0, changes=0;
      const prev = meta.prev;
      // console.log(`input`, input);
      let optionalReturn;
      const next = ro((next_temp,n,k)=>{
        ++nextLen;
        if(pred(prev[k],n)){return next_temp[k]=prev[k];}
        ++changes;
        optionalReturn = mapNew(n,k,next_temp);
        if(optionalReturn){next_temp[k]=mapNew(n,k,next_temp);}
      })(input);
      // console.log(`after input:changes,nextLen,next`, changes,nextLen,next);
      // console.log(`next`,input);
      if(!changes && nextLen === meta.len){return prev;}
      meta.len = nextLen;
      return meta.prev = next;
    }),
    dropRepeats,
    remember,
  );
};
const derivedIndex = (key,nestedKey)=>derivedColl({
  pred:(p,n)=>p && p[n[key]]&&p[n[key]][n[nestedKey]],
  mapNew:(n,k,acc)=>{
    acc[n[key]] || (acc[n[key]] = {});
    acc[n[key]][n[nestedKey]]=n;
  },
})

export const d3TreeStructure_by_repoid$ = cache.set(['rootNodes','repoNodeOutEdges'],'treeNodes',pipe(
  combine$,
  map(([roots,edges])=>ro((acc,{repoid,id})=>{acc[repoid]={repoid,id,edges};})(roots)),
  derivedColl({ mapNew:({id,edges,repoid})=>hierarchy(id,i=>(edges[i]||{edges:[]}).edges)}),
));

const codeAnalysesRaw$ = cache.set(['repoNodes'],'codeAnalysesRaw',
  derivedColl({mapNew:next=>analyse(next.path,next.code)}),
);

export const nodeAnalyses$ = cache.set(
  ['analysisMods','repoNodes','codeAnalysesRaw'], 'nodeAnalyses',pipe(combine$,
    map(([mods,repoNodes,analyses])=>{
      const reposData = {};
      return ro((acc,node,nodeid)=>{
        if(!node.code){return;}
        reposData[node.repoid] || (reposData[node.repoid] = {
          costPerChangeMax:0,costPerChangeMin:Infinity,
          devcost: mods[node.repoid].devcost,
          changetime: mods[node.repoid].changetime,
        });
        acc[nodeid] = { ...node, ...analyses[nodeid],repoData:reposData[node.repoid]};
      })(repoNodes)
    }),
    derivedColl({
      pred:(p,n)=>(p  && p.repoData.devcost === n.repoData.devcost
                      && p.repoData.changetime === n.repoData.changetime),
      mapNew:(n,k,acc)=>{
        const {repoData,analysis}=n;
        let minKey,maxKey;
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
        return Object.assign(n,repoData);
      }
    }),
  )
);



/**
  Joins
**/

export const nodeAnalyses_by_repoid$ = cache.set(['nodeAnalyses'],'repos.nodeAnalyses',
  derivedIndex('repoid','id')
);





/**
  Store Updating Utils (simple state shape ftw)
  cases are:
  collections items removing (one,many) - assignToState
  collections items adding (one, many) - assignToState
  collections item props updating many - assignToState
  collections item props updating one - toStore

  Collections are defined in initialState, so no need to add/remove those from store.

  exporting toStore because indirection only adds complexity when setting single props
  not exporting assignToStore. data logic in components increases coupling and complexity
    ... use getHandler for that
**/
export const toStore = str=>({value,data=''})=>{
  dispatch({type:'fn',updater:state=>set(tpl(str)({data}),value,state)}); return {value,data};};

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
  sampleCombine(repos$,repoNodes$,rootNodes$,repoNodeOutEdges$,analysisMods$),
  map(([id,repos,repoNodes,rootNodes,repoNodeOutEdges,mods])=>{
    let repoid=id+'_1';
    while(repos[repoid]){ repoid+='_1'; }
    const sRepo=(str)=>str.replace(id,repoid);
    const transformRepo = (acc,v,k)=>{ if(k===id){acc[repoid]={...v,id:repoid,repoid}}};
    const transformMods = transformRepo;
    const transformNode = (acc,v,k)=>{
      if (v.repoid!==id) {return;}
      const fid = sRepo(k);
      console.log(`v.repoid`, v.repoid);
      acc[fid]={...v,id:fid,repoid};
      if(v.edges){
        console.log(`EDGES`, v.edges);
        acc[fid].edges=v.edges.map(sRepo);
      };
    };
    assignToStore({
      repos:{...repos,...ro(transformRepo)(repos)},
      rootNodes:{...rootNodes,...ro(transformNode)(rootNodes)},
      repoNodes:{...repoNodes,...ro(transformNode)(repoNodes)},
      analysisMods:{...mods,...ro(transformMods)(mods)},
      repoNodeOutEdges:{...repoNodeOutEdges,...ro(transformNode)(repoNodeOutEdges)},
    });
  })
);

export const to_repo_remove = getHandler(
  sampleCombine(repos$,repoNodes$,rootNodes$,repoNodeOutEdges$,analysisMods$),
  map(([id,repos,repoNodes,rootNodes,repoNodeOutEdges,mods])=>{
    assignToStore({
      repos:ox(matches({id}))(repos),
      rootNodes:ox(matches({repoid:id}))(rootNodes),
      repoNodes:ox(matches({repoid:id}))(repoNodes),
      analysisMods:ox(matches({id}))(mods),
      repoNodeOutEdges:ox(matches({repoid:id}))(repoNodeOutEdges),
    });
  })
);


export const to_repo_url = getHandler(
  debounce(500),
  filter(({value})=>!!value),
  sampleCombine(repos$,rootNodes$,repoNodes$,repoNodeOutEdges$,cache$('userTokens.0.value')),
  map(([props,allRepos,allRootNodes,allrepoNodes,allRepoNodeOutEdges,token])=>{
    const {data:id,value:url} = props;
    console.log(`requesting`,{url,id,token});
    loadRepoGraph({url,id,token})
    .then((args)=>{
      console.log(`received`,args);
      const {repoNodes:newNodes,repoNodeOutEdges:newEdges,rootNodes:newRoots} = args;
      let maxKey,minKey;
      const repo = {...allRepos[id],url}; // add url
      const repos = {...allRepos,[id]:repo};
      // const omittedNodes = ox(matches({repoid:id}))(allrepoNodes);
      // console.log(`omittedNodes`, omittedNodes);
      const repoNodeOutEdges = {...ox(matches({repoid:id}))(allRepoNodeOutEdges),...newEdges};
      const repoNodes = {...ox(matches({repoid:id}))(allrepoNodes), ...newNodes};
      const rootNodes = {...ox(matches({repoid:id}))(allRootNodes), ...newRoots};
      assignToStore({repos,repoNodes,rootNodes,repoNodeOutEdges})
    });
  })
);
