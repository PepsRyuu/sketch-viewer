import RendererOutput from '../../src/components/renderer/RendererOutput';
import SketchArtboardResolver from '../../src/engines/sketch/resolvers/ArtboardResolver';
import XDArtboardResolver from '../../src/engines/xd/resolvers/ArtboardResolver';
import SketchFileResolver from '../../src/engines/sketch/resolvers/FileResolver';
import XDFileResolver from '../../src/engines/xd/resolvers/FileResolver';
import { compareHTMLWithArchive } from '../utils/rasterizer';

let fs = global.require('fs');

let resolvers = {
    'sketch': {
        file: SketchFileResolver,
        artboard: SketchArtboardResolver
    },
    'xd': {
        file: XDFileResolver,
        artboard: XDArtboardResolver
    }
};

describe ('Samples', () => {
    ['sketch', 'xd'].forEach(engine => {
        let cases = fs.readdirSync(process.cwd() + '/test/samples/' + engine);

        describe(engine, () => {
             cases.forEach(file_name => {
                it (file_name, async function () {
                    this.timeout(60000)
                    let path = process.cwd() + '/test/samples/' + engine + '/' + file_name;
                    let data = fs.readFileSync(path);
                    let file = await resolvers[engine].file(new Blob([data.buffer])); 
                    window.__page__images = file.images;

                    for (let i = 0; i < file.pages.length; i++) {
                        let page = file.pages[i];

                        for (let j = 0; j < page.data.length; j++) {
                            let d = page.data[j];

                            let node = RendererOutput({
                                data: resolvers[engine].artboard(d.data)
                            });

                            await compareHTMLWithArchive(
                                node.children[0],
                                engine + '-' + file_name + '-' + page.id + '-' + d.id
                            );
                        }
                    }
                });
            });
        });
    });
});