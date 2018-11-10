require('babel-register')();
let less = require('less');
let fs = require('fs');

let CSSParse = function (module, filename) {
    let content = fs.readFileSync(filename, 'utf8');
    less.render(content, {}, function(error, output) {
        let tag = document.createElement('style');
        tag.textContent = output.css;
        document.head.appendChild(tag);
    });
}

require.extensions['.less'] = CSSParse;
require.extensions['.css'] = CSSParse;