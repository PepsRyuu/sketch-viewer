import { getDOMColor, parseNumberSet } from '../utils';

function generateShapePath (layer) {
    function parsePoint (point) {
        let _w = layer.frame.width;
        let _h = layer.frame.height;
        let _x = layer.frame.x;
        let _y = layer.frame.y;
        let parts = point.replace(/\{|\}/g, '').split(', ').map(parseFloat);
        return (parts[0] * _w + _x) + ' ' + (parts[1] * _h + _y);
    }

    let points = layer.points || layer.path.points;
    let start = parsePoint(points[0].point);
    let d = `M ${start} `;

    for (let i = 1; i < points.length; i++) {
        let curr = points[i];
        let prev = i === 0? points[points.length - 1] : points[i - 1];
        let p = parsePoint(curr.point);

        if (curr.hasCurveTo) {
            let c1 = parsePoint(prev.curveFrom);
            let c2 = parsePoint(curr.curveTo);

            d += `C ${c1}, ${c2}, ${p} `;
        } else {
            d += `L ${p} `;
        }

    }

    if (layer.isClosed || (layer.path && layer.path.isClosed)) {
        let p = parsePoint(points[0].point);

        if (points[0].hasCurveTo) {
            
            let c1 = parsePoint(points[points.length - 1].curveFrom);
            let c2 = parsePoint(points[0].curveTo);

            d += `C ${c1}, ${c2}, ${p} `;
        } else {
            d += `L ${p}`
        }

        d += 'z';
    }

    return d.replace(/-0/g, '0')
}

function generateRectangle (layer) {
    let {x, y, width, height} = layer.frame;
    let points = layer.points || layer.path.points;

    let corners = points.map(p => {
        return Math.min(Math.min(width, height) / 2, p.cornerRadius);
    });

    let d = `M  ${x + corners[0]} ${y} `
      + `h ${Math.max(0, width - corners[0] - corners[1])} `
      + `a ${corners[1]} ${corners[1]} 0 0 1 ${corners[1]} ${corners[1]} `
      + `v ${Math.max(0, height - corners[1] - corners[2])} `
      + `a ${corners[2]} ${corners[2]} 0 0 1 -${corners[2]} ${corners[2]} `
      + `h -${Math.max(0, width - corners[2] - corners[3])} `
      + `a ${corners[3]} ${corners[3]} 0 0 1 -${corners[3]} -${corners[3]} `
      + `v -${Math.max(0, height - corners[3] - corners[0])} `
      + `a ${corners[0]} ${corners[0]} 0 0 1 ${corners[0]} -${corners[0]} `
      + `z`

    return d.replace(/-0/g, '0')
           
}

let gradientIndex = 0;
let maskIndex = 0;
let borderClipIndex = 0;


const BlendingMode = {
    0: 'normal',
    1: 'darken',
    2: 'multiply',
    3: 'color-burn',
    4: 'lighten',
    5: 'screen',
    6: 'color-dodge',
    7: 'overlay',
    8: 'soft-light',
    9: 'hard-light',
    10: 'difference',
    11: 'exclusion',
    12: 'hue',
    13: 'saturation',
    14: 'color',
    15: 'luminosity'
};

/**
 * SVG shape group class.
 *
 * @method ElementShapeGroup
 */
export default function ElementShapeGroup ({layer}) {
    // Props to be applied to the SVG.
    let props = {
        width: layer.frame.width,
        height: layer.frame.height,
        overflow: 'visible',
        style: {}
    };

    let els = [];
    let masks = [];
    let clips = [];
    let prevOp;

    // Calculate boolean operations for all paths.
    layer.layers.forEach((childLayer, index) => {
        let d = childLayer._class === 'rectangle'? generateRectangle(childLayer) : generateShapePath(childLayer);
        let prev = els[els.length - 1];
        let op = childLayer.booleanOperation;
        let transform = childLayer.rotation? 
            `rotate(${childLayer.rotation}, ${childLayer.frame.x + childLayer.frame.width / 2}, ${childLayer.frame.y + childLayer.frame.height / 2})` 
            : 
            '';


        // Boolean Operation: None
        if (op === -1) {
            if (els.length === 0) {
                els.push(<path d={d} transform={transform}/>)
            } else {
                prev.attributes.d = prev.attributes.d + d;
            }
        }

        // Boolean Operation: Union
        if (op === 0) {
            els.push(<path d={d} transform={transform} />);
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

            masks[masks.length - 1].children.push(
                <path d={d} />
            )
        }

        if (layer.style && layer.style.borders && layer.style.borders.length > 0 && layer.style.borders[0].isEnabled && layer.style.borders[0].thickness > 0 && layer.style.borders[0].position === 1) {
            let clipId = `__border_clip_index__${borderClipIndex++}`;
            let clipEl = JSON.parse(JSON.stringify(els[els.length - 1]));

            els[els.length - 1].attributes['clip-path'] = `url(#${clipId})`;
            clips.push(
                <clipPath id={clipId}>
                    {clipEl}
                </clipPath>
            );
        }

        prevOp = op;
    });


    let fills = layer.style.fills? layer.style.fills.filter(f => f.isEnabled) : [];
    let borders = layer.style.borders? layer.style.borders.filter(b => b.isEnabled) : [];
    let fillOutput = [];
    let borderOptions = layer.style.borderOptions || {};

    // Get the gradients and solid colors for each fill.
    if (fills && fills.length > 0) {
        let index = `__pattern__${gradientIndex++}`;

        fills.forEach((fill, fi) => {
            let output;

            if (fill.gradient && fill.fillType === 1) {
                let id = `${index}__gradient${fi}`;
                let start = parseNumberSet(fill.gradient.from).map(v => v * 100);
                let end = parseNumberSet(fill.gradient.to).map(v => v * 100);

                let css = (function () {
                    let angle = Math.round(Math.atan2(end[1] - start[1], end[0] - start[0]) * 180 / Math.PI);
                    let stops = fill.gradient.stops.map(stop => {
                        return `${getDOMColor(stop.color)} ${stop.position * 100}%`; 
                    })

                    return `linear-gradient(${angle}deg, ${stops.join(', ')})`;
                })();

                output = {
                    type: 'gradient',
                    prepend: (
                        <linearGradient 
                            id={id} 
                            x1={start[0] + '%'} 
                            y1={start[1] + '%'} 
                            x2={end[0] + '%'} 
                            y2={end[1] + '%'}>
                            {fill.gradient.stops.map(stop => (
                                <stop 
                                    stop-color={getDOMColor(stop.color)} 
                                    offset={stop.position * 100} 
                                />
                            ))}
                        </linearGradient>
                    ),
                    fill: `url(#${id})`,
                    css: css
                }
            } else if (fill.fillType === 0) {
                output = {
                    type: 'solid',
                    fill: getDOMColor(fill.color),
                    css: getDOMColor(fill.color)
                }
            }

            if (output) {
                let blendNumber = fill.contextSettings? fill.contextSettings.blendMode : 0;
                output.blend = BlendingMode[blendNumber];
                fillOutput.push(output);
            }
            
        })

    }

    // If there's no fill, apply a transparent fill.
    // This is important to ensure that paths don't default to black
    // and for also inner shaodws to function correctly.
    if (fills.length === 0) {
        fillOutput.push({
            fill: 'rgba(1,1,1,0)'
        });
    }

    if (borders && borders.length > 0) {
        props.stroke = getDOMColor(borders[0].color);
        props['stroke-width'] = borders[0].thickness;

        if (borderOptions.dashPattern && borderOptions.dashPattern.length > 0) {
            props['stroke-dasharray'] = borderOptions.dashPattern[0];
        }

        // Inside stroke, double and add clip mask
        if (borders[0].position === 1) {
            props['stroke-width'] = borders[0].thickness * 2;
        }
    }

    layer.__resolved.shapegroup = {
        fills: fillOutput.map(output => output.css),
        border: props.stroke,
        borderwidth: props['stroke-width'],
        borderRadius: layer.layers[0]._class === 'rectangle' || layer.layers[0]._class === 'oval'? (layer.layers[0].points || layer.layers[0].path.points).map(p => p.cornerRadius).join(', ') : undefined
    };

    return (
        <svg {...props}>
            <defs>
                {fillOutput.filter(f => f.prepend).map(f => f.prepend)}
                {masks}
                {clips}
            </defs>
            {els.map(el => {
                return fillOutput.map(f => {
                    el = JSON.parse(JSON.stringify(el));
                    el.attributes.fill = f.fill;
                    el.attributes.style = {};
                    el.attributes.style['mix-blend-mode'] = f.blend;
                    return el;
                })
            })}
        </svg>
    );
}