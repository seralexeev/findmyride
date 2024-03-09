import { RpcInput } from '@findmyride/api';
import qs from 'qs';
import { Linking } from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { useInvalidate, useRpc } from '../../api/rpc';
import { useConfig } from '../../config/ConfigProvider';
import { useEvent } from '../../hooks/useEvent';
import { analytics } from '../analytics';
import { useProfile } from '../user/ProfileProvider';

export const useOAuth = ({ endpoint, params }: { endpoint: string; params: Record<string, string> }) => {
    const config = useConfig();
    const url = `${endpoint}?${qs.stringify({ ...params, redirect_uri: `${config.web.url}/auth/callback` }, { encode: true })}`;

    return useEvent(() => {
        return new Promise<URL>(async (res, rej) => {
            const listener = Linking.addEventListener('url', (e) => {
                InAppBrowser.closeAuth();
                res(new URL(e.url));
            });

            try {
                const response = await InAppBrowser.openAuth(url, 'findmyride://findmyride.app/auth/callback', {
                    ephemeralWebSession: false,
                    showTitle: true,
                    enableUrlBarHiding: true,
                    enableDefaultShare: false,
                    forceCloseOnRedirection: false,
                    showInRecents: true,
                });

                if (response.type === 'success' && response.url) {
                    res(new URL(response.url));
                } else {
                    rej(new Error('Authentication failed: ' + response.type));
                }
            } catch (error) {
                rej(error);
            } finally {
                listener.remove();
            }
        });
    });
};

export const useOAuthLogin = ({
    endpoint,
    params,
    extractPayload,
}: {
    endpoint: string;
    params: Record<string, string>;
    extractPayload: (url: URL) => RpcInput<'auth/login'>;
}) => {
    const open = useOAuth({ endpoint, params });
    const login = useLogin();

    return useEvent(async () => {
        const url = await open();
        const payload = extractPayload(url);

        return login(payload);
    });
};

export const useLogin = () => {
    const invalidate = useInvalidate();
    const [mutateAsync] = useRpc('auth/login').useMutation();

    return async (payload: RpcInput<'auth/login'>) => {
        const { isNewUser } = await mutateAsync(payload);
        if (isNewUser) {
            analytics.logSignUp({ method: payload.provider });
        } else {
            analytics.logLogin({ method: payload.provider });
        }

        await invalidate(['user/profile']);
    };
};

export const useAnonymousLogin = () => {
    const invalidate = useInvalidate();
    const [mutateAsync] = useRpc('auth/anonymous_login').useMutation();

    return async () => {
        await mutateAsync(null);
        await invalidate(['user/profile']);

        analytics.logSignUp({ method: 'anonymous' });
    };
};

export const useLinkStrava = () => {
    const { profile } = useProfile();
    const [linkStravaReq] = useRpc('auth/link_strava').useMutation();
    const [unlinkStravaReq] = useRpc('auth/unlink_strava').useMutation();
    const invalidate = useInvalidate();

    const open = useOAuth({
        endpoint: 'https://www.strava.com/oauth/authorize',
        params: {
            client_id: '70279',
            response_type: 'code',
            approval_prompt: 'auto',
            scope: 'read_all',
        },
    });

    return {
        isLinked: profile.stravaIsLinked,
        link: async () => {
            const url = await open();

            const code = url.searchParams.get('code');
            if (!code) {
                throw new Error('Unable to link Strava');
            }

            await linkStravaReq({ code });
            await invalidate(['user/profile']);
        },
        unlink: () => unlinkStravaReq(null).then(() => invalidate(['user/profile'])),
    };
};
