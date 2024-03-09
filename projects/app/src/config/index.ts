// The variables in the file are replaced using app/babel-plugin

declare const __IP_ADDRESS__: string;
declare const __ENV__: 'local' | 'prod';

export const ENV = __ENV__;
export const API_URL = ENV === 'local' ? `http://${__IP_ADDRESS__}:3000` : 'https://findmyride.app';
