import ElementShapeGroup from '../../src/components/renderer/elements/ShapeGroupElement';
import ArtboardResolver from '../../src/resolvers/ArtboardResolver';
import { compareWithArchive } from '../utils/rasterizer';

let fs = global.require('fs');
let cases = fs.readdirSync(process.cwd() + '/test/features/shapegroup_json');

describe ('ShapeGroup', () => {
    
    cases.forEach(name => {
        it (name, async function () {
            let case_json = JSON.parse(fs.readFileSync(process.cwd() +'/test/features/shapegroup_json/'+name, 'utf8'));
            let layer = {
                __resolved: {},
                ...case_json
            };

            let node = ElementShapeGroup(ArtboardResolver(layer));
            await compareWithArchive(node, 100, 100, name);
        });
    });

})