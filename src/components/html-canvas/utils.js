/**
 * Set the style on the JSX element.
 *
 * @method setStyle 
 * @param {VNode} el
 * @param {String} name
 * @param {Any} value
 */
export function setStyle(el, name, value) {
    if (!el.attributes.style) {
        el.attributes.style = {};
    }

    el.attributes.style[name] = value;
}

/**
 * Get the style, else return undefined
 *
 * @method getStyle
 * @param {VNode} el,
 * @param {String} name
 * @return {Any}
 */
export function getStyle (el, name) {
    if (!el.attributes.style) {
        return undefined;
    } 

    return el.attributes.style[name];
}

/**
 * Convert Sketch RGBA structure to DOM color string.
 *
 * @method getDOMColor
 * @param {Object} color
 * @return {String}
 */
export function getDOMColor (color) {
    return `rgba(${Math.floor(255 * color.red)}, ${Math.floor(255 * color.green)}, ${Math.floor(255 * color.blue)}, ${color.alpha})`;
}

/**
 * Takes Sketch number set format and returns them parsed as floats.
 *
 * @method parseNumberSet
 * @param {String} input
 * @return {Array<Float>}
 */
export function parseNumberSet (input) {
    return input.replace(/\{|\}/g, '').split(', ').map(parseFloat);
}

/**
 * Apply translate and rotations.
 *
 * @method applyTransforms
 * @param {VNode} el
 * @param {Object} layer
 */
export function applyTransforms (el, layer) {
    if (!getStyle(el, 'transform')) {
        setStyle(el, 'transform', '');
    }

    if (!layer.isVisible) {
        setStyle(el, 'display', 'none');
    }

    if (layer.isFlippedHorizontal || layer.isFlippedVertical) {
        let scaleX = layer.isFlippedHorizontal? -1 : 1;
        let scaleY = layer.isFlippedVertical? -1 : 1;
        let updatedStyle = getStyle(el, 'transform') + ` scale(${scaleX},${scaleY})`;
        setStyle(el, 'transform', updatedStyle);
    }

    if (layer.rotation) {
        let rotation = {value: layer.rotation * -1, cx: layer.parent.frame.width / 2, cy: layer.parent.frame.height / 2};
        let updatedStyle = getStyle(el, 'transform') + ` rotate(${rotation.value}deg)`;
        setStyle(el, 'transform', updatedStyle);
    }

    if (getStyle(el, 'position') === undefined) {
        setStyle(el, 'position', 'absolute');
        setStyle(el, 'top', layer.frame.y + 'px');
        setStyle(el, 'left', layer.frame.x + 'px');
    }

    layer.__resolved.transform = {
        transform: getStyle(el, 'transform')
    }
       
}

/**
 * Creates clip mask.
 *
 * @method applyClipMasks
 * @param {VNode} el
 * @param {Object} layer
 */
let clipIndex = 0;
export function applyClipMasks (el, layer, parentEl) {
    if (layer.clippingMask) {
        let clipId = `__clip__${clipIndex++}`;
        let previous = layer.parent.layers[layer.parent.layers.findIndex(l => l === layer) - 1];

        if (previous) {
            let clipEl = JSON.parse(JSON.stringify(previous.__element.children.find(c => c.nodeName !== 'defs')));
            setStyle(clipEl, 'transform', `translate(${layer.frame.x * -1}px, ${layer.frame.y * -1}px)`);

            el.attributes['clip-path'] = `url(#${clipId})`;

            el.children.push(
                <clipPath id={clipId}>
                    {clipEl}
                </clipPath>
            );
        } 
    } else if (layer.hasClippingMask) {
        setStyle(parentEl, 'overflow', 'hidden');
    }

}

/**
 * Apply opacity context settings.
 *
 * @method applyOpacity
 * @param {VNode} el
 * @param {Object} layer
 */
export function applyOpacity (el, layer) {
    if (layer.style && layer.style.contextSettings) {
        setStyle(el, 'opacity', layer.style.contextSettings.opacity);

        layer.__resolved.opacity = {
            opacity: getStyle(el, 'opacity')
        }
    }
}

/**
 * Apply inner and outer shadows.
 *
 * @method applyShadows
 * @param {VNode} el
 * @param {Object} layer
 */
let filterId = 0;
export function applyShadows (el, layer) {
    if (layer.style && layer.style.innerShadows) {
        let shadows = layer.style.innerShadows;
        if (shadows.length > 0 && shadows[0].isEnabled) {
            let s = shadows[0];
            let color = getDOMColor(s.color);

            let id = `__inset_shadow__${filterId++}`;
            setStyle(el, 'filter', `url(#${id})`);

            let isTransparent = el.children.find(c => c.nodeName === 'path').attributes.fill === 'rgba(1,1,1,0)';

            // By default, we put in a transparent fill.
            // However, for this shadow filter to work, we need to make it non-transparent.
            if (isTransparent) {
                el.children.find(c => c.nodeName === 'path').attributes.fill = 'rgba(1,1,1,1)';
            }

            el.children.push(
                <filter id={id}>
                    <feOffset
                        dx={s.offsetX}
                        dy={s.offsetY}
                    />
                    <feGaussianBlur
                        stdDeviation={s.blurRadius}
                        result='offset-blur'
                    />
                    <feComposite 
                        operator="out" 
                        in="SourceGraphic" 
                        in2="offset-blur"
                        result="inverse" 
                    />
                    <feFlood
                        flood-color={color}
                        result='color'
                    />
                    <feComposite
                        operator='in'
                        in='color'
                        in2='inverse'
                        result='shadow'
                    />
                    {!isTransparent? 
                        <feComposite
                            operator="over"
                            in="shadow"
                            in2="SourceGraphic"
                        />
                    : null}
                </filter>
            );
        }
    }

    if (layer.style && layer.style.shadows) {
        let shadows = layer.style.shadows;
        if (shadows.length > 0 && shadows[0].isEnabled) {
            let s = shadows[0];
            let color = getDOMColor(s.color);
            let updatedStyle = getStyle(el, 'filter') + ` drop-shadow(${s.offsetX}px ${s.offsetY}px ${s.blurRadius}px ${color})`;
            setStyle(el, 'filter', updatedStyle);
        }
    }
}

