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
    function findTargetLayer (layers, id) {
        for (let i = 0; i < layers.length; i++) {
            if (layers[i].do_objectID === id) {
                return layers[i];
            }

            if (layers[i].layers) {
                let hr = findTargetLayer(layers[i].layers, id);
                if (hr) {
                    return hr;
                }
            }
        }
    }

    if (layer.overrideValues) {
        layer.overrideValues.forEach(override => {
            let [id_path, override_type] = override.overrideName.split('_');
            let id_path_parts = id_path.split('/');

            id_path_parts.forEach(id => {
                let target_layer = findTargetLayer(layer.layers, id);

                if (target_layer) {
                    if (override_type === 'stringValue') {
                        // TODO: Normalize string layer
                        if (target_layer.attributedString) {
                            target_layer.attributedString.string = override.value;
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
        });
    }

    // Constrain frames.
    layer.layers.forEach(child => {
        if (child.frame.width > layer.frame.width) {
            child.frame.width = layer.frame.width;
        }

        if (child.frame.height > layer.frame.height) {
            child.frame.height = layer.frame.height;
        }
    })
}

function resolveSymbols (layers) {
    let impl = layers => {
        for (let i = 0; i < layers.length; i++) {
            if (layers[i]._class === 'symbolInstance') {
                let master = getSymbolMaster(layers[i].symbolID);

                // Ensure master is found. Might not exist.
                if (master) {
                    layers[i].layers = JSON.parse(JSON.stringify(master.layers));
                    applyOverrides(layers[i]);
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