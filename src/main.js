import { render, h, Component } from 'preact';
import App from './App';
import './main.scss';

// Shorthand
window.h = h;

// Disable component recycling.
Object.defineProperty(Component.prototype, 'nextBase', {
  get() { return null; },
  set() { return; }
});

render(<App />, document.getElementById('app'));
