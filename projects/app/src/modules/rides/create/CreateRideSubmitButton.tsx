import { routes } from '@findmyride/api';
import { useLinkTo, useNavigation } from '@react-navigation/native';
import { object } from '@untype/toolbox';
import React, { FC, memo } from 'react';
import { useInvalidate, useRpc } from '../../../api/rpc';
import { ui } from '../../../ui';
import { truncateDateToUTCStringWithoutTZ } from '../../../ui/utils';
import { useCreateRide } from './services';

export const CreateRideSubmitButton: FC = memo(() => {
    const { ride, setLoading } = useCreateRide();
    const [mutateAsync] = useRpc('ride/create').useMutation();
    const invalidate = useInvalidate();
    const linkTo = useLinkTo();
    const { goBack } = useNavigation();

    const checkIsValid = () => {
        if (!ride.start) {
            return false;
        }

        if (!ride.startDate) {
            return false;
        }

        return true;
    };

    const onPress = async () => {
        if (!ride.start) {
            return;
        }

        if (!ride.startDate) {
            return;
        }

        if (!ride.startTimezone) {
            return;
        }

        try {
            setLoading(true);

            return await mutateAsync({
                ...object.pick(ride, [
                    'bikeType',
                    'description',
                    'title',
                    'manualDistance',
                    'elevation',
                    'gpxTrackId',
                    'privacy',
                    'riderLevel',
                    'trackSource',
                    'trackSourceUrl',
                    'visibility',
                    'autoStart',
                    'autoFinish',
                    'chatLink',
                    'termsUrl',
                ]),
                start: ride.start,
                finish: ride.finish,
                startDate: truncateDateToUTCStringWithoutTZ(ride.startDate),
                startTimezone: ride.startTimezone,
            }).then(({ id }) => {
                goBack();
                goBack();
                linkTo(`${routes.ride(id)}?popup=true`);
                return invalidate(['ride/get']);
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ui.Button
            haptic
            borderVariant='round'
            color='primary'
            children='🚀  Create'
            disabled={!checkIsValid()}
            marginRight
            onPress={onPress}
        />
    );
});
