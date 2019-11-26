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

    // TODO: No clue what's happening here.
    // Some text need glyph bounds added, others don't.
    // These conditions are just random guesses that get most
    // cases I've encountered working. Still breaks a couple though.
    // The JSON doesn't provide any differences so must be something I'm missing.
    if (layer.glyphBounds && layer.textBehaviour === 0) {
        let bounds = parseNumberSet(layer.glyphBounds);

        if (layer.attributedString.attributes[0].attributes.paragraphStyle.alignment !== 2) {
            layer.frame.__text_x = x;
            x += bounds[0];
        }

        if (layer.attributedString.attributes[0].attributes.paragraphStyle.minimumLineHeight !== undefined) {
            layer.frame.__text_y = y;
            y += bounds[1];
        }
    }

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