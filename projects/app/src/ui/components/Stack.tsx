import React, { Children, FC, ReactNode } from 'react';
import { Box, BoxProps } from './Box';

export type StackProps = BoxProps & {
    spacing?: BoxProps['margin'];
    flexInside?: boolean;
    separator?: ReactNode;
    innerGrow?: true;
};

export const Stack: FC<StackProps> = ({ children, spacing = 0, separator, flexInside = false, innerGrow, ...props }) => {
    const inner = Children.toArray(children)
        .filter(Boolean)
        .map((x, i, ar) => {
            const item = flexInside ? <Box children={x} /> : x;
            const notLast = i !== ar.length - 1;

            return (
                <Box
                    key={i}
                    flexGrow={innerGrow ? 1 : 0}
                    marginRight={props.row && notLast ? spacing : 0}
                    marginBottom={!props.row && notLast ? spacing : 0}
                >
                    {item}
                    {notLast && separator}
                </Box>
            );
        });

    return <Box {...props} children={inner} />;
};
