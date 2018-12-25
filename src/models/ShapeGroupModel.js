import { getFill, getBorder, getInnerShadow, getShadow } from './ShapeStyling';

export default function ShapeGroupModel (layer) {
    return {
        fill: getFill(layer),
        border: getBorder(layer),
        innerShadow: getInnerShadow(layer),
        shadow: getShadow(layer)
    };
}