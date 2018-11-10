import { getDOMColor, parseNumberSet } from '../utils';

function generateShapePath (layer, offset) {
    function parsePoint (point) {
        let _w = layer.frame.width;
        let _h = layer.frame.height;
        let _x = offset.x;
        let _y = offset.y;
        let parts = point.replace(/\{|\}/g, '').split(', ').map(parseFloat);
        return (parts[0] * _w + _x) + ' ' + (parts[1] * _h + _y);
    }

    let points = layer.points || layer.path.points;
    let start = parsePoint(points[0].point);
    let d = `M ${start} `;

    for (let i = 1; i < points.length; i++) {
        let curr = points[i];
        let prev = i === 0? points[points.length - 1] : points[i - 1];
        let p = parsePoint(curr.point);

        if (curr.hasCurveTo) {
            let c1 = parsePoint(prev.curveFrom);
            let c2 = parsePoint(curr.curveTo);

            d += `C ${c1}, ${c2}, ${p} `;
        } else {
            d += `L ${p} `;
        }

    }

    if (layer.isClosed || (layer.path && layer.path.isClosed)) {
        let p = parsePoint(points[0].point);

        if (points[0].hasCurveTo) {
            
            let c1 = parsePoint(points[points.length - 1].curveFrom);
            let c2 = parsePoint(points[0].curveTo);

            d += `C ${c1}, ${c2}, ${p} `;
        } else {
            d += `L ${p}`
        }

        d += 'z';
    }

    return d.replace(/-0/g, '0')
}

function generateRectangle (layer, offset) {
    let { width, height } = layer.frame;
    let x = offset.x, y = offset.y;
    let points = layer.points || layer.path.points;

    let corners = points.map(p => {
        return Math.min(Math.min(width, height) / 2, p.cornerRadius);
    });

    let d = `M  ${x + corners[0]} ${y} `
      + `h ${Math.max(0, width - corners[0] - corners[1])} `
      + `a ${corners[1]} ${corners[1]} 0 0 1 ${corners[1]} ${corners[1]} `
      + `v ${Math.max(0, height - corners[1] - corners[2])} `
      + `a ${corners[2]} ${corners[2]} 0 0 1 -${corners[2]} ${corners[2]} `
      + `h -${Math.max(0, width - corners[2] - corners[3])} `
      + `a ${corners[3]} ${corners[3]} 0 0 1 -${corners[3]} -${corners[3]} `
      + `v -${Math.max(0, height - corners[3] - corners[0])} `
      + `a ${corners[0]} ${corners[0]} 0 0 1 ${corners[0]} -${corners[0]} `
      + `z`

    return d.replace(/-0/g, '0')
           
}

function createLinearGradient (fill) {
    let id = `__gradient${gradientIndex++}`;
    let start = parseNumberSet(fill.gradient.from).map(v => v * 100);
    let end = parseNumberSet(fill.gradient.to).map(v => v * 100);

    let css = (function () {
        let angle = Math.round(Math.atan2(end[1] - start[1], end[0] - start[0]) * 180 / Math.PI);
        let stops = fill.gradient.stops.map(stop => {
            return `${getDOMColor(stop.color)} ${stop.position * 100}%`; 
        })

        return `linear-gradient(${angle}deg, ${stops.join(', ')})`;
    })();

    return {
        gradient: (
            <linearGradient 
                id={id} 
                x1={start[0] + '%'} 
                y1={start[1] + '%'} 
                x2={end[0] + '%'} 
                y2={end[1] + '%'}>
                {fill.gradient.stops.map(stop => (
                    <stop 
                        stop-color={getDOMColor(stop.color)} 
                        offset={stop.position * 100} 
                    />
                ))}
            </linearGradient>
        ),
        url: `url(#${id})`,
        css: css
    };
}

export function createShapePath (layer, offset = {x: 0, y: 0}) {
    let d = layer._class === 'rectangle'? generateRectangle(layer, offset) : generateShapePath(layer, offset);

    return d;
}