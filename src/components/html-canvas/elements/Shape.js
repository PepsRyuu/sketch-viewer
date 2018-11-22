import { getDOMColor, parseNumberSet } from '../utils';
import { getFill, getBorder } from './ShapeStyling';
import { createShapePath } from './ShapeGenerator';

export default function ElementShape ({ layer }) {
    let d = createShapePath(layer);
    let el = <path d={d} />
    let fill = getFill(layer);
    let border = getBorder(layer, [el]);

    let props = {
        width: layer.frame.width,
        height: layer.frame.height,
        overflow: 'visible',
        style: {},
        ...fill.props,
        ...border.props
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
            </defs>
            {el}
        </svg>
    )
}