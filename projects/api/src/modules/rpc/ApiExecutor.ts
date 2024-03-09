import { Pg } from '@untype/pg';
import { ExpressExecutor } from '@untype/rpc-express';
import { UnauthorizedError, assert, result, uuid } from '@untype/toolbox';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import ms from 'ms';
import { singleton } from 'tsyringe';
import { Config } from '../../config';
import { User, UserSession } from '../../entities';
import { TokenPayload } from '../auth/models';
import { ApiUser, Context } from './models';

@singleton()
export class ApiExecutor extends ExpressExecutor<Context<false>, ApiUser> {
    public constructor(
        private pg: Pg,
        private config: Config,
    ) {
        super();
    }

    public override invoke = async ({ resolve, user }: typeof this.types.invoke) => {
        return this.pg.transaction(async (t) => {
            return await resolve({ t, user });
        });
    };

    public override auth = async ({ req, res }: typeof this.types.auth) => {
        const session = await this.getSession(req, res);
        if (!session) {
            return null;
        }

        const user = await User.findByPk(this.pg, {
            pk: { id: session.userId },
            selector: {
                id: true,
                name: true,
                isAnonymous: true,
            },
        });

        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        return {
            id: user.id,
            name: user.name,
            isAnonymous: user.isAnonymous,
            session,
        };
    };

    private getSession = async (req: Request, res: Response) => {
        if (req.headers.authorization == null) {
            return null;
        }

        const token = req.headers.authorization.split('Bearer ')[1];
        if (!token) {
            throw new UnauthorizedError('Invalid token', {
                internal: 'Token is missing',
            });
        }

        const verifiedPayload = assert.noexept(() => {
            return jwt.verify(token, this.config.auth.jwt.secret, {
                issuer: this.config.auth.jwt.issuer,
                audience: this.config.auth.jwt.audience,
            });
        });

        if (result.isError(verifiedPayload)) {
            throw new UnauthorizedError('Invalid token', {
                cause: verifiedPayload.cause,
            });
        }

        const rawPayload = TokenPayload.safeParse(verifiedPayload);
        if (!rawPayload.success) {
            throw new UnauthorizedError('Invalid token', {
                internal: "Token doesn't match the schema",
                cause: rawPayload.error,
            });
        }

        const payload = rawPayload.data;

        const session = await UserSession.findByPk(this.pg, {
            pk: { id: payload.sessionId },
            selector: ['id', 'userId', 'tokenId'],
        });

        if (!session) {
            throw new UnauthorizedError('Invalid token', {
                internal: 'Session not found',
            });
        }

        if (session.tokenId !== payload.tokenId) {
            throw new UnauthorizedError('Invalid token', {
                internal: 'Token mismatch',
            });
        }

        if (session.userId !== payload.sub) {
            throw new UnauthorizedError('Invalid token', {
                internal: 'User mismatch',
            });
        }

        if (payload.exp * 1000 - Date.now() < ms(this.config.auth.jwt.slidingTokenWindow)) {
            const tokenId = uuid.v4();
            const newToken = jwt.sign(
                {
                    sub: payload.sub,
                    tokenId,
                    sessionId: payload.sessionId,
                },
                this.config.auth.jwt.secret,
                {
                    expiresIn: this.config.auth.jwt.tokenExpiresIn,
                    issuer: this.config.auth.jwt.issuer,
                    audience: this.config.auth.jwt.audience,
                },
            );

            await UserSession.update(this.pg, {
                pk: { id: session.id },
                patch: { tokenId },
            });

            session.tokenId = tokenId;
            res.header('Authorization', `Bearer ${newToken}`);
        }

        return session;
    };
}
