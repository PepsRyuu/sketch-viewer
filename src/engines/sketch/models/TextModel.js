import { getDOMColor, parseNumberSet } from '../utils';
import { TextWeights, TextAlignments, VerticalAlignments } from '../Constants';

export function getFontStyle (attrs) {
    let { name, size } = attrs.MSAttributedStringFontAttribute.attributes;

    // TODO: NSCTFontUIUsageAttribute
    if (!name) {
        name = 'Arial-Regular';
    }

    let parts = name.split('-');
    let family = parts[0] + ', ' + parts[0].replace(/([A-Z](?:[a-z]))/g, ' $1').trim();
    let weight = parts.length === 2? TextWeights[parts[1].toLowerCase()] : '300';

    return {
        'letter-spacing': (attrs.kerning || -0.1) + 'px',
        'font-size': size,
        'font-weight': weight,
        'font-family': family + ', sans-serif'
    };
}

function getColor (attrs) {
    let color = getDOMColor(attrs.MSAttributedStringColorAttribute);

    return {
        'color': color
    };
}

function getDecoratorStyle (attrs) {
    return {
        'text-decoration': attrs.underlineStyle === 1? 'underline' : 'none'
    };
}

function getAlignmentAndSpacing (attrs, layer) {
    let lineHeight = 'normal';
    
    if (attrs.paragraphStyle) {
        if (attrs.paragraphStyle._class === 'paragraphStyle') {
            if (attrs.paragraphStyle.minimumLineHeight !== undefined) {
                lineHeight = attrs.paragraphStyle.minimumLineHeight + 'px';
            } else if (attrs.paragraphStyle.paragraphSpacing) {
                lineHeight = (1 + attrs.paragraphStyle.paragraphSpacing) + 'em';
            }
        }
    }

    return {
        'text-align': attrs.paragraphStyle && attrs.paragraphStyle.alignment !== undefined? TextAlignments[attrs.paragraphStyle.alignment] : 'left',
        'line-height': lineHeight,
        'vertical-align': attrs.verticalAlignment !== undefined? VerticalAlignments[attrs.verticalAlignment] : 'middle'
    };
}

function getTextTransform (attrs) {
    let transform = '';

    if (attrs.MSAttributedStringTextTransformAttribute === 1) {
        transform = 'uppercase';
    }

    return {
        'text-transform': transform
    };
}

export default function TextModel (layer) {
    let { string, attributes } = layer.attributedString;

    let strings = attributes.map(attr => {
        return {
            value: string.substring(attr.location, attr.location + attr.length).replace(/\u2028/g, '\n'),
            attributes: {
                ...getTextTransform(attr.attributes),
                ...getFontStyle(attr.attributes),
                ...getAlignmentAndSpacing(attr.attributes, layer),
                ...getColor(attr.attributes),
                ...getDecoratorStyle(attr.attributes)
            } 
        };
    });

    let offsetY = 0;

    // perfect
    //  bounds 14 line height 24 font-size 16 tb 0 lb 1 --> using line height, but normal also works 
    //  bounds 22 line height none font-size 21, tb 1, lb 2 --> uses normal line height 
    //  bounds 177 line height 80, font-size 16, tb 2, lb 2 --> using line height

    // too high:
    //   bounds 12, line height 21, font-size 14px tb 0 lb 0 ==> glyph tranlsation
    //   bounds 15, line height 27, font-size 18px tb 1 lb 0 --> glyph translation

    // too low:
    //   bounds 10 line height 21 font-size 12px tb 1 lb 1 -- normal line height works
    if (layer.glyphBounds && layer.lineSpacingBehaviour === 0 && strings[0].attributes['line-height'].endsWith('px')) {
        let bounds = parseNumberSet(layer.glyphBounds);
        offsetY = bounds[1] + 'px';
        strings.forEach(s => {
            if (bounds[3] < parseInt(strings[0].attributes['line-height'])) {
                s.attributes['line-height'] = bounds[3] + 'px';
            }
        });
    }

    return {
        'offsetY': offsetY,
        'text-wrap': layer.textBehaviour === 0? 'pre' : 'pre-wrap',
        'strings': strings
    };
}