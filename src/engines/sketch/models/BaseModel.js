import { parseNumberSet } from '../utils';

export default function BaseModel (layer, parent) {

    let scaleX = layer.isFlippedHorizontal? -1 : 1;
    let scaleY = layer.isFlippedVertical? -1 : 1;
    let rotation = layer.rotation * -1;
    let opacity = 1;

    if (layer.style && layer.style.contextSettings) {
        opacity = layer.style.contextSettings.opacity;
    }

    let { x, y, width, height } = layer.frame;

    return {
        'visible': layer.isVisible,
        'x': x,
        'y': y,
        'width': width,
        'height': height,
        'rotation': rotation,
        'scaleX': scaleX,
        'scaleY': scaleY,
        'opacity': opacity,
        '__overrided': layer.__overrided,
        'useAsClipPath': layer.hasClippingMask,
        'clipNode': layer.clippingMask && parent.children.find(n => n.useAsClipPath),
    }
}