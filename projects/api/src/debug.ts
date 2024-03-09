import 'reflect-metadata';
import 'source-map-support/register';

import { Logger } from '@untype/logger';
import { Pg } from '@untype/pg';
import { FileService } from './modules/files/FileService';
import { createServer } from './server';

if (require.main === module) {
    (async () => {
        try {
            const { container } = await createServer();
            const fileService = container.resolve(FileService);
            const logger = container.resolve(Logger);
            const pg = container.resolve(Pg);

            try {
                // const res = await fileService.upload('files', {
                //     path: '/Users/sergeyalekseev/projects/findmyride/misc/files/track.gpx',
                // });

                const res = await pg.transaction(async (t) => {
                    return fileService.upload({ t, user: null }, 'images', {
                        url: 'https://avatars.githubusercontent.com/u/141599231?s=64&v=4',
                    });
                });

                logger.info('Success', res);

                process.exit(0);
            } catch (error) {
                logger.error('Error', error);
                process.exit(1);
            }
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    })();
}
