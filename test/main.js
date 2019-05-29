import './features/**/*.js';
import { h } from 'preact';

window.h = h;
window.expect = global.require('chai').expect;

if (module && module.hot) {
    module.hot.accept(() => {
        miui.reset();
        require(module.id);
        miui.run();
    });
}