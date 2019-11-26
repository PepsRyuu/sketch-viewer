import RendererOutput from '../../src/components/renderer/RendererOutput';
import SketchArtboardResolver from '../../src/engines/sketch/resolvers/ArtboardResolver';
import XDArtboardResolver from '../../src/engines/xd/resolvers/ArtboardResolver';
import { compareSVGWithArchive } from '../utils/rasterizer';

let fs = global.require('fs');

let resolvers = {
    'sketch': SketchArtboardResolver,
    'xd': XDArtboardResolver
};

describe ('Fixtures', () => {
    ['sketch', 'xd'].forEach(engine => {
        let cases = fs.readdirSync(process.cwd() + '/test/fixtures/' + engine);

        describe(engine, () => {
             cases.forEach(file_name => {
                it (file_name, async function () {
                    let case_json = JSON.parse(fs.readFileSync(process.cwd() +'/test/fixtures/' + engine + '/' + file_name, 'utf8'));
                    let layer = {
                        __resolved: {},
                        ...case_json
                    };

                    let node = RendererOutput({ data: resolvers[engine](layer) });
                    await compareSVGWithArchive(node.children[0], 100, 100, engine + '-' + file_name);
                });
            });
        });
    });
});