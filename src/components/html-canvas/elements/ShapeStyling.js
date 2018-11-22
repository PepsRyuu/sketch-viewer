import { getDOMColor, parseNumberSet } from '../utils';
import { BlendingMode } from '../constants';

let gradientIndex = 0;
let patternIndex = 0;
let borderClipIndex = 0;

function createLinearGradient (fill) {
    let id = `__gradient${gradientIndex++}`;
    let start = parseNumberSet(fill.gradient.from).map(v => v * 100);
    let end = parseNumberSet(fill.gradient.to).map(v => v * 100);

    let css = (function () {
        let angle = Math.round(Math.atan2(end[1] - start[1], end[0] - start[0]) * 180 / Math.PI);
        let stops = fill.gradient.stops.map(stop => {
            return `${getDOMColor(stop.color)} ${stop.position * 100}%`; 
        })

        return `linear-gradient(${angle}deg, ${stops.join(', ')})`;
    })();

    return {
        gradient: (
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
        url: `url(#${id})`,
        css: css
    };
}

export function getFill (layer) {
    let output = [];
    let pattern = [];
    let fills = layer.style && layer.style.fills? layer.style.fills : [];

    let pushToPattern = (color, blend) => {
        pattern.push(
            <rect 
                x="0" 
                y="0" 
                width={layer.frame.width} 
                height={layer.frame.height}
                fill={color}
                style={`mix-blend-mode: ${blend}`}
            />
        )
    };

    let getFromFillType = (fill) => {
        let color;

        if (fill.fillType === 0) {
            color = getDOMColor(fill.color);
        }

        if (fill.fillType === 1) {
            let { gradient, url } = createLinearGradient(fill);
            output.push(gradient);
            color = url;
        }

        return color;
    };

    fills = fills.filter(f => f.isEnabled);

    let css;

    if (fills.length === 0) {
        css = 'rgba(1,1,1,0)';
    } else if (fills.length === 1) {
        css = getFromFillType(fills[0]);
    } else {
        fills.forEach((fill) => {
            let color = getFromFillType(fill);
            let blend = BlendingMode[fill.contextSettings? fill.contextSettings.blendMode : 0];
            pushToPattern(color, blend);
        });

        let id = `__pattern${patternIndex++}`;
        css = `url(#${id})`;

        output.push(
            <pattern 
                id={id} 
                patternUnits="userSpaceOnUse" 
                patternContentUnits="userSpaceOnUse" 
                width={layer.frame.width} 
                height={layer.frame.height}
            >{pattern}</pattern>
        )
    }

    return { 
        props: { fill: css }, 
        output
    };
}

export function getBorder (layer, els) {
    let borders = layer.style && layer.style.borders? layer.style.borders.filter(b => b.isEnabled) : [];
    let borderOptions = layer.style && layer.style.borderOptions? layer.style.borderOptions : {};
    let props = {};

    if (borders && borders.length > 0) {
        props['stroke'] = getDOMColor(borders[0].color);
        props['stroke-width'] = borders[0].thickness;

        if (borderOptions.dashPattern && borderOptions.dashPattern.length > 0) {
            props['stroke-dasharray'] = borderOptions.dashPattern[0];
        }

        // Inside stroke, double and add clip mask
        if (borders[0].position === 1) {
            props['stroke-width'] = borders[0].thickness * 2;
        }
    }

    let output = [];

    if (layer.style && layer.style.borders && layer.style.borders.length > 0 && layer.style.borders[0].isEnabled && layer.style.borders[0].thickness > 0 && layer.style.borders[0].position === 1) {
        let clipId = `__border_clip_index__${borderClipIndex++}`;
        props['clip-path'] = `url(#${clipId})`;

        output.push(
            <clipPath id={clipId}>
                {els}
            </clipPath>
        );
    }

    return {
        props,
        output
    }
}