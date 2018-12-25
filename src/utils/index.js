import { shell } from 'electron';
import fs from 'fs';
import path from 'path';

export function OpenJSON (file_json) {
    let json = JSON.stringify(file_json.data, null, 4);
    let uri = 'data:application/json;base64,' + Buffer.from(json).toString('base64');

    if (!fs.existsSync('__temp__')) {
        fs.mkdirSync('__temp__');
    }

    let filepath = '__temp__/' + file_json.id + '.json';
    fs.writeFileSync(filepath, json);

    shell.openItem(path.resolve(process.cwd(), filepath));   
}

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

export function withProperty (layer, path, callback) {
    let hr = getProperty(layer, path);
    if (hr) {
        callback(hr);
    } 
}

export function getImageData (ref) {
    let data;
    let extension;

    for (let i = 0; i < window.__page__images.length; i++) {
        let entry = window.__page__images[i];
        if (entry.name.indexOf(ref) === 0) {
            data = entry.data;
            extension = entry.name.match(/\.[\w]+$/)[0];
            break;
        }
    }

    return `data:image/${extension.slice(1)};base64,${data}`;
}

export function getProperty (layer, path) {
    let parts = path.split('.');
    let partIndex = 0;
    let parent = layer;

    let value = parent[parts[partIndex]];
    while (partIndex < parts.length) {
        let value = parent[parts[partIndex]];
        if (value !== undefined) {
            if (partIndex === parts.length - 1) {
                return value;
                break;
            } else {
                partIndex++;
                parent = value;
            }
        } else {
            break;
        }
    } 
}