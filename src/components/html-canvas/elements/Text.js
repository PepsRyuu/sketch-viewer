import { getDOMColor } from '../utils';
import bplist from 'bplist-parser';

function parseBplist (prop) {
    let buffer = Buffer.from(prop._archive, 'base64');
    let result = bplist.parseBuffer(buffer);
    return result;
}

// Weights have to be strings for them 
// to be applied as styles.
const weights = {
    'thin': '100',
    'hairline': '100',
    'extralight': '200',
    'ultralight': '200',
    'light': '300',
    'normal': '400',
    'regular': '400',
    'medium': '500',
    'semibold': '600',
    'demibold': '600',
    'bold': '700',
    'extrabold': '800',
    'ultrabold': '800',
    'black': '900',
    'heavy': '900'
};

const alignments = {
  1: 'right',
  2: 'center',
  3: 'justify',
  4: 'left'
};

function getFontStyle (layer) {
    let list = parseBplist(layer.style.textStyle.encodedAttributes.MSAttributedStringFontAttribute);
    let parts = list[0].$objects[6].split('-');
    let fontSize = list[0].$objects[5];

    let fontFamily, fontWeight;
    if (parts.length === 2) {
        fontFamily = parts[0];
        fontWeight = weights[parts[1].toLowerCase()];
    } else {
        fontFamily = parts[0];
        fontWeight = '300'; // TODO: Is this the correct default?
    }

    return { fontSize, fontWeight, fontFamily };
}

function getStringValue (layer) {
    let list = parseBplist(layer.attributedString.archivedAttributedString);
    let stringValue = list[0].$objects[2].replace(/\u2028/g, '\n');

    // transform if needed
    if (layer.style.textStyle.encodedAttributes.MSAttributedStringTextTransformAttribute === 1) {
        stringValue = stringValue.toUpperCase();
    }

    return { stringValue };

}

function getColor (layer) {
    let color;
    if (layer.style.textStyle.encodedAttributes.NSColor) {
        let buffer = parseBplist(layer.style.textStyle.encodedAttributes.NSColor)[0].$objects[1].NSRGB.toString('utf8');
        let parts = buffer.split(' ').map(parseFloat);
        color = getDOMColor({
            red: parts[0],
            green: parts[1],
            blue: parts[2],
            alpha: parts[3] || 1
        });
    } else {
        color = getDOMColor(layer.style.textStyle.encodedAttributes.MSAttributedStringColorDictionaryAttribute);
    }

    if (layer.style.fills && layer.style.fills[0].isEnabled) {
        color = getDOMColor(layer.style.fills[0].color);
    }

    return { color };
}

function getAlignmentAndSpacing (layer) {
    let attrs = layer.style.textStyle.encodedAttributes;
    let list = parseBplist(attrs.paragraphStyle || attrs.NSParagraphStyle);
    let { NSAlignment, NSParagraphSpacing, NSMinLineHeight} = list[0].$objects[1];

    let lineHeight;
    if (NSMinLineHeight !== undefined) {
        lineHeight = NSMinLineHeight + 'px';
    } else if (NSParagraphSpacing !== undefined) {
        lineHeight = (1 + NSParagraphSpacing) + 'em';
    } else {
        lineHeight = '1.5em';
    }

    let textAlign = alignments[NSAlignment] || 'left'
    let letterSpacing = (layer.style.textStyle.encodedAttributes.kerning || '0') + 'px';

    return {
        letterSpacing,
        textAlign,
        lineHeight
    };
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