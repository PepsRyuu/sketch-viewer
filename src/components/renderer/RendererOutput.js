import { Component } from 'preact';

import BaseStyler from './BaseStyler';
import ArtboardElement from './elements/ArtboardElement';
import TextElement from './elements/TextElement';
import ShapeElement from './elements/ShapeElement';
import BitmapElement from './elements/BitmapElement';
import ShapeGroupElement from './elements/ShapeGroupElement';

const ELEMENT_MAP = {
    'artboard': ArtboardElement,
    'text': TextElement,
    'rectangle': ShapeElement,
    'oval': ShapeElement,
    'shapePath': ShapeElement,
    'bitmap': BitmapElement,
    'shapeGroup': ShapeGroupElement
};

function renderNode (node) {
    let el;

    if (ELEMENT_MAP[node._class]) {
        el = ELEMENT_MAP[node._class](node);
    } else {
        el = <div />
    }

    if (!el.attributes) {
        el.attributes = {};
    }

    if (!el.attributes.style) {
        el.attributes.style = {};
    }

    el.attributes['data-class'] = node._class;
    el.attributes['data-id'] = node.id;

    el.attributes.onClick = () => {
        this.props.onOutputClick(node);
    };

    el.attributes.onMouseEnter = () => {
        this.props.onOutputHover(node);
    };

    BaseStyler(node, el);

    if (node.children.length > 0) {
       el.children = node.children.map(n => renderNode.call(this, n)); 
    }

    return el;
}

export default class RendererOutput extends Component {
    render () {
        try {
            return (
                <div class="RendererOutput">
                    {renderNode.call(this, this.props.data)}
                </div>
            );
        } catch (e) {
            console.error(e);
            return (<div style="white-space: pre-wrap">{e.message + e.stack}</div>);
        }
       
    }
}