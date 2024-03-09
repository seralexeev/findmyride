import 'reflect-metadata';
import 'source-map-support/register';

import { createServer } from './server';

if (require.main === module) {
    void createServer().then(({ start }) => start());
}
