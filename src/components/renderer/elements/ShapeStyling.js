let gradientIndex = 0;
let patternIndex = 0;
let borderClipIndex = 0;

function createLinearGradient (f) {
    let id = `__gradient${gradientIndex++}`;
    let start = f.gradient.start.map(v => v * 100);
    let end = f.gradient.end.map(v => v * 100);

    return {
        gradient: (
            <linearGradient 
                id={id} 
                x1={start[0] + '%'} 
                y1={start[1] + '%'} 
                x2={end[0] + '%'} 
                y2={end[1] + '%'}>
                {f.gradient.stops.map(stop => (
                    <stop 
                        stop-color={stop.color} 
                        offset={stop.position * 100} 
                    />
                ))}
            </linearGradient>
        ),
        url: `url(#${id})`
    };
}

export function getFill (node) {
    let pattern = [];
    let fills = node.fill;

    let pushToPattern = (color, blend) => {
        pattern.push(
            <rect 
                x="0" 
                y="0" 
                width={node.width} 
                height={node.height}
                fill={color}
                style={`mix-blend-mode: ${blend}`}
            />
        )
    };

    let getFromFillType = (f) => {
        if (f.type === 'color') {
            return { css: f.color };
        }

        if (f.type === 'gradient') {
            let { gradient, url } = createLinearGradient(fill);
            return { css: url, output: gradient };
        }
    };

    let css, output = [];

    if (fills.length === 1) {
        let tmp = getFromFillType(fills[0]);
        css = tmp.css;
        output.push(tmp.output);
    } else {
        fills.forEach((f) => {
            let tmp = getFromFillType(f);
            output.push(tmp.output);
            pushToPattern(tmp.css, blend);
        });

        let id = `__pattern${patternIndex++}`;
        css = `url(#${id})`;

        output.push(
            <pattern 
                id={id} 
                patternUnits="userSpaceOnUse" 
                patternContentUnits="userSpaceOnUse" 
                width={node.width} 
                height={node.height}
            >{pattern}</pattern>
        )
    }

    return { 
        props: { fill: css }, 
        output
    };
}

export function getBorder (node, els) {

    if (node.border) {
        let props = {};
        let output = [];
        let border = node.border;

        props['stroke'] = border.color;
        props['stroke-width'] = border.width;

        if (border.type === 'dashed') {
            props['stroke-dasharray'] = props.dasharray;
        }

        if (border.position === 'inner') {
            props['stroke-width'] = border.width * 2;

            let clipId = `__border_clip_index__${borderClipIndex++}`;
            props['clip-path'] = `url(#${clipId})`;

            output.push(
                <clipPath id={clipId}>
                    {els}
                </clipPath>
            );
        }

        return { props, output };
    }

    return {};
}