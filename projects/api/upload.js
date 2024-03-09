const Axios = require('axios');
const fs = require('node:fs/promises');

(async () => {
    try {
        const {
            data: { url },
        } = await Axios({
            method: 'POST',
            url: 'http://localhost:3000/api/file/get_presigned_url',
        });

        const data = await fs.readFile('upload.js');

        console.log('file');

        const { data: uploadResult, status } = await Axios({
            method: 'PUT',
            url,
            data,
            headers: {
                'Content-Type': 'application/octet-stream',
            },
        });

        console.log('file 2');

        console.log(status);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
