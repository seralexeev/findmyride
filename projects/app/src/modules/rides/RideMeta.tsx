import { BikeType, RiderLevel, formatDistanceMeters } from '@findmyride/api';
import React, { FC, memo } from 'react';
import { ui } from '../../ui';
import { useTheme } from '../../ui/ThemeProvider';
import { flattenDuration, formatDurationShort } from '../../ui/utils';
import { BikeTypeIcon, getBikeTypeTitle } from './BikeTypeIcon';
import { RiderLevelIcon } from './RiderLevelIcon';

type RideMetaProps = {
    ride: {
        manualDistance?: number | null;
        calculatedDistance?: number | null;
        elevation?: number | null;
        distanceToStart?: number | null;
        bikeType?: BikeType | null;
        riderLevel?: RiderLevel | null;
        autoFinish?: number | null;
    };
    loading?: Partial<Record<keyof RideMetaProps['ride'], boolean>>;
    onDistanceClick?: () => void;
    onElevationClick?: () => void;
    onDistanceToStartClick?: () => void;
    onBikeTypeClick?: () => void;
    onRiderLevelClick?: () => void;
    showAutoFinish?: boolean;
};

export const RideMeta: FC<RideMetaProps> = ({
    ride,
    onBikeTypeClick,
    onDistanceClick,
    onDistanceToStartClick,
    onElevationClick,
    onRiderLevelClick,
    loading = {},
    showAutoFinish = false,
}) => {
    const distance = ride.manualDistance ?? ride.calculatedDistance;
    const isCalculatedDistance = !ride.manualDistance && ride.calculatedDistance;

    return (
        <ui.Stack row paddingBottom={0} justifyContent='space-around'>
            {ride.riderLevel && (
                <ui.Box flexCenter onPress={onRiderLevelClick}>
                    <ui.Text variant='caption' marginBottom={0.75} children='Level' />
                    <RiderLevelIcon level={ride.riderLevel} size={12} />
                </ui.Box>
            )}
            {ride.bikeType && (
                <ui.Box flexCenter minWidth={60} onPress={onBikeTypeClick}>
                    <ui.Text variant='caption' marginBottom={0.5}>
                        Bike Type
                    </ui.Text>
                    <ui.Stack row spacing alignItems='center'>
                        <BikeTypeIcon type={ride.bikeType} size={14} />
                        <ui.Text variant='body2' children={getBikeTypeTitle(ride.bikeType)} semiBold />
                    </ui.Stack>
                </ui.Box>
            )}

            {Boolean(ride.distanceToStart || loading.distanceToStart) && (
                <FormatMeters
                    title='To Start'
                    value={ride.distanceToStart}
                    loading={loading['distanceToStart']}
                    onPress={onDistanceToStartClick}
                />
            )}
            {Boolean(distance || loading.calculatedDistance) && (
                <FormatMeters
                    title='Distance'
                    value={distance}
                    loading={loading['calculatedDistance']}
                    onPress={onDistanceClick}
                    prefix={isCalculatedDistance ? '~' : undefined}
                />
            )}
            {Boolean(ride.elevation || loading.elevation) && (
                <FormatMeters
                    title='Elevation'
                    value={ride.elevation}
                    loading={loading['elevation']}
                    onPress={onElevationClick}
                />
            )}
            {showAutoFinish && ride.autoFinish && (
                <ui.Box flexCenter minWidth={24} onPress={onBikeTypeClick}>
                    <ui.Text variant='caption' marginBottom={0.5} children='ET' />
                    <ui.Stack row spacing alignItems='center'>
                        <ui.Text
                            variant='body2'
                            children={formatDurationShort(flattenDuration({ minutes: ride.autoFinish }))}
                            semiBold
                        />
                    </ui.Stack>
                </ui.Box>
            )}
        </ui.Stack>
    );
};

export const RideMetaScrollView: FC<RideMetaProps> = memo((props) => {
    return (
        <ui.ScrollView horizontal minWidth='100%' flexGrow={1} paddingHorizontal>
            <RideMeta {...props} />
        </ui.ScrollView>
    );
});

type FormatMetersProps = {
    title: string;
    value: number | undefined | null;
    loading?: boolean;
    onPress?: () => void;
    prefix?: string;
};

const FormatMeters: FC<FormatMetersProps> = memo(({ title, value, loading, onPress, prefix = '' }) => {
    const hasValue = value != null;
    const { border } = useTheme();

    return (
        <ui.Box flexCenter onPress={onPress}>
            <ui.Text variant='caption' children={title} marginBottom={0.5} />
            {loading ? (
                <ui.Spinner wh={14} color={border.color} />
            ) : (
                <ui.Text
                    variant={hasValue ? 'body2' : 'caption'}
                    children={`${prefix}${hasValue ? formatDistanceMeters(value) : '~'}`}
                    semiBold={hasValue}
                />
            )}
        </ui.Box>
    );
});
