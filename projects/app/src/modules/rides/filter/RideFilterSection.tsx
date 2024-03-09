import React, { FC, Fragment, ReactNode } from 'react';
import { ui } from '../../../ui';

type RideFilterSectionProps = {
    title: string;
    children: ReactNode;
};

export const RideFilterSection: FC<RideFilterSectionProps> = ({ title, children }) => {
    return (
        <Fragment>
            <ui.Text variant='caption' paddingHorizontal={2} children={title} />
            <ui.ScrollView horizontal paddingHorizontal>
                <ui.Stack spacing row padding children={children} />
            </ui.ScrollView>
        </Fragment>
    );
};
