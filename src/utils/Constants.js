export const TextAlignments = {
    1: 'right',
    2: 'center',
    3: 'justify',
    4: 'left'
};

export const TextWeights = {
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

export const BlendingMode = {
    0: 'normal',
    1: 'darken',
    2: 'multiply',
    3: 'color-burn',
    4: 'lighten',
    5: 'screen',
    6: 'color-dodge',
    7: 'overlay',
    8: 'soft-light',
    9: 'hard-light',
    10: 'difference',
    11: 'exclusion',
    12: 'hue',
    13: 'saturation',
    14: 'color',
    15: 'luminosity'
};

export const BooleanOperations = {
    '-1': 'none',
    '0': 'union',
    '1': 'subtract',
    '2': 'intersect',
    '3': 'difference'
};

export const ResizeConstraints = {
    NONE: 0b00111111,
    TOP: 0b00011111,
    RIGHT: 0b00111110,
    BOTTOM: 0b00110111,
    LEFT: 0b00111011,
    WIDTH: 0b00111101,
    HEIGHT: 0b00101111
};