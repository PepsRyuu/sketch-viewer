export default function ArtboardModel (node) {
    let background = 'white';
    if (node.style.fill && node.style.fill.color) {
        let c = node.style.fill.color.value;
        background = `rgb(${c.r}, ${c.g}, ${c.b})`;
    }

    return {
        'x': 0,
        'y': 0,
        'width': node.artboard.width,
        'height': node.artboard.height,
        'background-color': background
    };
}