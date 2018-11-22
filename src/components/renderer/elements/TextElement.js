export default function TextElement (node) {
    return (
        <div>
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