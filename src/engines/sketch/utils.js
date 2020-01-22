/**
 * Takes Sketch number set format and returns them parsed as floats.
 *
 * @method parseNumberSet
 * @param {String} input
 * @return {Array<Float>}
 */
export function parseNumberSet (input) {
    return input.replace(/\{|\}/g, '').split(', ').map(parseFloat);
}

/**
 * Convert Sketch RGBA structure to DOM color string.
 *
 * @method getDOMColor
 * @param {Object} color
 * @return {String}
 */
export function getDOMColor (color) {
    return `rgba(${Math.floor(255 * color.red)}, ${Math.floor(255 * color.green)}, ${Math.floor(255 * color.blue)}, ${color.alpha})`;
}