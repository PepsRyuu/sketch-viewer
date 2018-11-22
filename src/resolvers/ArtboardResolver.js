// import TextModel from '../models/TextModel';
// import ShapeModel from '../models/ShapeModel';
// import ShapeGroupModel from '../models/ShapeGroupModel';
import BaseModel from '../models/BaseModel';
import ArtboardModel from '../models/ArtboardModel';
import TextModel from '../models/TextModel';
import ShapeModel from '../models/ShapeModel';

const CLASS_MODELS = {
    'artboard': ArtboardModel,
    'text': TextModel,
    'rectangle': ShapeModel,
    'oval': ShapeModel,
    'shapePath': ShapeModel
};

function layerToModel (output, parent, layer) {
    let model = CLASS_MODELS[layer._class] || (() => ({}));

    output.id = layer.do_objectID;
    output._class = layer._class;

    output.attributes = {
        ...BaseModel(layer),
        ...model(layer)
    };

    if (layer.layers) {
        output.children = layer.layers.map(l => {
            return layerToModel(createNode(), output, l);
        });
    }

    return output;
}

function createNode () {
    return {
        attributes: {},
        children: []
    };
}

export default function ArtboardResolver (layer) {
    let output = createNode();
    layerToModel(output, null, layer);
    return output;
}