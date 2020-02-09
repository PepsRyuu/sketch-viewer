export default function BaseStyler (node, el) {
    let attrs = node.attributes;

    if (!el.attributes.style) {
        el.attributes.style = {};
    }

    // artboard needs to be relative for zooming to work
    if (!el.attributes.style.position) {
        el.attributes.style.position = 'absolute';
    }

    el.attributes.style.top = attrs.y + 'px';
    el.attributes.style.left = attrs.x + 'px';
    el.attributes.style.width = attrs.width === 'auto'? 'auto' : attrs.width + 'px';
    el.attributes.style.height = attrs.height + 'px';
    el.attributes.style.opacity = attrs.opacity;

    el.attributes.style.transform = `
        scale(${attrs.scaleX}, ${attrs.scaleY}) 
        rotate(${attrs.rotation}deg) 
        translate(${attrs.offsetX || 0}, ${attrs.offsetY || 0})
    `;
    
    if (!attrs.visible) {
        el.attributes.style.display = 'none';
    }

    if (attrs['transformOrigin']) {
        el.attributes.style.transformOrigin = attrs.transformOrigin;
    }

    if (attrs['background-color']) {
        el.attributes.style.backgroundColor = attrs['background-color'];
    }

    if (node._class === 'group' && attrs.shadow) {
        let s = attrs.shadow;
        el.attributes.style['box-shadow'] = `${s.offsetX}px ${s.offsetY}px ${s.blurRadius}px ${s.color}`;
    }
}