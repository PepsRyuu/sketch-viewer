import { getFill, getBorder, getInnerShadow, getShadow } from './ShapeStyling';
import { getShapePath } from './ShapeGenerator';
import { parseNumberSet } from '../utils';
import { BooleanOperations } from '../Constants';

function getClipPath (ancestors) {
    let parentIndex = ancestors.length - 1;

    if (ancestors[parentIndex] && ancestors[parentIndex]._class === 'symbolInstance') {
        parentIndex--;
    }

    let parent = ancestors[parentIndex];
    if (parent) {
        for (let i = 0; i < parent.children.length; i++ ){
            let child = parent.children[i];
            if (child._class === 'symbolInstance') {
                child = child.children[0];
            }

            if (child.attributes.useAsClipPath) {
                return child;
            }
        }
    }
}

export default function ShapeModel (layer, parent, ancestors) {

    return {
        fill: getFill(layer),
        border: getBorder(layer),
        innerShadow: getInnerShadow(layer),
        shadow: getShadow(layer),
        path: getShapePath(layer),
        useAsClipPath: layer.hasClippingMask,
        booleanOperation: BooleanOperations[layer.booleanOperation] || 'none',
        clipPath: getClipPath(ancestors)
    }

}