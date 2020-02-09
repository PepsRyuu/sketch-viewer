import { TextWeights } from '../../../utils/Constants';

function getFontWeight (fontStyle) {
    let name = fontStyle.trim().replace(/ /g, '').toLowerCase().replace('italic', '');
    let weight = TextWeights[name] || '300';
    return weight;
}

function getFontStyle (fontStyle) {
    if (fontStyle.toLowerCase().indexOf('italic') > -1) {
        return 'italic';
    }
}

function getFontColor (num) {
    num >>>= 0;

    let color = {
        b: num & 0xFF,
        g: (num & 0xFF00) >>> 8,
        r: (num & 0xFF0000) >>> 16,
        a: ( (num & 0xFF000000) >>> 24 ) / 255
    };

    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}

function getLineHeight (node) {
    return 'normal';
}

function getStyle (node, start, end) {
    // Use meta.ux.rangedStyles and figure out what styles apply to the segment
    // RangedStyles summarise the line segment styles fairly well in a more condensed wa
    let text_index = 0;
    let group_style = node.meta.ux.rangedStyles[0];

    for (let i = 0; i < node.meta.ux.rangedStyles.length; i++) {
        if (start < text_index + node.meta.ux.rangedStyles[i].length) {
            group_style = node.meta.ux.rangedStyles[i];
            break;
        }

        text_index += node.meta.ux.rangedStyles[i].length;
    }

    let fontStyle = group_style.fontStyle;
    let fontFamily = group_style.fontFamily;

    // Sometimes the style isn't parsed out of the filename
    if (fontFamily.indexOf('-') > -1) {
        fontStyle = fontFamily.split('-')[1];
        fontFamily = fontFamily.split('-')[0];
    }

    return {
        'vertical-align': 'top',
        'text-transform': group_style.textTransform,
        'font-family': fontFamily,
        'font-size': group_style.fontSize + 'px',
        'font-weight': getFontWeight(fontStyle),
        'font-style': getFontStyle(fontStyle),
        'letter-spacing': (group_style.charSpacing / 100) + 'px', // TODO: -38px for spacing??
        'text-decoration': group_style.underline? 'underline' : 'none',
        'color': getFontColor(group_style.fill.value),
        'line-height': getLineHeight(node)
    }
}

function getWidth (node) {
    if (node.text.frame.type === 'area') {
        return node.text.frame.width;
    }

    return 'auto';
}

function getHeight (node) {
    if (node.text.frame.type === 'area') {
        return node.text.frame.height;
    }

    return 'auto';
}

export default function TextModel (node) {
    return {
        'text-wrap': 'pre',
        'width': getWidth(node),
        'height': getHeight(node),
        'paragraphs': node.text.paragraphs.map(paragraph => {
            return paragraph.lines.map(line => {
                let fontSize = node.meta.ux.rangedStyles[0].fontSize;
                let deltaY = fontSize;

                return {
                    x: (line[0].x || 0),
                    y: (line[0].y - deltaY),
                    segments: line.map(segment => {
                        return {
                            value: node.text.rawText.slice(segment.from, segment.to),
                            style: getStyle(node, segment.from, segment.to)
                        }
                    })
                }
            }).flat()
        }).flat()
    }
}