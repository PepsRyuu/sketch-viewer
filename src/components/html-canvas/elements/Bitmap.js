/**
 * Sketch Class Bitmap.
 *
 * @method ElementBitmap
 */ 
export default function ElementBitmap ({ layer }) {
    let data;
    let extension;
    let key = layer.image._ref;

    for (let i = 0; i < window.__page__images.length; i++) {
        let entry = window.__page__images[i];
        if (entry.name.indexOf(key) === 0) {
            data = entry.data;
            extension = entry.name.match(/\.[\w]+$/)[0];
            break;
        }
    }

    let href = `data:image/${extension};base64,${data}`;

    return (
        <svg width={layer.frame.width} height={layer.frame.height}>
            <image width={layer.frame.width} height={layer.frame.height} href={ href } />
        </svg>
    );
}