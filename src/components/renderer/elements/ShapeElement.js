import { createShapePath } from './ShapeGenerator';
import { getFill, getBorder, getInnerShadow, getShadow } from './ShapeStyling';

export default function ShapeElement (node) {
    let d = createShapePath(node._class, node.attributes);

    let el = <path d={d} />
    let fill = getFill(node.attributes);
    let border = getBorder(node.attributes, [el]);
    let innerShadow = getInnerShadow(node.attributes, [el], fill);
    let shadow = getInnerShadow(node.attributes, [el]);

    let props = {
        width: node.attributes.width,
        height: node.attributes.height,
        overflow: 'visible',
        ...fill.props,
        ...border.props,
        ...innerShadow.props,
        ...shadow.props,
        style: { 'mix-blend-mode': fill.blend }
    };

    return (
        <svg {...props}>
            <defs>
                {fill.output}
                {border.output}
                {innerShadow.output}
            </defs>
            {el}
        </svg>
    )
}