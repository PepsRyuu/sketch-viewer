let ElementShapeGroup = require('../../src/components/renderer/elements/ShapeGroupElement').default;
let ArtboardResolver = require('../../src/resolvers/ArtboardResolver').default;
let { compareWithArchive } = require('../utils/rasterizer');

let fs = require('fs');
let cases = fs.readdirSync(__dirname + '/shapegroup_json');

describe ('ShapeGroup', () => {
    
    cases.forEach(name => {
        it (name, async function () {
            let case_json = JSON.parse(fs.readFileSync(__dirname +'/shapegroup_json/'+name, 'utf8'));
            let layer = {
                __resolved: {},
                ...case_json
            };

            let node = ElementShapeGroup(ArtboardResolver(layer));
            await compareWithArchive(node, 100, 100, name);
        });
    });

})