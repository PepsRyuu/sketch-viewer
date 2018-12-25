import { getImageData } from '../utils/index';

export default function BitmapModel (layer, parent) {
    let href = getImageData(layer.image._ref);

    return {
        image: href,
        clipPath: layer.clippingMask && parent.children.find(n => n.attributes.useAsClipPath),
    };
}