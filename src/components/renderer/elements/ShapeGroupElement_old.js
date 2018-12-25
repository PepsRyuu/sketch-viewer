import { createShapePath } from './ShapeGenerator';
import { getFill, getBorder } from './ShapeStyling';
import paper from 'paper';

let maskIndex = 0;

/**
 * SVG shape group class.
 *
 * @method ElementShapeGroup
 */
export default function ShapeGroupElement (node) {
    let els = [];
    let masks = [];
    let prevOp;

    // Calculate boolean operations for all paths.
    node.children.forEach((child, index) => {
        let offset = {
            x: child.attributes.x,
            y: child.attributes.y
        };

        let el;

        if (child._class === 'shapeGroup') {
            el = ShapeGroupElement(child);
        } else {
            el = (
                <path 
                    d={createShapePath(child._class, child.attributes, offset)}
                />
            );
        }

        let prev = els[els.length - 1];
        let op = child.attributes.booleanOperation;

        if (op === 'none') {
            els.push(el);
        }

        if (op === 'union') {
            els.push(el);
        }

        if (op === 'subtract') {
            if (prevOp !== 'none') {
                let maskId = '__mask__' + maskIndex++;
                masks.push(
                    <mask id={maskId}>
                        <rect 
                            x="0" 
                            y="0"
                            width={node.attributes.width} 
                            height={node.attributes.height} 
                            fill="white"
                        />
                    </mask>
                );

                // Fixes multiple masks with nothing to mask
                if (prev) {
                    prev.attributes.mask = `url(#${maskId})`;
                }
                
            }

            masks[masks.length - 1].children.push(el);
        }

        prevOp = op;
    });

    let fill = getFill(node.attributes);
    let border = getBorder(node.attributes, els);

    // Props to be applied to the SVG.
    let props = {
        width: node.attributes.width,
        height: node.attributes.height,
        overflow: 'visible'
    };

    node.children = [];

    return (
        <svg {...props}>
            <defs>
                {fill.output}
                {border.output}
                {masks}
            </defs>
            {els.map(el => {
                el.attributes = {
                    ...el.attributes,
                    ...fill.props,
                    ...border.props
                };

                return el;
            })}
        </svg>
    );
}