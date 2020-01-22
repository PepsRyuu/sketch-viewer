function valignToFlex (value) {
    return {
        'top': 'flex-start',
        'middle': 'center',
        'bottom': 'flex-end'
    }[value] || 'auto';
}

function talignToFlex (value) {
    return {
        'left': 'flex-start',
        'center': 'center',
        'right': 'flex-end'
    }[value] || 'auto';
}

export default function TextElement (node) {
    return (
        <div style={{
           'justify-content': talignToFlex(node.attributes.strings[0].attributes['text-align']),
            'white-space': node.attributes['text-wrap'],
           'display': 'flex',
           'align-items': valignToFlex(node.attributes.strings[0].attributes['vertical-align']),
        }}>
            <div style={{
                'text-align': node.attributes.strings[0].attributes['text-align']
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
        </div>
    );
}