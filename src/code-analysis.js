import {analyse as ana} from 'escomplex';
import * as babel from '@babel/standalone';

/*
Running a slew of babel presets trades:
- analysis speed
- code clarity
for
- "just works" reliability
- metrics consistency across files/repos/transpilations

Notes:
2015 especially mangles the code
Per babel docs, presets run last-to-first
*/

const babelPresets = {presets:[
  'es2015',
  'es2016',
  'es2017',
  ['stage-3',{"decoratorsLegacy": true}],
  ['stage-2',{"decoratorsLegacy": true}],
  ['stage-1',{"decoratorsLegacy": true}],
  ['stage-0',{"decoratorsLegacy": true}],
  'react',
  'typescript',
]};

export const analyse = (pathStr,codeStr)=>{
  let code, analysis, errors;
  try {
    code = babel.transform(codeStr, babelPresets).code;
    analysis = ana(code,{noCoreSize:true});
    // console.log(`analysis: "${pathStr}"\n`, analysis);
  } catch(e){
    code || (code = codeStr);
    code = `File Not Analyzed.\nERROR escomplex-ing "${pathStr}".\n:${e.message}\n\n\n` + code;
    analysis = ana('',{noCoreSize:true});
    console.log(`\nERROR escomplex-ing "${pathStr}".\n:${e.message}`);
  }
  return {code,analysis};
};

// var estimateBigOhs = (pairsArray)=>{
 // var max=0;
 // var Ohs = pairsArray.map(([n,time])=>{
    // if(typeof time !== 'number' || typeof n !== 'number'){
      // return 'all args must be nums';
    // }
    // if(n<=1){
      // return 'n must be greater than 1';
    // }
    // let result = time;
    // let o = 0;
    // while(true){
      // result = result/n;
      // o++;
      // if (result<=1){break;}
    // };
    // if(o>max){max=o;}
    // return o;
 // });
 // return {
    // ohs:Ohs,
    // ohsMax:`O(n^${max})`
 // }
// };
// estimateBigOhs([[2,4],[4,16],[8,64]])

// export const codeStringToCodeObj = (str)=>{
//   try{ return parseScript(str);}
//   catch(e){
//     try{return parseModule(str);}
//     catch(ee){ return ee; }
//   }
// }
// export const filesArrayToTreeObj = (str)=>{
//   try{ return parseScript(str);}
//   catch(e){
//     try{return parseModule(str);}
//     catch(ee){ return ee; }
//   }
// }
//
// export const codeObjToCodeGraph = composeWalker([
//   extension.inOutEdges,
//   extension.nodeMaps,
//   extension.rootNodes,
//   {getRelated:(relArr, node, cdata)=>[...relArr,...filter(isObjectLike)(node)]},
// ]);
//
// export const graphToTreeObjects = ({rootNodes,outEdges})=>{
//   return Array.from(rootNodes).map(function nodeToPojo(n){
//     const name = n.name||n.type||(n.key&&n.key.type);
//     const children = flatten([...ensureArray(outEdges.get(n)).map(nodeToPojo)]);
//     if(!name){return children}
//     if(children.length){return {name,children:children.filter(c=>!!c)}}
//     return {name}
//   })
// }
//
//
// export const codeObjToToTreeObj = pipe( codeObjToCodeGraph, graphToTreeObjects, get(0) );
// export const codeStringToTreeObj = pipe( codeStringToCodeObj, codeObjToToTreeObj);
