
import xstream from 'xstream';
import econcat from 'xstream/extra/concat';
import efromDiagram from 'xstream/extra/fromDiagram';
import efromEvent from 'xstream/extra/fromEvent';
import etween from 'xstream/extra/tween';
import ebuffer from 'xstream/extra/buffer';
import edebounce from 'xstream/extra/debounce';
import edelay from 'xstream/extra/delay';
import edropRepeats from 'xstream/extra/dropRepeats';
import edropUntil from 'xstream/extra/dropUntil';
import eflattenConcurrently from 'xstream/extra/flattenConcurrently';
import eflattenSequentially from 'xstream/extra/flattenSequentially';
import epairwise from 'xstream/extra/pairwise';
import esampleCombine from 'xstream/extra/sampleCombine';
import esplit from 'xstream/extra/split';
import ethrottle from 'xstream/extra/throttle';

// export the base obj for factories
export const xs = xstream;

// these make life easier when working with normal pipes
export const mergeWith = (...streams)=>stream=>xs.merge(stream,...streams);
export const combineWith = (...streams)=>stream=>xs.combine(stream,...streams);



// Methods/Operators
// Methods are functions attached to a Stream instance, like stream.addListener().
// Operators are also methods, but return a new Stream, leaving the existing Stream unmodified,
// except for the fact that it has a child Stream attached as Listener. Documentation doesn't say
// which is which
// operators
export const addListener = (...a)=>s=>s.addListener(...a);
export const debug = (...a)=>s=>s.debug(...a);
export const drop = (...a)=>s=>s.drop(...a);
export const endWhen = (...a)=>s=>s.endWhen(...a);
export const filter = (...a)=>s=>s.filter(...a);
export const flatten = s=>s.flatten();
export const fold = (...a)=>s=>s.fold(...a); // - returns MemoryStream
export const imitate = (...a)=>s=>s.imitate(...a); // imitates any non-Memory Stream
export const last = (...a)=>s=>s.last(...a);
export const map = (...a)=>s=>s.map(...a);
export const mapTo = (...a)=>s=>s.mapTo(...a);
export const remember = (...a)=>s=>s.remember(...a);
export const removeListener = (...a)=>s=>s.removeListener(...a);
export const replaceError = (...a)=>s=>s.replaceError(...a);
export const shamefullySendComplete = (...a)=>s=>s.shamefullySendComplete(...a);
export const shamefullySendError = (...a)=>s=>s.shamefullySendError(...a);
export const shamefullySendNext = (...a)=>s=>s.shamefullySendNext(...a);
export const startWith = (...a)=>s=>s.startWith(...a); // - returns MemoryStream
export const subscribe = (...a)=>s=>s.subscribe(...a);
export const take = (...a)=>s=>s.take(...a);
export const setDebugListener = ({
  next = n => console.log('debug next',n),
  error = e => console.error('debug error',e),
  complete = () => console.log('debug complete'),
}={})=>s=>{s.setDebugListener({next,error,complete});return s;};
export const addDebugListener = s=>{s.addListener({
  next : n => console.log('debug next',n),
  error : e => console.error('debug error',e),
  complete : () => console.log('debug complete'),
});return s;};

// extras
export const concat = (...args)=>stream=>stream.compose(econcat(...args));
export const fromDiagram = (...args)=>stream=>stream.compose(efromDiagram(...args));
export const fromEvent = (...args)=>stream=>stream.compose(efromEvent(...args));
export const tween = (...args)=>stream=>stream.compose(etween(...args));
export const buffer = (...args)=>stream=>stream.compose(ebuffer(...args));
export const debounce = (...args)=>stream=>stream.compose(edebounce(...args));
export const delay = (...args)=>stream=>stream.compose(edelay(...args));
export const dropRepeats = stream=>stream.compose(edropRepeats());
export const dropUntil = (...args)=>stream=>stream.compose(edropUntil(...args));
export const flattenConcurrently = (...args)=>stream=>stream.compose(eflattenConcurrently(...args));
export const flattenSequentially = (...args)=>stream=>stream.compose(eflattenSequentially(...args));
export const pairwise = (...args)=>stream=>stream.compose(epairwise(...args));
export const sampleCombine = (...args)=>stream=>stream.compose(esampleCombine(...args));
export const split = (...args)=>stream=>stream.compose(esplit(...args));
export const throttle = (...args)=>stream=>stream.compose(ethrottle(...args));
