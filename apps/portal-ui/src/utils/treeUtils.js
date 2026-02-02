/**
 * Helper to normalize API items for the file tree
 * @param {Object} item - API item object
 * @returns {Object|null} - Normalized tree node or null
 */
export const normalizeItem = (item) => {
    // Screenshot logic:
    // 'prefix' ending in '/' -> Folder
    // 'name' -> File
    if (item.prefix) {
        // e.g. "submissions/hk1_web_2/..."
        // Remove trailing slash for name, but keep full prefix for path
        const rawName = item.prefix.replace(/\/$/, '').split('/').pop();
        return {
            name: rawName,
            path: item.prefix, // Use full prefix as unique ID/Path
            type: 'folder',
            children: [],
            isLoaded: false // Marker for lazy load
        };
    }
    if (item.name) {
        const rawName = item.name.split('/').pop();
        return {
            name: rawName,
            path: item.name,
            type: 'file',
            meta: item
        };
    }
    return null;
};

/**
 * Recursive helper to update tree nodes with new children
 * @param {Array} nodes - Current list of nodes
 * @param {String} targetPath - Path of the folder execution
 * @param {Array} newChildren - New children to insert
 * @returns {Array} - New node list
 */
export const updateTreeNodes = (nodes, targetPath, newChildren) => {
    return nodes.map(node => {
        if (node.path === targetPath) {
            return { ...node, children: newChildren, isLoaded: true };
        }
        if (node.children && node.children.length > 0) {
            return { ...node, children: updateTreeNodes(node.children, targetPath, newChildren) };
        }
        return node;
    });
};
