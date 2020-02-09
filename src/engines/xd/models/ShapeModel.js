import { getImageData } from '../../../utils/index';
import { getDOMColor } from '../utils';
import { path, paper } from '../../../utils/Node';

let canvas = document.createElement('canvas');
canvas.width = 1920;
canvas.height = 1080;
canvas.setAttribute('style', 'position: fixed; top: -9999px; left: -9999px');
let paper_project = paper.setup(canvas);
document.body.appendChild(canvas);


function getPath (node) {
    let shape = node.shape;
    if (shape.type === 'line') {
        return {
            width: Math.max(shape.x1, shape.x2, node.style.stroke.width),
            height: Math.max(shape.y1, shape.y2, node.style.stroke.width),
            path:`M ${shape.x1} ${shape.y1} L ${shape.x2} ${shape.y2}`
        }
    }

    if (shape.type === 'rect') {
        let { x, width, height, y, r } = shape;
        if (!r) {
            r = [0, 0, 0, 0];
        }

        r = r.map(p => {
            return Math.min(Math.min(width, height) / 2, p);
        });

        return {
            width: width,
            height: height,
            path: [
                `M ${x + r[0]} ${y} `,
                `h ${Math.max(0, width - r[0] - r[1])} ` ,
                `a ${r[1]} ${r[1]} 0 0 1 ${r[1]} ${r[1]} `,
                `v ${Math.max(0, height - r[1] - r[2])} `,
                `a ${r[2]} ${r[2]} 0 0 1 -${r[2]} ${r[2]} `,
                `h -${Math.max(0, width - r[2] - r[3])} `,
                `a ${r[3]} ${r[3]} 0 0 1 -${r[3]} -${r[3]} `,
                `v -${Math.max(0, height - r[3] - r[0])} `,
                `a ${r[0]} ${r[0]} 0 0 1 ${r[0]} -${r[0]} `,
                `z `
            ].join(' ')
        }
    }

    if (shape.type === 'circle') {
        return {
            width: shape.r * 2,
            height: shape.r * 2,
            path: `
                M ${shape.cx}, ${shape.cy}
                m -${shape.r}, 0
                a ${shape.r},${shape.r} 0 1,0 ${shape.r * 2},0
                a ${shape.r},${shape.r} 0 1,0 -${shape.r * 2},0
            `
        }
    }

    if (shape.type === 'path' || shape.type === 'compound') {
        let paper_group = new paper.Group();
        let strokeProps = '', offsetY, offsetX;

        if (node.style?.stroke) {
            strokeProps = `stroke-width="${node.style.stroke.width}" stroke="black"`;
        }

        paper_group.importSVG(`<g><path d="${shape.path}" ${strokeProps}></path></g>`);

        if (paper_group.strokeBounds.y > paper_group.strokeBounds.height) {
            offsetY = paper_group.strokeBounds.y + 'px';
            offsetX = paper_group.strokeBounds.x + 'px';
            let x = paper_group.strokeBounds.x;
            let y = paper_group.strokeBounds.y;

            let paper_path = paper_group.children[0].children[0];
            if (paper_path.getClassName() === 'CompoundPath') {
                paper_path.children.forEach(path => {
                    path.segments.forEach(s => {
                        s.transform(new paper.Matrix(1, 0, 0, 1, -x, -y))
                    });
                })
            } else {
                paper_path.segments.forEach(s => {
                    s.transform(new paper.Matrix(1, 0, 0, 1, -x, -y))
                });
            } 
        }

        return {
            path: paper_group.exportSVG().querySelector('path').getAttribute('d'),
            width: paper_group.strokeBounds.width,
            height: paper_group.strokeBounds.height,
            offsetY,
            offsetX
        }
    }

    return {
        width: 0,
        height: 0,
        path: ''
    };
}

function getFill (fill, opts) {
    if (fill) {
        let output = [];

        if (fill.type === 'solid') {
            output.push({
                type: 'color',
                blend: 'normal',
                color: getDOMColor(fill.color)
            });
        }

        if (fill.type === 'gradient') {
            if (fill.gradient.type === 'radial') {
                output.push({
                    type: 'radial',
                    blend: 'normal',
                    cx: fill.gradient.cx / opts.width,
                    cy: fill.gradient.cy / opts.height,
                    fx: fill.gradient.fx / opts.width,
                    fy: fill.gradient.fy / opts.height,
                    r: fill.gradient.r / opts.width,
                    stops: fill.gradient.stops.map(s => {
                        return {
                            color: getDOMColor(s.color),
                            position: s.offset
                        }
                    })
                })
            } else {
                output.push({
                    type: 'gradient',
                    blend: 'normal',
                    start: [fill.gradient.x1, fill.gradient.y1],
                    end: [fill.gradient.x2, fill.gradient.y2],
                    stops: fill.gradient.stops.map(s => {
                        return {
                            color: getDOMColor(s.color),
                            position: s.offset
                        }
                    })
                })
            }
            
        }

        if (fill.type === 'pattern') {
            if (fill.pattern.meta.ux.uid) {
                let extension = path.extname(fill.pattern.href);

                output.push({
                    type: 'image',
                    blend: 'normal',
                    href: getImageData(fill.pattern.meta.ux.uid, extension)
                });
            }
        }

        return output;
    }

    return [{ 
        type: 'color',
        blend: 'normal',
        color: 'rgba(1,1,1,0)'
    }];
}

function getShadow (node) {
    let shadows = node.style && node.style.filters? node.style.filters.filter(f => f.type === 'dropShadow' && f.visible !== false) : [];

    if (shadows.length > 0) {
        let s = shadows[0].params.dropShadows[0];

        return {
            color: getDOMColor(s.color),
            offsetX: s.dx,
            offsetY: s.dy,
            blurRadius: s.r
        }
    }
}

function getClipPath (ancestors) {
    let clipPath, parent, parentIndex = ancestors.length - 1;

    while (parent = ancestors[parentIndex]) {
        if (parent.attributes.useAsClipPath) {
            clipPath = parent.attributes.useAsClipPath;
        }

        parentIndex--;
    }

    // Empty clipPaths possible
    if (clipPath && clipPath.children) {
        let { width, height, path } = getPath(clipPath.children[0]);

        let x = ancestors[ancestors.length - 3].attributes.x;
        let y = ancestors[ancestors.length - 3].attributes.y;

        // Clippath based on rects don't have this
        if (clipPath.children[0].transform) {
            x += clipPath.children[0].transform.tx;
            y += clipPath.children[0].transform.ty;
        }

        return {
            attributes: {
                x: x,
                y: y,
                width: width,
                height: height,
                rotation: 0,
                path: path
            }  
        }
    }
}


export default function ShapeModel (node, parent, ancestors) {
    let { offsetX, offsetY, width, height, path } = getPath(node);

    return {
        fill: (node.style && getFill(node.style.fill, { width, height })) || [],
        border: node.style && node.style.stroke && node.style.stroke.type !== 'none' && [{
            type: node.style.stroke.type,
            fill: [{
                type: 'color',
                blend: 'normal',
                color: getDOMColor(node.style.stroke.color)
            }],
            width: node.style.stroke.width,
            dasharray: 0,
            position: node.style.stroke.align || 'center'
        }],
        // innerShadow: [],
        shadow: getShadow(node),
        path: path,
        useAsClipPath: false,
        booleanOperation: 'none',
        width: width,
        height: height,
        clipPath: getClipPath(ancestors),
        offsetY: offsetY,
        offsetX
    }
}