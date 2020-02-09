let gradientIndex = 0;
let patternIndex = 0;
let borderClipIndex = 0;
let borderMaskIndex = 0;
let imageIndex = 0;


function createLinearGradient (f) {
    let id = `__gradient${gradientIndex++}`;
    let start = f.start.map(v => v * 100);
    let end = f.end.map(v => v * 100);

    return {
        gradient: (
            <linearGradient 
                id={id} 
                x1={start[0] + '%'} 
                y1={start[1] + '%'} 
                x2={end[0] + '%'} 
                y2={end[1] + '%'}>
                {f.stops.map(stop => (
                    <stop 
                        stop-color={stop.color} 
                        offset={stop.position * 100 + '%'} 
                    />
                ))}
            </linearGradient>
        ),
        url: `url(#${id})`
    };
}

function createRadialGradient (f) {
    let id = `__gradient${gradientIndex++}`;

    return {
        gradient: (
            <radialGradient 
                id={id} 
                cx={f.cx}
                cy={f.cy} 
                r={f.r}
                fx={f.fx}
                fy={f.fy}
            >
                {f.stops.map(stop => (
                    <stop 
                        stop-color={stop.color} 
                        offset={stop.position * 100 + '%'} 
                    />
                ))}
              </radialGradient>
        ),
        url: `url(#${id})`
    };
}

function createImagePattern (f, width, height) {
    let id = `__imagepattern${imageIndex++}`;
    let css = `url(#${id})`;
    let output = (
        <pattern 
            id={id} 
            patternUnit="objectBoundingBox"
            patternContentUnit="objectBoundingBox"
            width="1"
            height="1"
        ><image preserveAspectRatio="none" href={f.href} width={width} height={height} /></pattern>
    );

    return { css, output };
}

function getFillImpl (fills, width, height, patternCreateFn, patternEntryFn) {
    let pattern = [];

    let getFromFillType = (f) => {
        f = f.fill? f.fill[0] : f;

        if (f.type === 'color') {
            return { css: f.color };
        }

        if (f.type === 'radial') {
            let { gradient, url } = createRadialGradient(f);
            return { css: url, output: gradient };
        }

        if (f.type === 'gradient') {
            let { gradient, url } = createLinearGradient(f);
            return { css: url, output: gradient };
        }

        if (f.type === 'image') {
            return createImagePattern(f, width, height);
        }
    };

    let css, defs = [];

    if (fills.length === 1) {
        let tmp = getFromFillType(fills[0]);
        css = tmp.css;
        defs.push(tmp.output);
    } else {
        fills.forEach((f) => {
            let tmp = getFromFillType(f);
            defs.push(tmp.output);
            pattern.push(patternEntryFn(tmp.css, f));
        });

        let id = `__pattern${patternIndex++}`;
        css = `url(#${id})`;

        defs.push(patternCreateFn(id, pattern));
    }

    return { 
        css, 
        defs,
        blend: fills.filter(f => f.blend !== 'normal').length > 0? 'overlay' : 'normal'
    };
}

export function getFill (node) {
    let { css, defs, blend } = getFillImpl(node.fill, node.width, node.height, (id, entries) => {
        return (
            <pattern 
                id={id} 
                patternUnits="userSpaceOnUse" 
                patternContentUnits="userSpaceOnUse" 
                width={node.width} 
                height={node.height}
            >{entries}</pattern>
        );
    }, (css, f) => {
        return (
            <rect 
                x="0" 
                y="0" 
                width={node.width} 
                height={node.height}
                fill={css}
                style={`mix-blend-mode: ${f.blend}`}
            />
        );
    })

    return { 
        props: { fill: css }, 
        output: defs,
        blend
    };
}

export function getBorder (node, el) {
    let getBorderFill = (borders, width, height, strokeWidth) => {
        return getFillImpl(borders, width, height, (id, entries) => {
            return (
                <pattern 
                    id={id} 
                    x={strokeWidth / -2}
                    y={strokeWidth / -2}
                    patternUnits="userSpaceOnUse" 
                    patternContentUnits="userSpaceOnUse" 
                    width={width + strokeWidth} 
                    height={height + strokeWidth}
                >{entries}</pattern>
            );
        }, (css, b) => {
            return (
                <rect 
                    x={strokeWidth} 
                    y={strokeWidth} 
                    width={width - strokeWidth} 
                    height={height - strokeWidth} 
                    stroke={css} 
                    stroke-width={b.width * 2}
                />   
            );
        })
    };

    if (node.border) {
        let props = {};
        let output = [];
        let preElement = [];
        let postElement = [];
        let { border, width, height } = node;

        let outsides = border.filter(b => b.position === 'outside');
        let centers = border.filter(b => b.position === 'center');
        let insides = border.filter(b => b.position === 'inside');

        if (outsides.length > 0) {           
            let strokeWidth = Math.max(...outsides.map(b => b.width));
            let { css, defs } = getBorderFill(outsides, width + strokeWidth, height + strokeWidth, strokeWidth);
            let scaleX = (width + strokeWidth) / width;
            let scaleY = (height + strokeWidth) / height;

            preElement.push(
                <path 
                    d={el.attributes.d} 
                    stroke-width={strokeWidth}
                    transform={`scale(${scaleX}, ${scaleY}) translate(${strokeWidth / -2}, ${strokeWidth / -2})`}
                    stroke={css}  
                    fill="transparent"                  
                    vector-effect="non-scaling-stroke"
                    stroke-dasharray={outsides[0].dasharray}
                />
            );            

            output.push(...defs);

        }

        if (centers.length > 0) {
            let strokeWidth = Math.max(...centers.map(b => b.width));
            let { css, defs } = getBorderFill(centers, width, height, strokeWidth);
            props['stroke'] = css;
            props['stroke-width'] = strokeWidth;
            props['stroke-dasharray'] = centers[0].dasharray;
            output.push(...defs);
        }

        if (insides.length > 0) {
            let strokeWidth = Math.max(...insides.map(b => b.width));
            let { css, defs } = getBorderFill(insides, width, height, strokeWidth);
            let scaleX = (width - strokeWidth) / width;
            let scaleY = (height - strokeWidth) / height;

            postElement.push(
                <path 
                    d={el.attributes.d} 
                    stroke-width={strokeWidth}
                    transform={`scale(${scaleX}, ${scaleY}) translate(${strokeWidth / 2}, ${strokeWidth / 2})`}
                    vector-effect="non-scaling-stroke"
                    stroke={css}
                    fill="transparent"
                    stroke-dasharray={insides[0].dasharray}
                />
            );

            output.push(...defs);
        }

        return { props, output, preElement, postElement };
    }

    return {};
}

let filterId = 0;
export function getInnerShadow (node, el) {
    if (node.innerShadow) {
        let s = node.innerShadow;
        let border = node.border || [];
        let id = `__inset_shadow__${filterId++}`;

        let centers = border.filter(b => b.position === 'center');
        let insides = border.filter(b => b.position === 'inside');

        let scaleX = 1;
        let scaleY = 1;
        let strokeWidth = 0;

        if (border.length > 0) {
            if (centers.length > 0) {
                strokeWidth = Math.max(...centers.map(b => b.width / 2));
            }

            if (insides.length > 0) {
                strokeWidth = Math.max(...insides.map(b => b.width));
            }

            scaleX = (node.width - strokeWidth) / node.width;
            scaleY = (node.height - strokeWidth) / node.height;
        }

        return {
            props: {},
            output: (
                <filter id={id}>
                    <feOffset
                        dx={s.offsetX}
                        dy={s.offsetY}
                    />
                    <feGaussianBlur
                        stdDeviation={s.blurRadius}
                        result='offset-blur'
                    />
                    <feComposite 
                        operator="out" 
                        in="SourceGraphic" 
                        in2="offset-blur"
                        result="inverse" 
                    />
                    <feFlood
                        flood-color={s.color}
                        result='color'
                    />
                    <feComposite
                        operator='in'
                        in='color'
                        in2='inverse'
                        result='shadow'
                    />
                </filter>
            ),
            postElement: (
                <path 
                    d={el.attributes.d} 
                    filter={`url(#${id})`} 
                    fill="black"
                    vector-effect="non-scaling-stroke"
                    transform={`scale(${scaleX}, ${scaleY}) translate(${strokeWidth / 2}, ${strokeWidth / 2})`}
                />
            )
        };
    }

    return {};
}

export function getShadow (node, el) {
    if (node.shadow) {
        let s = node.shadow;

        return {
            props: {
                filter: `drop-shadow(${s.offsetX}px ${s.offsetY}px ${s.blurRadius}px ${s.color})`
            }
        }
    }

    return {};
}
