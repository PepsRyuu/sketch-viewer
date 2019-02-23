import TextNormalizer from '../normalizers/TextNormalizer';

const CLASS_NORMALIZERS = {
    'text': TextNormalizer
};

/**
 * Upgrades the data for all of the pages
 * to match the latest format for Sketch files.
 *
 * @method NormalizerResolver
 * @param {Array<Object>} pages
 */
export default function NormalizerResolver (pages) {
    let impl = (layers) => {
        layers && layers.forEach(layer => {
            let fn = CLASS_NORMALIZERS[layer._class];

            if (fn) {
                fn(layer);
            }

            impl(layer.layers);
        });
    };

    pages.forEach(page => impl(page.data.layers));
}