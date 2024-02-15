import { BadRequestError } from '@untype/toolbox';
import Axios from 'axios';
import { singleton } from 'tsyringe';
import { Config } from '../../config';
import { StravaAccount, User } from '../../entities';
import { FileService } from '../files/FileService';
import { TrackSource } from '../rides/models';
import { ApiContext } from '../rpc/types';
import { GpxService } from './GpxService';
import { StravaRoute } from './strava';

@singleton()
export class StravaService {
    public constructor(
        private files: FileService,
        private gpxService: GpxService,
        private config: Config,
    ) {}

    public link = async (ctx: ApiContext<true>, code: string) => {
        const { access_token, refresh_token, athlete } = await Axios.request<{
            access_token: string;
            refresh_token: string;
            athlete: {
                id: number;
                firstname: string | null;
                lastname: string | null;
                profile: string | null;
                bio: string | null;
            };
        }>({
            method: 'POST',
            url: '/oauth/token',
            data: {
                client_id: this.config.strava.clientId,
                client_secret: this.config.strava.clientSecret,
                grant_type: 'authorization_code',
                code,
            },
        }).then((x) => x.data);

        const stravaProfile = await StravaAccount.create(ctx.t, {
            item: {
                accessToken: access_token,
                refreshToken: refresh_token,
                profile: athlete,
                athleteId: String(athlete.id),
            },
            selector: ['id'],
        });

        await User.update(ctx.t, {
            pk: { id: ctx.user.id },
            patch: { stravaId: stravaProfile.id },
        });
    };

    public unlink = (ctx: ApiContext<true>) => {
        return User.update(ctx.t, {
            pk: { id: ctx.user.id },
            patch: { stravaId: null },
        });
    };

    public getRoutes = async (ctx: ApiContext<true>) => {
        const { accessToken, athleteId } = await this.getAccessToken(ctx);

        const routes = await Axios.request<StravaRoute[]>({
            url: `/athletes/${athleteId}/routes`,
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }).then((x) => x.data);

        return routes.map((x) => ({
            id: x.id_str,
            user: {
                id: x.athlete.id,
                avatarUrl: x.athlete.profile_medium,
                name: [x.athlete.firstname, x.athlete.lastname].filter(Boolean).join(' '),
            },
            name: x.name,
            distance: x.distance,
            elevation: x.elevation_gain,
            description: x.description,
            staticMapUrl: x.map_urls.retina_url,
        }));
    };

    private getRouteImpl = async (args: { stravaRouteId: string; accessToken: string }) => {
        const { accessToken, stravaRouteId } = args;
        const route = await Axios.request<StravaRoute>({
            url: `/routes/${stravaRouteId}`,
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return route.data;
    };

    private getRoute = async (ctx: ApiContext<true>, stravaRouteId: string) => {
        const { accessToken } = await this.getAccessToken(ctx);
        return this.getRouteImpl({ stravaRouteId, accessToken });
    };

    public importStravaGpx = async (ctx: ApiContext<true>, stravaRouteId: string) => {
        const { accessToken } = await this.getAccessToken(ctx);
        const url = `${this.config.strava.apiUrl}/routes/${stravaRouteId}/export_gpx`;
        const { buffer } = await this.files.upload({
            url,
            config: {
                headers: { Authorization: `Bearer ${accessToken}` },
            },
        });

        const route = await this.getRouteImpl({ accessToken, stravaRouteId });

        const { id } = await this.gpxService.processGpx(ctx, {
            buffer,
            meta: { originalUrl: url },
        });

        return {
            ...(await this.gpxService.getGpxTrack(ctx, id)),
            manualDistance: route.distance,
            trackSource: 'strava' as TrackSource,
            trackSourceUrl: `https://www.strava.com/routes/${route.id_str}`,
        };
    };

    public getAccessToken = async (ctx: ApiContext<true>) => {
        const { strava } = await User.findByPkOrError(ctx.t, {
            pk: { id: ctx.user.id },
            selector: {
                strava: ['id', 'refreshToken', 'athleteId'],
            },
        });

        if (!strava) {
            throw new BadRequestError('Strava is not linked');
        }

        const { access_token, refresh_token } = await Axios.request<{
            token_type: string;
            access_token: string;
            expires_at: number;
            expires_in: number;
            refresh_token: string;
        }>({
            method: 'POST',
            url: '/oauth/token',
            data: {
                client_id: this.config.strava.clientId,
                client_secret: this.config.strava.clientSecret,
                grant_type: 'refresh_token',
                refresh_token: strava.refreshToken,
            },
        }).then((x) => x.data);

        await StravaAccount.update(ctx.t, {
            pk: { id: strava.id },
            patch: {
                refreshToken: refresh_token,
                accessToken: access_token,
            },
        });

        return { accessToken: access_token, athleteId: strava.athleteId };
    };
}
