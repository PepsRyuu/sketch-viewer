import { getDOMColor, withProperty, getProperty } from '../utils/index';
import { TextWeights, TextAlignments } from '../utils/constants';

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

function getAlignmentAndSpacing (attrs) {
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
        'text-align': TextAlignments[attrs.paragraphStyle.alignment] || 'left',
        'line-height': lineHeight
    }
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

    return {
        'text-wrap': layer.textBehaviour === 0? 'pre' : 'pre-wrap',
        'strings': attributes.map(attr => {
            return {
                value: string.substring(attr.location, attr.location + attr.length).replace(/\u2028/g, '\n'),
                attributes: {
                    ...getTextTransform(attr.attributes),
                    ...getFontStyle(attr.attributes),
                    ...getAlignmentAndSpacing(attr.attributes),
                    ...getColor(attr.attributes),
                    ...getDecoratorStyle(attr.attributes)
                } 
            };
        })
    };
}