import { getFill, getBorder } from './ShapeStyling';
import { parseNumberSet } from '../utils/index';

export default function ShapeModel (layer) {
    return {
        fill: getFill(layer),
        border: getBorder(layer),
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
        }
    }

}