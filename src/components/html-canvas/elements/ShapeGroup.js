import { createShapePath } from './ShapeGenerator';
import { getFill, getBorder } from './ShapeStyling';

let maskIndex = 0;

/**
 * SVG shape group class.
 *
 * @method ElementShapeGroup
 */
export default function ElementShapeGroup ({layer}) {
    let els = [];
    let masks = [];
    let prevOp;

    // Calculate boolean operations for all paths.
    layer.layers.forEach((childLayer, index) => {
        let offset = {
            x: childLayer.frame.x,
            y: childLayer.frame.y
        };

        let el = (
            <path 
                d={createShapePath(childLayer, offset)}
            />
        );

        let prev = els[els.length - 1];
        let op = childLayer.booleanOperation;

        // Boolean Operation: None
        if (op === -1) {
            els.push(el);
        }

        // Boolean Operation: Union
        if (op === 0) {
            els.push(el);
        }

        // Boolean Operation: Subtraction
        if (op === 1) {
            if (prevOp !== 1) {
                let maskId = '__mask__' + maskIndex++;
                masks.push(
                    <mask id={maskId}>
                        <rect 
                            x="0" 
                            y="0"
                            width={layer.frame.width} 
                            height={layer.frame.height} 
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

    let fill = getFill(layer);
    let border = getBorder(layer, els);

    // Props to be applied to the SVG.
    let props = {
        width: layer.frame.width,
        height: layer.frame.height,
        overflow: 'visible',
        style: {}
    };

    layer.__resolved.shape = {
        ...fill.props,
        ...border.props
    };

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