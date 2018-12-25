import { createShapePath } from './ShapeGenerator';

let clipIndex = 0;

export default function BitmapElement (node, parent) {
    let attrs = node.attributes;
    let clipEl, clipId;

    if (attrs.clipPath) {
        clipId = `__clip__${clipIndex++}`;

        let clipPath = attrs.clipPath;
        // TODO: Support shapeGroup clips

        while (clipPath._class === 'shapeGroup') {
            clipPath = clipPath.children[0];
        }

        let c = clipPath.attributes;
        let d = createShapePath(node._class, c);
        let transform = `
            translate(${c.x - attrs.x}px, ${c.y - attrs.y}px)
            translate(${c.width / 2}px, ${c.height / 2}px)
            rotate(${c.rotation}deg)
            translate(-${c.width / 2}px, -${c.height / 2}px)
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