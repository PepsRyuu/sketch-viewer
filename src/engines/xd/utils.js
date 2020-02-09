export function getDOMColor (color) {
    let c = color.value;
    let a = color.alpha !== undefined? color.alpha : 1;
    return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`
}