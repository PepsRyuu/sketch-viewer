/**
 * Sketch SymbolInstance class.
 *
 * @method ElementSymbolInstance
 */
export default function ElementSymbolInstance ({ layer }) {
    return (
        <div style={{ 
            width: layer.frame.width + 'px',
            height: layer.frame.height + 'px'
        }} />
    );
}