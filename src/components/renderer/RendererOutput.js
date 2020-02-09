import { Component } from 'preact';

import BaseStyler from './BaseStyler';
import ArtboardElement from './elements/ArtboardElement';
import TextElement from './elements/TextElement';
import ShapeElement from './elements/ShapeElement';
import BitmapElement from './elements/BitmapElement';

const ELEMENT_MAP = {
    'artboard': ArtboardElement,
    'text': TextElement,
    'rectangle': ShapeElement,
    'oval': ShapeElement,
    'triangle': ShapeElement,
    'shapePath': ShapeElement,
    'shape': ShapeElement,
    'bitmap': BitmapElement,
    'shapeGroup': ShapeElement
};

function renderNode (props, node) {
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

    if (ELEMENT_MAP[node._class]) {
        el.attributes.onClick = e => {
            e.stopPropagation();
            props.onOutputClick(node, e.srcElement);
        };

        el.attributes.onMouseEnter = e => {
            e.stopPropagation();
            props.onOutputHover(node, e.srcElement);
        };
    }

    BaseStyler(node, el);

    if (el.nodeName !== 'svg' && node.children.length > 0) {
       el.children = node.children.map(n => renderNode(props, n)); 
    }

    return el;
}

export default function RendererOutput (props) {
    try {
        return (
            <div class="RendererOutput">
                {renderNode(props, props.data)}
            </div>
        );
    } catch (e) {
        console.error(e);
        return (<div style="white-space: pre-wrap">{e.message + e.stack}</div>);
    }
}