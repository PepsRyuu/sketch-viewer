let current = { };

function getSymbolMasterImpl (layers, id) {
    for (let i = 0; i < layers.length; i++) {
        if (layers[i]._class === 'symbolMaster' && layers[i].symbolID === id) {
            return layers[i];
        }
        if (layers[i].layers) {
            getSymbolMasterImpl(layers[i].layers);
        }
    }
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
    for (let key in current.foreign.foreignSymbols) {
        if (key === id) {
            return current.foreign.foreignSymbols[key];
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
                    // TODO: Normalize string layer
                    if (target_layer.attributedString) {
                        target_layer.attributedString.string = override.value;
                        if (target_layer.attributedString.attributes.length === 1) {
                            target_layer.attributedString.attributes[0].length = override.value.length;
                        }
                    }
                }

                if (override_type === 'layerStyle') {
                    target_layer.style = current.foreign.foreignLayerStyles[override.value];
                }

                if (override_type === 'textStyle') {
                    // TODO: Attributed string layer
                    target_layer.textStyle = current.foreign.foreignTextStyles[override.value];
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

                // Ensure master is found. Might not exist.
                if (master) {
                    layers[i].resizesContent = master.resizesContent;
                    layers[i].layers = JSON.parse(JSON.stringify(master.layers));
                    let masterFrame = master.frame;

                    let resizeLayers = (layer) => {
                        if (layer.layers) {
                            layer.layers.forEach(child => {
                                // TODO: Elements with padding of some sort.

                                // TODO: Master frame is wrong. not taking layer[i] into account

                                if (Math.round(child.frame.width) >= masterFrame.width) {
                                    child.frame.__width = child.frame.width;
                                    child.frame.width = layer.frame.width;
                                }

                                if (Math.round(child.frame.height >= masterFrame.height)) {
                                    child.frame.__height = child.frame.height;
                                    child.frame.height = layer.frame.height;
                                }

                                // if (Math.round(child.frame.width) >= layer.frame.width) {
                                //     child.frame.__width = child.frame.width;
                                //     child.frame.width = layer.frame.width;
                                // }

                                // if (Math.round(child.frame.height) >= layer.frame.height) {
                                //     child.frame.__height = child.frame.height;
                                //     child.frame.height = layer.frame.height;
                                // }

                                // if (child._class === 'text') {
                                //     child.frame.width = masterFrame.width;
                                //     child.frame.height = masterFrame.height;
                                // }

                                resizeLayers(child);
                            });
                        }
                    }

                    resizeLayers(layers[i]);
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

export default function SymbolResolver (pages, foreign) {

    current = { pages, foreign };

    pages.forEach(page => resolveSymbols(page.data.layers));        
    pages.forEach(page => resolveOverrides(page.data.layers));        
}