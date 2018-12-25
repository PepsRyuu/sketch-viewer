let ElementShape = require('../../src/components/renderer/elements/ShapeElement').default;
let ArtboardResolver = require('../../src/resolvers/ArtboardResolver').default;
let { compareWithArchive } = require('../utils/rasterizer');

let fs = require('fs');
let cases = fs.readdirSync(__dirname + '/shape_json');

describe ('Shape', () => {

    cases.forEach(name => {
        it (name, async function () {
            let case_json = JSON.parse(fs.readFileSync(__dirname +'/shape_json/'+name, 'utf8'));
            let layer = {
                __resolved: {},
                ...case_json
            };

            let node = ElementShape(ArtboardResolver( layer ));
            await compareWithArchive(node, 100, 100, name);
        });
    });
})