import { getDOMColor, parseBplist, withProperty } from '../utils';
import { TextWeights, TextAlignments } from '../constants';

function getFontStyle (layer) {
    let font, size;

    withProperty(layer, 'style.textStyle.encodedAttributes.MSAttributedStringFontAttribute', encodedFont => {
        if (encodedFont._archive) {
            let obj = parseBplist(encodedFont);
            font = obj[0].$objects[6];
            size = obj[0].$objects[5];
        }

        if (encodedFont._class === 'fontDescriptor') {
            font = encodedFont.attributes.name;
            size = encodedFont.attributes.size;
        }   
    });

    let parts = font.split('-');
    let family = parts[0] + ', ' + parts[0].replace(/([A-Z])/g, ' $1').trim();
    let weight = parts.length === 2? TextWeights[parts[1].toLowerCase()] : '300';

    return {
        fontSize: size,
        fontWeight: weight,
        fontFamily: family
    };
}

function getStringValue (layer) {
    let stringValue;

    withProperty(layer, 'attributedString', attributedString => {
        if (attributedString.archivedAttributedString) {
            stringValue = parseBplist(attributedString.archivedAttributedString)[0].$objects[2];
        }
           
        if (attributedString._class === 'attributedString') {
            stringValue = attributedString.string;
        }
    });

    stringValue = stringValue.replace(/\u2028/g, '\n');

    withProperty(layer, 'style.textStyle.encodedAttributes.MSAttributedStringTextTransformAttribute', (value) => {
        if (value === 1) {
            stringValue = stringValue.toUpperCase();
        }
    });

    return { stringValue };
}

function getColor (layer) {
    let color;

    withProperty(layer, 'style.textStyle.encodedAttributes', encodedAttributes => {
        withProperty(encodedAttributes, 'NSColor', raw => {
            let parts = parseBplist(raw)[0].$objects[1].NSRGB.toString('utf8').split(' ').map(parseFloat);
            color = getDOMColor({
                red: parts[0],
                green: parts[1],
                blue: parts[2],
                alpha: parts[3] || 1
            });
        });

        withProperty(encodedAttributes, 'MSAttributedStringColorAttribute', raw => {
            color = getDOMColor(raw);
        });

        withProperty(encodedAttributes, 'MSAttributedStringColorDictionaryAttribute', raw => {
            color = getDOMColor(raw);
        });
    });

    withProperty(layer, 'style.fills', fills => {
        if (fills[0].isEnabled) {
            color = getDOMColor(fills[0].color);
        }
    });

    return { color };
}

function getAlignmentAndSpacing (layer) {
    let attrs = layer.style.textStyle.encodedAttributes;
    let paragraphStyle = attrs.paragraphStyle || attrs.NSParagraphStyle

    // Might not exist sometimes
    if (paragraphStyle) {
        let alignment, lineHeight;

        if (paragraphStyle._archive) {
            let list = parseBplist(paragraphStyle);
            let { NSAlignment, NSParagraphSpacing, NSMinLineHeight} = list[0].$objects[1];

            let lineHeight;
            if (NSMinLineHeight !== undefined) {
                lineHeight = NSMinLineHeight + 'px';
            } else if (NSParagraphSpacing !== undefined) {
                lineHeight = (1 + NSParagraphSpacing) + 'em';
            }

            alignment = NSAlignment;
        } else if (paragraphStyle._class === 'paragraphStyle') {
            alignment = paragraphStyle.alignment;

            if (paragraphStyle.minimumLineHeight) {
                lineHeight = paragraphStyle.minimumLineHeight + 'px';
            } else if (paragraphStyle.paragraphSpacing) {
                lineHeight = (1 + paragraphStyle.paragraphSpacing) + 'em';
            }
        }

        if (lineHeight === undefined) {
            // TODO: Not entirely sure if this is the correct default.
            lineHeight = '1.5';
        }
        
        let textAlign = TextAlignments[alignment] || 'left'
        let letterSpacing = (layer.style.textStyle.encodedAttributes.kerning || '0') + 'px';

        return {
            letterSpacing,
            textAlign,
            lineHeight
        };
    }
    
}

/**
 * Sketch Text class.
 *
 * @method ElementText
 */
export default function ElementText ({layer}) {
    let resolved = Object.assign({}, 
        getStringValue(layer),
        getFontStyle(layer),
        getColor(layer),
        getAlignmentAndSpacing(layer)
    );

    layer.__resolved.text = resolved;

    // TODO: Check for attributedString.attributes
    // if that exists, use that, else use other properties
    // Just do a simple map of the below for attributed

    // TODO: Adjust letter spacing so content fits into box
    // Use requestAnimationFrame for this

    return (
        <div 
            style={{
                'font-family': resolved.fontFamily +', sans-serif',
                'font-size': resolved.fontSize,
                'font-weight': resolved.fontWeight,
                'color': resolved.color,
                'white-space': 'pre-wrap',
                'height': layer.frame.height,
                'width': layer.frame.width,
                'vertical-align': 'middle',
                'line-height': resolved.lineHeight,
                'text-align': resolved.textAlign,
                'letter-spacing': resolved.letterSpacing,
            }}
        >   
           {resolved.stringValue}
        </div>
    );
}