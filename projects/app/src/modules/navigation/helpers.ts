import { useNavigation } from '@react-navigation/native';

export const withGoBack = <T, P extends any[]>(goBack: () => void, callback: ((...args: P) => T) | undefined | null) => {
    return async (...args: P) => {
        const res = await Promise.resolve(callback?.(...args));
        goBack();
        return res;
    };
};

export const useGoBackCallback = <T, P extends any[]>(callback: ((...args: P) => T) | undefined | null) => {
    const { goBack } = useNavigation();

    return withGoBack(goBack, callback);
};
