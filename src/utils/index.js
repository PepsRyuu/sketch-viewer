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

export function getImageData (ref, defaultExtension) {
    let data;
    let extension;

    for (let i = 0; i < window.__page__images.length; i++) {
        let entry = window.__page__images[i];
        if (entry.name.indexOf(ref) === 0) {
            data = entry.data;
            extension = defaultExtension || (function () {
                let match = entry.name.match(/\.[\w]+$/);
                if (match) {
                    return match[0];
                }
            })() || (function () {
                // No extension found at all
                let sample = atob(data).slice(0, 20).toLowerCase();
                if (sample.indexOf('png') > -1) {
                    return '.png';
                }

                if (sample.indexOf('jpg') > -1 || sample.indexOf('jpeg') > -1) {
                    return '.jpg';
                }

                return '.tiff';
            })()
            break;
        }
    }

    if (data && extension) {
        return `data:image/${extension.slice(1)};base64,${data}`;
    } else {
        return `data:image/svg+xml;utf8,<svg></svg>`;
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