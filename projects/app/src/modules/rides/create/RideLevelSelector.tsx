import { RiderLevel } from '@findmyride/api';
import { capitalCase } from 'change-case';
import React, { useState } from 'react';
import { ui } from '../../../ui';
import { memos } from '../../../ui/utils';
import { useGoBackCallback } from '../../navigation/helpers';
import { RiderLevelIcon } from '../RiderLevelIcon';

type RiderLevelSelectorProps = {
    value: RiderLevel;
    onChange?: (riderLevel: RiderLevel) => void;
};

export const RiderLevelSelector = memos(
    ({ value, onChange }: RiderLevelSelectorProps) => {
        return (
            <ui.Box>
                <ui.Text variant='caption'>Rider Level</ui.Text>
                <ui.RadioGroup
                    items={RiderLevel.options.map((x) => x.value)}
                    value={value}
                    keySelector={(x) => x}
                    renderItem={(x, isSelected) => (
                        <ui.Box row alignItems='center' paddingHorizontal>
                            <RiderLevelIcon level={x} size={20} />
                            <ui.Text marginLeft={2} children={capitalCase(x)} variant='body2' semiBold={isSelected} flex />
                        </ui.Box>
                    )}
                    onChange={onChange}
                />
            </ui.Box>
        );
    },
    {
        Screen: function RiderLevelSelectorScreen(props: RiderLevelSelectorProps) {
            const [value, setValue] = useState(props.value);
            const onSave = useGoBackCallback(props.onChange);

            return (
                <ui.Screen
                    name='RiderLevelSelectorScreen'
                    header='Rider Level'
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
                    <ui.Box padding={2} flex>
                        <RiderLevelSelector value={value} onChange={setValue} />
                    </ui.Box>
                </ui.Screen>
            );
        },
    },
);
