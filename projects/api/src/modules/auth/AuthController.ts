import { RedirectResponse } from '@untype/rpc';
import { ForbiddenError, assert, random, string, uuid } from '@untype/toolbox';
import appleSignIn from 'apple-signin-auth';
import Axios from 'axios';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import qs from 'qs';
import { singleton } from 'tsyringe';
import { z } from 'zod';
import { Config } from '../../config';
import { User, UserSession } from '../../entities';
import { FileService } from '../files/FileService';
import { StravaService } from '../geo/StravaService';
import { NotificationStatus } from '../models/users';
import { rest, rpc } from '../rpc';
import { Context } from '../rpc/models';
import { RandomUserService } from '../user/RandomUserService';

@singleton()
export class AuthController {
    public constructor(
        private randomUserService: RandomUserService,
        private fileService: FileService,
        private stravaService: StravaService,
        private config: Config,
    ) {}

    public ['GET /auth/callback'] = rest({
        anonymous: true,
        resolve: ({ req }) => {
            return new RedirectResponse('findmyride://findmyride.app/auth/callback?' + qs.stringify(req.query));
        },
    });

    public ['auth/anonymous_login'] = rpc({
        anonymous: true,
        resolve: async ({ ctx, res }) => {
            const { avatarId, name, slug } = await this.randomUserService.getRandomUser(ctx.t);

            const newUser = await User.create(ctx.t, {
                selector: ['id'],
                item: {
                    isAnonymous: true,
                    email: `${slug}.user@findmyride.app`,
                    slug,
                    name,
                    avatarId,
                },
            });

            const token = await this.createSession(ctx, newUser.id);
            res.header('Authorization', `Bearer ${token}`);

            return { isNewUser: true };
        },
    });

    public ['auth/login'] = rpc({
        anonymous: true,
        input: LoginSchema,
        resolve: async ({ ctx, res, input }) => {
            const info = await this.getProviderProfile(input);

            const { isNewUser, user } = await User.findFirst(ctx.t, {
                filter: { email: { equalTo: info.email } },
                selector: ['id', 'isDeleted'],
            }).then(async (user) => ({
                isNewUser: !user,
                user: user ?? (await this.createUser(ctx, info)),
            }));

            if (user && user.isDeleted) {
                throw new ForbiddenError('Account is deleted');
            }

            const token = await this.createSession(ctx, user.id);
            res.header('Authorization', `Bearer ${token}`);

            return { isNewUser };
        },
    });

    private createSession = async (ctx: Context<false>, userId: string) => {
        const tokenId = uuid.v4();
        const sessionId = uuid.v4();
        const token = jwt.sign(
            {
                sub: userId,
                tokenId,
                sessionId,
            },
            this.config.auth.jwt.secret,
            {
                expiresIn: this.config.auth.jwt.tokenExpiresIn,
                issuer: this.config.auth.jwt.issuer,
                audience: this.config.auth.jwt.audience,
            },
        );

        await UserSession.create(ctx.t, {
            item: {
                id: sessionId,
                userId,
                tokenId,
            },
        });

        return token;
    };

    private createUser = async (
        ctx: Context<false>,
        { name, email, avatarUrl }: { name: string | null | undefined; email: string; avatarUrl?: string | null },
    ) => {
        let slug = email
            .substring(0, email.lastIndexOf('@'))
            .replace(/[^A-Za-z0-9_]/g, '')
            .toLowerCase();

        while (await User.exists(ctx.t, { filter: { slug: { equalTo: slug } } })) {
            slug += random.int(1, 9);
        }

        const avatar = avatarUrl ? await this.fileService.upload(ctx, 'images', { url: avatarUrl }) : undefined;

        return await User.create(ctx.t, {
            item: {
                name: string.trimToNull(name) ?? this.randomUserService.getRandomName(),
                avatarId: avatar?.file.id,
                email,
                slug,
            },
            selector: ['id', 'isDeleted'],
        });
    };

    private getProviderProfile = (input: z.infer<typeof LoginSchema>) => {
        switch (input.provider) {
            case 'google':
                return this.getGoogleProfile(input.payload);
            case 'facebook':
                return this.getFacebookProfile(input.payload);
            case 'apple':
                return this.getAppleProfile(input.payload);
            default:
                assert.never(input);
        }
    };

    private getGoogleProfile = async (payload: { idToken: string }) => {
        const data = await Axios.request({
            url: 'https://oauth2.googleapis.com/tokeninfo',
            params: { id_token: payload.idToken },
        }).then((x) => GoogleProfile.parse(x.data));

        return {
            email: data.email,
            name: data.name,
            avatarUrl: data.picture ?? null,
        };
    };

    private getAppleProfile = async (payload: {
        fullName: { familyName: string | null; givenName: string | null } | null;
        identityToken: string;
        nonce: string;
    }) => {
        const appleIdTokenClaims = await appleSignIn.verifyIdToken(payload.identityToken, {
            nonce: payload.nonce ? crypto.createHash('sha256').update(payload.nonce).digest('hex') : undefined,
        });

        return {
            email: appleIdTokenClaims.email,
            name: [payload.fullName?.givenName, payload.fullName?.familyName].filter(Boolean).join(' '),
            avatarUrl: null,
        };
    };

    private getFacebookProfile = async (payload: { accessToken: string }) => {
        const { email, first_name, last_name, picture } = await Axios.request<{
            email: string;
            first_name: string;
            last_name: string;
            picture?: { data?: { url?: string } };
        }>({
            url: 'https://graph.facebook.com/me',
            params: {
                fields: 'id,email,first_name,last_name,picture.type(large)',
                access_token: payload.accessToken,
            },
        }).then((x) => x.data);

        return { name: [first_name, last_name].filter(Boolean).join(' '), email, avatarUrl: picture?.data?.url };
    };

    public ['auth/link_strava'] = rpc({
        input: z.object({ code: z.string() }),
        resolve: async ({ ctx, input }) => {
            await this.stravaService.link(ctx, input.code);
        },
    });

    public ['auth/unlink_strava'] = rpc({
        resolve: async ({ ctx }) => {
            await this.stravaService.unlink(ctx);
        },
    });

    public ['auth/logout'] = rpc({
        input: z.object({ deleteAccount: z.boolean().optional() }).optional(),
        resolve: async ({ ctx, input }) => {
            const devices = await UserSession.find(ctx.t, {
                filter: {
                    id: { equalTo: ctx.user.session.id },
                    userId: { equalTo: ctx.user.id },
                },
                selector: ['id'],
            });

            for (const device of devices) {
                await UserSession.delete(ctx.t, { pk: { id: device.id } });
            }

            if (input?.deleteAccount) {
                await User.update(ctx.t, { pk: { id: ctx.user.id }, patch: { isDeleted: true } });
            }
        },
    });

    public ['auth/fcm_token'] = rpc({
        input: z.object({
            fcmToken: z.string(),
            status: NotificationStatus,
        }),
        resolve: async ({ ctx, input }) => {
            // await UserSession.update(ctx.t, {
            //     pk: { id: ctx.device.id },
            //     patch: { fcmToken: input.fcmToken, notificationStatus: input.status },
            // });
        },
    });
}

const GoogleProfile = z.object({
    email: z.string(),
    picture: z.string().nullish(),
    name: z.string().nullish(),
});

const LoginSchema = z.union([
    z.object({
        provider: z.literal('facebook'),
        payload: z.object({ accessToken: z.string() }),
    }),
    z.object({
        provider: z.literal('apple'),
        payload: z.object({
            nonce: z.string(),
            fullName: z.object({ givenName: z.string().nullable(), familyName: z.string().nullable() }).nullable(),
            identityToken: z.string(),
            email: z.string().nullable(),
            authorizationCode: z.string().nullable(),
        }),
    }),
    z.object({
        provider: z.literal('google'),
        payload: z.object({
            idToken: z.string(),
        }),
    }),
]);
