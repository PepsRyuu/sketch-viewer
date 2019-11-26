import BaseModel from '../models/BaseModel';
import ArtboardModel from '../models/ArtboardModel';
import TextModel from '../models/TextModel';
import ShapeModel from '../models/ShapeModel';
import BitmapModel from '../models/BitmapModel';
import ShapeGroupModel from '../models/ShapeGroupModel';

const CLASS_MODELS = {
    'artboard': ArtboardModel,
    'text': TextModel,
    'rectangle': ShapeModel,
    'oval': ShapeModel,
    'triangle': ShapeModel,
    'shapePath': ShapeModel,
    'bitmap': BitmapModel,
    'shapeGroup': ShapeGroupModel
};

function layerToModel (output, parent, layer, ancestors) {
    let model = CLASS_MODELS[layer._class] || (() => ({}));
    output.id = layer.do_objectID;
    output._class = layer._class;

    output.attributes = {
        ...BaseModel(layer, parent, ancestors),
        ...model(layer, parent, ancestors)
    };

    if (layer.layers) {
        ancestors.push(output);

        // Would use map normally, but children needs to be updated
        // so that stuff like clip-path can be calculated properly
        for (let i = 0; i < layer.layers.length; i++) {
            let child = layer.layers[i];
            output.children.push(layerToModel(createNode(), output, child, ancestors));
        }

        ancestors.pop();
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
    layerToModel(output, null, layer, []);
    return output;
}