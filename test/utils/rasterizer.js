let { render } = global.require('preact');
let fs = global.require('fs');
let electron = global.require('electron');

if (!global.test_window) {
    global.test_window = new electron.remote.BrowserWindow({
        width: 1000,
        height: 1000
    });

    global.test_window.loadURL('data:text/html;utf8,<meta name="viewport" content="width=device-width, initial-scale=1"><style>html, body { overflow: hidden; margin: 0; }</style>')
}

let test_window = global.test_window;

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

function Base64ToImage (string) {
    return new Promise ((resolve, reject) => {
        let img = new Image();
        img.src = 'data:image/png;base64,' + string;
        img.onload = function () {
            resolve(img);
        }

        img.onerror = function (e) {
            reject('Invalid image - ' + img.src);
        }
    });   
}

async function rasterizeSVG (node, width, height) {
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    let img = await SVGtoImage(node);
    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas;
}

async function getDifference (archived, width, height, image) {
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    archived = await Base64ToImage(archived);
    image = await Base64ToImage(image); 

    let ctx = canvas.getContext('2d');
    ctx.drawImage(archived, 0, 0, width, height);
    ctx.globalCompositeOperation = 'difference';
    ctx.drawImage(image, 0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
    return canvas.toDataURL().replace('data:image/png;base64,', '');
}

async function compareWithArchive (title, width, height, imageDataUri) {
    let filename = process.cwd() + '/test/__archive/' + title + '.png';
    let base64Image = imageDataUri.replace('data:image/png;base64,', '');

    if (!fs.existsSync(filename)) {
        fs.writeFileSync(filename, base64Image, 'base64');
    } else {
        let archived = fs.readFileSync(filename, 'base64');
            
        try {
            expect(archived).to.equal(base64Image);
        } catch (e) {
            let padding_height = Math.min(100, height / 2);
            let diff = await getDifference(archived, width, height, base64Image);

            console.error(title, filename);
            console.error('Generated');
            console.error('%c ', `border: 1px solid black; padding:${width / 2}px ${padding_height}px; background: url(data:image/png;base64,${base64Image}) no-repeat; background-size: contain`);
            console.error('Archived');
            console.error('%c ', `border: 1px solid black; padding:${width / 2}px ${padding_height}px; background: url(data:image/png;base64,${archived}) no-repeat; background-size: contain`);
            console.error('Difference');
            console.error('%c ', `border: 1px solid black; padding:${width / 2}px ${padding_height}px; background: url(data:image/png;base64,${diff}) no-repeat; background-size: contain`);
            throw "Image comparison failed";
        }
    }
}

export async function compareSVGWithArchive (node, width, height, title) {
    title = title.replace(/ /g, '_');

    document.body.querySelectorAll(`[data-test="${title}"]`).forEach(e => e.remove());

    if (!fs.existsSync(process.cwd() + '/test/__archive')) {
        fs.mkdirSync(process.cwd() + '/test/__archive');
    }

    let canvas = await rasterizeSVG(node, width, height);
    await compareWithArchive(title, width, height, canvas.toDataURL());
}

export async function compareHTMLWithArchive (node, title) {
    let wrapper = document.createElement('div');
    render(node, wrapper);
    await test_window.webContents.executeJavaScript(`document.body.innerHTML = \`${wrapper.innerHTML}\``);
    await test_window.webContents.executeJavaScript(`document.body.innerHTML`);

    let { width, height } = await test_window.webContents.executeJavaScript(`
        (function () {
            let { width, height } = document.body.children[0].getBoundingClientRect();
            return { width, height };
        })();
        
    `);

    test_window.setContentBounds({ x: 200, y: 200, width, height });

    // Bypasses a bug where this sometimes returns nothing
    await test_window.capturePage();
    
    let image = await test_window.capturePage();
    await compareWithArchive(title, width, height, image.toDataURL());
}

window.onunload = () => {
    test_window.close();
}