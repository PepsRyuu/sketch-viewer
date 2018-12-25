import PListResolver from '../resolvers/PListResolver';

function getFont (textStyle) {
    let name, size;
    let obj = textStyle.MSAttributedStringFontAttribute;

    if (obj) {
        if (obj._archive) {
            obj = PListResolver(obj._archive);
            name = obj.NSFontDescriptorAttributes.NSFontNameAttribute;
            size = obj.NSFontDescriptorAttributes.NSFontSizeAttribute;
        } else if (obj._class === 'fontDescriptor') {
            name = obj.attributes.name;
            size = obj.attributes.size;
        }
    }

    return {
        attributes: { name, size }
    };
}

function getColor (textStyle) {
    if (textStyle.MSAttributedStringColorDictionaryAttribute) {
        return textStyle.MSAttributedStringColorDictionaryAttribute;
    }

    if (textStyle.MSAttributedStringColorAttribute) {
        return textStyle.MSAttributedStringColorAttribute;
    }

    if (textStyle.NSColor) {
        let parts = PListResolver(textStyle.NSColor._archive).NSRGB.toString('utf8').split(' ').map(parseFloat);
        return {
            red: parts[0],
            green: parts[1],
            blue: parts[2],
            alpha: parts[3] || 1
        };
    }
}

function getParagraphStyle (textStyle) {
    let paragraphStyle = textStyle.paragraphStyle || textStyle.NSParagraphStyle

    // Might not exist sometimes
    if (paragraphStyle) {
        if (paragraphStyle._archive) {
            let obj = PListResolver(paragraphStyle._archive);
            let { NSAlignment, NSParagraphSpacing, NSMinLineHeight} = obj;

            return { 
                alignment: NSAlignment,
                minimumLineHeight: NSMinLineHeight,
                paragraphSpacing: NSParagraphSpacing
            };
        } else if (paragraphStyle._class === 'paragraphStyle') {
            return paragraphStyle;
        }
    }
}

function getTransform (textStyle) {
    return textStyle.MSAttributedStringTextTransformAttribute;
}

/**
 * Sketch Text class.
 *
 * @method ElementText
 */
export default function TextModelNormalizer (layer) {
    if (!layer.attributedString.archivedAttributedString) {
        return layer.attributedString;
    }

    let attributedString = PListResolver(layer.attributedString.archivedAttributedString._archive);
    let textStyle = layer.style.textStyle.encodedAttributes;

    return {
        string: attributedString.NSString,
        attributes: [{
            location: 0,
            length: attributedString.NSString.length,
            attributes: {
                MSAttributedStringFontAttribute: getFont(textStyle),
                MSAttributedStringColorAttribute: getColor(textStyle),
                MSAttributedStringTextTransformAttribute: getTransform(textStyle),
                underlineStyle: 0,
                paragraphStyle: {
                    _class: 'paragraphStyle',
                    ...getParagraphStyle(textStyle)
                }
            }
        }]
    }
}