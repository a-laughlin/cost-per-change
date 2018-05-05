import * as d3 from 'd3'
import {Transition,TransitionGroup} from 'react-transition-group';
import * as rc from 'recompose';
// Creates a curved (diagonal) path from parent to the child nodes
const diagonal = (s, d=s)=>(
  `M ${s.y} ${s.x}
  C ${(s.y + d.y) / 2} ${s.x},
  ${(s.y + d.y) / 2} ${d.x},
  ${d.y} ${d.x}`
);

const withTransitionGroup = transitionProps=>BaseComponent=>{
  return (props)=>{
    return <TransitionGroup {...transitionProps}>
      <BaseComponent {...props} />
    </TransitionGroup>
  }
}
const withTransition = (
  enterTimeout=(props)=>300,
  exitTimeout=(props)=>300,
  defaultStyle=(props)=>({}),
  transitionStyle=(props)=>({}),
  shouldStartTransition=(props)=>false
)=>BaseComponent=>{
  return (props)=>{
    return <Transition
      timeout={{enter:enterTimeout(),exit:exitTimeout()}}
      in={shouldStartTransition}
      style={{
        ...defaultStyle(props),
        ...transitionStyle(props),
      }}
      >
      <BaseComponent {...props} />
    </Transition>
  }
}


//
// export const renderCollapsibleTree = (treePojo)=>{
//
//   // Set the dimensions and margins of the diagram
//   var margin = {top: 20, right: 90, bottom: 30, left: 90},
//   width = 960 - margin.left - margin.right,
//   height = 500 - margin.top - margin.bottom;
//
//   // append the svg object to the body of the page
//   // appends a 'group' element to 'svg'
//   // moves the 'group' element to the top left margin
//   var svg = d3.select("body").append("svg")
//   .attr("width", width + margin.right + margin.left)
//   .attr("height", height + margin.top + margin.bottom)
//   .append("g")
//   .attr("transform", `translate(${margin.left},${margin.top})`);
//
//   var i = 0,
//   duration = 750,
//   root;
//
//   // declares a tree layout and assigns the size
//   var treemap = d3.tree().size([height, width]);
//
//   // Assigns parent, children, height, depth
//   // get root node
//   root = d3.hierarchy(treePojo);
//   root.x0 = height / 2;
//   root.y0 = 0;
//   // Collapse after the second level
//   root.children.forEach(collapse);
//
//   update(root);
//
//   // Collapse the node and all it's children
//   function collapse(d) {
//     if(!d.children) {return;}
//     d._hiddenChildren = d.children
//     d._hiddenChildren.forEach(collapse)
//     d.children = null
//   }
//
//   function update(source) {
//
//     // Assigns the x and y position for the nodes
//     const treeData = treemap(root);
//
//     // Compute the new tree layout.
//     const nodes = treeData.descendants();
//     const links = treeData.descendants().slice(1);
//
//     // Normalize for fixed-depth.
//     nodes.forEach(function(d){ d.y = d.depth * 180});
//
//     // ****************** Nodes section ***************************
//
//     // const getSelectionObj = (selector)=>
//     // const includeData = f=>sel=>sel.data(f)
//     // Update the nodes...
//     var node = svg.selectAll('g.node')
//     .data(nodes, function(d) {return d.id || (d.id = ++i); });
//
//     // Enter any new modes at the parent's previous position.
//     var nodeEnter = node
//     .enter()
//     .append('g')
//     .attrs({ 'class':'node', transform:({x,y})=>`translate(${source.y0},${source.x0})`})
//     .on('click', click);
//     // Add Circle for the nodes
//
//     nodeEnter.append('circle')
//     .attrs({ 'class':'node', r:1e-6 })
//     .styles(n=>({
//       fill:n._hiddenChildren ? "steelblue" : "#fff",
//       stroke:'#ccc',
//       'stroke-width':'2px'
//     }));
//
//     // Add labels for the nodes
//     nodeEnter.append('text')
//     .attrs(({children,_hiddenChildren})=>({
//       dy:'0.35em',
//       x:(children || _hiddenChildren) ? -13 : 13,
//       'text-anchor':(children || _hiddenChildren) ? "end" : "start"
//     }))
//     .styles({font: '12px sans-serif'})
//     .text(d=>d.data.name);
//
//     // UPDATE
//     var nodeUpdate = nodeEnter.merge(node);
//
//     // Transition to the proper position for the node
//     nodeUpdate.transition()
//     .duration(duration)
//     .attr("transform", ({x,y})=>`translate(${y},${x})`);
//
//     // Update the node attributes and style
//     nodeUpdate.select('circle')
//     .attrs(()=>({r:10}))
//     .styles(({_hiddenChildren})=>({
//       cursor:'pointer',
//       fill:_hiddenChildren ? "steelblue" : "#fff",
//     }));
//
//
//     // Remove any exiting nodes
//     var nodeExit = node.exit().transition()
//     .duration(duration)
//     .attr("transform", ()=>`translate(${source.y},${source.x})`)
//     .remove();
//
//     // On exit reduce the node circles size to 0
//     // nodeExit.select('circle')
//     // .attr('r', 1e-6);
//
//     // On exit reduce the opacity of text labels
//     // nodeExit.select('text')
//     // .style('fill-opacity', 1e-6);
//
//     // ****************** links section ***************************
//
//     // Update the links...
//     var link = svg.selectAll('path')
//     .data(links, n=>n.id);
//
//     // Enter any new links at the parent's previous position.
//     link.enter()
//     .insert('path', "g")
//     .attrs({d:()=>diagonal({x: source.x0, y: source.y0})})
//     .styles(()=>({
//       fill: 'none',
//       stroke: '#ccc',
//       'stroke-width': '2px',
//     }))
//     // UPDATE
//     .merge(link)
//     // Transition back to the parent element position
//     .transition()
//     .duration(duration)
//     .attr('d', d=>diagonal(d,d.parent))
//     // EXIT
//
//     link.exit()
//     .transition()
//     .attrs({d:()=>diagonal({x: source.x, y: source.y})})
//     .duration(duration)
//     .remove();
//
//
//     // Remove any exiting links
//
//     // Store the old positions for transition.
//     nodes.forEach(function(d){
//       d.x0 = d.x;
//       d.y0 = d.y;
//     });
//
//
//
//     // Toggle children on click.
//     function click(d) {
//       if (d.children) {
//         d._hiddenChildren = d.children;
//         d.children = null;
//       } else {
//         d.children = d._hiddenChildren;
//         d._hiddenChildren = null;
//       }
//       update(d);
//
//     }
//   }
// };
