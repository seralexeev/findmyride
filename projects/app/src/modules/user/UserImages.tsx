import React, { FC, memo } from 'react';
import { useRpc } from '../../api/rpc';
import { ui } from '../../ui';
import { useRideImagesScreen } from '../rides/view/RideImageScreen';

type UserImagesProps = {
    userId: string;
};

export const UserImages: FC<UserImagesProps> = memo(({ userId }) => {
    const imagesReq = useRpc('social/get_user_photos').useQuery({ input: { userId, page: 1 } });
    const openImage = useRideImagesScreen();

    if (!imagesReq.isSuccess) {
        return <ui.FetchFallback query={imagesReq} spinner />;
    }

    if (!imagesReq.data.items.length) {
        return <ui.Empty children='No Rides' />;
    }

    return (
        <ui.Box row flex flexWrap>
            {imagesReq.data.items.map((x) => (
                <ui.Box
                    width='25%'
                    key={x.file.id}
                    borderWidth
                    borderColor='#fff'
                    onPress={() => openImage(x, imagesReq.data.items)}
                >
                    <ui.FileImage image={x.file} resizeMode='cover' aspectRatio={1} />
                </ui.Box>
            ))}
        </ui.Box>
    );
});
