import { getClipPath } from './ShapeGenerator';


export default function BitmapElement (node, parent) {
    let attrs = node.attributes;
    let clipPath = getClipPath(attrs);

    let props = {
        width: attrs.width,
        height: attrs.height,
        ...clipPath.props
    }

    return (
        <svg {...props}>
            <defs>
                {clipPath.output}
            </defs>
            <image width={attrs.width} height={attrs.height} href={ attrs.image } />
        </svg>
    );
}