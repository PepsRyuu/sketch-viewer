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
    if (node.attributes.paragraphs) {
        return (
            <div>
                {node.attributes.paragraphs.map(group => (
                    <div style={{
                        'position': 'absolute',
                        'top': group.y + 'px',
                        'left': group.x + 'px',
                        'white-space': 'pre',
                        'line-height': group.segments[0].style['line-height']
                    }}>
                        {group.segments.map(segment => (
                            <span style={segment.style}>
                                {segment.value}
                            </span>
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div style={{
           'justify-content': talignToFlex(node.attributes.strings[0].attributes['text-align']),
            'white-space': node.attributes['text-wrap'],
           'display': 'flex',
           'align-items': valignToFlex(node.attributes.strings[0].attributes['vertical-align']),
        }}>
            <div>
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