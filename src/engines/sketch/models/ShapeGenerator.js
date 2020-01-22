import { parseNumberSet } from '../utils';

function generateShapePath (path, width, height, offset) {
    function parsePoint (point) {
        let _w = width;
        let _h = height;
        let _x = offset.x;
        let _y = offset.y;
        return (point[0] * _w + _x) + ' ' + (point[1] * _h + _y);
    }

    let points = JSON.parse(JSON.stringify(path.points));

    points.forEach((p, i) => {
        if (p.hasCurveTo) {
            let next = i === points.length - 1? 0 : i + 1;
            points[next].hasCurveFrom = true;
        }
    });


    let start = parsePoint(points[0].point);
    let d = `M ${start} `;

    for (let i = 1; i < points.length; i++) {
        let curr = points[i];
        let prev = i === 0? points[points.length - 1] : points[i - 1];
        let p = parsePoint(curr.point);

        if (curr.hasCurveFrom || curr.hasCurveTo) {
            let c1 = parsePoint(prev.curveFrom);
            let c2 = parsePoint(curr.curveTo);

            d += `C ${c1}, ${c2}, ${p} `;
        } else {
            d += `L ${p} `;
        }

    }

    if (path.closed) {
        let p = parsePoint(points[0].point);

        if (points[0].hasCurveFrom || points[0].hasCurveTo) {
            
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

function generateRectangle (path, width, height, offset) {
    let x = offset.x, y = offset.y;
    let points = path.points;

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

export function getShapePath (layer,  offset = {x: 0, y: 0}) {
    let pathObj = {
        closed: layer.isClosed || (layer.path && layer.path.isClosed),
        points: (layer.points || (layer.path && layer.path.points)).map(p => {
            return {
                cornerRadius: p.cornerRadius,
                curveFrom: p.curveFrom && parseNumberSet(p.curveFrom),
                curveMode: p.curveMode,
                curveTo: p.curveTo && parseNumberSet(p.curveTo),
                hasCurveFrom: p.hasCurveFrom,
                hasCurveTo: p.hasCurveTo,
                point: p.point && parseNumberSet(p.point)
            };
        })
    };

    if (layer._class === 'rectangle' && pathObj.points.length === 4) {
        return generateRectangle(pathObj, layer.frame.width, layer.frame.height, offset);
    } else {
        return generateShapePath(pathObj, layer.frame.width, layer.frame.height, offset);
    }
}
