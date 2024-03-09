import { useAnonymousGuard } from '@app/modules/auth/services';
import { useImagesUpload } from '@app/modules/files/services';
import { useRideImagesScreen } from '@app/modules/rides/view/RideImageScreen';
import { RpcOutput, useInvalidate, useRpc } from '@app/modules/rpc/useRpc';
import { icons, ui } from '@app/ui';
import { useLoadCallback, useUIConfig } from '@flstk/react-core';
import React, { VFC } from 'react';

type RideImageGalleryProps = {
    ride: RpcOutput<'getRide'>;
};

export const RideImageGallery: VFC<RideImageGalleryProps> = ({ ride }) => {
    const uploadImages = useImagesUpload();
    const invalidate = useInvalidate();
    const openImage = useRideImagesScreen();
    const { mutateAsync: attachImageReq } = useRpc('attachRideImage').useMutation();
    const [attachImage, loading] = useLoadCallback(() => {
        return uploadImages().then((images) => {
            return attachImageReq({ fileIds: images.map((f) => f.id), rideId: ride.id }).then(() => {
                return invalidate(['getRideImages']);
            });
        });
    });

    const getRideImagesReq = useRpc('getRideImages').useQuery({ input: { rideId: ride.id } });
    const { voidGuard } = useAnonymousGuard();
    const { font } = useUIConfig();

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
                                    <ui.Box onPress={voidGuard(attachImage)} flex flexCenter>
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
