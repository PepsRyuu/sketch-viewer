import { createShapePath } from './ShapeGenerator';

let clipIndex = 0;

export default function BitmapElement (node, parent) {
    let attrs = node.attributes;
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
        }

        // TODO: Support shapeGroup clips properly
        while (clipPath._class === 'shapeGroup') {
            clipPath = clipPath.children[0];
        }

        let c = clipPath.attributes;
        let d = createShapePath(clipPath._class, c);
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
    }

    return (
        <svg width={attrs.width} height={attrs.height} clip-path={clipEl && `url(#${clipId})`}>
            <image width={attrs.width} height={attrs.height} href={ attrs.image } />
            {clipEl}
        </svg>
    );
}