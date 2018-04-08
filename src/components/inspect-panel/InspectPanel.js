import { Component } from 'preact';
import './InspectPanel.less'
import EventBus from '../../EventBus';

export default class InspectPanel extends Component {
        
    constructor () {
        super ();

        this.state = {
            properties: []
        }
    }

    componentDidMount () {
        EventBus.subscribe('inspect-element', this.onInspectElement.bind(this));
    }

    onInspectElement ({ element, layer}) {
        let properties = [];

        if (layer.frame) {
            properties.push({title: 'width', value: layer.frame.width});
            properties.push({title: 'height', value: layer.frame.height});
        }

        Object.keys(layer.__resolved).forEach(type => {
            let obj = layer.__resolved[type];

            for (let key in obj) {
                let value = obj[key];
                if (value !== undefined && value !== '') {
                    let property = {
                        title: key,
                        value: value
                    };

                    if (value.toString().indexOf('linear-gradient') === 0 || value.toString().indexOf('rgba(') === 0) {
                        property.extra = <div style={`height: 10px; background: ${value};`}/>
                    }

                    properties.push(property);
                }
            }
        });

        this.setState({ properties });
    }

    render () {
        return (
            <div class="InspectPanel">
                {this.state.properties.map(property => (
                    <div class="InspectPanel-property">
                        <h3>{property.title}</h3>
                        <p>{property.value}</p>
                        {property.extra || null}
                    </div>
                ))}
            </div>
        )
    }

}