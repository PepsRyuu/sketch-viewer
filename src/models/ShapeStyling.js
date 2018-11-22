import { getDOMColor, parseNumberSet } from '../utils/index';
import { BlendingMode } from '../utils/Constants';

let gradientIndex = 0;
let patternIndex = 0;
let borderClipIndex = 0;


export function getFill (layer) {
    let output = [];

    let fills = (layer.style && layer.style.fills) || [];
    fills = fills.filter(f => f.isEnabled);

    if (fills.length === 0) {
        output.push({
            type: 'color',
            color: 'rgba(1, 1, 1, 0)',
            blend: 'normal'
        });
    }

    let getBlendMode = f => BlendingMode[f.contextSettings? f.contextSettings.blendMode : 0];

    if (fills.length >= 1) {
        fills.forEach(f => {
            if (f.fillType === 0) {
                output.push({
                    type: 'color',
                    color: getDOMColor(f.color),
                    blend: getBlendMode(f)
                });
            }

            if (f.fillType === 1) {
                output.push({
                    type: 'gradient',
                    blend: getBlendMode(f),
                    start: parseNumberSet(f.gradient.from),
                    end: parseNumberSet(f.gradient.to),
                    stops: f.gradient.stops.map(s => {
                        return {
                            color: getDOMColor(s.color),
                            position: s.position
                        };
                    })
                })
            }
        });
    }

    return output;
}

export function getBorder (layer) {

    let borders = (layer.style && layer.style.borders) || [];
    borders = borders.filter(b => b.isEnabled);

    if (borders.length > 0) {
        // support for single border only currently
        let b = borders[0];
        let opts = borders[0].borderOptions || {};
        let dashed = opts.dashPattern && opts.dashPattern.length > 0;

        return {
            type: dashed? 'dashed' : 'solid',
            color: getDOMColor(b.color),
            width: b.thickness,
            dasharray: dashed? opts.dashPattern[0] : 0,
            position: b.position === 1? 'inner' : 'normal'
        };
    }
}