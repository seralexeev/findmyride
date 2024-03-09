import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { FC, ReactNode } from 'react';
import { icons, ui } from '../../ui';
import { useBottomSheet } from '../../ui/BottomSheetProvider';

type DevScreenProps = {
    onSave?: () => void;
    onReset?: () => void;
};

export const DevScreen: FC<DevScreenProps> = ({ onSave, onReset }) => {
    // const { config, reset, env, setConfig } = useConfig();
    // const [local, setLocal] = useState(config);

    return (
        <ui.Box padding={2} flex paddingBottom={16}>
            <ui.Box flex>
                <ui.Text colorPalette='primary' children={'env'} semiBold />
                <ui.Text children='Api URL' variant='caption' marginBottom={0.5} />
                <ui.Input
                    // value={local.api.url}
                    color='tertiary'
                    // TODO: fixme
                    // onChangeText={(value) => setLocal((prev) => ({ ...prev, api: { ...prev.api, url: value } }))}
                />
            </ui.Box>

            <ui.Stack spacing>
                <ui.Button
                    children='Save'
                    onPress={() => {
                        // setConfig(local);
                        onSave?.();
                    }}
                    StartIcon={icons.Check}
                />
                <ui.Button children='Reset' onPress={() => AsyncStorage.clear()} color='secondary' StartIcon={icons.Clear} />
            </ui.Stack>
        </ui.Box>
    );
};

export const DevScreenHiddenAction: FC<{ children: ReactNode }> = ({ children }) => {
    const showBottomSheet = useBottomSheet();

    return (
        <ui.HiddenAction
            count={10}
            children={children}
            onAction={() => {
                showBottomSheet({
                    children: ({ close }) => <DevScreen onReset={close} onSave={close} />,
                    position: '90%',
                });
            }}
        />
    );
};
