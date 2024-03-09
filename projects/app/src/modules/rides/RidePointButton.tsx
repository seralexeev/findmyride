import { LocationWithName } from '@untype/geo';
import { FC, memo } from 'react';
import { showLocation } from 'react-native-map-link';
import { icons, ui } from '../../ui';
import { useSelectLocation } from '../map/services';

type RidePointButtonProps = {
    name: string;
    value: LocationWithName | null;
    onChange?: (value: LocationWithName) => void;
    required?: boolean;
};

export const RidePointButton: FC<RidePointButtonProps> = memo(({ value, onChange, name, required }) => {
    if (!onChange && !value) {
        return null;
    }

    const openMap = () => {
        if (value) {
            return showLocation({
                longitude: value.location.coordinates[0],
                latitude: value.location.coordinates[1],
                // title: value.name,
                alwaysIncludeGoogle: true,
            });
        }
    };

    return (
        <ui.Box marginBottom={2}>
            <ui.Box row justifyContent='space-between' marginBottom={0.5}>
                <ui.Text
                    variant='caption'
                    children={`${name} Location`}
                    flex
                    colorPalette={!value && required ? 'transparent' : undefined}
                />
                {value && (
                    <ui.Text
                        variant='caption'
                        selectable
                        numberOfLines={1}
                        children={`${value.location.coordinates[0]}, ${value.location.coordinates[1]}`}
                    />
                )}
            </ui.Box>
            <ui.Box row>
                {onChange ? (
                    <EditButton value={value} onChange={onChange} name={name} openMap={openMap} />
                ) : (
                    <ui.Button
                        children={value?.name}
                        onPress={openMap}
                        color='light'
                        flex
                        selectable
                        StartIcon={icons.Marker}
                        alignItems='flex-start'
                        fillIcon={false}
                        caption={!value}
                    />
                )}
            </ui.Box>
        </ui.Box>
    );
});

type EditButtonProps = {
    name: string;
    value?: LocationWithName | null;
    onChange: (value: LocationWithName) => void;
    openMap: () => void;
};

const EditButton: FC<EditButtonProps> = memo(({ value, onChange, name, openMap }) => {
    const selectLocation = useSelectLocation();
    const onPress = () => selectLocation({ value, onSelect: onChange });

    return (
        <ui.Box row flex>
            <ui.Button
                flex
                selectable
                color='tertiary'
                StartIcon={icons.Marker}
                alignItems='flex-start'
                fillIcon={false}
                onPress={onPress}
                children={value?.name ?? `Select ${name} Location`}
                caption={!value}
            />
            <ui.Button color='light' StartIcon={icons.Map} disabled={!value} fillIcon={false} marginLeft onPress={openMap} />
        </ui.Box>
    );
});
