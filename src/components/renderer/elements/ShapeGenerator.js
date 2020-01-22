let clipIndex = 0;
export function getClipPath (attrs) {
    let clipEl, clipId;

    if (attrs.clipPath) {
        clipId = `__clip__${clipIndex++}`;

        let clipPath = attrs.clipPath;

        // Have to use shapeGroup frame, not child frame.
        let clipPathFrame = {
            x: attrs.clipPath.attributes.x,
            y: attrs.clipPath.attributes.y,
            width: attrs.clipPath.attributes.width,
            height: attrs.clipPath.attributes.height
        };

        let c = clipPath.attributes;
        let d = clipPath.attributes.path;
        let transform = `
            translate(${clipPathFrame.x - attrs.x}px, ${clipPathFrame.y - attrs.y}px)
            translate(${clipPathFrame.width / 2}px, ${clipPathFrame.height / 2}px)
            rotate(${c.rotation}deg)
            translate(-${clipPathFrame.width / 2}px, -${clipPathFrame.height / 2}px)
        `;

        clipEl = (
            <clipPath id={clipId}>
                <path d={d} style={`transform: ${transform}`} />
            </clipPath>
        );

        return {
            props: {
                'clip-path': `url(#${clipId})`
            },
            output: clipEl
        };
    }

    return {};
}

