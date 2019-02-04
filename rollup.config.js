let node_resolve = require('rollup-plugin-node-resolve');
let buble = require('rollup-plugin-buble');
let css = require('rollup-plugin-hot-css');
let glob = require('rollup-plugin-glob-import');

let scss = (code, id) => {
    return require('node-sass').renderSync({
        data: code,
        compressed: true,
        includePaths: [ require('path').dirname(id) ]
    }).css.toString();
};

let config = {
    input: './src/main.js',
    output: {
        dir: './dist',
        format: 'umd',
        assetFileNames: '[name][extname]',
        entryFileNames: '[name].js'
    },
    plugins: [
    	glob(),
        css({
            filename: 'styles.css',
            hot: process.env.NODE_ENV === 'development',
            transform: scss
        }),
        buble({
            jsx: 'h',
            objectAssign: 'Object.assign'
        }),
        node_resolve({
        	jsnext: true
        })
    ]
};

module.exports = config;