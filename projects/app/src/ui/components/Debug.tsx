import React, { FC, memo } from 'react';
import { Text } from './Text';

export const Debug: FC<{ value: unknown }> = memo(({ value }) => {
    return <Text tabular children={JSON.stringify(value, null, 2)} />;
});
