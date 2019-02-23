import SymbolResolver from './SymbolResolver';
import NormalizerResolver from './NormalizerResolver';
import { fs, path, jszip } from '../utils/Node';

async function LoadJSONFile(zip, name) {
    return JSON.parse(await zip.files[name].async('text'));
}

function ReadFile (filename) {
    return new Promise(resolve => {
        let reader = new FileReader();
        reader.onload = (e) => {
            resolve(e.target.result);
        };
        reader.readAsArrayBuffer(filename);
    });
}

/**
 * Loads the Sketch file at the specified filename.
 * Will load file as a zip, and retrieve the raw JSON
 * for the Sketch files, along with image data.
 * 
 * Symbols are also resolved here.
 *
 * @method FileResolver
 * @param {String} filename
 * @return {Promise<Object>}
 */
export default function FileResolver (filename) {

    return new Promise(async function (resolve) {
        let file = await ReadFile(filename);
        let zip = await jszip.loadAsync(file)
        let metadata = await LoadJSONFile(zip, 'meta.json');
        let docdata = await LoadJSONFile(zip, 'document.json');

        let output = {
            pages: [],
            images: []
        };

        // Parse pages and artboards
        for (let uid in metadata.pagesAndArtboards) {
            let page_meta = metadata.pagesAndArtboards[uid];
            let page_data = await LoadJSONFile(zip, `pages/${uid}.json`);
            let artboards = [];

            for (let auid in page_meta.artboards) {
                artboards.push({
                    id: auid,
                    name: page_meta.artboards[auid].name
                });
            }

            output.pages.push({
                id: uid,
                name: page_meta.name,
                data: page_data,
                artboards: artboards
            });
        }

        // Remove empty pages with no artboards
        output.pages = output.pages.filter(p => p.artboards.length > 0);

        // Parse images
        for (let file in zip.files) {
            if (file.indexOf('images/') === 0) {
                output.images.push({
                    name: file,
                    data: await zip.files[file].async('base64')
                });
            }
        }

        // Parse foreign symbols
        let foreign = {
            symbols: {},
            layerStyles: {},
            textStyles: {}
        };

        if (docdata.foreignSymbols) {
            docdata.foreignSymbols.forEach(obj => {
                if (obj.symbolMaster) {
                    foreign.symbols[obj.symbolMaster.symbolID] = obj.symbolMaster;
                }
            });
        }

        if (docdata.foreignLayerStyles) {
            docdata.foreignLayerStyles.forEach(obj => {
                foreign.layerStyles[obj.localSharedStyle.do_objectID] = obj.localSharedStyle.value;
            });
        }

        if (docdata.foreignTextStyles) {
            docdata.foreignTextStyles.forEach(obj => {
                foreign.textStyles[obj.localSharedStyle.do_objectID] = obj.localSharedStyle.value;
            });
        }

        // Tidy up the data and return it
        NormalizerResolver(output.pages);
        SymbolResolver(output.pages, foreign);
        resolve(output);
    });

    
}