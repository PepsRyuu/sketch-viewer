let ElementShape = require('../../src/components/html-canvas/elements/Shape_redo').default;
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

            let node = ElementShape({ layer });
            await compareWithArchive(node, 100, 100, name);
        });
    });
})