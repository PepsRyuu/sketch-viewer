import { getFill, getBorder, getInnerShadow, getShadow } from './ShapeStyling';
import { getShapePath } from './ShapeGenerator';
import { paper } from '../../../utils/Node';
import { BooleanOperations } from '../Constants';

let canvas = document.createElement('canvas');
canvas.width = 1920;
canvas.height = 1080;
canvas.setAttribute('style', 'position: fixed; top: -9999px; left: -9999px');
let paper_project = paper.setup(canvas);

document.body.appendChild(canvas);

export default function ShapeGroupModel (layer) {
    function generateShapeGroup (layer, parent_group) {
        let el;
        let prevOp;

        let paper_group = new paper.Group();

        if (parent_group) {
            paper_group.parent = parent_group;
        }

         // Calculate boolean operations for all paths.
        layer.layers.forEach((child, index) => {
            let offset = {
                x: child.frame.x,
                y: child.frame.y
            };

            let local_el;

            if (child._class === 'shapeGroup') {
                local_el = generateShapeGroup(child, paper_group);
            } else {
                let d = getShapePath(child, offset);
                local_el = paper_group.importSVG(`<g><path d="${d}"></path></g>`);
            }

            if (child.rotation) {
                local_el.rotation = child.rotation * -1;
            }

            let oldParent = local_el;
            local_el = local_el.children[0];
            local_el.parent = paper_group;

            oldParent.remove();

            let op = BooleanOperations[child.booleanOperation];

            if (el) {

                if (op === 'none' || op === 'union') {
                    let oldEl = el;
                    el = el.unite(local_el);
                    oldEl.remove();
                }

                if (op === 'subtract') {
                    if (el) {
                        let oldEl = el;
                        el = el.subtract(local_el);
                        oldEl.remove();
                    }
                }

                if (op === 'intersect') {
                    let oldEl = el;
                    el = el.intersect(local_el);
                    oldEl.remove();
                }

                if (op === 'difference') {
                    let oldEl = el;
                    el = el.exclude(local_el);
                    oldEl.remove();
                }

                local_el.remove();

            } else {
                el = local_el;
            }



            prevOp = op;
        });

        return Array.from(paper_group.exportSVG().children)[0];
    }

    let path_segments = (function () {
        let output = [], tmp = [];

        layer.layers.forEach((child, index) => {
            if (BooleanOperations[child.booleanOperation] === 'none') {
                if (tmp.length > 0) {
                    output.push(tmp);
                }

                tmp = [];
            }

            tmp.push(child);

            if (index === layer.layers.length - 1) {
                output.push(tmp);
            }
        });

        return output;
    })();

    let paths = path_segments.map(ps => {
        return generateShapeGroup({ layers: ps }).getAttribute('d');
    });

    return {
        fill: getFill(layer),
        border: getBorder(layer),
        innerShadow: getInnerShadow(layer),
        shadow: getShadow(layer),
        path: paths.join(' '),
        useAsClipPath: layer.hasClippingMask
    };
}