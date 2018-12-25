import { getFill, getBorder, getInnerShadow, getShadow } from './ShapeStyling';
import { parseNumberSet } from '../utils/index';
import { BooleanOperations } from '../utils/Constants';

export default function ShapeModel (layer, parent) {
    return {
        fill: getFill(layer),
        border: getBorder(layer),
        innerShadow: getInnerShadow(layer),
        shadow: getShadow(layer),
        path: {
            closed: layer.isClosed || (layer.path && layer.path.isClosed),
            points: (layer.points || (layer.path && layer.path.points)).map(p => {
                return {
                    cornerRadius: p.cornerRadius,
                    curveFrom: parseNumberSet(p.curveFrom),
                    curveMode: p.curveMode,
                    curveTo: parseNumberSet(p.curveTo),
                    hasCurveFrom: p.hasCurveFrom,
                    hasCurveTo: p.hasCurveTo,
                    point: parseNumberSet(p.point)
                };
            })
        },
        useAsClipPath: layer.hasClippingMask,
        booleanOperation: BooleanOperations[layer.booleanOperation] || 'none'
    }

}