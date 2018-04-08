import { getDOMColor } from '../utils';

/**
 * Sketch Class Artboard.
 *
 * @method ElementArtboard
 */ 
export default function ElementArtboard ({ layer }) {
    let backgroundColor = layer.hasBackgroundColor? getDOMColor(layer.backgroundColor) : 'white';

    layer.frame.x = 0;
    layer.frame.y = 0;

    return (
        <div style={{ 
            position: 'relative',
            backgroundColor, 
            marginRight: '30px', 
            marginBottom: '30px',
            width: layer.frame.width + 'px',
            height: layer.frame.height + 'px',
            overflow: 'hidden'
        }} />
    );
}