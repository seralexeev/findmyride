import * as uuid from 'uuid';

export const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
export const v4 = uuid.v4;

export const isUUID = (uuid: unknown) => {
    return typeof uuid === 'string' && uuidRegex.test(uuid);
};
