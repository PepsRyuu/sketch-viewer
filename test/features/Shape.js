import ElementShape from '../../src/components/renderer/elements/ShapeElement';
import ArtboardResolver from '../../src/resolvers/ArtboardResolver';
import { compareWithArchive } from '../utils/rasterizer';

let fs = global.require('fs');
let cases = fs.readdirSync(process.cwd() + '/test/features/shape_json');

describe ('Shape', () => {

    cases.forEach(name => {
        it (name, async function () {
            let case_json = JSON.parse(fs.readFileSync(process.cwd() +'/test/features/shape_json/'+name, 'utf8'));
            let layer = {
                __resolved: {},
                ...case_json
            };

            let node = ElementShape(ArtboardResolver( layer ));
            await compareWithArchive(node, 100, 100, name);
        });
    });
})