import React, { FC, ReactNode, useEffect, useState } from 'react';
import { ui } from '..';
import { useGoBackCallback } from '../../modules/navigation/helpers';

type TextInputScreenProps = {
    header: ReactNode;
    multiline?: boolean;
    numberOfLines?: number;
    value?: string | null;
    onChange?: (value: string) => void;
    validate?: (value: string | null) => boolean | Promise<boolean>;
    hint?: ReactNode;
};

export const TextInputScreen: FC<TextInputScreenProps> = ({
    onChange,
    value,
    header,
    multiline,
    numberOfLines,
    validate = () => true,
    hint,
}) => {
    const [text, setText] = useState(value ?? '');
    const onChangeAndBack = useGoBackCallback(onChange);
    const [isValid, setIsValid] = useState<boolean>();
    const [validating, setValidating] = useState(true);

    useEffect(() => {
        setValidating(true);
        void Promise.resolve(validate(text))
            .then(setIsValid, () => setIsValid(false))
            .finally(() => setValidating(false));
    }, [text]);

    return (
        <ui.Screen
            name='TextInputScreen'
            white
            header={header}
            headerRight={
                <ui.Button
                    haptic
                    size='small'
                    children='Save'
                    borderVariant='round'
                    onPress={() => onChangeAndBack(text)}
                    disabled={!isValid}
                    loading={validating}
                />
            }
        >
            <ui.Box padding>
                <ui.Input
                    numberOfLines={numberOfLines}
                    multiline={multiline}
                    color='tertiary'
                    value={text}
                    onChangeText={setText}
                    autoFocus
                />
                {typeof hint === 'string' ? <ui.Text children={hint} variant='caption' marginTop={0.5} /> : hint}
            </ui.Box>
        </ui.Screen>
    );
};
