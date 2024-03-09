import LottieView, { LottieViewProps } from 'lottie-react-native';
import { StylerProps, withStyler } from '../styler';
import { viewStyler } from '../styler/viewStyler';

export type LottieBoxProps = StylerProps<typeof viewStyler> & LottieViewProps;
export const LottieBox = withStyler(viewStyler)(LottieView);
