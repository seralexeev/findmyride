import Axios from 'axios';
import { FC, ReactNode, memo } from 'react';
import { ui } from '..';
import { SplashLoader } from '../../modules/common/SplashLoader';
import { SplashScreenError } from '../../modules/common/SplashScreenError';
import { Theme } from '../theme';

type FetchFallbackProps = {
    query:
        | { status: 'pending'; data?: undefined; error?: unknown; refetch?: () => void }
        | { status: 'error'; data?: unknown; error?: unknown; refetch?: () => void };
    children?: ReactNode;
    height?: number;
    spinner?: boolean;
    spinnerSize?: number;
    spinnerColor?: keyof Theme['colors'];
};

export const FetchFallback: FC<FetchFallbackProps> = memo(({ query, children, spinner, height, spinnerColor, spinnerSize }) => {
    const isCanceled = Axios.isCancel(query.error);

    if (query.status === 'pending' || isCanceled) {
        return children ? (
            children
        ) : spinner ? (
            <ui.Box flexCenter height={height} flex>
                <ui.Spinner wh={spinnerSize} paletteColor={spinnerColor} />
            </ui.Box>
        ) : (
            <SplashLoader />
        );
    }

    return <SplashScreenError error={query.error} refetch={query.refetch} />;
});
