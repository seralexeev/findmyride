import { Point } from '@untype/geo';
import { Context } from '../models/context';

export type ApiUser = {
    id: string;
    name: string | null;
    location: Point | null;
    isAnonymous: boolean;
    device: DeviceInfo;
};

export type ApiContext<TAuth extends boolean = false> = Context<TAuth> & {
    device: DeviceInfo;
};

export type WebDeviceInfo = {
    type: 'web';
    deviceId: string;
    os?: string;
    browser?: string;
};

export type MobileDeviceInfo = {
    type: 'mobile';
    deviceId: string;
    os: string;
    osVersion?: string;
    model?: string;

    manufacturer?: string;
    appName?: string;
    brand?: string;
    buildNumber?: string;
    bundleId?: string;
    deviceType?: string;
    seadableVersion?: string;
    version?: string;
    deviceName?: string;
    carrier?: string;
    ipAddress?: string;
    isEmulator?: boolean;
};

export type DeviceInfo = MobileDeviceInfo | WebDeviceInfo;
