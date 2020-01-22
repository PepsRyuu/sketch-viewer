import { getDOMColorXD } from '../../../utils/index';

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

    if (shape.type === 'path') {
        return {
            path: shape.path,
            // TODO: Parse width and height using the path values
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
                color: getDOMColorXD(fill.color)
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
                            color: getDOMColorXD(s.color),
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
                            color: getDOMColorXD(s.color),
                            position: s.offset
                        }
                    })
                })
            }
            
        }

        return output;
    }

    return [];
}

export default function ShapeModel (node) {
    let { width, height, path } = getPath(node);

    return {
        fill: (node.style && getFill(node.style.fill, { width, height })) || [],
        border: node.style && node.style.stroke && node.style.stroke.type !== 'none' && [{
            type: node.style.stroke.type,
            fill: [{
                type: 'color',
                blend: 'normal',
                color: getDOMColorXD(node.style.stroke.color)
            }],
            width: node.style.stroke.width,
            dasharray: 0,
            position: 'center'
        }],
        // innerShadow: [],
        // shadow: getShadow(layer),
        path: path,
        useAsClipPath: false,
        booleanOperation: 'none',
        width: width,
        height: height
    }
}