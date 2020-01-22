import ArtboardModel from '../models/ArtboardModel';
import BaseModel from '../models/BaseModel';
import TextModel from '../models/TextModel';
import ShapeModel from '../models/ShapeModel';

const CLASS_MODELS = {
    'artboard': ArtboardModel,
    'text': TextModel,
    'shape': ShapeModel,
    // 'rectangle': ShapeModel,
    // 'oval': ShapeModel,
    // 'triangle': ShapeModel,
    // 'shapePath': ShapeModel,
    // 'bitmap': BitmapModel,
    // 'shapeGroup': ShapeGroupModel
};

function layerToModel (output, parent, node) {
    let model = CLASS_MODELS[node.type] || (() => ({}));

    output.id = node.id;
    output._class = CLASS_MODELS[node.type]? node.type : 'unknown-' + node.type;

    output.attributes = {
        ...BaseModel(node, parent),
        ...model(node, parent)
    };

    if (node[node.type].children) {
        for (let i = 0; i < node[node.type].children.length; i++) {
            let child = node[node.type].children[i];
            output.children.push(layerToModel(createNode(), output, child));
        }
    }

    return output;
}

function createNode () {
    return {
        attributes: {},
        children: []
    };
}

export default function ArtboardResolver (data) {
    data = JSON.parse(JSON.stringify(data));
    let output = createNode();

    if (data.children[0] && data.children[0].type === 'artboard') {
        let artboard = data.children[0].artboard;
        if (artboard.ref) {
            data.children[0].artboard = {
                ...(data.artboards[artboard.ref]),
                ...artboard
            }

            artboard.children.forEach(c => {
                if (c.transform) {
                    c.transform.tx -= data.children[0].artboard.x;
                    c.transform.ty -= data.children[0].artboard.y;
                }
            })
        }

        layerToModel(output, null, data.children[0]);
    }

    return output;
}