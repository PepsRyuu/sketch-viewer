import bplist from 'bplist-parser';

export default function PListResolver (encodedArchive) {
    let output = {};

    // Base64 to Object Archive
    let buffer = Buffer.from(encodedArchive, 'base64');
    let archive = bplist.parseBuffer(buffer)[0];
    let { $objects, $top } = archive;

    function getByUID (uid) {
        let value = $objects[uid];

        if (typeof value === 'string' || typeof value === 'number') {
             return value;
        }

        if (value['NS.keys']) {
            let obj = {};
            value['NS.keys'].forEach((k, i) => {
                obj[getByUID(k.UID)] = getByUID(value['NS.objects'][i].UID)
            });

            return obj;
        }

        if (typeof value === 'object') {
            Object.keys(value).forEach(key => {
                if (value[key].UID !== undefined) { 
                    value[key] = getByUID(value[key].UID);
                }
            });

            return value;
        }
    }

    let top = $objects[$top.root.UID];
    Object.keys(top).forEach(key => {
        if (top[key].UID) {
            output[key] = getByUID(top[key].UID);
        } else {
            output[key] = top[key];
        }
    });

    return output;
}