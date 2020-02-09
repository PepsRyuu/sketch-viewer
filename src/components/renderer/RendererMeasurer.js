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

function getBoundingClientRect (el) {
    let { x, y, width, height } = el.getBoundingClientRect();

    if (el.getAttribute('data-class') === 'text') {
        let text_bounds = [].map.call(el.querySelectorAll('span'), s => s.getBoundingClientRect());
        let last = text_bounds[text_bounds.length - 1];
        height = (last.y - y) + last.height;
        width = Math.max(...text_bounds.map(b => b.width));

        // Correction for elements with -top;
        let first = text_bounds[0];
        if (first.y < y) {
            height += (y - first.y);
            y = y - (y - first.y);
        }
    }

    y -= 56;

    return { x, y, width, height };
}

export default class RendererMeasurer extends Component {

    show (node, pan, zoom, el) {
        this.forceUpdate(); // trigger resize

        let ctx = this.canvas.getContext('2d');

        if (this.activeNode !== node) {
            this.activeNode = node;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            let { x, y, width, height } = getBoundingClientRect(el);

            let hierarchy = document.elementsFromPoint(x + width / 2, y + 56 + height / 2);
            hierarchy = [].slice.call(hierarchy, hierarchy.indexOf(el) + 1).filter(h => {
                return (
                    h.tagName === 'svg' || 
                    h.getAttribute('data-class') === 'artboard'
                );
            });

            ctx.strokeStyle = line_color;
            ctx.strokeRect(x, y, width, height);

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

            if (hierarchy.length > 0) {
                let { x: px, y: py, width: pwidth, height: pheight } = getBoundingClientRect(hierarchy[0]);

                let page_elements = Array.from(document.querySelector('[data-class="artboard"]').querySelectorAll('svg, [data-class="text"]'));
                page_elements = page_elements.map(el => getBoundingClientRect(el));

                // c ==> to check
                // p ==> parent
                // _ ==> eleent
                let closest_right = page_elements.filter(c => {
                    return c.x >= x + width && c.y <= y + height && c.y + c.height >= y && c.x + c.width < px + pwidth; 
                }).sort((a, b) => {
                    return a.x - b.x;
                })[0];

                let closest_down = page_elements.filter(c => {
                    return c.y >= y + height && c.x <= x + width && c.x + c.width >= x && c.y < py + pheight;
                }).sort((a, b) => {
                    return a.y - b.y;
                })[0];

                let closest_up = page_elements.filter(c => {
                    return c.y + c.height <= y && c.x <= x + width && c.x + c.width >= x && c.y > py;
                }).sort((a, b) => {
                    return (b.y + b.height) - (a.y + a.height);
                })[0];

                let closest_left = page_elements.filter(c => {
                    return c.x + c.width <= x && c.y <= y + height && c.y + c.height >= y && c.x > px;
                }).sort((a, b) => {
                    return (b.x + b.width) - (a.x + a.width);
                })[0];



                if (closest_up) {
                    let above = Math.round((y - closest_up.y - closest_up.height) / zoom);
                    drawLine(above, x + width / 2, y, x + width / 2, closest_up.y + closest_up.height);
                } else {
                    let above = Math.round((y - py) / zoom);
                    drawLine(above, x + width / 2, y, x + width / 2, py);
                }
                

                if (closest_right) {
                    let rightside = Math.round((closest_right.x - x - width) / zoom);
                    drawLine(rightside, x + width, y + height / 2, closest_right.x, y + height / 2);
                } else {
                    let rightside = Math.round((px + pwidth - x - width) / zoom);
                    drawLine(rightside, x + width, y + height / 2, px + pwidth, y + height / 2);
                }
                
                if (closest_left) {
                    let leftside = Math.round((x - closest_left.x - closest_left.width) / zoom);
                    drawLine(leftside, x, y + height / 2, closest_left.x + closest_left.width, y + height / 2);
                } else {
                    let leftside = Math.round((x - px) / zoom);
                    drawLine(leftside, x, y + height / 2, px, y + height / 2);
                }
                

                if (closest_down) {
                    let below = Math.round((closest_down.y - y - height) / zoom);
                    drawLine(below, x + width / 2, y + height, x + width / 2, closest_down.y);
                } else {
                    let below = Math.round((py + pheight - y - height) / zoom);
                    drawLine(below, x + width / 2, y + height, x + width / 2, py + pheight);
                }
                
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