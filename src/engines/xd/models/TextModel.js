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
        'text-align': TextAlignments[attrs.paragraphStyle && attrs.paragraphStyle.alignment] || 'left',
        'line-height': lineHeight,
        'vertical-align': attrs.verticalAlignment !== undefined? VerticalAlignments[attrs.verticalAlignment] : 'middle'
    };
}


export default function TextModel (node) {
    let color = node.style.fill.color.value;
    color = `rgb(${color.r}, ${color.g}, ${color.b})`;


    return {
        // 'text-wrap': //'pre' : 'pre-wrap',
        'text-wrap': 'pre',
        'width': 'auto',
        'height': 'auto',
        'strings': [node.text.rawText].map(text => {
            if (node.meta.ux.rangedStyles && node.meta.ux.rangedStyles[0]) {
                let textTransform = node.meta.ux.rangedStyles[0].textTransform;

                if (textTransform === 'titlecase') {
                    text = text.replace(/(^| |\n)([a-z])/g, (full, a, b) => { 
                        return a + b.toUpperCase();
                    })
                }
            }

            return {
                value: text,
                attributes: {
                    'text-transform': 'auto',
                    'letter-spacing': '-0.1px',
                    'font-size': node.style.font.size,
                    'font-family': node.style.font.family + ', sans-serif',
                    'font-weight': node.style.font.style, // TODO: to weight
                    'text-align': 'auto' ,
                    'text-decoration': 'auto',
                    'line-height': 'auto',
                    'vertical-align': 'auto',
                    'color': color
                } 
            };
        })
    };
}