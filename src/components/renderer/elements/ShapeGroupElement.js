import { createShapePath } from './ShapeGenerator';
import { getFill, getBorder, getInnerShadow, getShadow } from './ShapeStyling';
import paper from 'paper';

let canvas = document.createElement('canvas');
canvas.width = 1920;
canvas.height = 1080;
canvas.setAttribute('style', 'position: fixed; top: -9999px; left: -9999px');
let paper_project = paper.setup(canvas);

document.body.appendChild(canvas);

/**
 * SVG shape group class.
 *
 * @method ElementShapeGroup
 */
export default function ShapeGroupElement (node) {

    function generateShapeGroup (node, parent_group) {
        let el;
        let prevOp;

        let paper_group = new paper.Group();

        if (parent_group) {
            paper_group.parent = parent_group;
        }
        
         // Calculate boolean operations for all paths.
        node.children.forEach((child, index) => {
            let offset = {
                x: child.attributes.x,
                y: child.attributes.y
            };


            let local_el;

            if (child._class === 'shapeGroup') {
                local_el = generateShapeGroup(child, paper_group);
            } else {
                let d = createShapePath(child._class, child.attributes, offset);
                local_el = paper_group.importSVG(`<g><path d="${d}"></path></g>`);
            }

            if (child.attributes.rotation) {
                local_el.rotation = child.attributes.rotation;
            }

            let oldParent = local_el;
            local_el = local_el.children[0];
            local_el.parent = paper_group;

            oldParent.remove();

            let op = child.attributes.booleanOperation;

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

        return paper_group;
    }

    let group = generateShapeGroup(node);
    let els = Array.from(group.exportSVG().children).map(el => <path d={el.getAttribute('d')} />);


    let fill = getFill(node.attributes);
    let border = getBorder(node.attributes, els);
    let innerShadow = getInnerShadow(node.attributes, els, fill);
    let shadow = getShadow(node.attributes, els);

    // Props to be applied to the SVG.
    let props = {
        width: node.attributes.width,
        height: node.attributes.height,
        overflow: 'visible'
    };

    props = {
        ...props,
        ...fill.props,
        ...border.props,
        ...innerShadow.props,
        ...shadow.props
    };

    node.children = [];

    return (
        <svg {...props}>
            <defs>
                {fill.output}
                {border.output}
                {innerShadow.output}
            </defs>
            <g>
                {els}
            </g>
        </svg>
    );
}