import { RpcItemsOutput } from '@findmyride/api';
import BottomSheet from '@gorhom/bottom-sheet';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { FC, ReactNode, memo, useRef, useState } from 'react';
import { LayoutChangeEvent } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useInvalidate, useRpc } from '../../../api/rpc';
import { useUpdateEffect } from '../../../hooks/useUpdateEffect';
import { ui } from '../../../ui';
import { useScreen } from '../../../ui/ScreenProvider';
import { useBottomSheetHelper } from '../../../ui/components';
import { SplashScreenError } from '../../common/SplashScreenError';
import { useProfile } from '../../user/ProfileProvider';
import { RideImage } from './RideImage';
import { RideProfile } from './RideProfileScreen';

type ImageVm = RpcItemsOutput<'image/ride_images'>;
export const useRideImagesScreen = () => {
    const { showScreen } = useScreen();

    return (image: ImageVm, images?: ImageVm[]) => {
        showScreen({
            children: <RideImageScreen image={image} images={images} />,
        });
    };
};

const snapPoints = [200];
export const RideImageScreen: FC<{ image: ImageVm; images?: ImageVm[]; headerRight?: ReactNode }> = memo(
    ({ image, images, headerRight }) => {
        const list = images ?? [image];
        const { profile } = useProfile();
        const [menuSheetRef, menuSheetProps] = useBottomSheetHelper(snapPoints);
        const [mutateAsync] = useRpc('image/delete').useMutation();
        const { goBack } = useNavigation();
        const invalidate = useInvalidate();
        const ref = useRef<ScrollView>(null);
        const [imageOffset, setImageOffset] = useState<number | null>(null);

        useUpdateEffect(() => {
            if (imageOffset) {
                ref.current?.scrollTo({ y: imageOffset, animated: false });
            }
        }, [imageOffset]);

        return (
            <ui.Screen name='RideImageScreen' header='Image' white bottomSafeArea={false} headerRight={headerRight}>
                <ScrollView ref={ref}>
                    {list.map((x) => {
                        const onLayout =
                            x === image ? (event: LayoutChangeEvent) => setImageOffset(event.nativeEvent.layout.y) : undefined;

                        return (
                            <RideImage
                                image={x}
                                key={x.id}
                                onLayout={onLayout}
                                onDotsPress={() => menuSheetRef.current?.expand()}
                                withDots={profile.id === x.user.id}
                            />
                        );
                    })}
                </ScrollView>

                <BottomSheet
                    ref={menuSheetRef}
                    {...menuSheetProps}
                    backdropComponent={ui.BottomSheetBackdrop}
                    enablePanDownToClose
                    index={-1}
                >
                    <ui.Box borderBottomWidth borderColor>
                        <ui.Box paddingBottom={2} paddingTop row flexCenter>
                            <ui.Text variant='title2' center children='Actions' />
                        </ui.Box>
                    </ui.Box>
                    <ui.BottomSheetScrollView padding>
                        <ui.Button
                            children='Delete'
                            color='danger'
                            onPress={() => {
                                return mutateAsync({ imageId: image.id })
                                    .then(() => invalidate(['image/ride_images']))
                                    .then(() => goBack());
                            }}
                        />
                    </ui.BottomSheetScrollView>
                </BottomSheet>
            </ui.Screen>
        );
    },
);

export const LazyRideImageScreen = memo(() => {
    const route = useRoute<any>();
    const { showScreen } = useScreen();

    const query = useRpc('image/by_image_id').useQuery({
        input: { imageId: route.params.id },
    });

    if (!query.isSuccess) {
        return <ui.FetchFallback query={query} />;
    }

    const image = query.data.items.find((x) => x.id === route.params.id);
    if (!image) {
        return <SplashScreenError />;
    }

    return (
        <RideImageScreen
            image={image}
            images={query.data.items}
            headerRight={
                <ui.Button
                    round
                    size='small'
                    children='Go to Ride'
                    onPress={() =>
                        showScreen({
                            children: <RideProfile id={image.rideId} />,
                        })
                    }
                />
            }
        />
    );
});
