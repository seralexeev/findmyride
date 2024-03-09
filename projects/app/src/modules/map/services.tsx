import React from 'react';
import { useScreen } from '../../ui/ScreenProvider';
import { withGoBack } from '../navigation/helpers';
import { SelectLocationScreen, SelectLocationScreenProps } from './SelectLocationScreen';

export const useSelectLocation = () => {
    const { showScreen } = useScreen();

    return (props: SelectLocationScreenProps) => {
        return showScreen({
            children: ({ goBack }) => <SelectLocationScreen {...props} onSelect={withGoBack(goBack, props.onSelect)} />,
        });
    };
};
