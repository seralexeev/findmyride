import React, { FC, memo } from 'react';
import Hyperlink from 'react-native-hyperlink';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { ui } from '../../ui';
import { useScreen } from '../../ui/ScreenProvider';
import { TextInputScreen } from '../../ui/components';

type RideDescriptionProps = {
    title: string;
    value?: string | null;
    onChange?: (value: string) => void;
    validate?: (value: string | null) => boolean;
};

export const RideDescription = ({ title, onChange, value, validate }: RideDescriptionProps) => {
    const { showScreen } = useScreen();

    if (!onChange && !value) {
        return null;
    }

    const showChangeScreen = () => {
        showScreen({
            children: (
                <TextInputScreen
                    header={title}
                    value={value}
                    onChange={onChange}
                    numberOfLines={10}
                    multiline
                    validate={validate}
                />
            ),
        });
    };

    const onPress = onChange ? showChangeScreen : undefined;

    const text = <ui.Text children={value || title} colorVariant={value ? 'body1' : 'caption'} />;

    return (
        <ui.Box marginBottom={2}>
            <ui.Text children={title} variant='caption' marginBottom={0.5} />
            <ui.Box
                bgPalette={onPress ? 'tertiary' : 'light'}
                paddingHorizontal={onPress ? 1.25 : 0}
                paddingVertical={onPress ? 1 : 0}
                borderRadius
                onPress={onPress}
            >
                {onPress ? (
                    text
                ) : (
                    <Hyperlink linkStyle={{ color: '#06c' }} onPress={(url) => InAppBrowser.open(url)} children={text} />
                )}
            </ui.Box>
        </ui.Box>
    );
};

const validateLink = (value: string | null) => {
    if (!value) {
        return true;
    }

    try {
        new URL(value);
        return true;
    } catch (error) {
        return false;
    }
};

export const RideChatLink: FC<{ title: string; value?: string | null; onChange?: (value: string) => void }> = memo(
    ({ onChange, value, title }) => {
        return <RideDescription title={title} value={value} onChange={onChange} validate={validateLink} />;
    },
);
