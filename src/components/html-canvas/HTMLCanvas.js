import { Component, render } from 'preact';
import EventBus from '../../EventBus';
import CanvasNavigator from './CanvasNavigator';
import ElementArtboard from './elements/Artboard';
import ElementGroup from './elements/Group';
import ElementShapeGroup from './elements/ShapeGroup';
import ElementBitmap from './elements/Bitmap';
import ElementText from './elements/Text';
import ElementSymbolInstance from './elements/SymbolInstance';
import { applyTransforms, applyClipMasks, applyOpacity, applyShadows } from './utils';

const ELEMENTS = {
    'artboard': ElementArtboard,
    'shapeGroup': ElementShapeGroup,
    'group': ElementGroup,
    'text': ElementText,
    'bitmap': ElementBitmap,
    'symbolInstance': ElementSymbolInstance
};

export default class HTMLCanvas extends Component {
    
    constructor () {
        super ();
    }

    onMouseDown (e) {
        this.navigator.activatePan(e, () => {
            this.applyTransform();
            this.highlightElement(e);
        });
    }

    componentDidMount () {
        this.navigator = new CanvasNavigator(this);
        this.forceUpdate();

        window.addEventListener('resize', () => {
            this.forceUpdate();
        });
    }

    componentWillReceiveProps() {
        this.navigator.reset();
        this.applyTransform();
    }

    onMouseWheel (e) {
        this.navigator.activateZoom(e, () => {
            this.applyTransform();
            this.highlightElement(e);
        });
    }

    applyTransform () {
        let { zoom, pan } = this.navigator.getState();
        let el = this.base.querySelector('.wrapper');
        el.style.transformOrigin = 'top left';
        el.style.transform = ` translate(${pan.x}px, ${pan.y}px) scale(${zoom}, ${zoom})`        
    }

    highlightElement (e, el, layer) {
        let overlay_color = '#EE7600';
        let ctx = this.canvas.getContext('2d');
        let canvasRect = this.canvas.getBoundingClientRect();
        ctx.strokeStyle = overlay_color;
        ctx.fillStyle = overlay_color;
        ctx.font = '12px Arial';

        if (this.highlightX !== e.pageX || this.highlightY !== e.pageY) {
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.highlightX = e.pageX;
            this.highlightY = e.pageY;
        }

        if (el) {
            let bounds = el.getBoundingClientRect();
            ctx.strokeRect(bounds.left, bounds.top - canvasRect.top, bounds.width, bounds.height);

            let activeLayer = layer;
            while (activeLayer !== undefined) {
                if (activeLayer.frame.x === 0 && activeLayer.frame.y === 0) {
                    activeLayer = activeLayer.parent;
                } else {
                    break;
                }
            }

            if (activeLayer && activeLayer.parent) {

                let drawLine = (text, x1, y1, x2, y2) => {
                    ctx.fillStyle = overlay_color;
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

                // Top line
                let t = activeLayer.frame.y;
                let ts = t * this.navigator.getState().zoom;
                let tx1 = bounds.left + bounds.width / 2;
                let ty1 = bounds.top - canvasRect.top - ts;
                let tx2 = tx1;
                let ty2 = bounds.top - canvasRect.top;
                drawLine(t, tx1, ty1, tx2, ty2);

                // Bottom line
                let b = (activeLayer.parent.frame.height - activeLayer.frame.y - activeLayer.frame.height);
                let bs = b * this.navigator.getState().zoom;
                let bx1 = bounds.left + bounds.width / 2;
                let by1 = bounds.top + bounds.height - canvasRect.top;
                let bx2 = bx1;
                let by2 = by1 + bs;
                drawLine(b, bx1, by1, bx2, by2);

                // Right line
                let r = activeLayer.parent.frame.width - activeLayer.frame.x - activeLayer.frame.width;
                let rs = r * this.navigator.getState().zoom;
                let rx1 = bounds.left + bounds.width;
                let ry1 = bounds.top - canvasRect.top + bounds.height / 2;
                let rx2 = rx1 + rs;
                let ry2 = ry1;
                drawLine(r, rx1, ry1, rx2, ry2);

                // Left line
                let l = activeLayer.frame.x;
                let ls = l * this.navigator.getState().zoom;
                let lx1 = bounds.left - ls;
                let ly1 = bounds.top - canvasRect.top + bounds.height / 2;
                let lx2 = bounds.left;
                let ly2 = ly1;
                drawLine(l, lx1, ly1, lx2, ly2);
            }
        }
    }

    render () {
        function renderLayers (layers, parent) {
            return layers.map(layer => {
                let el;

                layer.parent = parent;
                layer.__resolved = {};

                if (ELEMENTS[layer._class]) {
                    let fn = ELEMENTS[layer._class];
                    el = fn({ layer });
                }

                if (!el) {
                    el = <div />
                }

                if (!el.attributes) {
                    el.attributes = {};
                }

                layer.__element = el;

                applyOpacity(el, layer);
                applyTransforms(el, layer);
                applyClipMasks(el, layer);
                applyShadows(el, layer);

                el.attributes.class = layer._class;
                el.attributes['data-id'] = layer.do_objectID;

                el.attributes.onMouseMove = (e) => {
                    this.highlightElement(e, e.currentTarget, layer);
                }

                el.attributes.onClick = (e) => {
                    e.stopPropagation();
                    EventBus.publish('inspect-element', {element: e.currentTarget, layer: layer});
                }

                if (el && layer._class !== 'shapeGroup' && layer.layers) {
                    el.children = el.children || [];
                    el.children = el.children.concat(renderLayers.call(this, layer.layers, layer));
                }

                return el;
            });
        }

        let width = this.base? this.base.offsetWidth : 0;
        let height = this.base? this.base.offsetHeight : 0;

        return (
            <div 
                class="Canvas" 
                style="width: 100%; height: 100%; overflow: hidden; position: relative" 
                onMouseWheel={this.onMouseWheel.bind(this)} 
                onMouseDown={this.onMouseDown.bind(this)}
            >  
                <div class="wrapper">
                    {renderLayers.call(this, this.props.data.layers)}
                </div>
                <canvas ref={e => this.canvas = e} width={width} height={height} style="width: 100%; height: 100%; position: absolute; top: 0; left: 0; pointer-events: none" />
            </div>
        )
    }

}