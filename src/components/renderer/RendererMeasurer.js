import { Component } from 'preact';

const style = {
    'width': '100%',
    'height': '100%',
    'position': 'absolute',
    'top': '0',
    'left': '0',
    'pointer-events': 'none'
};

const line_color = '#EE7600';
const font_style = '12px Arial';

function getNodePosition (node, pan, zoom) {
    let x = 0, y = 0;

    let impl = node => {
        x += node.attributes.x * zoom;
        y += node.attributes.y * zoom;

        if (node.parent) {
            impl(node.parent);
        }
    }

    impl(node);

    x += pan.x;
    y += pan.y;

    return { x, y };
}

function getNodeSize (node, pan, zoom) {
    return {
        width: node.attributes.width * zoom,
        height: node.attributes.height * zoom
    };
}

function findClosestNode (node, fn) {
    // TODO: Could be multiple children, find the closest one
    let closest;

    if (!node.parent) {
        return null;
    }

    node.parent.children.forEach(child => {
        if (fn(node.attributes, child.attributes)) {
            if (!closest || fn(child.attributes, closest.attributes)) {
                closest = child;
            }
        }
    });

    return closest;
}

export default class RendererMeasurer extends Component {

    show (node, pan, zoom) {
        this.forceUpdate(); // trigger resize

        let ctx = this.canvas.getContext('2d');

        if (this.activeNode !== node) {
            this.activeNode = node;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            let position = getNodePosition(node, pan, zoom);
            let size = getNodeSize(node, pan, zoom);
            ctx.strokeStyle = line_color;
            ctx.strokeRect(position.x, position.y, size.width, size.height);

            // TODO: Need to find closest boundaries
            // could be on the same level, could be a different level.
            let closestLeft = findClosestNode(node, (n, t) => t.x + t.width < n.x);
            // console.log(closestLeft);

        }
    }

    render () {
        let width = this.base? this.base.offsetWidth : 0;
        let height = this.base? this.base.offsetHeight : 0;

        return (
            <canvas 
                class="RendererMeasurer" 
                ref={e => this.canvas = e}
                width={width}
                height={height}
                style={style}
            />
        );
    }
}