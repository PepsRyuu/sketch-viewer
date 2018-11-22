import { getDOMColor } from '../utils/index';

export default function ArtboardModel (layer) {
    return {
        'x': 0,
        'y': 0,
        'background-color': layer.hasBackgroundColor? getDOMColor(layer.backgroundColor) : 'white'
    };
}