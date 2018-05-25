import {
  mapv,pipe,ensureArray,each,arrayToArgs,identity,
  assignPropsToArrays,plog,flatMap
} from './utils'
import * as bb from 'bluebird';
export const demoData = [{
  name:'1',
  children:[
    {name:'1.1',children:[{name:'1.1.1'},{name:'1.1.2'}]},
    {name:'1.2',children:[{name:'1.2.1'},{name:'1.2.2'}]}
  ]
}];
const pipeAllArgs=(fn1,...fns)=>(arg1,...args)=>fns.reduce((a,f)=>f(a,...args), fn1(arg1,...args));
export const extension = {
  defaults:{
    afterVisitRelated:(node, related, subRelated, depth, cdata)=>node,
    isWalkingSkipped:(isSkipped, node, related, depth, cdata)=>isSkipped,
    getCollectionMeta:(obj)=>({
      getNodeKey:identity,
      ...obj,
      walkingSkipped:new Set(),
      resolved:new Map(), // basically transitive closure...
      visited:new Set(),
    }),
    clearCollectionMeta:(obj)=>{
      obj.walkingSkipped.clear();
      obj.visited.clear();
      obj.resolved.clear();
      delete obj.getNodeKey;
      delete obj.walkingSkipped;
      delete obj.visited;
      delete obj.resolved;
      return obj;
    },
    getRelated:(relArr, node, cdata)=>relArr,
    onResolve:(node, adjacentNodes, depth, allRelated, cdata)=>node,
    onVisit:(node, depth, cdata)=>node,
    onVisitRelated:(node, relatedNode, depth, cdata)=>node,
    preWalk:(collection,cdata)=>collection,
    postWalk:(collection,cdata)=>collection,
    spreadNode:ensureArray
  },
  demoData:{
    getRelated:(relArr, node, cdata)=>[...relArr,...ensureArray(node.children)]
  },
  adjacencyMap:{
    getCollectionMeta:obj=>({...obj,adjacencyMap:new Map()}),
    onResolve:(node, adjacentNodes, depth, allRelated, {getNodeKey,adjacencyMap})=>{
      adjacencyMap.set(getNodeKey(node),adjacentNodes);
      return node;
    }
  },
  nodeMap:{
    getCollectionMeta:obj=>({...obj,nodeMap:new Map()}),
    onResolve:(node, adjacentNodes, depth, allRelated, {getNodeKey,nodeMap})=>{
      nodeMap.set(getNodeKey(node),node);
      return node;
    }
  },
  inOutEdgeMaps:{
    getCollectionMeta:obj=>({...obj,inEdges:new Map(),outEdges:new Map()}),
    onResolve:(node, adjacentNodes, depth, allRelated, {getNodeKey,inEdges,outEdges})=>{
      let adjKey;
      const nodeKey = getNodeKey(node);
      adjacentNodes.forEach((adj)=>{
        adjKey = getNodeKey(adj);
        (inEdges.get(adjKey)||inEdges.set(adjKey,[]).get(adjKey)).push(nodeKey);
        (outEdges.get(nodeKey)||outEdges.set(nodeKey,[]).get(nodeKey)).push(adjKey);
      })
      return node;
    }
  },
  rootNodes:{ // should come after inOutEdgeMaps when composing
    getCollectionMeta:obj=>{
      if(obj.nodeMap === undefined || obj.inEdges === undefined){ throw new Error('rootNodeSet must come after inOutEdgeMaps') }
      return ({...obj,rootNodes:[]})
    },
    postWalk:(collection,{inEdges,rootNodes,nodeMap,getNodeKey})=>{
      let nodeKey;
      nodeMap.forEach((node)=>{
        nodeKey = getNodeKey(node);
        if(!inEdges.has(nodeKey)){rootNodes.push(nodeKey);}
      });
      return collection;
    }
  },
  treeMap:{ // should come after inOutEdgeMaps when composing
    getCollectionMeta:obj=>{
      if(obj.rootNodeSet === undefined){ throw new Error('treeMap must come after rootNodeSet') }
      return ({ ...obj, treeMap:new Map()})
    },
    postWalk:(collection,{treeMap,inEdges,outEdges,rootNodeSet,nodeMap,getNodeKey})=>{
      const getNodeByKey = nodeMap.get.bind(nodeMap);
      const nodeKeyToPojo = (nodeKey)=>{
        const parent = ensureArray(inEdges.get(nodeKey)).map(getNodeByKey)[0]
        return {
          value:getNodeByKey(nodeKey),
          parent,
          children:nodeKeyToChildren(nodeKey)
        }
      };
      const nodeKeyToChildren = pipe(
        outEdges.get.bind(outEdges),
        ensureArray,
        flatMap(nodeKeyToPojo)
      );
      rootNodeSet.forEach(key=>treeMap.set(key,nodeKeyToPojo(key)));
      return collection;
    }
  },
  paths:{
    getCollectionMeta:obj=>{
      if(obj.inEdges === undefined){ throw new Error('paths must come after inOutEdgeMaps') }
      return ({...obj,paths:new Map()})
    },
    onResolve:(node, adjacentNodes, depth, allRelated, {paths,inEdges,outEdges})=>{
      // TBD
      return node;
    }
  },
  trackCycles:{
    getCollectionMeta:obj=>({...obj,trackCycles:new Map()}),
    onVisit:(node, adjacentNodes, depth, allRelated, {getNodeKey,trackCycles,visited,resolved,walkingSkipped})=>{
      const nodeKey = getNodeKey(node);
      if (visited.has(nodeKey) && !resolved.has(nodeKey)){
        trackCycles.add(nodeKey,allRelated)
        walkingSkipped.add(nodeKey)
      }
      return node;
    },
  },
  errorOnCycles:{
    onVisit:(node, depth, {visited,resolved,getNodeKey})=>{
      if (visited.has(getNodeKey(node)) && !resolved.has(getNodeKey(node))){throw new Error('cycle error in packages');}
      return node;
    },
  },
  topoSortAndDedupRelatedArrayInPlace:{
    // TBD: Making the name ugly since mutating related array is not ideal.
    // Need to think more on strategies to dedupe the recursive allRelated array that won't
    // break other extensions that depend on sort order or duplicate existence.
    onResolve:(node, immediateRelated, depth, allRelated, {resolved})=>{
      // given related nodes like A<CB & B<C, A's allRelated is [C,B,C], so uniq + sort to [B,C]
      if (allRelated.length <= 1){return;}
      let relA, relB;
      const sorted = Array.from(new Set(allRelated)).sort((a, b)=>{
        relA = resolved.get(a);
        if (relA.length === 0){return 1;}
        if (relA.includes(b)){return -1;}
        relB = resolved.get(b);
        if (relB.length === 0){return -1;}
        if (relB.includes(a)){return 1;}
        return 0;
      });
      allRelated.length = 0;
      allRelated.push(...sorted);
      return node
    }
  },
};

export const composeDFWalker = pipeAllArgs(
  (objs)=>assignPropsToArrays([extension.defaults,...objs]),
  mapv(arrayToArgs(pipeAllArgs)),
  function dfWalker ({
    afterVisitRelated, getCollectionMeta, getRelated, getNodeKey,clearCollectionMeta,
    onResolve, onVisit, onVisitRelated, preWalk, postWalk, spreadNode,
  }){
    return function composedWalker(collection){
      const cdata = getCollectionMeta({getNodeKey});
      collection = preWalk(collection, cdata);
      each((val, key)=>{
        spreadNode(val, key, cdata).forEach((node,i)=>depthFirst(node,0,cdata));
      })(ensureArray(collection));
      postWalk(collection, cdata);
      clearCollectionMeta(cdata);
      return cdata;
    }
    /* eslint-disable no-unreachable */
    function depthFirst(node, depth = 0, cdata){
      const nodeKey = getNodeKey(node);
      let allRelated = cdata.resolved.get(nodeKey);
      if (allRelated){return allRelated;}
      onVisit(node, depth, cdata);
      cdata.visited.add(nodeKey);
      allRelated = [];
      if (cdata.walkingSkipped.has(nodeKey)){return allRelated;}
      let j = -1;
      let immediateRelated = getRelated([],node, cdata);
      let relatedLen = immediateRelated.length;
      let related, subRelated;
      while (++j < relatedLen){
        related = immediateRelated[j];
        if (cdata.walkingSkipped.has(getNodeKey(related))){continue;}
        allRelated.push(related);
        subRelated = depthFirst(related, depth + 1, cdata);
        allRelated.push(...subRelated);
        afterVisitRelated(node, related, subRelated, depth, cdata);
      }
      onResolve(node, immediateRelated, depth, allRelated, cdata);
      cdata.resolved.set(nodeKey, allRelated);
      return allRelated;
    };
    /* eslint-enable no-unreachable */
  }
);
export const composeWalker = composeDFWalker;



export const composeBFWalkerAsync = pipeAllArgs(
  (objs)=>assignPropsToArrays([extension.defaults,...objs]),
  mapv(arrayToArgs(pipeAllArgs)),
  function bfWalkerAsync ({
    afterVisitRelated, getCollectionMeta, getRelated, getNodeKey,
    onResolve, onVisit, onVisitRelated, preWalk, postWalk,clearCollectionMeta
  }){
    return function breadthFirst(collection){
      const cdata = getCollectionMeta({getNodeKey});
      return bb.all(ensureArray(collection))
      .then(c=>ensureArray(preWalk(c, cdata)))
      .each(n=>next(n,0))
      .then(c=>{
        postWalk(c,cdata);
        clearCollectionMeta(cdata);
        return cdata;
      })
      function next(node,depth){
        const nodeKey = getNodeKey(node);
        let allRelated = cdata.resolved.get(nodeKey);
        if(allRelated){return allRelated;}
        allRelated = [];
        onVisit(node,depth,cdata);

        return bb.all(getRelated([],node,cdata))
        .then(immediateRelated=>{
          onResolve(node, immediateRelated, depth, undefined, cdata);
          cdata.resolved.set(nodeKey, immediateRelated);
          return bb.all(immediateRelated.map(r=>next(r,depth+1)))
        });
      };// eslint-disable-line no-unreachable
    };
  }
);

// bfAsync({
//   ...extension.defaults,
//   getRelated:node=>Promise.resolve(node.children||[]),
//   onResolve:(node, allRelated, depth, allRelated2, cdata)=>{console.log(node,allRelated,depth);}
// })(demoData);
