import './features/**/*.js';
import { h } from 'preact';

window.h = h;
window.expect = global.require('chai').expect;