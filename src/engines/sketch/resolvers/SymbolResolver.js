import { TextWeights, ResizeConstraints } from '../Constants';
import { parseNumberSet } from '../utils';
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
            return JSON.parse(JSON.stringify(layers[i]));
        }
        if (layers[i].layers) {
            getSymbolMasterImpl(layers[i].layers);
        }
    }
}

function getSymbolMaster (id) {
    for (let key in current.foreign.symbols) {
        if (key === id) {
            return JSON.parse(JSON.stringify(current.foreign.symbols[key]));
        }
    }

    for (let i = 0; i < current.pages.length; i++) {
        let hr = getSymbolMasterImpl(current.pages[i].data.map(d => d.data), id);
        if (hr) {
            return hr;
        }
    }
}

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

function getSymbolIDOverrides ( layer) {
    if (layer.overrideValues) {
        return layer.overrideValues.filter(o => {
            return o.overrideName.indexOf('_symbolID') > -1;
        }).map(override => {
            let [id_path, override_type] = override.overrideName.split('_');
            // TODO: Complex paths for symbolIDs
            let id_path_parts = id_path.split('/');

            return {
                id: id_path_parts[id_path_parts.length - 1],
                value: override.value
            };
        });
    }

    return [];
}

function applyOverrides ( layer) {
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

            if (target_layer) {
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
                    target_layer.style = current.foreign.textStyles[override.value];
                    target_layer.attributedString.attributes.forEach(entry => {
                        entry.attributes = {
                            ...entry.attributes,
                            ...target_layer.style.textStyle.encodedAttributes,
                            verticalAlignment: target_layer.style.textStyle.verticalAlignment
                        };
                    });
                }
            }
        });
    }
}

function resolveSymbols (layers) {
    let impl = (layers, ancestors) => {
        for (let i = 0; i < layers.length; i++) {
            if (layers[i]._class === 'symbolInstance') {
                let symbolID = layers[i].symbolID;

                ancestors.forEach(anc => {
                    let overrideSymbolID = anc.__symbol_overrides.find(o => o.id === layers[i].do_objectID);
                    if (overrideSymbolID) {
                        symbolID = overrideSymbolID.value;
                    }
                })
               
                let master = getSymbolMaster(symbolID);

                if (master) {
                    layers[i].layers = JSON.parse(JSON.stringify(master.layers));
                    layers[i].__master = JSON.parse(JSON.stringify(master));
                }
            }

            layers[i].__symbol_overrides = getSymbolIDOverrides(layers[i]);
            ancestors.push(layers[i]);

            if (layers[i].layers) {
                impl(layers[i].layers, ancestors);
            }

            ancestors.pop();
        }
    }

    impl(layers, []);
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
            if (
                child._class === 'symbolInstance'
            ) {
                return;
            }

            if (master && master.frame.constrainProportions) {
                let constraint = child.resizingConstraint;

                if ((ResizeConstraints.WIDTH | constraint) !== ResizeConstraints.WIDTH &&
                    (ResizeConstraints.HEIGHT | constraint) !== ResizeConstraints.HEIGHT) {
                    
                    // Auto-scale both width and height together.
                    let ratio = 1;
                    if (child.frame.width > child.frame.height) {
                        ratio = master.frame.width / child.frame.width;
                    } else {
                        ratio = master.frame.height / child.frame.height; 
                    }

                    if (ratio < 1) {
                        child.frame.__width = child.frame.width;
                        child.frame.__height = child.frame.height;
                        child.frame.__x = child.frame.x;
                        child.frame.__y = child.frame.y;

                        child.frame.width *= ratio;
                        child.frame.height *= ratio;

                        child.frame.x = (child.frame.x / master.frame.width) * child.frame.width;
                        child.frame.y = (child.frame.y / master.frame.height) * child.frame.height;
                    } 
                }
            }

            if (master && master.frame.constrainProportions === false) {
                let constraint = child.resizingConstraint;

                if (child.frame.width > master.frame.width || child.frame.height > master.frame.height) {
                    if ((ResizeConstraints.WIDTH | constraint) !== ResizeConstraints.WIDTH) {
                        let ratio = master.frame.width / child.frame.width;
                        child.frame.__width = child.frame.width;
                        child.frame.__x = child.frame.x;
                        child.frame.width *= ratio;
                        child.frame.x = (child.frame.x / master.__master.frame.width) * child.frame.width;
                    } 

                    if  ((ResizeConstraints.HEIGHT | constraint) !== ResizeConstraints.HEIGHT) {
                        let ratio = master.frame.height / child.frame.height;
                        child.frame.__height = child.frame.height;
                        child.frame.__y = child.frame.y;
                        child.frame.height *= ratio;
                        child.frame.y = (child.frame.y / master.__master.frame.height) * child.frame.height;
                    }
                }

                
            }

            // Text bound correction
            if (master && child._class === 'text') {
                if (child.glyphBounds) {
                    let glyphBounds = parseNumberSet(child.glyphBounds);
                    let x1 = glyphBounds[0];
                    let y1 = glyphBounds[1];
                    let x2 = glyphBounds[2];
                    let y2 = glyphBounds[3];

                    // TODO: Width correction
                    // if (child.frame.__x !== undefined) {
                    //     child.frame.x = (x1 / child.frame.__width) * child.frame.width;
                    //     child.frame.width = ((x2 - x1) / child.frame.__width) * child.frame.width;
                    // }
                }
            }

            // TODO: Push content to the right of text out
            // TODO: Alignment issues still.

            // if (master && child._class === 'text' && child.__overrided) {
            if (master && child._class === 'text') {
            //     let props = getFontStyle(child.attributedString.attributes[0].attributes);
            //     let font_style = `${props['font-weight']} ${props['font-size']}px ${props['font-family']}`;
            //     canvas.style.letterSpacing = props['letter-spacing'];
            //     let { width } = measureText(font_style, child.attributedString.string);

            //         // child.frame.__overrided_width = child.frame.width;
            //         // child.frame.width = 'auto';

                // Not sure why this is needed for these elements.
                if (master.resizingConstraint === 9) {
                    child.frame.x = child.frame.__x;
                }
            }
        });
    }

    let impl = layers => {
        for (let i = 0; i < layers.length; i++) {
            if (layers[i]._class === 'symbolInstance') {
                resizeLayers(layers[i].layers, layers[i]);
            }

            if (layers[i].layers) {
                impl(layers[i].layers);
            }
        }
    }

    impl(layers);
}

export default function SymbolResolver (pages, foreign) {
    current = { pages, foreign };

    pages.forEach(page => resolveSymbols(page.data.map(d => d.data)));        
    pages.forEach(page => resolveOverrides(page.data.map(d => d.data)));        
    pages.forEach(page => resolveResizes(page.data.map(d => d.data))); 
}