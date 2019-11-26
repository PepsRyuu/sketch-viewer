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
        
    if (layer.glyphBounds) {
        let bounds = parseNumberSet(layer.glyphBounds);
        if (attrs.paragraphStyle.minimumLineHeight !== undefined) {
            lineHeight = Math.min(bounds[3], attrs.paragraphStyle.minimumLineHeight) + 'px';
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

    // Move multiline paragraphs upwards so that the bounding box
    // begins exactly where the text begins with no added padding
    // due to line-height.
    if (layer.glyphBounds) {
        // Multi-line adjustment
        let bounds = parseNumberSet(layer.glyphBounds);
        let lineHeight = parseInt(strings[0].attributes['line-height']);
        let fontSize = parseInt(strings[0].attributes['font-size']);
        if (bounds[3] > lineHeight && layer.lineSpacingBehaviour === 1) {
            offsetY = -(lineHeight - fontSize) / 2 + 'px';
        }
    }

    return {
        'offsetY': offsetY,
        'text-wrap': layer.textBehaviour === 0? 'pre' : 'pre-wrap',
        'strings': strings
    };
}