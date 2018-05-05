/**
 * what
 */

const attributeTypes = {
  categorical:{id:'categorical',attributeTypes:[],'operations':['map','manipulate','separate','align','use']},
  quantitative:{id:'quantitative',attributeTypes:[],'operations':[]},
  // discreet vs continuous?
  ordered:{id:'ordered',attributeTypes:['sequential','diverging','cyclic'],'operations':[]},
    sequential:{id:'sequential',attributeTypes:[],'operations':['encode','manipulate','facet','reduce']},
    diverging:{id:'diverging',attributeTypes:[],'operations':['encode','manipulate','facet','reduce']},
    cyclic:{id:'cyclic',attributeTypes:[],'operations':['encode','manipulate','facet','reduce']},
  stability:{id:'stability',attributeTypes:['static','dynamic'],'operations':[]}
    static:{id:'static',attributeTypes:[],'operations':['encode','manipulate']},
    dynamic:{id:'dynamic',attributeTypes:[],'operations':['encode','manipulate']},
};
const dataTypes = {
  attribute:{id:'attribute',attributeTypes:['categorical','quantitative','ordered','stability']},
  item:{id:'item',attributeTypes:['stability']},
  link:{id:'link',attributeTypes:['stability']},
  position:{id:'position',attributeTypes:['','stability']},
};
const dataSetTypes={
  // dataSet types - including here enables dataTypes to have other dataTypes
  grid:{id:'grid',dataTypes:['position','attribute'],attributeTypes:['stability']},
  table:{id:'table',dataTypes:['item','attribute'],attributeTypes:['stability']},
  // ^^ can have 2+ dimensions. e.g., 4d table is 2d table with 3 keys required for uniqueness
  network:{id:'network',dataTypes:['item','link','attribute'],attributeTypes:['stability']},
  field:{id:'field',dataTypes:['item','link','attribute'],attributeTypes:['stability']},
  geometry:{id:'geometry',dataTypes:['item','position'],attributeTypes:['stability']},
  cluster:{id:'cluster',dataTypes:['item'],attributeTypes:['stability']},
  set:{id:'set',dataTypes:['item'],attributeTypes:['stability']},
  list:{id:'list',dataTypes:['item'],attributeTypes:['stability']},
};

/**
 * why
 */
const actionTypes = {
  analyze:{id:'analyze',actionTypes:['consume','produce']},
    consume:{id:'consume',actionTypes:['discover','present','enjoy']},
      discover:{id:'discover'},
      present:{id:'present'},
      enjoy:{id:'enjoy'},
    produce:{id:'produce',actionTypes:['annotate','record','derive']},
      annotate:{id:'annotate'},
      record:{id:'record'},
      derive:{id:'derive'},
  search:{id:'search',actionTypes:['lookup', 'locate', 'browse', 'explore']},
    lookup:{id:'lookup'},
    locate:{id:'locate'},
    browse:{id:'browse'},
    explore:{id:'explore'},
  query:{id:'search',actionTypes:['identify', 'compare', 'summarize']},
    identify:{id:'identify'},
    compare:{id:'compare'},
    summarize:{id:'summarize'},
}
const targetTypes = {
  trends:{id:'trends',minDatums:3,maxDatums:null,minDataTypes:1,maxDataTypes:null,dataTypes:['attribute','item','link','position']},
  outliers:{id:'outliers',minDatums:3,maxDatums:null,minDataTypes:1,maxDataTypes:null,dataTypes:['attribute','item','link','position']},
  features:{id:'features',minDatums:2,maxDatums:null,minDataTypes:1,maxDataTypes:null,dataTypes:['attribute','item','link','position']},
  distribution:{id:'distribution',minDatums:3,maxDatums:null,minDataTypes:1,maxDataTypes:1,dataTypes:['attribute','item','link','position']},
  extremes:{id:'extremes',minDatums:3,maxDatums:null,minDataTypes:1,maxDataTypes:1,dataTypes:['attribute','item','link','position']},
  dependency:{id:'dependency',minDatums:3,maxDatums:null,minDataTypes:2,maxDataTypes:null,dataTypes:['attribute','item','link','position']},
  topology:{id:'topology',minDatums:3,maxDatums:null,minDataTypes:2,maxDataTypes:null,dataTypes:['item','link']},
  paths:{id:'paths',minDatums:3,maxDatums:null,minDataTypes:2,maxDataTypes:null,dataTypes:['item','link']},
  shape:{id:'shape',minDatums:1,maxDatums:null,minDataTypes:1,maxDataTypes:1,dataTypes:['position']},
}
/**
 * how
 */
const marks={
  point:{id:'point',operations:['color','position','motion','size','shape']},
  line:{id:'line',operations:['map']},
  area:{id:'area',operations:[]},
};
const operations={
  encode:{id:'encode',operations:['map','arrange']},
    arrange:{id:'arrange',operations:['express', 'separate', 'order', 'align', 'use',]},
      express:{id:'express',operations:[]},
      separate:{id:'separate',operations:[]},
      order:{id:'order',operations:[]},
      align:{id:'align',operations:[]},
      use:{id:'use',operations:[]},
    // map, from categorical and ordered attributes
    map:{id:'map',operations:['color','size','angle','curvature','shape','motion']},
      size:{id:'size',operations:[]},
      angle:{id:'angle',operations:[]},
      curvature:{id:'curvature',operations:[]},
      color:{id:'color',operations:['hue', 'saturation', 'luminance',]},
        hue:{id:'hue',operations:[]},
        saturation:{id:'saturation',operations:[]},
        luminance:{id:'luminance',operations:[]},
      motion:{id:'motion',operations:['direction','rate','frequency']},
        direction:{id:'direction',operations:[]},
        rate:{id:'rate',operations:[]},
        frequency:{id:'frequency',operations:[]},
      shape:{id:'shape',operations:[]},
  manipulate:{id:'manipulate',operations:['change','select','navigate']},
    change:{id:'change',operations:[]}
    select:{id:'select',operations:[]}
    navigate:{id:'navigate',operations:[]}
  facet:{id:'facet',operations:['juxtapose','partition','superimpose']},
    juxtapose:{id:'juxtapose',operations:[]}
    partition:{id:'partition',operations:[]}
    superimpose:{id:'superimpose',operations:[]}
  reduce:{id:'reduce',operations:['filter','aggregate','embed']},
    filter:{id:'filter',operations:[]}
    aggregate:{id:'aggregate',operations:[]}
    embed:{id:'embed',operations:[]}
}
