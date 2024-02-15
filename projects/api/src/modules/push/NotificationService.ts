import { Logger } from '@untype/logger';
import { Filter } from '@untype/orm';
import { Pg } from '@untype/pg';
import { InternalError, assert } from '@untype/toolbox';
import deepmerge from 'deepmerge';
import admin from 'firebase-admin';
import { BaseMessage, Message } from 'firebase-admin/messaging';
import { singleton } from 'tsyringe';
import { Config } from '../../config';
import { UserDevice } from '../../entities';
import { PushNotification } from './NotificationWorker';

@singleton()
export class NotificationService {
    private firebase;

    public constructor(
        private logger: Logger,
        private pg: Pg,
        config: Config,
    ) {
        this.firebase = admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            databaseURL: config.firebase.databaseURL,
        });
    }

    public sendMessagesByUserSilent = (args: { userId: string; notification: PushNotification }) => {
        this.sendMessagesByUser(args).catch(this.logger.error);
    };

    public sendMessagesByUser = ({ userId, notification }: { userId: string; notification: PushNotification }) => {
        return this.sendMessagesByFilter({
            filter: { userId: { equalTo: userId } },
            notification,
        });
    };

    private sendMessagesByFilter = async ({
        filter,
        notification,
    }: {
        filter: Filter<UserDevice>;
        notification: PushNotification;
    }) => {
        const devices = await UserDevice.find(this.pg, {
            selector: ['fcmToken', 'userId'],
            filter: { ...filter, fcmToken: { isNull: false } },
        });

        return this.sendMessages({
            tokens: devices.map((x) => x.fcmToken).filter(assert.exists),
            notification,
        });
    };

    private sendMessages = async ({ tokens, notification }: { tokens: string[]; notification: PushNotification }) => {
        const defaults: BaseMessage = {
            apns: {
                headers: { 'apns-priority': '10' },
                payload: {
                    aps: {
                        sound: 'default',
                    },
                },
            },
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: '500',
                },
            },
            data: notification.action ? { action: JSON.stringify(notification.action) } : undefined,
            notification: { title: notification.title, body: notification.body },
        };

        const messages = tokens.map((token) => deepmerge.all<Message>([defaults, { token }]));
        if (!messages.length) {
            return;
        }

        try {
            await this.firebase.messaging().sendAll(messages);
        } catch (cause) {
            throw new InternalError('Unable to send a message', { cause });
        }
    };
}
