export default function BaseModel (node, parent) {
    let x = node.transform? node.transform.tx : 0;
    let y = node.transform? node.transform.ty : 0;
    let offsetX = 0;

    if (node.type === 'text' && node.text.frame.type === 'positioned') {
        y -= node.style.font.size;
    } 

    if (node.type === 'text' && node.style.textAttributes && node.style.textAttributes.paragraphAlign === 'center') {
        offsetX = '-50%';
    }

    return {
        'visible': true,
        'x': x,
        'y': y,
        'width': 'auto',
        'height': 'auto',
        'rotation': 0,
        'scaleX': (node.transform && node.transform.a) || 1,
        'scaleY': (node.transform && node.transform.d) || 1,
        'opacity': 1,
        'offsetX': offsetX,
        // '__overrided': node.__overrided,
        'useAsClipPath': false,
        // 'clipNode': node.clippingMask && parent.children.find(n => n.useAsClipPath),
    }
}