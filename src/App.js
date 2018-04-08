import { Component } from 'preact';
import InspectPanel from './components/inspect-panel/InspectPanel';
import HTMLCanvas from './components/html-canvas/HTMLCanvas';
import SelectBox from './components/select-box/SelectBox';
import JSZip from 'jszip';
import './App.less';

let { shell } = require('electron');
let fs = require('fs');
let path = require('path');

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
            loaded: false,
            loading: false,
            pages: [],
            images: [],
            selectedPage: undefined,
            selectedArtboard: undefined
        };
    }

    /**
     * Create the file input and trigger it.
     *
     * @method loadFile
     */
    loadFile () {
        let el = document.createElement('input');
        el.setAttribute('type', 'file');
        el.onchange = this.onFileLoad.bind(this);
        el.click();
    }

    /**
     * Load the file, get the json files and images.
     *
     * @method onFileLoad
     * @param {Event} e
     */
    onFileLoad (e) {
        let reader = new FileReader();

        reader.onload = async (e) => {
            let zip = await JSZip.loadAsync(e.target.result);

            let pages = [];
            let images = [];
            let metadata = JSON.parse(await zip.files['meta.json'].async('text'));

            // Parse pages and artboards
            for (let key in metadata.pagesAndArtboards) {
                let page = metadata.pagesAndArtboards[key];
                let raw = await zip.files[`pages/${key}.json`].async('text');

                pages.push({
                    label: page.name,
                    value: key,
                    raw: raw,
                    data: JSON.parse(raw),
                    artboards: Object.keys(page.artboards).map(key => {
                        return {
                            label: page.artboards[key].name,
                            value: key
                        }
                    })
                });
            }

            // Parse images
            for (let file in zip.files) {
                if (file.indexOf('images/') === 0) {
                    images.push({
                        name: file,
                        data: await zip.files[file].async('base64')
                    });
                }
            }

            function getSymbolMaster (id) {
                let impl = layers => {
                    for (let i = 0; i < layers.length; i++) {
                        if (layers[i]._class === 'symbolMaster' && layers[i].symbolID === id) {
                            return layers[i];
                        }
                        if (layers[i].layers) {
                            impl(layers[i].layers);
                        }
                    }
                }

                for (let i = 0; i < pages.length; i++) {
                    let hr = impl(pages[i].data.layers);
                    if (hr) {
                        return hr;
                    }
                }
            }

            function resolveSymbols (page) {
                let impl = layers => {
                    for (let i = 0; i < layers.length; i++) {
                        if (layers[i]._class === 'symbolInstance') {
                            let master = getSymbolMaster(layers[i].symbolID);
                            layers[i].layers = JSON.parse(JSON.stringify(master.layers));
                        }

                        if (layers[i].layers) {
                            impl(layers[i].layers);
                        }
                    }
                }

                impl(page.data.layers);

            }

            // Go through symbols and duplicate them.
            // TODO: Need to support symbol overrides.
            pages.forEach(resolveSymbols);

            // Make it accessible for Bitmap class.
            window.__page__images = images;

            this.setState({
                loaded: true,
                loading: false,
                pages,
                selectedPage: 0,
                selectedArtboard: 0
            });
        }

        this.setState({
            loaded: false,
            loading: true
        });

        reader.readAsArrayBuffer(e.target.files[0]);
    }

    /**
     * Set the selected page and reset artboard.
     *
     * @method onPageChange
     * @param {Object} selected
     */
    onPageChange (selected) {
        this.setState({
            selectedPage: this.state.pages.findIndex(p => p.value === selected.value),
            selectedArtboard: 0
        });
    }

    /**
     * Set the selected artboard.
     *
     * @method onArtboardChange
     * @param {Object} selected
     */
    onArtboardChange (selected) {
        this.setState({
            selectedArtboard: this.state.pages[this.state.selectedPage].artboards.findIndex(a => a.value === selected.value)
        });
    }

    /**
     * Tidy up the JSON, and load it in a text editor.
     *
     * @method openJSON
     */
    async openJSON () {
        let { raw, value } = this.state.pages[this.state.selectedPage];
        let json = JSON.stringify(JSON.parse(raw), null, 4);
        let uri = 'data:application/json;base64,' + Buffer.from(json).toString('base64');

        if (!fs.existsSync('__temp__')) {
            fs.mkdirSync('__temp__');
        }

        let filepath = '__temp__/' + value + '.json';
        fs.writeFileSync(filepath, json);

        shell.openItem(path.resolve(process.cwd(), filepath));        
    }

    /**
     * Render.
     *
     * @method render
     */
    render () {
        let pages = this.state.pages, activePage, activeArtboard;

        if (this.state.loaded) {
            activePage = this.state.pages[this.state.selectedPage];
            activeArtboard = activePage.artboards[this.state.selectedArtboard];
        }

        return (
            <div class="App">
                <div class="App-toolbar">
                    <button onClick={this.loadFile.bind(this)}>Load File</button>
                    {this.state.loading? <div>Loading...</div> : null}
                    {this.state.loaded? 
                        <div>
                            <span>Page: </span>
                            <SelectBox 
                                items={pages} 
                                selected={activePage.value}
                                onChange={this.onPageChange.bind(this)}
                            /> 
                            <span>Artboard: </span>
                            <SelectBox
                                items={activePage.artboards}
                                selected={activeArtboard.value}
                                onChange={this.onArtboardChange.bind(this)}
                            />
                            <button onClick={this.openJSON.bind(this)}>Open JSON</button>
                        </div>
                    : null}
                </div>
                <div class="App-body">
                    <div class="App-canvas">
                        {this.state.loaded? <HTMLCanvas data={{
                            layers:[
                                activePage.data.layers.find(l => l.do_objectID === activeArtboard.value)
                            ]
                        }} /> : null}
                    </div>
                    <div class="App-inspect">
                        <InspectPanel />
                    </div>
                </div>
            </div>
        )
    }
}