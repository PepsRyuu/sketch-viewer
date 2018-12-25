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
    el.attributes.style.width = attrs.width + 'px';
    el.attributes.style.height = attrs.height + 'px';
    el.attributes.style.opacity = attrs.opacity;

    el.attributes.style.transform = `
        scale(${attrs.scaleX}, ${attrs.scaleY}) rotate(${attrs.rotation}deg)
    `;
    
    if (!attrs.visible) {
        el.attributes.style.display = 'none';
    }
}