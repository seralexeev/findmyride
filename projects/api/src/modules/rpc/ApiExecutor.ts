import { Point } from '@untype/geo';
import { Pg } from '@untype/pg';
import { ExpressExecutor } from '@untype/rpc-express';
import { BadRequestError, UnauthorizedError, object, uuid } from '@untype/toolbox';
import { camelCase } from 'change-case';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { singleton } from 'tsyringe';
import { Config } from '../../config';
import { User } from '../../entities';
import { ApiContext, ApiUser, DeviceInfo } from './types';

@singleton()
export class ApiExecutor extends ExpressExecutor<ApiContext, ApiUser> {
    public constructor(
        private pg: Pg,
        private config: Config,
    ) {
        super();
    }

    public override invoke = async ({ resolve, res, req, user }: typeof this.types.invoke) => {
        const device = this.getDeviceInfo(req) ?? {
            deviceId: uuid.v4(),
            type: 'web',
        };

        let location: Point | null = null;
        if (user) {
            if (!device || !device.deviceId) {
                throw new BadRequestError('Device Id is missing');
            }

            [location = null] = user
                ? await this.pg.sql<Point>`SELECT ST_AsGeoJSON(get_user_location(${user.id}, ${device.deviceId}))`
                : [];
        }

        return this.pg.transaction(async (t) => {
            return await resolve({ device, t, user });
        });
    };

    public override auth = async (ctx: typeof this.types.auth) => {
        const id = this.getUserId(ctx.req);
        if (!id) {
            return null;
        }

        const user = await User.findByPk(this.pg, {
            pk: { id },
            selector: {
                id: true,
                name: true,
                isAnonymous: true,
            },
        });

        if (!user) {
            return null;
        }

        return {
            ...object.pick(user, ['id', 'name', 'isAnonymous']),
            // location: user.location?.geojson ?? null,
        } as any; // hack for deviceId
    };

    private getUserId = (req: Request) => {
        const accessToken = req.headers.authorization?.split(' ')[1] || null;
        if (!accessToken) {
            return null;
        }

        try {
            jwt.verify(accessToken, this.config.auth.jwt.secret, { issuer: this.config.auth.jwt.issuer });
            const sub = jwt.decode(accessToken, { json: true })?.sub;
            if (!sub) {
                throw new UnauthorizedError('Invalid token', { cause: 'Sub is missing' });
            }

            return sub;
        } catch (cause) {
            throw new UnauthorizedError('Invalid token', { cause });
        }
    };

    private getDeviceInfo = (req: Request): DeviceInfo | null => {
        const di = Object.entries(req.headers).reduce((acc, [key, value]) => {
            if (key.startsWith('x-di-')) {
                const name = camelCase(key.substring(5));
                if (name && value) {
                    acc[name] = value;
                }
            }
            return acc;
        }, {} as any);

        return Object.keys(di).length ? di : null;
    };
}
