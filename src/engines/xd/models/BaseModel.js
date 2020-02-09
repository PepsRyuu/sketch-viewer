export default function BaseModel (node, parent) {
    let x = node.transform? node.transform.tx : 0;
    let y = node.transform? node.transform.ty : 0;
    let rotation = 0;

    if (node.meta.ux.rotation) {
        rotation = node.meta.ux.rotation;
    }

    return {
        'visible': node.visible !== false,
        'x': x,
        'y': y,
        'width': 'auto',
        'height': 'auto',
        'rotation': rotation,
        'scaleX': 1,
        'scaleY': 1,
        'opacity': 1,
        'transformOrigin': 'top left',
        'useAsClipPath': node.style && node.style.clipPath
    }
}