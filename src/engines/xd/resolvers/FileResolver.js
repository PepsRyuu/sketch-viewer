import { LoadZipFile } from '../../../utils/index';

export default async function FileResolver (filename) {
    let zip = await LoadZipFile(filename);

    let output = {
        pages: [],
        images: []
    };

    let page = {
        id: 'page-1',
        name: 'Page 1',
        data: [],
        artboards: []
    };

    output.pages.push(page);

    let manifest = await zip.loadJSON('manifest');
    let pushComponents = async function (name, path, child) {
        if (child.components) {
            for (let i = 0; i < child.components.length; i++) {
                let component = child.components[i];
                if (component.type.startsWith('image')) {
                    // push to images
                } else if (component.type === 'application/vnd.adobe.agc.graphicsTree+json') {
                    page.artboards.push({
                        id: component.id,
                        name: name + ' ' + component.name
                    })

                    page.data.push({
                        id: component.id,
                        path: path + '/' + component.path,
                        data: await zip.loadJSON((path + '/' + component.path).substring(1))
                    })
                }
            }
        }

        if (child.children) {
            for (let i = 0; i < child.children.length; i++) {
                let nextChild = child.children[i];
                await pushComponents(name + ' ' + nextChild.name, path + '/' + nextChild.path, nextChild);

            }
        }
    }

    await pushComponents('', '', manifest);

    page.data.forEach(d => {
        if (d.data.artboards && d.data.artboards.href) {
            d.data.artboards = page.data.find(o => o.path === d.data.artboards.href).data.artboards;
        }

        if (d.data.resources && d.data.resources.href) {
            d.data.resources = page.data.find(o => o.path === d.data.resources.href).data.resources;
        }
    });

    let resolveRefs = (page, parent, obj) => {
        for (let key in obj) {
            if (key === 'ref' && parent !== 'artboard') {
                let ref = page.data.resources[parent + 's'][obj[key]];
                for (let refKey in ref) {
                    obj[refKey] = ref[refKey];
                }
                delete obj.ref;
            }

            if (typeof obj[key] === 'object') {
                resolveRefs(page, key, obj[key]);
            }
        }
    };

    let checkChildrenForRefs = (page, children) => {
        children.forEach(node => {
            resolveRefs(page, '', node);
            if (node.type === 'group') {
                checkChildrenForRefs(page, node.group.children);
            }
        })
    };

    page.data.forEach(p => {
        checkChildrenForRefs(p, p.data.children);
    });

    return output;
}