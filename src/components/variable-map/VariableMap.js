import { Component } from 'preact';
import Portal from 'preact-portal';
import Settings from '../../utils/Settings';
import './VariableMap.less';

export default class VariableMap extends Component {
    constructor () {
        super();

        this.state = {
            showing: false
        };

        this.toggle = this.toggle.bind(this);
        this.addMapping = this.addMapping.bind(this);
        this.removeMapping = this.removeMapping.bind(this);
        this.saveMappings = this.saveMappings.bind(this);
        this.onMappingChange = this.onMappingChange.bind(this);
    }

    toggle () {
        this.setState({
            showing: !this.state.showing,
            mappings: Settings.read('variable_map') || [{
                style: '',
                value: '',
                variable: ''
            }]
        });
    }

    addMapping () {
        this.setState({
            mappings: this.state.mappings.slice(0).concat([{
                style: '', 
                value: '', 
                variable: ''
            }])
        });
    }

    onMappingChange (e) {
        let index = parseInt(e.currentTarget.parentNode.getAttribute('data-index'));
        let name = e.currentTarget.getAttribute('data-name');
        let value = e.currentTarget.value;

        this.state.mappings[index][name] = value;
        this.forceUpdate();
    }

    removeMapping (e) {
        let index = parseInt(e.currentTarget.parentNode.getAttribute('data-index'));

        let mappings = this.state.mappings.slice(0);
        mappings.splice(index, 1);

        this.setState({
            mappings
        });
    }

    saveMappings () {
        Settings.write('variable_map', JSON.parse(JSON.stringify(this.state.mappings)));
        this.toggle();
    }

    render () {

        return (
            <div style="display: inline-block">
                <button onClick={this.toggle}>Variable Map</button>
                {this.state.showing? <Portal into="body">
                    <div class="App VariableMap">
                        <div class="VariableMap-body">
                            <div class="VariableMap-close" onClick={this.toggle}>✕</div>
                            <div class="VariableMap-list">
                                {this.state.mappings.map((mapping, index) => {
                                    return (
                                        <div class="VariableMap-listItem" data-index={index}>
                                            <span>Style:</span>
                                            <input type="text" data-name="style" value={mapping.style} onChange={this.onMappingChange}/>
                                            <span>Value:</span>
                                            <input type="text" data-name="value" value={mapping.value} onChange={this.onMappingChange}/>
                                            <span>Variable:</span>
                                            <input type="text" data-name="variable" value={mapping.variable} onChange={this.onMappingChange}/>
                                            <span onClick={this.removeMapping}>✕</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div class="VariableMap-buttons">
                                <button class="VariableMap-add" onClick={this.addMapping}>Add</button>
                                <button class="VariableMap-save" onClick={this.saveMappings}>Save</button>
                            </div>
                        </div>
                    </div>
                </Portal> : null}
            </div>
            
        );
    }

    static GetVariableMapping (style, value) {
        let mappings = Settings.read('variable_map');

        for (let i = 0; i < mappings.length; i++) {
            let mapping = mappings[i];
            if (mapping.style === style && mapping.value === value) {
                return mapping.variable;
            }
        }
    }
}