import { delay } from 'packages/toolbox/src/promise';
import React, { VFC } from 'react';
import { ScrollView } from 'react-native';
import { ui } from '../../ui';
import { useProfile } from '../user/ProfileProvider';

const image = {
    id: 'e05e3748-4f52-44db-8e95-d18eefc067a8',
    imageSizes: {
        orig: {
            url: 'https://nplus1rides.fra1.digitaloceanspaces.com/images/e05e3748-4f52-44db-8e95-d18eefc067a8/orig',
            width: 305,
            height: 135,
            mimeType: 'image/png',
        },
        large: {
            url: 'https://nplus1rides.fra1.digitaloceanspaces.com/images/e05e3748-4f52-44db-8e95-d18eefc067a8/large',
            width: 1280,
            height: 567,
            mimeType: 'image/png',
        },
        small: {
            url: 'https://nplus1rides.fra1.digitaloceanspaces.com/images/e05e3748-4f52-44db-8e95-d18eefc067a8/small',
            width: 128,
            height: 57,
            mimeType: 'image/png',
        },
        medium: {
            url: 'https://nplus1rides.fra1.digitaloceanspaces.com/images/e05e3748-4f52-44db-8e95-d18eefc067a8/medium',
            width: 512,
            height: 227,
            mimeType: 'image/png',
        },
    },
};

export const Showcase: VFC = () => {
    const { logout } = useProfile();
    return (
        <ui.Screen padding name='Showcase'>
            <ui.Button onPress={logout}>Logout</ui.Button>
            <ScrollView>
                <ui.Stack spacing={2}>
                    <ui.Stack spacing>
                        <ui.Text>Default</ui.Text>
                        <ui.Text variant='title1'>Title 1</ui.Text>
                        <ui.Text variant='subtitle1'>Subtitle 1</ui.Text>
                        <ui.Text variant='title2'>Title 2</ui.Text>
                        <ui.Text variant='subtitle2'>Subtitle 2</ui.Text>
                        <ui.Text variant='body1'>Body 1</ui.Text>
                        <ui.Text variant='body2'>Body 2</ui.Text>
                        <ui.Text variant='caption'>Caption</ui.Text>
                    </ui.Stack>
                    <ui.Stack row spacing innerGrow>
                        {/* <ui.Box aspectRatio={1} backgroundColor='red' flex />
                        <ui.Box aspectRatio={1} backgroundColor='blue' />
                        <ui.Box aspectRatio={1} backgroundColor='yellow' /> */}
                        <ui.FileImage image={image} width={10} height={20} />
                        <ui.FileImage image={image} />
                    </ui.Stack>
                    {(
                        ['light', 'transparent', 'primary', 'secondary', 'tertiary', 'success', 'warning', 'danger'] as const
                    ).map((color) =>
                        (['small', 'medium', 'large'] as const).map((size) =>
                            (['default', 'round'] as const).map((border) =>
                                (['Press', undefined] as const).map((children) => (
                                    <ui.ScrollView key={`${color}-${size}-${border}-${children}`} horizontal paddingHorizontal>
                                        <ui.Stack spacing row>
                                            <ui.Button
                                                size={size}
                                                borderVariant={border}
                                                children={children}
                                                onPress={() => delay(1000)}
                                                haptic
                                                color={color}
                                            />
                                            <ui.Button
                                                size={size}
                                                borderVariant={border}
                                                children={children}
                                                onPress={() => delay(1000)}
                                                // StartIcon={(props) => <Iconify icon='fluent-emoji:baby-chick' {...props} />}
                                                haptic
                                                color={color}
                                            />
                                            <ui.Button
                                                size={size}
                                                borderVariant={border}
                                                children={children}
                                                onPress={() => delay(1000)}
                                                // EndIcon={(props) => <Iconify icon='fluent-emoji:baby-chick' {...props} />}
                                                haptic
                                                color={color}
                                            />
                                            <ui.Button
                                                size={size}
                                                borderVariant={border}
                                                children={children}
                                                onPress={() => delay(1000)}
                                                // StartIcon={(props) => <Iconify icon='fluent-emoji:baby-chick' {...props} />}
                                                // EndIcon={(props) => <Iconify icon='fluent-emoji:baby-chick' {...props} />}
                                                haptic
                                                color={color}
                                            />
                                        </ui.Stack>
                                    </ui.ScrollView>
                                )),
                            ),
                        ),
                    )}
                </ui.Stack>
            </ScrollView>
        </ui.Screen>
    );
};
