import { Component } from 'preact';
import './InspectPanel.less'
import VariableMap from '../variable-map/VariableMap';

let ATTRIBUTES_TO_SHOW = ['width', 'height', 'rotation', 'opacity', 'fill', 'border', 'innerShadow', 'shadow', 'strings', 'background-color'];

function formatAttribute (key, value) {
    function outputValue (key, value) {
        if (Array.isArray(value)) {
            return (
                <div>
                    <h3>{key}</h3>
                    <section>
                        {value.map((v, i) => outputValue(i, v))}
                    </section>
                </div>
                
            );
        }

        if (typeof value === 'object') {
            return (
                <div>
                    <h3>{key}</h3>
                    <section>
                        {Object.keys(value).map(k => outputValue(k, value[k]))}
                    </section>
                </div>
            );
        }

        return (
            <div>
                <h3>{key}</h3>
                <p>{value}</p>
                {key === 'color' && <div style={`height: 5px; margin-bottom: 8px; background-color: ${value}`} />}
            </div>
        );
    }

    return outputValue(key, value);
}

export default class InspectPanel extends Component {
        
    render () {
        return (
            <div class="InspectPanel">
                {this.props.node && Object.keys(this.props.node.attributes).filter(key => ATTRIBUTES_TO_SHOW.indexOf(key) > -1).map(n => {
                    return (
                        <div class="InspectPanel-property">
                            {formatAttribute(n, this.props.node.attributes[n])}
                        </div>
                    );
                })}
            </div>
        )
    }

}