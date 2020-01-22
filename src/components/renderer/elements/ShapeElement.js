import { createShapePath, getClipPath } from './ShapeGenerator';
import { getFill, getBorder, getInnerShadow, getShadow } from './ShapeStyling';

export default function ShapeElement (node) {
    let d = node.attributes.path;
    let el = <path d={d} />
    let fill = getFill(node.attributes);
    let border = getBorder(node.attributes, el);
    let innerShadow = getInnerShadow(node.attributes, el, fill);
    let shadow = getShadow(node.attributes, el);
    let clipPath = getClipPath(node.attributes);

    let props = {
        width: node.attributes.width,
        height: node.attributes.height,
        overflow: 'visible',
        style: { 'mix-blend-mode': fill.blend },
        ...innerShadow.props,
        ...shadow.props,
        ...clipPath.props
    };

    el.attributes = {
        ...el.attributes,
        ...fill.props,
        ...border.props
    };

    return (
        <svg {...props}>
            <defs>
                {fill.output}
                {border.output}
                {innerShadow.output}
                {clipPath.output}
            </defs>
            {border.preElement}
            {el}
            {border.postElement}
            {innerShadow.postElement}
        </svg>
    )
}