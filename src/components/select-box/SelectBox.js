import { Component } from 'preact';
import DropdownInterface from 'dropdown-interface';
import 'dropdown-interface/dist/DropdownInterface.css';
import './SelectBox.less';

/**
 * Simple select box wrapping dropdown-interface.
 *
 * @class SelectBox
 * @extends Component
 */
export default class SelectBox extends Component {
    
    constructor () {
        super ();
        this.onItemSelected = this.onItemSelected.bind(this);
    }

    componentDidMount () {
        this.interface = new DropdownInterface({
            onItemSelected: this.onItemSelected,
            parent: this.base
        });

        this.applyPropsToInterface(this.props);
    }

    componentWillReceiveProps (nextProps) {
        this.applyPropsToInterface(nextProps);
    }

    onItemSelected (selected) {
        this.props.onChange(selected);
    }

    onClick (e) {
        this.interface.toggle();
    }

    onKeyDown (e) {
        this.interface.handleKeyDown(e);
    }

    applyPropsToInterface (props) {
        if (this.interface) {
            this.interface.hideList();
        }

        this.interface.setItems(props.items || []);

        if (props.selected) {
            let selectedValue = typeof props.selected === 'object'? props.selected.value : props.selected;
            this.interface.setFocusedItem(props.items.findIndex(i => i.value === selectedValue));
        }
    }

    render () {
        return (
            <div 
                class="SelectBox"
                onClick={e => this.onClick(e)}
                onKeyDown={e => this.onKeyDown(e)}
                ref={e => this.input = e}
            >
                {this.props.items.find(i => i.value === this.props.selected).label}
            </div>
        );
    }

}