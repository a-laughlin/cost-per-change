import {createEventHandler} from 'recompose';
import {of$,from$,combine$,map,debug,debounce,from,combineWith,flatten,flattenConcurrently,flattenSequentially,addListener,
  addDebugListener,setDebugListener,dropRepeats,flatMapLatest,flatMap,sampleCombine,getDebugListener,
  removeListener,getListener,subscribe,fold,drop,periodic$
} from './utils$.js';
import {isObservable} from './utils.js';
import {takeWhenPropChanged,filterChangedItems,simpleStore} from 'dataflow.js';

const defaultStore = {
  collA:{a:{id:'a',v:1},b:{id:'b',v:2}},
  collC:{c:{id:'c',v:1},d:{id:'d',v:2}},
};




describe(`simpleStore`, () => {
  test(`gets store and dispatch fns`, () => {
    const {store$,dispatch} = simpleStore();
    expect(isObservable(store$)).toBe(true);
    expect(isFunction(dispatch)).toBe(true);
  });
});

describe(`takeWhenPropChanged`, () => {
  test(`correctly filters from store`, () => {
    return true;
    // manual tests earlier - need to add to official tests once I'm sure these functions work well

    // const store_on_token_changed$ = takeWhenPropChanged('userTokens')(store$);
    // const userTokens_changed$ = store_on_token_changed$.map(get('userTokens'));
    // const repos_changed$ = (takeWhenPropChanged('repos')(store$)).map(get('repos'));
    // const userTokens_changed_value$ = filterChangedItems('value')(userTokens_changed$);
    // // const userTokens_values_on_value_changed = filterChangedItems('value')(userTokens_on_any_changed$);
    //
    //
    // // setStateX('tColl')({value:tColl});
    // // setStateX('tColl')(t01);
    // const getDbl = str=>({
    //   next:v=>console.log(str+' changed:',isPlainObject(v)?Object.keys(v):v),
    //   error:e=>{console.error(e);},
    //   complete:x=>x//console.log.bind(console,str+' complete'),
    // });
    // setDebugListener(getDbl(' ****** store$ changed ****** '))(store$);
    // setDebugListener(getDbl('userTokens_changed$'))(userTokens_changed$);
    // addDebugListener(getDbl('repos_changed$'))(repos_changed$);
    // addDebugListener(getDbl('userTokens_changed_value$'))(userTokens_changed_value$);
    //
    // periodic$(2000)
    // .take(2)
    // .map((v)=>{
    //   setStateX('userTokens.0.value')({value:''+v});
    // })
    // .addListener(getListener())

  });

});
describe(`filterChangedItems`, () => {
  return true;
});
