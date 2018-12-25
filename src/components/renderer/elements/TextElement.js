export default function TextElement (node) {
    return (
        <div style={{
            'line-height': node.attributes.strings[0].attributes['line-height'],
            'text-align': node.attributes.strings[0].attributes['text-align']
        }}>
            {node.attributes.strings.map(s => {
                return (
                    <span style={{
                        'vertical-align': 'middle',
                        'white-space': 'pre-wrap',
                        ...s.attributes
                    }}>
                        {s.value}
                    </span>
                );
            })}
        </div>
    );
}