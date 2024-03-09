import { RpcItemsOutput, formatDistanceMeters } from '@findmyride/api';
import React, { FC } from 'react';
import { useRpc } from '../../api/rpc';
import { useEvent } from '../../hooks/useEvent';
import { ui } from '../../ui';
import { useScreen } from '../../ui/ScreenProvider';
import { useLinkStrava } from '../auth/services';
import { useProfile } from '../user/ProfileProvider';

type StravaRoutesScreenProps = {
    onSelect: (routeId: string) => void;
};

export const StravaRoutesScreen: FC<StravaRoutesScreenProps> = ({ onSelect }) => {
    const query = useRpc('strava/get_routes').useQuery();

    return (
        <ui.Screen name='StravaRoutesScreen' header='Strava'>
            {query.isSuccess ? (
                <ui.ScrollView padding={2}>
                    {query.data.items.map((x) => (
                        <RideCard key={x.id} onPress={() => onSelect(x.id)} route={x} />
                    ))}
                </ui.ScrollView>
            ) : (
                <ui.FetchFallback query={query} />
            )}
        </ui.Screen>
    );
};

const RideCard: FC<{ onPress: () => void; route: RpcItemsOutput<'strava/get_routes'> }> = ({ onPress, route }) => {
    return (
        <ui.Box white borderRadius borderWidth borderColor marginBottom={2} onPress={onPress} overflowHidden>
            <ui.Box flex>
                <ui.Box row alignItems='center' flex padding>
                    <ui.Box marginRight={2} round overflowHidden>
                        <ui.Image source={{ uri: route.user.avatarUrl }} style={{ width: 48, height: 48 }} />
                    </ui.Box>
                    <ui.Box flex>
                        <ui.Text semiBold marginBottom={0.5} children={route.user.name} />
                        {route.name ? <ui.Text variant='caption' numberOfLines={2} children={route.name} /> : null}
                    </ui.Box>
                </ui.Box>
                <ui.Divider marginBottom />
                <ui.Box row flex justifyContent='space-around' marginBottom>
                    <ui.Box flexCenter>
                        <ui.Text variant='caption' children='Elevation' marginBottom={0.5} />
                        <ui.Box row>
                            <ui.Text variant='body2' children={formatDistanceMeters(route.elevation)} semiBold />
                        </ui.Box>
                    </ui.Box>
                    <ui.Box flexCenter>
                        <ui.Text variant='caption' children='Distance' marginBottom={0.5} />
                        <ui.Box row>
                            <ui.Text variant='body2' children={formatDistanceMeters(route.distance)} semiBold />
                        </ui.Box>
                    </ui.Box>
                </ui.Box>
            </ui.Box>
            <ui.Box overflowHidden borderRadius></ui.Box>
            <ui.Image source={{ uri: route.staticMapUrl }} style={{ width: '100%', height: 200 }} />
        </ui.Box>
    );
};

export const useSelectStravaRoute = () => {
    const { profile } = useProfile();
    const { link } = useLinkStrava();
    const { showScreen } = useScreen();

    return useEvent(() => {
        return new Promise<string>((res, rej) => {
            const showScreenImpl = () => {
                showScreen({
                    onClose: rej,
                    children: ({ goBack }) => (
                        <StravaRoutesScreen
                            onSelect={(rideId) => {
                                res(rideId);
                                goBack();
                            }}
                        />
                    ),
                });
            };

            if (profile.stravaIsLinked) {
                showScreenImpl();
            } else {
                link().then(showScreenImpl).catch(rej);
            }
        });
    });
};
