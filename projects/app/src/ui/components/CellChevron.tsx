import { FC } from 'react';
import { useTheme } from '../ThemeProvider';

export const CellChevron: FC = () => {
    const { border } = useTheme();

    // TODO fixme
    return null; // <Iconify icon='chevron-right' width={32} height={32} fill={border.color} style={{ marginRight: -16 }} />;
};
