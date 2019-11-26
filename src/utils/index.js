import { electron, fs, path, jszip } from './Node';

export function OpenJSON (file_name, file_json) {
    let json = JSON.stringify(file_json, null, 4);
    let uri = 'data:application/json;base64,' + Buffer.from(json).toString('base64');

    if (!fs.existsSync('__temp__')) {
        fs.mkdirSync('__temp__');
    }

    let filepath = '__temp__/' + file_name + '.json';
    fs.writeFileSync(filepath, json);

    electron.shell.openItem(path.resolve(process.cwd(), filepath));   
}

export function getDOMColorXD (color) {
    let c = color.value;
    let a = color.alpha !== undefined? color.alpha : 1;
    return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`
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

    if (data && extension) {
        return `data:image/${extension.slice(1)};base64,${data}`;
    } else {
        return `data:image/svg+xml;utf8,<svg></svg>`;
    }
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

export function LoadZipFile (filename) {
    return new Promise(resolve => {
        let reader = new FileReader();
        reader.onload = (e) => {
            jszip.loadAsync(e.target.result).then(zip => {
                resolve({
                    files: zip.files,
                    loadJSON: async function (name) {
                        return JSON.parse(await zip.files[name].async('text'));
                    },

                    loadImage: async function (name) {
                        return await zip.files[name].async('base64');
                    }
                })
            });
        };
        reader.readAsArrayBuffer(filename);
    });
}