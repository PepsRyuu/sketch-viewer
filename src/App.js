import { Component } from 'preact';
import InspectPanel from './components/inspect-panel/InspectPanel';
import SelectBox from './components/select-box/SelectBox';
import FileResolver from './resolvers/FileResolver';
import ArtboardResolver from './resolvers/ArtboardResolver';
import { OpenJSON } from './utils/index';
import Renderer from './components/renderer/Renderer';
import './App.scss';

// Stops input field from sometimes not firing onchange
let file_input;

/**
 * Main app class.
 *
 * @class App
 * @extends Component
 */
export default class App extends Component {
    constructor () {
        super();

        this.state = {
            loading: false,
            selectedPage: undefined,
            selectedArtboard: undefined
        };

        this.onNodeClick = this.onNodeClick.bind(this);
    }

    /**
     * Create the file input and trigger it.
     *
     * @method loadFile
     */
    loadFile () {
        file_input = document.createElement('input');
        file_input.setAttribute('type', 'file');
        file_input.onchange = this.onFileLoad.bind(this);
        file_input.click();
    }

    /**
     * Load the file, get the json files and images.
     *
     * @method onFileLoad
     * @param {Event} e
     */
    onFileLoad (e) {
        let input = e.target.files[0];

        this.setState({ 
            loading: true,
            file: undefined, 
            resolvedArtboard: undefined,
            selectedPage: undefined,
            selectedArtboard: undefined
        });

        FileResolver(input).then(file => {
            this.state.file = file;
            this.state.loading = false;
            window.__page__images = file.images;

            this.setUpdatedPageAndArtboard(0, 0);

        });
    }

    /**
     * Set the selected page and reset artboard.
     *
     * @method onPageChange
     * @param {Object} selected
     */
    onPageChange (selected) {
        let { pages } = this.state.file;
        let pageIndex = pages.findIndex(p => p.id === selected.value);
        let artboardIndex = 0;
        
        this.setUpdatedPageAndArtboard(pageIndex, artboardIndex);
    }

    /**
     * Set the selected artboard.
     *
     * @method onArtboardChange
     * @param {Object} selected
     */
    onArtboardChange (selected) {
        let { pages } = this.state.file;
        let pageIndex = this.state.selectedPage;
        let artboardIndex = pages[pageIndex].artboards.findIndex(a => a.id === selected.value);

        this.setUpdatedPageAndArtboard(pageIndex, artboardIndex);
    } 

    setUpdatedPageAndArtboard (pageIndex, artboardIndex) {
        if (this.state.selectedPage !== pageIndex || this.state.selectedArtboard !== artboardIndex) {
            let artboardId = this.state.file.pages[pageIndex].artboards[artboardIndex].id;
            let artboardData = this.state.file.pages[pageIndex].data.layers.find(l => l.do_objectID === artboardId)

            this.setState({
                selectedPage: pageIndex,
                selectedArtboard: artboardIndex,
                resolvedArtboard: ArtboardResolver(artboardData)
            });
        }
    }

    onNodeClick (node) {
        this.setState({
            clickedNode: node
        });
    }

    /**
     * Render.
     *
     * @method render
     */
    render () {
        let pages, artboards, activePage, activeArtboard;

        if (this.state.file) {
            let { file, selectedPage, selectedArtboard } = this.state;

            pages = file.pages.map(p => ({label: p.name, value: p.id }));
            artboards = file.pages[selectedPage].artboards.map(a => ({ label: a.name, value: a.id }));

            activePage = file.pages[selectedPage];
            activeArtboard = file.pages[selectedPage].artboards[selectedArtboard];
        }

        return (
            <div class="App">
                <div class="App-toolbar">
                    <button onClick={this.loadFile.bind(this)}>Load File</button>
                    {this.state.loading && <div>Loading...</div>}
                    {!this.state.loading && this.state.file && (
                        <div>
                            <SelectBox 
                                items={pages} 
                                selected={activePage.id}
                                onChange={this.onPageChange.bind(this)}
                            /> 
                            <SelectBox
                                items={artboards}
                                selected={activeArtboard.id}
                                onChange={this.onArtboardChange.bind(this)}
                            />
                            <button onClick={() => OpenJSON(this.state.file.pages[this.state.selectedPage])}>Open JSON</button>
                        </div>
                    )}
                </div>
                <div class="App-body">
                    <div class="App-canvas">
                        {this.state.resolvedArtboard && (
                            <Renderer data={this.state.resolvedArtboard} onNodeClick={this.onNodeClick}/>
                        )}
                    </div>
                    <div class="App-inspect scrollbar">
                        <InspectPanel node={this.state.clickedNode}/>
                    </div>
                </div>
            </div>
        )
    }
}