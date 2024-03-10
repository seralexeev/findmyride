import { RpcItemsOutput } from '@findmyride/api';
import { formatDistanceToNow } from 'date-fns';
import React, { FC, Fragment } from 'react';
import { LayoutChangeEvent } from 'react-native';
import Pinchable from 'react-native-pinchable';
import { useConfig } from '../../../config/ConfigProvider';
import { icons, ui } from '../../../ui';
import { useShareScreen } from '../../share/ShareScreen';
import { UserMediaCard } from '../../user/UserMediaCard';

type RideImageProps = {
    image: RpcItemsOutput<'image/ride_images'>;
    onDotsPress: () => void;
    onLayout?: (event: LayoutChangeEvent) => void;
    withDots: boolean;
};

export const RideImage: FC<RideImageProps> = ({ image, onDotsPress, onLayout, withDots }) => {
    const config = useConfig();
    const share = useShareScreen();

    return (
        <Fragment>
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
        </Fragment>
    );
};
