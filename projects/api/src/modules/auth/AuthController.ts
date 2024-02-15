import { Transaction } from '@untype/pg';
import { BadRequestError, InvalidOperationError, UnauthorizedError, assert, random } from '@untype/toolbox';
import appleSignIn from 'apple-signin-auth';
import Axios from 'axios';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { singleton } from 'tsyringe';
import { z } from 'zod';
import { Config } from '../../config';
import { User, UserDevice } from '../../entities';
import { FileService } from '../files/FileService';
import { StravaService } from '../geo/StravaService';
import { ActionByType } from '../models/actions';
import { AuthAction, NotificationStatus } from '../models/users';
import { rpc } from '../rpc';
import { DeviceInfo } from '../rpc/types';
import { RandomUserService } from '../user/RandomUserService';

@singleton()
export class AuthController {
    public constructor(
        private randomUserService: RandomUserService,
        private fileService: FileService,
        private stravaService: StravaService,
        private config: Config,
    ) {}

    public ['auth/anonymous_login'] = rpc({
        anonymous: true,
        resolve: async ({ ctx }) => {
            const { avatarId, name, slug } = await this.randomUserService.getRandomUser(ctx.t);

            const newUser = await User.create(ctx.t, {
                selector: ['id'],
                item: {
                    isAnonymous: true,
                    email: `${slug}.user@findmyride.cc`,
                    slug,
                    name,
                    avatarId,
                },
            });

            return this.generateTokens(ctx.t, newUser.id, ctx.device);
        },
    });

    public ['auth/login'] = rpc({
        anonymous: true,
        input: LoginSchema,
        resolve: async ({ ctx, input }) => {
            if (!ctx.device) {
                throw new BadRequestError('Missing device info');
            }

            const { email, name, avatarUrl } = await this.getProviderProfile(input);
            let user = await User.findFirst(ctx.t, {
                filter: { email: { equalTo: email } },
                selector: ['id', 'isDeleted'],
            });

            if (user && user.isDeleted) {
                throw new InvalidOperationError('Account is deleted');
            }

            const isNewUser = !user;

            if (!user) {
                let slug = email
                    .substring(0, email.lastIndexOf('@'))
                    .replace(/[^A-Za-z0-9_]/g, '')
                    .toLowerCase();

                while (await User.exists(ctx.t, { filter: { slug: { equalTo: slug } } })) {
                    slug += random.int(1, 9);
                }

                const avatar = avatarUrl ? await this.fileService.upload({ url: avatarUrl }) : undefined;

                user = await User.create(ctx.t, {
                    item: {
                        name: name || this.randomUserService.getRandomName(),
                        avatarId: avatar?.file.id,
                        email,
                        slug,
                    },
                    selector: ['id', 'isDeleted'],
                });
            }

            return {
                ...(await this.generateTokens(ctx.t, user.id, ctx.device)),
                isNewUser,
            };
        },
    });

    private getProviderProfile = (
        input: z.infer<typeof LoginSchema>,
    ): Promise<{ name: string; email: string; avatarUrl?: string | null }> => {
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
        const { email, name, picture } = await Axios.request<{ picture?: string; name: string; email: string }>({
            url: 'https://oauth2.googleapis.com/tokeninfo',
            params: { id_token: payload.idToken },
        }).then((x) => x.data);

        return { name, email, avatarUrl: picture };
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

    public ['auth/tokens'] = rpc({
        anonymous: true,
        input: z.object({ refreshToken: z.string().nullable() }),
        resolve: async ({ ctx, input }) => {
            const decoded = this.validateRefreshToken(input.refreshToken ?? '');
            const userId = decoded.sub;

            const device = await UserDevice.findByPk(ctx.t, {
                pk: { id: decoded.deviceId },
                selector: ['refreshToken', 'deviceInfo'],
            });

            if (!device || device.refreshToken !== input.refreshToken) {
                throw new UnauthorizedError('Invalid refresh token');
            }

            return this.generateTokens(ctx.t, userId, ctx.device ?? device.deviceInfo);
        },
    });

    public ['auth/logout'] = rpc({
        input: z.object({ deleteAccount: z.boolean().optional() }).optional(),
        resolve: async ({ ctx, input }): Promise<ActionByType<AuthAction, '@auth/REMOVE_SECURITY_TOKENS'>> => {
            const devices = await UserDevice.find(ctx.t, {
                filter: {
                    id: { equalTo: ctx.device.deviceId },
                    userId: { equalTo: ctx.user.id },
                },
                selector: ['id'],
            });

            for (const device of devices) {
                await UserDevice.delete(ctx.t, { pk: { id: device.id } });
            }

            if (input?.deleteAccount) {
                await User.update(ctx.t, { pk: { id: ctx.user.id }, patch: { isDeleted: true } });
            }

            return {
                type: '@auth/REMOVE_SECURITY_TOKENS',
            };
        },
    });

    private generateTokens = async (
        t: Transaction,
        userId: string,
        deviceInfo: DeviceInfo,
    ): Promise<ActionByType<AuthAction, '@auth/SET_SECURITY_TOKENS'>> => {
        const accessToken = jwt.sign({ sub: userId }, this.config.auth.jwt.secret, {
            expiresIn: this.config.auth.jwt.accessTokenExpiresIn,
            issuer: this.config.auth.jwt.issuer,
        });

        const refreshToken = jwt.sign({ sub: userId, deviceId: deviceInfo.deviceId }, this.config.auth.jwt.secret, {
            expiresIn: this.config.auth.jwt.refreshTokenExpiresIn,
            issuer: this.config.auth.jwt.issuer,
        });

        await UserDevice.updateOrCreate(t, {
            pk: { id: deviceInfo.deviceId },
            selector: ['updatedAt'],
            item: { userId, refreshToken, deviceInfo },
        });

        return {
            type: '@auth/SET_SECURITY_TOKENS',
            payload: { userId, accessToken, refreshToken },
        };
    };

    private validateRefreshToken = (refreshToken: string) => {
        try {
            jwt.verify(refreshToken, this.config.auth.jwt.secret, { issuer: this.config.auth.jwt.issuer });
            return jwt.decode(refreshToken, { json: true }) as { sub: string; deviceId: string };
        } catch (cause) {
            throw new UnauthorizedError('Invalid token', { cause });
        }
    };

    public ['auth/fcm_token'] = rpc({
        input: z.object({
            fcmToken: z.string(),
            status: NotificationStatus,
        }),
        resolve: async ({ ctx, input }) => {
            await UserDevice.update(ctx.t, {
                pk: { id: ctx.device.deviceId },
                patch: { fcmToken: input.fcmToken, notificationStatus: input.status },
            });
        },
    });
}

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
