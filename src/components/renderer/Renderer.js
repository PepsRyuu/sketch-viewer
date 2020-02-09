import { Component } from 'preact';
import Navigator from './Navigator';
import RendererOutput from './RendererOutput';
import RendererMeasurer from './RendererMeasurer';
import './Renderer.scss';

function applyParents (parent, node) {
    node.parent = parent;

    node.children.forEach(child => {
        applyParents(node, child);
    });
}

export default class Renderer extends Component {
    constructor () {
        super();

        this.state = {};
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseWheel = this.onMouseWheel.bind(this);

        this.onOutputClick = this.onOutputClick.bind(this);
        this.onOutputHover = this.onOutputHover.bind(this);
    }

    componentDidMount () {
        this.navigator = new Navigator(this.base.querySelector('.Renderer-output'));
        this.setStateFromProps(this.props);

        window.addEventListener('resize', () => this.forceUpdate());
    }

    componentWillReceiveProps (nextProps) {
        if (nextProps.data !== this.props.data) {
            this.navigator.reset();
            this.applyTransform();
            this.setStateFromProps(nextProps);
        }
    }

    shouldComponentUpdate (nextProps) {
        return !this.state.data || nextProps.data !== this.props.data;
    }

    setStateFromProps (props) {
        // TODO: Delta check for performance
        let data = JSON.parse(JSON.stringify(props.data));
        applyParents(null, data);
        this.setState({ data });
    }

    onMouseDown (e) {
        this.navigator.activatePan(e, () => {
            this.applyTransform();
        });
    }

    onMouseWheel (e) {
        this.navigator.activateZoom(e, () => {
            this.applyTransform();
        });
    }

    applyTransform () {
        let { zoom, pan } = this.navigator.getState();
        let el = this.base.querySelector('.Renderer-output');
        el.style.transform = ` translate(${pan.x}px, ${pan.y}px) scale(${zoom}, ${zoom})`        
    }

    onOutputClick (node, el) {
        this.props.onNodeClick(node, el);
    }

    onOutputHover (node, el) {
        let { zoom, pan } = this.navigator.getState();
        this.measurer.show(node, pan, zoom, el);
    }

    render () {
        return (
            <div class="Renderer" onMouseWheel={this.onMouseWheel} onMouseDown={this.onMouseDown}>
                <div class="Renderer-output">
                    {this.state.data && (
                        <RendererOutput 
                            data={this.state.data} 
                            onOutputClick={this.onOutputClick}
                            onOutputHover={this.onOutputHover}
                        /> 
                    )}
                </div>
                <div class="Renderer-measurer">
                    <RendererMeasurer ref={e => this.measurer = e}/>
                </div>
            </div>
        );
    }
}