import { RpcOutput } from '@findmyride/api';
import React, { FC } from 'react';
import { useInvalidate, useRpc } from '../../../api/rpc';
import { useLoadCallback } from '../../../hooks/useLoadingCallback';
import { icons, ui } from '../../../ui';
import { useTheme } from '../../../ui/ThemeProvider';
import { useFileUpload } from '../../files/useFileUpload';
import { useProfile } from '../../user/ProfileProvider';
import { useRideImagesScreen } from './RideImageScreen';

type RideImageGalleryProps = {
    ride: RpcOutput<'ride/get'>;
};

export const RideImageGallery: FC<RideImageGalleryProps> = ({ ride }) => {
    const { requireRegistration } = useProfile();
    const { uploadMultiple } = useFileUpload();
    const invalidate = useInvalidate();
    const openImage = useRideImagesScreen();
    const [attachImageReq] = useRpc('image/attach').useMutation();
    const [attachImage, loading] = useLoadCallback(() => {
        return uploadMultiple('photo').then((images) => {
            return attachImageReq({ fileIds: images.map((f) => f.id), rideId: ride.id }).then(() => {
                return invalidate(['image/ride_images']);
            });
        });
    });

    const getRideImagesReq = useRpc('image/ride_images').useQuery({ input: { rideId: ride.id } });
    const { font } = useTheme();

    return (
        <ui.Box flex>
            {getRideImagesReq.isSuccess ? (
                <ui.Box row flex flexWrap>
                    {(ride.participantStatus === 'approved' || ride.isOrganizer) && (
                        <ui.Box width='25%' borderWidth borderColor='#fff' bgPalette='tertiary'>
                            <ui.Box aspectRatio={1}>
                                {loading ? (
                                    <ui.Box flex flexCenter>
                                        <ui.Spinner wh={16} paletteColor='primary' />
                                    </ui.Box>
                                ) : (
                                    <ui.Box onPress={requireRegistration(attachImage)} flex flexCenter>
                                        <icons.Plus width={16} height={16} fill={font.variants.caption.color} />
                                        <ui.Text marginTop children='Add' variant='caption' />
                                    </ui.Box>
                                )}
                            </ui.Box>
                        </ui.Box>
                    )}

                    {getRideImagesReq.data.items.map((x) => (
                        <ui.Box
                            width='25%'
                            key={x.id}
                            borderWidth
                            borderColor='#fff'
                            onPress={() => openImage(x, getRideImagesReq.data.items)}
                        >
                            <ui.FileImage image={x.file} resizeMode='cover' aspectRatio={1} />
                        </ui.Box>
                    ))}
                </ui.Box>
            ) : (
                <ui.FetchFallback query={getRideImagesReq} spinner height={200} />
            )}
        </ui.Box>
    );
};
