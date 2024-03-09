import { RidePrivacy, RideVisibility } from '@findmyride/api';
import React, { FC, memo, useState } from 'react';
import { icons, ui } from '../../../ui';
import { useTheme } from '../../../ui/ThemeProvider';
import { useGoBackCallback } from '../../navigation/helpers';
import { getRidePrivacyConfig, getRideVisibilityConfig } from './utils';

type RideAdditionalOptionsScreen = {
    value: {
        privacy: RidePrivacy;
        visibility: RideVisibility;
        autoStart: boolean;
        autoFinish: number | null;
    };
    onChange: (value: { privacy: RidePrivacy; visibility: RideVisibility }) => void;
};

export const RideAdditionalOptionsScreen: FC<RideAdditionalOptionsScreen> = memo((props) => {
    const [value, setValue] = useState(props.value);
    const { colors, border } = useTheme();
    const onSave = useGoBackCallback(props.onChange);

    return (
        <ui.Screen
            name='RideAdditionalOptionsScreen'
            header='Additional Options'
            backgroundColor='#fff'
            headerRight={
                <ui.Button
                    onPress={() => onSave(value)}
                    borderVariant='round'
                    color='primary'
                    children='Save'
                    size='small'
                    haptic
                />
            }
        >
            <ui.Box flex padding={2}>
                <ui.Stack spacing={2} flex>
                    <ui.RadioGroup
                        items={RidePrivacy.options.map((x) => x.value)}
                        value={value.privacy}
                        keySelector={(x) => x}
                        renderItem={(x, isSelected) => {
                            const config = getRidePrivacyConfig(x);
                            return (
                                <ui.Box row>
                                    <config.Icon
                                        width={24}
                                        height={24}
                                        fill={isSelected ? colors.primary.background : border.color}
                                    />
                                    <ui.Box marginLeft={2}>
                                        <ui.Text children={config.title} semiBold={isSelected} />
                                        {config.description && <ui.Text children={config.description} variant='caption' />}
                                    </ui.Box>
                                </ui.Box>
                            );
                        }}
                        onChange={(privacy) => setValue((prev) => ({ ...prev, privacy }))}
                    />
                    <ui.Divider children='Visibility' marginTop />
                    <ui.RadioGroup
                        items={['anyone', 'link'] as RideVisibility[]}
                        value={value.visibility}
                        keySelector={(x) => x}
                        renderItem={(x, isSelected) => {
                            const config = getRideVisibilityConfig(x);
                            return (
                                <ui.Box row alignItems='center'>
                                    <config.Icon
                                        width={24}
                                        height={24}
                                        fill={isSelected ? colors.primary.background : border.color}
                                    />
                                    <ui.Box marginLeft={2}>
                                        <ui.Text children={config.title} semiBold={isSelected} />
                                    </ui.Box>
                                </ui.Box>
                            );
                        }}
                        onChange={(visibility) => setValue((prev) => ({ ...prev, visibility }))}
                    />
                    <ui.Divider children='Start / Finish' marginTop />

                    <ui.Box row justifyContent='space-between'>
                        <ui.Box row alignItems='center'>
                            <icons.Clock
                                width={24}
                                height={24}
                                fill={value.autoStart ? colors.primary.background : border.color}
                            />
                            <ui.Box marginLeft={2}>
                                <ui.Text children='Auto-Start' />
                            </ui.Box>
                        </ui.Box>
                        <ui.Switcher
                            onChange={(autoStart) => setValue((prev) => ({ ...prev, autoStart }))}
                            value={value.autoStart}
                        />
                    </ui.Box>
                </ui.Stack>
            </ui.Box>
        </ui.Screen>
    );
});
