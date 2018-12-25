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

function findClosestNode (node, fn, defaulter) {
    let closest;
    let targets = [].concat(node.parent.children).concat([node.parent]);

    targets.forEach(target => {
        if (fn(node.attributes, target.attributes, (closest? closest.attributes : null))) {
            closest = target;
        }
    });

    if (closest) {
        return { id: closest.id, parent: closest.parent, attributes: fn(node.attributes, closest.attributes) };
    }

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

            if (node === null || node.parent === null) {
                return;
            }

            let nodeToMeasure = node;
            while (nodeToMeasure !== null) {
                if (nodeToMeasure.attributes.x === 0 && nodeToMeasure.attributes.y === 0) {
                    nodeToMeasure = nodeToMeasure.parent;
                } else {
                    break;
                }
            }

            if (nodeToMeasure === null) {
                return;
            }

            let closestLeft = findClosestNode(nodeToMeasure, (n, t, c) => {
                let result;
                if (n.y + n.height / 2 >= t.y && n.y + n.height / 2 <= t.y + t.height) {
                    if (t.x + t.width < n.x) {
                        result = { x: t.x + t.width, y: t.y, height: t.height, width: 0};
                    }

                    if (n.x > t.x && n.x < t.x + t.width) {
                        result = { x: t.x, y: t.y, height: t.height, width: 0 };
                    }   
                }

                if (!c || (result && result.x > c.x + c.width)) {
                    return result;
                }
            });

            let closestRight = findClosestNode(nodeToMeasure, (n, t, c) => {
                let result;
                if (n.y + n.height / 2 >= t.y && n.y + n.height / 2 <= t.y + t.height) {
                    if (t.x > n.x + n.width) {
                        result = { x: t.x, y: t.y, height: t.height, width: 0};
                    }

                    if (n.x + n.width > t.x && n.x + n.width < t.x + t.width) {
                        result = { x: t.x + t.width, y: t.y, height: t.height, width: 0 };
                    }   

                    if (n.x >= t.x && n.x + n.width <= t.x + t.width) {
                        result = { x: t.x + t.width, y: t.y, height: t.height, width: 0 };
                    }
                }

                if (!c || (result && result.x < c.x)) {
                    return result;
                }
            });

            let closestUp = findClosestNode(nodeToMeasure, (n, t, c) => {
                let result;
                if (n.x + n.width / 2 >= t.x && n.x + n.width / 2 <= t.x + t.width) {
                    if (t.y + t.height < n.y) {
                        result = { x: t.x, y: t.y + t.height, height: 0, width: t.width };
                    }

                    if (n.y > t.y && n.y < t.y + t.height) {
                        result = { x: t.x, y: t.y, height: 0, width: t.width };
                    }
                }

                if (!c || (result && result.y > c.y + c.height)) {
                    return result;
                }
            });

            let closestDown = findClosestNode(nodeToMeasure, (n, t, c) => {
                let result;
                if (n.x + n.width / 2 >= t.x && n.x + n.width / 2 <= t.x + t.width) {
                    if (t.y > n.y + n.height) {
                        result = { x: t.x, y: t.y, height: 0, width: t.width};
                    }

                    if (n.y + n.height > t.y && n.y + n.height < t.y + t.height) {
                        result = { x: t.x, y: t.y + t.height, height: 0, width: t.width };
                    }   

                    if (n.y >= t.y && n.y + n.height <= t.y + t.height) {
                        result = { x: t.x, y: t.y + t.height, height: 0, width: t.width };
                    }
                }

                if (!c || (result && result.y < c.y)) {
                    return result;
                }
            });

            let drawLine = (text, x1, y1, x2, y2) => {
                ctx.strokeStyle = line_color;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();

                ctx.fillStyle = 'black';
                let measurement = ctx.measureText(text);
                let centerX = x1 + (x2 - x1) / 2;
                let centerY = y1 + (y2 - y1) / 2;
                ctx.fillRect(centerX - 5, centerY - 18, measurement.width + 10, 22);
                ctx.fillStyle = 'white';
                ctx.fillText(text, centerX, centerY);
            };

            if (closestLeft) {
                let left_pos = getNodePosition(closestLeft, pan, zoom);
                let left_size = getNodeSize(closestLeft, pan, zoom);
                let x1 = left_pos.x;
                let x2 = position.x;
                let y1 = position.y + size.height / 2;
                let y2 = position.y + size.height / 2;
                drawLine(nodeToMeasure.attributes.x - closestLeft.attributes.x, x1, y1, x2, y2);
            }

            if (closestRight) {
                let right_pos = getNodePosition(closestRight, pan, zoom);
                let right_size = getNodeSize(closestRight, pan, zoom);
                let x1 = right_pos.x;
                let x2 = position.x + size.width;
                let y1 = position.y + size.height / 2;
                let y2 = position.y + size.height / 2;
                drawLine(closestRight.attributes.x - nodeToMeasure.attributes.x - nodeToMeasure.attributes.width, x1, y1, x2, y2);
            }

            if (closestUp) {
                let up_pos = getNodePosition(closestUp, pan, zoom);
                let up_size = getNodeSize(closestUp, pan, zoom);
                let x1 = position.x + size.width / 2;
                let x2 = position.x + size.width / 2;
                let y1 = up_pos.y;
                let y2 = position.y;
                drawLine(nodeToMeasure.attributes.y - closestUp.attributes.y, x1, y1, x2, y2);
            }

            if (closestDown) {
                let down_pos = getNodePosition(closestDown, pan, zoom);
                let down_size = getNodeSize(closestDown, pan, zoom);
                let x1 = position.x + size.width / 2;
                let x2 = position.x + size.width / 2;
                let y1 = down_pos.y;
                let y2 = position.y + size.height;
                drawLine(closestDown.attributes.y - nodeToMeasure.attributes.y - nodeToMeasure.attributes.height, x1, y1, x2, y2);
            }

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