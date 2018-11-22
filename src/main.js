import { render, h, Component } from 'preact';
import Settings from './utils/Settings';
import App from './App';
import './main.less';

// Shorthand
window.h = h;

// Disable component recycling.
Object.defineProperty(Component.prototype, 'nextBase', {
  get() { return null; },
  set() { return; }
});

Settings.init();
render(<App />, document.getElementById('app'));
