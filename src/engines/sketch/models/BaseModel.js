import { parseNumberSe, getDOMColor } from '../utils';

export default function BaseModel (layer, parent) {

    let scaleX = layer.isFlippedHorizontal? -1 : 1;
    let scaleY = layer.isFlippedVertical? -1 : 1;
    let rotation = layer.rotation * -1;
    let opacity = 1, shadow;

    if (layer.style && layer.style.contextSettings) {
        opacity = layer.style.contextSettings.opacity;
    }

    // Group can have shadows
    if (layer._class === 'group' && layer.style && layer.style.shadows) {
        let s = layer.style.shadows.filter(s => s.isEnabled)[0];

        if (s) {   
            shadow = {
                color: getDOMColor(s.color),
                offsetX: s.offsetX,
                offsetY: s.offsetY,
                blurRadius: s.blurRadius
            }            
        }
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
        'shadow': shadow
    }
}