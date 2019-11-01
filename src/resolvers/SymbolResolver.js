import { TextWeights, ResizeConstraints } from '../utils/Constants';
import { parseNumberSet } from '../utils/index';
import { getFontStyle } from '../models/TextModel';

let current = { };
let canvas = document.createElement('canvas');

// Has to be attached to the DOM for letter-spacing to work.
canvas.setAttribute('style', `
    font-kerning: normal;
    text-rendering: optimizeLegibility;
    position: absolute;
    top: -99999px;
    left: -99999px;
    opacity: 0.00001;
    pointer-events: none;
`);
document.body.appendChild(canvas);

let ctx = canvas.getContext('2d');

function measureText (font_style, text) {
    ctx.font = font_style;
    ctx.fillStyle = 'red';
    ctx.fillText(text, 10, 10);

    return ctx.measureText(text);
}

function getSymbolMasterImpl ( layers, id) {
    for (let i = 0; i < layers.length; i++) {
        if (layers[i]._class === 'symbolMaster' && layers[i].symbolID === id) {
            return layers[i];
        }
        if (layers[i].layers) {
            getSymbolMasterImpl(layers[i].layers);
        }
    }
}

function getSymbolMaster (id) {
    for (let key in current.foreign.symbols) {
        if (key === id) {
            return current.foreign.symbols[key];
        }
    }

    for (let i = 0; i < current.pages.length; i++) {
        let hr = getSymbolMasterImpl(current.pages[i].data.layers, id);
        if (hr) {
            return hr;
        }
    }
}

function applyOverrides ( layer) {
    function findTargetLayer (layer, id) {
        if (layer.layers) {
            for (let i = 0; i < layer.layers.length; i++) {
                if (layer.layers[i].do_objectID === id) {
                    return layer.layers[i];
                }

                if (layer.layers[i].layers) {
                    let hr = findTargetLayer(layer.layers[i], id);
                    if (hr) {
                        return hr;
                    }
                }
            }
        }
    }

    if (layer.overrides) {
        for (let key in layer.overrides) {
            /*
                "0": {
                    "B7822ED4-7966-45E9-9783-D993FBE9E971": "07:04"
                }
            */
        }
    }

    if (layer.overrideValues) {
        layer.overrideValues.forEach(override => {
            let [id_path, override_type] = override.overrideName.split('_');
            let id_path_parts = id_path.split('/');

            let target_layer = layer;
            
            for (let i = 0; i < id_path_parts.length; i++) {
                let found = findTargetLayer(target_layer, id_path_parts[i]);
                if (found) {
                    target_layer = found;
                }

                if (i === id_path_parts.length - 1) {
                    break;
                }
            }

            if (target_layer && !target_layer.__overrided) {
                target_layer.__overrided = true;

                if (override_type === 'stringValue') {
                    if (target_layer.attributedString) {
                        target_layer.attributedString.string = override.value;
                        if (target_layer.attributedString.attributes.length === 1) {
                            target_layer.attributedString.attributes[0].length = override.value.length;
                        }
                    }
                }

                if (override_type === 'layerStyle') {
                    target_layer.style = current.foreign.layerStyles[override.value];
                }

                if (override_type === 'textStyle') {
                    target_layer.textStyle = current.foreign.textStyles[override.value];
                }
            }
        });
    }
}

function resolveSymbols (layers) {
    let impl = layers => {
        for (let i = 0; i < layers.length; i++) {
            if (layers[i]._class === 'symbolInstance') {
                let master = getSymbolMaster(layers[i].symbolID);
                if (master) {
                    layers[i].layers = JSON.parse(JSON.stringify(master.layers));
                    layers[i].__master = master;
                }
            }

            if (layers[i].layers) {
                impl(layers[i].layers);
            }
        }
    }

    impl(layers);
}

function resolveOverrides (layers) {
    let impl = layers => {
        for (let i = 0; i < layers.length; i++) {
            if (layers[i]._class === 'symbolInstance') {
                applyOverrides(layers[i]);
            }

            if (layers[i].layers) {
                impl(layers[i].layers);
            }
        }
    }

    impl(layers);
}

function resolveResizes (layers) {

    let resizeLayers = (layers, master) => {
        layers.forEach(child => {
            if (master) {
                let constraint = child.resizingConstraint;

                if ((ResizeConstraints.WIDTH | constraint) !== ResizeConstraints.WIDTH) {
                    if (Math.round(child.frame.width) >= master.__master.frame.width) {
                        child.frame.__width = child.frame.width;
                        child.frame.width = master.frame.width;
                    }
                }
                
                if ((ResizeConstraints.HEIGHT | constraint) !== ResizeConstraints.HEIGHT) {
                    if (Math.round(child.frame.height) >= master.__master.frame.height) {
                        child.frame.__height = child.frame.height;
                        child.frame.height = master.frame.height;
                    }
                }

                // TODO: Push content to the right of text out
                // TODO: Alignment issues still.
                if (child._class === 'text' && child.__overrided) {
                    let props = getFontStyle(child.attributedString.attributes[0].attributes);
                    let font_style = `${props['font-weight']} ${props['font-size']}px ${props['font-family']}`;
                    canvas.style.letterSpacing = props['letter-spacing'];
                    let { width } = measureText(font_style, child.attributedString.string);
                    let frameWidth = master.frame.width - child.frame.x;

                    child.frame._width = child.frame.width;
                    child.frame.width = Math.min(frameWidth, width);
                }
            }
            
            resizeLayers(child.layers || [], child._class === 'symbolInstance'? child : master);
        });
    }

    resizeLayers(layers, null);
}

export default function SymbolResolver (pages, foreign) {
    current = { pages, foreign };

    pages.forEach(page => resolveSymbols(page.data.layers));        
    pages.forEach(page => resolveOverrides(page.data.layers));        
    pages.forEach(page => resolveResizes(page.data.layers));        
}