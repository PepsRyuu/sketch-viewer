export default function ArtboardElement (node) {
    return (
        <div
            style={{
                position: 'relative',
                backgroundColor: node.attributes['background-color'],
                overflow: 'hidden'
            }}
        />
    );
}