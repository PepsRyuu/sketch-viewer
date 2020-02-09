export const TextAlignments = {
    0: 'left',
    1: 'right',
    2: 'center',
    3: 'justify',
    4: 'left' // default alignment
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

export const ResizeConstraintsMask = {
    NONE:    0b00000000,
    TOP:     0b00100000,
    HEIGHT:  0b00010000,
    BOTTOM:  0b00001000,
    LEFT:    0b00000100,
    WIDTH:   0b00000010,
    RIGHT:   0b00000001,
};

export const VerticalAlignments = {
    '0': 'top',
    '1': 'middle',
    '2': 'bottom'
};

export const BorderPositions = {
    '0': 'center',
    '1': 'inside',
    '2': 'outside'
};

// https://github.com/sketch-hq/SketchAPI/blob/develop/Source/dom/layers/Text.js
export const LineSpacingBehaviours = {
    '0': 'none',
    '1': 'variable', // uses min and max line height on paragraph style
    '2': 'consistent-baseline' // Uses MSConstantBaselineTypesetter for fixed line height
}

// https://sketchtalk.io/discussion/2975/bounding-box-auto-resize-to-height-of-text-block-impossible
export const TextBehaviours = {
    '0': 'auto', // width is adjusted to fit the content
    '1': 'fixed' // width is fixed
}