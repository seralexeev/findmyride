import { array } from '@untype/toolbox';
import { formatDuration } from 'date-fns';
import React, { FC, memo } from 'react';
import { icons, ui } from '../../../ui';
import { useBottomSheetPicker } from '../../../ui/components';
import { flattenDuration } from '../../../ui/utils';

type EstimationSelectorProps = {
    value: number | null;
    onChange?: (autoFinish: number | null) => void;
};

const intervals = [0, ...array.range(1, 97).map((x) => x * 30)];
export const EstimationSelector: FC<EstimationSelectorProps> = memo(({ value, onChange }) => {
    const showPicker = useBottomSheetPicker();
    if (!onChange && !value) {
        return null;
    }

    return (
        <ui.Box marginBottom={2}>
            <ui.Box marginBottom={0.5} row justifyContent='space-between'>
                <ui.Text variant='caption' children='Estimated Time' />
            </ui.Box>
            <ui.Box row>
                <ui.Button
                    flex
                    color={onChange ? 'tertiary' : 'light'}
                    StartIcon={icons.Clock}
                    alignItems='flex-start'
                    onPress={() => {
                        if (onChange) {
                            showPicker({
                                title: 'Estimated Time',
                                items: intervals,
                                keySelector: (x) => String(x),
                                renderItem: (minutes) => {
                                    if (!minutes) {
                                        return '- no estimation -';
                                    }
                                    return formatDuration(flattenDuration({ minutes }), {
                                        format: ['days', 'hours', 'minutes'],
                                    });
                                },
                                value,
                                onChange: (autoFinish) => onChange?.(typeof autoFinish === 'string' ? null : autoFinish),
                            });
                        }
                    }}
                    children={
                        value
                            ? formatDuration(flattenDuration({ minutes: value }), {
                                  format: ['days', 'hours', 'minutes'],
                              })
                            : '- no estimation -'
                    }
                    caption={!value}
                />
            </ui.Box>
        </ui.Box>
    );
});
