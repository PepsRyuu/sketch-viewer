let ElementText = require('../../src/components/renderer/elements/TextElement').default;
let ArtboardResolver = require('../../src/resolvers/ArtboardResolver').default;

let LayerFrame = (x, y, w, h) => ({
    _class: 'text',
    frame: {
        height: h,
        width: w
    }
});

let LayerString = (value, family, size, rgba, transform) => ({
    attributedString: {
        _class: 'attributedString',
        string: value,
        attributes: [{
            location: 0,
            length: value.length,
            attributes: {
                paragraphStyle: {},
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
        }]
    }
});

function assertText (node, value) {
    expect(node.children[0].children[0]).to.equal(value);
}

function assertColor (node, r, g, b, a) {
    let color = node.children[0].attributes.style.color;
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
                ...LayerString('Hello World', 'Arial', 10, 0xFF000000)
            };

            let node = ElementText(ArtboardResolver(layer));
            assertText(node, 'Hello World');
        });

        it ('should replace unicode line separator with normal line separator', () => {
            let layer = {
                ...LayerFrame(0, 0, 20, 20),
                ...LayerString('Hello\u2028World', 'Arial', 10, 0xFF000000),
            };

            let node = ElementText(ArtboardResolver(layer));
            assertText(node, 'Hello\nWorld');
        });
    });

    describe('Color', () => {
        it ('style.textStyle.encodedAttributes.MSAttributedStringColorAttribute for font color', () => {
            let layer = {
                ...LayerFrame(0, 0, 20, 20),
                ...LayerString('abc', 'Arial', 10, 0x01020304),
            };

            let node = ElementText(ArtboardResolver(layer));
            assertColor(node, 1, 2, 3, 4);
        });
    });

    describe ('Font', () => {
        it ('style.textStyle.encodedAttributes.MSAttributedStringFontAttribute for font descriptor', () => {
            let layer = {
                ...LayerFrame(0, 0, 20, 20),
                ...LayerString('abc', 'Arial-Regular', 20, 0xFF000000),
            };

            let node = ElementText(ArtboardResolver(layer));
            expect(node.children[0].attributes.style['font-family']).to.equal('Arial, Arial, sans-serif');
            expect(node.children[0].attributes.style['font-size']).to.equal(20);
            expect(node.children[0].attributes.style['font-weight']).to.equal('400');
        })

        it ('should put spaces between PascalCasing fonts', () => {
            let layer = {
                ...LayerFrame(0, 0, 20, 20),
                ...LayerString('abc', 'ComicSans-Heavy', 20, 0xFF000000),
            };

            let node = ElementText(ArtboardResolver(layer));
            expect(node.children[0].attributes.style['font-family']).to.equal('ComicSans, Comic Sans, sans-serif');
            expect(node.children[0].attributes.style['font-size']).to.equal(20);
            expect(node.children[0].attributes.style['font-weight']).to.equal('900');
        });
    });
});