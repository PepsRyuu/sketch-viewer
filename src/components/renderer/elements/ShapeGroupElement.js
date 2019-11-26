// import { createShapePath, getClipPath } from './ShapeGenerator';
// import { getFill, getBorder, getInnerShadow, getShadow } from './ShapeStyling';



// /**
//  * SVG shape group class.
//  *
//  * @method ElementShapeGroup
//  */
// export default function ShapeGroupElement (node) {
//     let fill = getFill(node.attributes);
//     let border = getBorder(node.attributes, el);
//     let innerShadow = getInnerShadow(node.attributes, el, fill);
//     let shadow = getShadow(node.attributes, el);
//     let clipPath = getClipPath(node.attributes);

//     // Props to be applied to the SVG.
//     let props = {
//         width: node.attributes.width,
//         height: node.attributes.height,
//         overflow: 'visible',
//         'fill-rule': 'evenodd',
//         style: { 'mix-blend-mode': fill.blend }
//     };

//     props = {
//         ...props,
//         ...fill.props,
//         ...border.props,
//         ...innerShadow.props,
//         ...shadow.props,
//         ...clipPath.props
//     };
    
//     return (
//         <svg {...props}>
//             <defs>
//                 {fill.output}
//                 {border.output}
//                 {innerShadow.output}
//                 {clipPath.output}
//             </defs>
//             <g>
//                 {el}
//             </g>
//         </svg>
//     );
// }