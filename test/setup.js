process.env.NODE_ENV = 'test';

let nollup = require('nollup');
let chokidar = require('chokidar');
let fs = require('fs');
let config = require('../rollup.config.js');

let files = {};
config.input = './test/main.js';

// TODO: MIUI needs to override mocha api for running tests?
// TODO: Have a clean API for re-running tests?
// TODO: Disable watching functionality in MIUI?

function handleGeneratedBundle (response) {
    let output = response.output;
    output.forEach(obj => {
        files[obj.fileName] = obj.isAsset? obj.source : obj.code;
    });

    console.log('%c%s', 'color: green', `Compiled in ${response.stats.time}ms.`);
    eval(files['main.js']);
}

async function compiler () {
    let bundle = await nollup(config);
    let watcher = chokidar.watch(['./test', './src']);
    let watcherTimeout;

    const onChange = async (path) => {
        if (fs.lstatSync(path).isFile()) {
            files = {};
            bundle.invalidate(path);

            if (watcherTimeout) {
                clearTimeout(watcherTimeout);
            }

            watcherTimeout = setTimeout(async () => {
                try {
                    let update = await bundle.generate();
                    handleGeneratedBundle(update);
                } catch (e) {
                    console.log('%c%s', 'color: red', e);
                }
            }, 100);
        }
    };

    watcher.on('add', onChange);
    watcher.on('change', onChange);

    try {
        handleGeneratedBundle(await bundle.generate());
    } catch (e) {
        console.log('%c%s', 'color: red', e);
    }
    
};

compiler();

