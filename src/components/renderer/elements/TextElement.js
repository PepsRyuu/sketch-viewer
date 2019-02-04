export default function TextElement (node) {
    return (
        <div style={{
            'line-height': node.attributes.strings[0].attributes['line-height'],
            'text-align': node.attributes.strings[0].attributes['text-align'],
            'white-space': node.attributes['text-wrap'],
        }}>
            {node.attributes.strings.map(s => {
                return (
                    <span style={{
                        'vertical-align': 'middle',
                        ...s.attributes
                    }}>
                        {s.value}
                    </span>
                );
            })}
        </div>
    );
}