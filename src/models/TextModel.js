import { getDOMColor, withProperty, getProperty } from '../utils/index';
import { TextWeights, TextAlignments } from '../utils/constants';
import PListResolver from '../resolvers/PListResolver';

// function getFontStyle (layer) {
//     let font, size;

//     withProperty(layer, 'style.textStyle.encodedAttributes.MSAttributedStringFontAttribute', encodedFont => {
//         if (encodedFont._archive) {
//             let obj = parseBplist(encodedFont);
//             font = obj[0].$objects[6];
//             size = obj[0].$objects[5];
//         }

//         if (encodedFont._class === 'fontDescriptor') {
//             font = encodedFont.attributes.name;
//             size = encodedFont.attributes.size;
//         }   
//     });

//     let parts = font.split('-');
//     let family = parts[0] + ', ' + parts[0].replace(/([A-Z])/g, ' $1').trim();
//     let weight = parts.length === 2? TextWeights[parts[1].toLowerCase()] : '300';

//     return {
//         fontSize: size,
//         fontWeight: weight,
//         fontFamily: family
//     };
// }

// function getStringValue (layer) {
//     let stringValue;

//     withProperty(layer, 'attributedString', attributedString => {
//         if (attributedString.archivedAttributedString) {
//             stringValue = parseBplist(attributedString.archivedAttributedString)[0].$objects[2];
//         }
           
//         if (attributedString._class === 'attributedString') {
//             stringValue = attributedString.string;
//         }
//     });

//     stringValue = stringValue.replace(/\u2028/g, '\n');

//     withProperty(layer, 'style.textStyle.encodedAttributes.MSAttributedStringTextTransformAttribute', (value) => {
//         if (value === 1) {
//             stringValue = stringValue.toUpperCase();
//         }
//     });

//     return { stringValue };
// }

// function getColor (layer) {
//     let color;

//     withProperty(layer, 'style.textStyle.encodedAttributes', encodedAttributes => {
//         withProperty(encodedAttributes, 'NSColor', raw => {
//             let parts = parseBplist(raw)[0].$objects[1].NSRGB.toString('utf8').split(' ').map(parseFloat);
//             color = getDOMColor({
//                 red: parts[0],
//                 green: parts[1],
//                 blue: parts[2],
//                 alpha: parts[3] || 1
//             });
//         });

//         withProperty(encodedAttributes, 'MSAttributedStringColorAttribute', raw => {
//             color = getDOMColor(raw);
//         });

//         withProperty(encodedAttributes, 'MSAttributedStringColorDictionaryAttribute', raw => {
//             color = getDOMColor(raw);
//         });
//     });

//     withProperty(layer, 'style.fills', fills => {
//         if (fills[0].isEnabled) {
//             color = getDOMColor(fills[0].color);
//         }
//     });

//     return { color };
// }

// function getAlignmentAndSpacing (layer) {
//     let attrs = layer.style.textStyle.encodedAttributes;
//     let paragraphStyle = attrs.paragraphStyle || attrs.NSParagraphStyle

//     // Might not exist sometimes
//     if (paragraphStyle) {
//         let alignment, lineHeight;

//         if (paragraphStyle._archive) {
//             let list = parseBplist(paragraphStyle);
//             let { NSAlignment, NSParagraphSpacing, NSMinLineHeight} = list[0].$objects[1];

//             let lineHeight;
//             if (NSMinLineHeight !== undefined) {
//                 lineHeight = NSMinLineHeight + 'px';
//             } else if (NSParagraphSpacing !== undefined) {
//                 lineHeight = (1 + NSParagraphSpacing) + 'em';
//             }

//             alignment = NSAlignment;
//         } else if (paragraphStyle._class === 'paragraphStyle') {
//             alignment = paragraphStyle.alignment;

//             if (paragraphStyle.minimumLineHeight) {
//                 lineHeight = paragraphStyle.minimumLineHeight + 'px';
//             } else if (paragraphStyle.paragraphSpacing) {
//                 lineHeight = (1 + paragraphStyle.paragraphSpacing) + 'em';
//             }
//         }

//         if (lineHeight === undefined) {
//             // TODO: Not entirely sure if this is the correct default.
//             lineHeight = '1.5';
//         }
        
//         let textAlign = TextAlignments[alignment] || 'left'
//         let letterSpacing = (layer.style.textStyle.encodedAttributes.kerning || '0') + 'px';

//         return {
//             letterSpacing,
//             textAlign,
//             lineHeight
//         };
//     }   
// }

function getFontStyle (attrs) {
    let { name, size } = attrs.MSAttributedStringFontAttribute.attributes;

    let parts = name.split('-');
    let family = parts[0] + ', ' + parts[0].replace(/([A-Z](?:[a-z]))/g, ' $1').trim();
    let weight = parts.length === 2? TextWeights[parts[1].toLowerCase()] : '300';

    return {
        'font-size': size,
        'font-weight': weight,
        'font-family': family
    };
}

function getColor (attrs) {
    let color = getDOMColor(attrs.MSAttributedStringColorAttribute);

    return {
        'color': color
    };
}

function getAlignmentAndSpacing (attrs) {
    let lineHeight = '1.5';

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
        'letter-spacing': (attrs.kerning || 0) + 'px',
        'text-align': TextAlignments[attrs.paragraphStyle.alignment] || 'left',
        'line-height': lineHeight
    }
}

export default function TextModel (layer) {
    let { string, attributes } = layer.attributedString;

    return {
        'strings': attributes.map(attr => {
            return {
                value: string.substring(attr.location, attr.location + attr.length).replace(/\u2028/g, '\n'),
                attributes: {
                    ...getFontStyle(attr.attributes),
                    ...getAlignmentAndSpacing(attr.attributes),
                    ...getColor(attr.attributes)
                } 
            };
        })
    };
}