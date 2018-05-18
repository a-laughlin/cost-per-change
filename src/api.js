import {
  get,omit,isPlainObject,plog,objToUrlParams,uniqueId
} from './lib/utils'
// import * as bb from 'bluebird';
import {composeBFWalkerAsync,extension} from './lib/composeWalker'

export const fFetch = (options={})=>data=>{
  if(isPlainObject(data)){
    return fFetch({
      url:'',
      method:'GET',
      mode:'cors',
      redirect:'follow',
      // body:'',
      // credentials:undefined
      ...options,
      ...data,
      headers:{...(options.headers||{}),...(data.headers||{})},
      search:{...(options.search||{}),...(data.search||{})},
    });
  }
  const opts = {...options,body:data||options.body};
  const fetchArgs = omit(['url','search'])(opts);
  return window.fetch( opts.url+objToUrlParams(opts.search),fetchArgs);
};


export const responseJsonToObj = resp=>resp.json(); // or lodash method('json');
export const objToJsonString = data=>JSON.stringify(data);
export const objToJsonStringPretty = data=>JSON.stringify(data,null,2);
export const jsonStringToObj = JSON.parse.bind(JSON);





const formatGQLQuery = (str)=>{
  return JSON.stringify({
    query:str.replace(/\s\n\t/g,'').replace(/\.\.\.on(.*?\{)/g,'... on $1'),
    variables:""
  });
}



const queryGithub = ({repo,author,branch,path,type,token})=>{
  return fFetch({
    method:'POST',
    url:'https://api.github.com/graphql',
    headers:{
      'Content-Type': 'application/json',
      Authorization:`token ${token}`
    },
    body:formatGQLQuery(`
      {
        repository(name: "${repo}", owner: "${author}") {
          object(expression: "${branch}:${path}") {
            ... on Tree{
              entries{
                name,
                type,
                object{
                  ... on Blob {
                    text,
                  }
                }
              }
            }
          }
        }
      }
    `)
  })()
  .then(responseJsonToObj)
  .then(get('data.repository.object'))
  .catch((e)=>{ console.error(e); throw e; })
}

const repoPathToQueryParts = (repoPath)=>{
  // inputs:
  //    https://github.com/<username>/repo/path...
  //    or, if tree|blob present as type
  //    https://github.com/<username>/repo/[type/branch/]path...
  let ignore,author,repo,type,path,branch='master';
  [ignore,author,repo,path]=repoPath.match(/^.*github.com\/(.+?)\/(.+?)\/(.*?)\/?$/)
  if(/^(tree|blob)/.test(path)) {
    [ignore,type,branch,path]=path.match(/^(.+?)\/(.+?)\/(.*)/);
  }
  return {author,repo,branch,path};
};

const hasCode = (node)=>node.text!==undefined;
const validFileExtensions = /\.js$|\.jsx$|\.ts$/;
const isJsFileOrDirectory = n=>n.type==='tree'||validFileExtensions.test(n.name)
export const loadRepoGraph = ({id,url,token})=>{
  const {author,repo,branch,path}=repoPathToQueryParts(url);
  return composeBFWalkerAsync([
    extension.nodeMap,
    extension.inOutEdgeMaps,
    {
      getCollectionMeta:(obj)=>({...obj,repoNodes:{},repoNodeOutEdges:{}}),
      getNodeKey:n=>n.id,
      getRelated:(relArr,node)=>{
        if(hasCode(node)){return relArr;}
        if(node.path.includes('node_modules')){return relArr;}
        return Promise.resolve(queryGithub({repo,author,branch,token,path:node.path}))
        .then(({entries})=>{
          return entries
            .filter(isJsFileOrDirectory)
            .map(({object,name})=>{
              const pth = (node.path?(node.path+'/'+name):name);
              return {...object,id:id+pth.replace(/\./g,'_'), name, enabled:true,hovered:false,repoid:id,path:pth};
            })
        })
        .catch(e=>{
          console.error(e);
          return relArr;
          throw e;
        })
      },
      postWalk:(collection,cdata)=>{
        const {nodeMap,inEdges,outEdges,repoNodes,repoNodeOutEdges} = cdata;
        const withoutText = omit(['text'])
        let edges;
        nodeMap.forEach((v,k)=>{
          repoNodes[k]=v.text===undefined?v:Object.assign(withoutText(v),{code:v.text})
          edges = outEdges.get(k);
          if(edges){repoNodeOutEdges[k]={id:k,repoid:id,edges};}
        });
        return collection;
      },
      clearCollectionMeta:(cdata)=>{
        ['nodeMap','inEdges','outEdges'].forEach((k)=>{
          cdata[k].clear()
          delete cdata[k];
        });
        return cdata;
      },
    }
  ])([{name:path,path:path,repoid:id,enabled:true,hovered:false,id:id+'_root'}])
};
