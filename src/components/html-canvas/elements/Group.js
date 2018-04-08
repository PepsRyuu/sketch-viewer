/**
 * Sketch Class Group.
 *
 * @method ElementGroup
 */ 
export default function ElementGroup ({ layer }) {
    let width, height;

    if (layer.frame.constrainProportions) {
        width = layer.parent.frame.width + 'px';
        height = layer.parent.frame.height + 'px';
    } else {
        width = layer.frame.width + 'px';
        height = layer.frame.height + 'px';
    }

    return (
        <div style={{ 
            width,
            height
        }} />
    );
}