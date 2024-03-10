import { BikeType } from '@findmyride/api';
import React, { useState } from 'react';
import { ui } from '../../../ui';
import { memos } from '../../../ui/utils';
import { useGoBackCallback } from '../../navigation/helpers';
import { BikeTypeIcon, getBikeTypeTitle } from '../BikeTypeIcon';

type BikeTypeSelectorProps = {
    value?: BikeType | null;
    onChange: (bikeType: BikeType) => void;
};

export const BikeTypeSelector = memos(
    ({ value, onChange }: BikeTypeSelectorProps) => {
        return (
            <ui.Box>
                <ui.RadioGroup
                    items={BikeType.options.map((x) => x.value)}
                    value={value}
                    keySelector={(x) => x}
                    renderItem={(x, isSelected) => (
                        <ui.Box row alignItems='center'>
                            <BikeTypeIcon type={x} size={24} active={isSelected} />
                            <ui.Text marginLeft={2} children={getBikeTypeTitle(x)} variant='body2' semiBold={isSelected} />
                        </ui.Box>
                    )}
                    onChange={onChange}
                />
            </ui.Box>
        );
    },
    {
        Screen: function BikeTypeSelectorScreen(props: BikeTypeSelectorProps) {
            const [value, setValue] = useState<BikeType | null>(props.value ?? null);
            const onSave = useGoBackCallback(props.onChange);

            return (
                <ui.Screen
                    name='BikeTypeSelectorScreen'
                    header='Bike Type'
                    backgroundColor='#fff'
                    headerRight={
                        <ui.Button
                            onPress={() => {
                                if (value) {
                                    return onSave(value);
                                }
                            }}
                            borderVariant='round'
                            color='primary'
                            children='Save'
                            size='small'
                            disabled={!value}
                            haptic
                        />
                    }
                >
                    <ui.Box padding={2} flex>
                        <BikeTypeSelector value={value} onChange={setValue} />
                    </ui.Box>
                </ui.Screen>
            );
        },
    },
);
