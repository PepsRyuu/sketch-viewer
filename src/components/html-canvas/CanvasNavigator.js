function drag (e, onMove, onEnd) {
    let start = {x: e.pageX, y: e.pageY};

    let onMouseUp = () => {
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('mouseleave', onMouseUp);
        document.removeEventListener('mousemove', onMouseMove);

        if (onEnd) {
            onEnd();
        }
        
    };

    let onMouseMove = (e) => {
        e.preventDefault();

        if (onMove) {
            onMove({
                x: e.pageX - start.x,
                y: e.pageY - start.y
            });
        }
    };

    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseUp);
    document.addEventListener('mousemove', onMouseMove);
}

/**
 * Utility class for managing panning and zooming for a canvas.
 * It tracks the values for zoom and pan, and handles
 * all of the mouse events.
 *
 * @class CanvasNavigator
 */ 
export default class CanvasNavigator {
    constructor (canvas) {
        this.zoom = 1;
        this.pan = {x: 0, y: 0};
        this.canvas = canvas.base;
    }

    /**
     * Starts panning with the mouse.
     * onMove is called each time the mouse moves.
     * onEnd is called when the user finishes panning.
     *
     * @method activatePan
     * @param {MouseEvent} e
     * @param {Function} onMove
     * @param {Function} onEnd
     */
    activatePan (e, onMove, onEnd) {
        let startPan = Object.assign({}, this.pan);

        drag(e, (delta) => {
            this.pan = {
                x: startPan.x + delta.x,
                y: startPan.y + delta.y
            };

            onMove();
        }, onEnd);
    }

    /**
     * Changes the zoom based on the provided delta.
     *
     * @method changeZoom
     * @param {Number} delta
     * @param {Function} onFinish
     * @param {Object} center
     */
    changeZoom (delta, onFinish, center) {       
        // Floating point comparing 0.6 to 0.600000001
        let newZoom = Math.max(0.6, parseFloat((this.zoom + delta).toFixed(1)));

        if (this.zoom !== newZoom) {
            let content = this.canvas.querySelector('.wrapper')
            this.zoom = newZoom;

            let dx = center.x * (content.offsetWidth * delta);
            let dy = center.y * (content.offsetHeight * delta);

            this.pan.x -= dx;
            this.pan.y -= dy;

            if (onFinish) {
                onFinish();
            }
        }
    }

    reset () {
        this.zoom = 1;
        this.pan = {x: 0, y: 0}
    }


    /**
     * Zooms into where the mouse is located.
     * onZoomChange is called if zoom level changes.
     *
     * @method activateZoom
     * @param {MouseEvent} e
     * @param {Function} onZoomChange
     */
    activateZoom (e, onZoomChange) {
        let content = this.canvas.querySelector('.wrapper');

        let delta = (e.wheelDelta > 1 ? 1 : -1) * 0.2;
        let width = content.offsetWidth * this.zoom;
        let height = content.offsetHeight * this.zoom;

        let contentRect = content.getBoundingClientRect();
        let center = {
            x: (e.pageX - contentRect.left) / width,
            y: (e.pageY - contentRect.top) / height
        }

        this.changeZoom(delta, () => {
            onZoomChange();
        }, center);
    }


    /**
     * Return zoom and pan values.
     *
     * @method getState
     * @return {Object}
     */
    getState () {
        return {
            zoom: this.zoom,
            pan: this.pan
        };
    }
}

