import JSZip from 'jszip';
import path from 'path';
import fs from 'fs';
import SymbolResolver from './SymbolResolver';

async function LoadJSONFile(zip, name) {
    return JSON.parse(await zip.files[name].async('text'));
}

export default function FileResolver (file) {

    return new Promise(resolve => {
        let output = {
            pages: [],
            images: [],
            symbolLibraries: []
        };

        let reader = new FileReader();

        reader.onload = async (e) => {
            let zip = await JSZip.loadAsync(e.target.result);

            let metadata = await LoadJSONFile(zip, 'meta.json');
            let docdata = await LoadJSONFile(zip, 'document.json');

            // Parse pages and artboards
            for (let key in metadata.pagesAndArtboards) {
                let page = metadata.pagesAndArtboards[key];


                output.pages.push({
                    id: key,
                    name: page.name,
                    data: await LoadJSONFile(zip, `pages/${key}.json`),
                    artboards: Object.keys(page.artboards).map(key => ({
                        id: key,
                        name: page.artboards[key].name,
                    }))
                });
                
            }

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
            let foreignSymbols = {};
            let foreignLayerStyles = {};
            let foreignTextStyles = {};

            for (let i = 0; i < docdata.foreignSymbols.length; i++) {
                let entry = docdata.foreignSymbols[i];
                if (entry.symbolMaster) {
                    foreignSymbols[entry.symbolMaster.symbolID] = entry.symbolMaster;
                }

                // TODO: External Libraries
                // let libpath = path.resolve(path.dirname(file.path), `${foreignSymbol.sourceLibraryName}.sketch`);
                
                // if (!loadedSourceLibraries[libpath]) {
                //     let libzip = await JSZip.loadAsync(fs.readFileSync(libpath));
                //     let output = {};

                //     for (let filename in libzip.files) {
                //         if (filename.indexOf('pages/') === 0) {
                //             output[filename] = await LoadJSONFile(libzip, filename);
                //         }
                //     }

                //     loadedSourceLibraries[libpath] = output;
                // }

                    // TODO: Support libraries
                    // let sourcelib = loadedSourceLibraries[libpath];

                    // for (let page in sourcelib) {
                    //     let symbolID = foreignSymbol.originalMaster.symbolID;
                    //     let hr = getSymbolMasterImpl(sourcelib[page].layers, symbolID);
                    //     if (hr) {
                    //         loadedForeignSymbols[foreignSymbol.symbolMaster.symbolID] = hr;
                    //         break;
                    //     }
                    // }
            }

            if (docdata.foreignLayerStyles) {
                docdata.foreignLayerStyles.forEach(obj => {
                    foreignLayerStyles[obj.localSharedStyle.do_objectID] = obj.localSharedStyle.value;
                });
            }

            if (docdata.foreignTextStyles) {
                docdata.foreignTextStyles.forEach(obj => {
                    foreignTextStyles[obj.localSharedStyle.do_objectID] = obj.localSharedStyle.value;
                });
            }

            SymbolResolver(output.pages, { 
                foreignSymbols, foreignLayerStyles, foreignTextStyles
            });

            output.pages = output.pages.filter(p => p.artboards.length > 0);

            resolve(output);
        };

        reader.readAsArrayBuffer(file);
    });

    
}