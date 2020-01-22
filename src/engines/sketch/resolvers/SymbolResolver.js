import { TextWeights, ResizeConstraints, ResizeConstraintsMask } from '../Constants';
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

function checkBitmask (value, mask) {
    return (value & mask) === 0;
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
            let target_layer = undefined;
            let search_layer = layer;
            let id_path_index = 0;

            for (let i = 0; i < id_path_parts.length; i++) {
                let found = findTargetLayer(search_layer, id_path_parts[i]);
                if (found) {
                    search_layer = found;
                    if (i === id_path_parts.length - 1) {
                        target_layer = found;
                    }
                }
            }

            if (target_layer) {
                if (override_type === 'stringValue' && !target_layer.__overrided_text) {
                    if (target_layer.attributedString) {
                        target_layer.attributedString.string = override.value;
                        if (target_layer.attributedString.attributes.length === 1) {
                            target_layer.attributedString.attributes[0].length = override.value.length;
                        }
                        target_layer.__overrided_text = true;
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

                if (override_type === 'image') {
                    let fill = target_layer.style.fills.find(f => f.fillType === 4);
                    if (fill) {
                        fill.image._ref = override.value._ref;
                    }
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
                    layers[i].resizesContent = master.resizesContent;
                    layers[i].groupLayout = master.groupLayout;
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

    let groupResizeLayers = (layers, parent) => {
        layers.forEach(child => {
            if (child.frame.__width === undefined) {
                child.frame.__width = child.frame.width;
                child.frame.__height = child.frame.height;
                child.frame.__x = child.frame.x;
                child.frame.__y = child.frame.y;
            }

            let constraint = child.resizingConstraint;

            if (!checkBitmask(constraint, ResizeConstraintsMask.WIDTH)) {
                child.frame.width = Math.round(child.frame.width / parent.frame.__width * parent.frame.width);
            }
            
            if (!checkBitmask(constraint, ResizeConstraintsMask.HEIGHT)) {
                child.frame.height = Math.round(child.frame.height / parent.frame.__height * parent.frame.height);
            }
            
            if (!checkBitmask(constraint, ResizeConstraintsMask.LEFT)) {
                child.frame.x = Math.round(child.frame.x / parent.frame.__width * parent.frame.width);
            }
            
            if (!checkBitmask(constraint, ResizeConstraintsMask.TOP)) {
                child.frame.y = Math.round(child.frame.y / parent.frame.__height * parent.frame.height);
            }
            
            if (child._class !== 'symbolInstance') {
                groupResizeLayers(child.layers || [], child);
            }
        });
    }

    let resizeLayers = (layers, symbolInstance) => {
        layers.forEach(child => {
            if (symbolInstance) {
                let master = symbolInstance.__master;
                if (child.frame.__width === undefined) {
                    child.frame.__width = child.frame.width;
                    child.frame.__height = child.frame.height;
                    child.frame.__x = child.frame.x;
                    child.frame.__y = child.frame.y;
                }

                let constraint = child.resizingConstraint;

                if (!checkBitmask(constraint, ResizeConstraintsMask.WIDTH)) {
                    child.frame.width = Math.round(child.frame.width / master.frame.width * symbolInstance.frame.width);
                }
                
                if (!checkBitmask(constraint, ResizeConstraintsMask.HEIGHT)) {
                    child.frame.height = Math.round(child.frame.height / master.frame.height * symbolInstance.frame.height);
                    if (child.glyphBounds) {
                        let bounds = parseNumberSet(child.glyphBounds);
                        bounds[3] = Math.round(bounds[3] / master.frame.height * symbolInstance.frame.height);
                        child.glyphBounds = `{{${bounds[0]}, ${bounds[1]}}, {${bounds[2]}, ${bounds[3]}}}`;
                    }
                }
                
                if (!checkBitmask(constraint, ResizeConstraintsMask.LEFT)) {
                    child.frame.x = Math.round(child.frame.x / master.frame.width * symbolInstance.frame.width);
                }
                
                if (!checkBitmask(constraint, ResizeConstraintsMask.TOP)) {
                    child.frame.y = Math.round(child.frame.y / master.frame.height * symbolInstance.frame.height);

                    if (child.glyphBounds) {
                        let bounds = parseNumberSet(child.glyphBounds);
                        bounds[1] = Math.round(bounds[1] / master.frame.height * symbolInstance.frame.height);
                        child.glyphBounds = `{{${bounds[0]}, ${bounds[1]}}, {${bounds[2]}, ${bounds[3]}}}`;
                    }
                }

                if (child._class !== 'symbolInstance') {
                    groupResizeLayers(child.layers || [], child);
                }
                
                return;
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