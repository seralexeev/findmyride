import { useConfig } from '@app/modules/config/ConfigProvider';
import { RpcItemsOutput } from '@app/modules/rpc/useRpc';
import { useShareScreen } from '@app/modules/share/ShareScreen';
import { UserMediaCard } from '@app/modules/user/UserMediaCard';
import { icons, ui } from '@app/ui';
import { formatDistanceToNow } from 'date-fns';
import React, { VFC } from 'react';
import { LayoutChangeEvent } from 'react-native';
import Pinchable from 'react-native-pinchable';

type RideImageProps = {
    image: RpcItemsOutput<'getRideImages'>;
    onDotsPress: () => void;
    onLayout?: (event: LayoutChangeEvent) => void;
    withDots: boolean;
};

export const RideImage: VFC<RideImageProps> = ({ image, onDotsPress, onLayout, withDots }) => {
    const { config } = useConfig();
    const share = useShareScreen();

    return (
        <>
            <ui.Box padding onLayout={onLayout}>
                <UserMediaCard
                    user={image.user}
                    subtitle={`${formatDistanceToNow(new Date(image.createdAt))} ago`}
                    aux={
                        <ui.Box flex flexCenter row>
                            <ui.Button
                                borderVariant='round'
                                StartIcon={icons.Share}
                                color='transparent'
                                onPress={() =>
                                    share({
                                        title: 'Share Ride Image',
                                        message: `Ride Image by ${image.user.name}`,
                                        url: `${config.web.url}/photos/${image.id}`,
                                    })
                                }
                            />
                            {withDots && (
                                <ui.Button
                                    StartIcon={icons.Dots}
                                    borderVariant='round'
                                    color='transparent'
                                    onPress={onDotsPress}
                                    size='large'
                                />
                            )}
                        </ui.Box>
                    }
                />
            </ui.Box>
            <Pinchable>
                <ui.FileImage image={image.file} width='100%' />
            </Pinchable>
            <ui.Box padding>
                <ui.Text children={image.description} marginBottom />
            </ui.Box>
        </>
    );
};
