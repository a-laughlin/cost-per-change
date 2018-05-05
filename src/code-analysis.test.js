const transformedJSX = babelPresetTransforms.react(`const Comp = (props)=>(<div>{props.children}</div>)`);
console.log(`transformedJSX`, transformedJSX);
const transformedTS = babelPresetTransforms.typescript(`const x: number = 0;`);
console.log(`transformedTS`, transformedTS);

const es6Test = `
import {React} from 'react';

class Foo extends React.Component{
  constructor(){}
  // someProp=true
};
export default Foo;
`;
console.log(`es6Test`, babelPresetTransforms.es2017(es6Test));
