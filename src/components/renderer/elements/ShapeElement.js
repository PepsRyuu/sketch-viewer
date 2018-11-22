import { createShapePath } from './ShapeGenerator';
import { getFill, getBorder } from './ShapeStyling';

export default function ShapeElement (node) {
    let d = createShapePath(node.attributes);

    let el = <path d={d} />
    let fill = getFill(node.attributes);
    let border = getBorder(node.attributes, [el]);

    let props = {
        width: node.attributes.width,
        height: node.attributes.height,
        overflow: 'visible',
        ...fill.props,
        ...border.props
    };
    
    return (
        <svg {...props}>
            <defs>
                {fill.output}
                {border.output}
            </defs>
            {el}
        </svg>
    )
}