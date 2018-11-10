let ElementText = require('../../src/components/html-canvas/elements/Text').default;

let LayerFrame = (x, y, w, h) => ({
    __resolved: {},
    _class: 'text',
    frame: {
        height: h,
        width: w
    }
});

let LayerString = (value) => ({
    attributedString: {
        _class: 'attributedString',
        string: value
    }
});

let LayerFont = (family, size, rgba, transform) => ({
    style: {
        textStyle: {
            encodedAttributes: {
                MSAttributedStringFontAttribute: {
                    _class: 'fontDescriptor',
                    attributes: {
                        name: family,
                        size: size
                    }
                },
                MSAttributedStringColorAttribute: {
                    red: ((rgba & 0xFF000000) >> 24) / 255,
                    green: ((rgba & 0x00FF0000) >> 16) / 255,
                    blue: ((rgba & 0x0000FF00) >> 8 ) / 255,
                    alpha: (rgba & 0x000000FF)
                },
                MSAttributedStringTextTransformAttribute: transform === 'uppercase'? 1 : 0
            }
        }
    }
})

function assertText (node, value) {
    expect(node.children[0]).to.equal(value);
}

function assertColor (node, r, g, b, a) {
    let color = node.attributes.style.color;
    let parts = color.match(/\d+/g).map(v => parseInt(v));
    expect(r).to.equal(parts[0]);
    expect(g).to.equal(parts[1]);
    expect(b).to.equal(parts[2]);
    expect(a).to.equal(parts[3]);
}

describe('Text', () => {

    describe('String Content', () => {
        it ('attributedString for text content', () => {
            let layer = {
                ...LayerFrame(0, 0, 20, 20),
                ...LayerString('Hello World'),
                ...LayerFont('Arial', 10, 0xFF000000)
            };

            let node = ElementText({ layer });
            assertText(node, 'Hello World');
        });

        it ('should replace unicode line separator with normal line separator', () => {
            let layer = {
                ...LayerFrame(0, 0, 20, 20),
                ...LayerString('Hello\u2028World'),
                ...LayerFont('Arial', 10, 0xFF000000)
            };

            let node = ElementText({ layer });
            assertText(node, 'Hello\nWorld');
        });

        it ('MSAttributedStringTextTransformAttribute uppercase', () => {
            let layer = {
                ...LayerFrame(0, 0, 20, 20),
                ...LayerString('Hello World'),
                ...LayerFont('Arial', 10, 0xFF000000, 'uppercase')
            };

            let node = ElementText({ layer });
            assertText(node, 'HELLO WORLD');
        })
    });

    describe('Color', () => {
        it ('style.textStyle.encodedAttributes.MSAttributedStringColorAttribute for font color', () => {
            let layer = {
                ...LayerFrame(0, 0, 20, 20),
                ...LayerString('abc'),
                ...LayerFont('Arial', 10, 0x01020304)
            };

            let node = ElementText({ layer });
            assertColor(node, 1, 2, 3, 4);
        });
    });

    describe ('Font', () => {
        it ('style.textStyle.encodedAttributes.MSAttributedStringFontAttribute for font descriptor', () => {
            let layer = {
                ...LayerFrame(0, 0, 20, 20),
                ...LayerString('abc'),
                ...LayerFont('Arial-Regular', 20, 0xFF000000)
            };

            let node = ElementText({ layer });
            expect(node.attributes.style['font-family']).to.equal('Arial, Arial, sans-serif');
            expect(node.attributes.style['font-size']).to.equal(20);
            expect(node.attributes.style['font-weight']).to.equal('400');
        })

        it ('should put spaces between PascalCasing fonts', () => {
            let layer = {
                ...LayerFrame(0, 0, 20, 20),
                ...LayerString('abc'),
                ...LayerFont('ComicSans-Heavy', 20, 0xFF000000)
            };

            let node = ElementText({ layer });
            expect(node.attributes.style['font-family']).to.equal('ComicSans, Comic Sans, sans-serif');
            expect(node.attributes.style['font-size']).to.equal(20);
            expect(node.attributes.style['font-weight']).to.equal('900');
        });
    });
});