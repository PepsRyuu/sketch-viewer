let { render } = global.require('preact');
let fs = global.require('fs');

function SVGtoImage (node) {
    return new Promise (resolve => {
        let element = render(node);
        element.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        let img = new Image();
        img.src = 'data:image/svg+xml,' + element.outerHTML;
        img.onload = function () {
            resolve(img);
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

    if (!fs.existsSync(__dirname + '/__archive')) {
        fs.mkdirSync(__dirname + '/__archive');
    }

    let canvas = await rasterize(node, width, height);
    let filename = __dirname + '/__archive/' + title + '.png';
    let image = canvas.toDataURL().replace('data:image/png;base64,', '');
    if (!fs.existsSync(filename)) {
        fs.writeFileSync(filename, image, 'base64');
    } else {
        let archived = fs.readFileSync(filename, 'base64');
        try {
            expect(archived).to.equal(image);
        } catch (e) {
            let el = render(node);
            el.style.border = '1px solid black';
            el.setAttribute('data-test', title);

            document.body.appendChild(el);

            canvas.style.border = '1px solid black';
            canvas.setAttribute('data-test', title);
            document.body.appendChild(canvas);
            throw e;
        }
        
    }
}