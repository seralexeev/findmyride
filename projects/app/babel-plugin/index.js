const ip = require('ip');

const replace = [
    {
        find: '__IP_ADDRESS__',
        replaceWith: ip.address(),
    },
    {
        find: '__ENV__',
        replaceWith: process.env.FINDMYRIDE__env || 'prod',
    },
];

module.exports = ({ types }) => {
    return {
        visitor: {
            ReferencedIdentifier(path) {
                for (const { find, replaceWith } of replace) {
                    if (path.node.name === find) {
                        path.replaceWith(types.stringLiteral(replaceWith));
                    }
                }
            },
        },
    };
};
