import { Alert } from 'react-native';

export * as ui from './components';
export * as icons from './icons';

export const withConfirm = ({ subtitle, title, action }: { title: string; subtitle: string; action: () => any }) => {
    return () => {
        return new Promise<any>((res, rej) => {
            Alert.alert(title, subtitle, [
                { text: 'Cancel', onPress: rej, style: 'cancel' },
                { text: 'OK', onPress: () => Promise.resolve(action()).then(res) },
            ]);
        });
    };
};
