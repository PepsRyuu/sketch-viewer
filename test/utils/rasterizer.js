let { render } = global.require('preact');
let fs = global.require('fs');

function SVGtoImage (node) {
    return new Promise ((resolve, reject) => {
        let element = render(node);
        element.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        let img = new Image();
        img.src = 'data:image/svg+xml,' + element.outerHTML.replace(/#/g, '%23');
        img.onload = function () {
            resolve(img);
        }

        img.onerror = function (e) {
            reject('Invalid image - ' + img.src);
        }
    });   
}

async function rasterize (node, width, height) {
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    let img = await SVGtoImage(node);
    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas;
}

export async function compareWithArchive (node, width, height, title) {
    title = title.replace(/ /g, '_');

    document.body.querySelectorAll(`[data-test="${title}"]`).forEach(e => e.remove());

    if (!fs.existsSync(process.cwd() + '/test/__archive')) {
        fs.mkdirSync(process.cwd() + '/test/__archive');
    }

    let canvas = await rasterize(node, width, height);

    let filename = process.cwd() + '/test/__archive/' + title + '.png';
    let image = canvas.toDataURL().replace('data:image/png;base64,', '');
    if (!fs.existsSync(filename)) {
        fs.writeFileSync(filename, image, 'base64');
    } else {
        let archived = fs.readFileSync(filename, 'base64');
        try {
            expect(archived).to.equal(image);
        } catch (e) {
            console.error(title);
            console.error('Generated');
            console.error('%c ', `border: 1px solid black; padding:${width / 2}px ${height / 2}px; background: url(data:image/png;base64,${image}) no-repeat;`);
            console.error('Archived');
            console.error('%c ', `border: 1px solid black; padding:${width / 2}px ${height / 2}px; background: url(data:image/png;base64,${archived}) no-repeat;`);
            throw e;
        }
        
    }
}