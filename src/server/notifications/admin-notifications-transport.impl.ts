/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Server, } from '@hapi/hapi';
import { ServerSubscriptionOptionsFilterOptions, } from '@hapi/nes';
import { Admin, } from 'invest-models';
import { AdminNotificationInterface, } from './admin-notification-interface';
import { AdminNotificationsOptions, } from './admin-notifications-options';

function UserNotifier$filterMessage(
	_path: string,
	_message: AdminNotificationInterface,
	options: ServerSubscriptionOptionsFilterOptions
): boolean {
	console.log(options);
	const { internal: userIds, } = options as unknown as { internal: Set<string> };
	const admin = options.credentials as Admin;
	const isOnline = admin && userIds.has(admin.id);
	if (isOnline) {
		console.debug(' [notifications] Notifying user', admin.id);
	} else {
		console.debug(' [notifications] Not notifying user', admin.id);
	}

	return isOnline;
}

export class AdminNotificationsTransport$ {
	private readonly _path: string;

	constructor(private readonly _server: Server, options: AdminNotificationsOptions = {}) {
		const { path = '/notifications', } = options;

		this._path = path;
	}

	async init(): Promise<this> {
		// @ts-ignore
		this._server.subscription(this._path, {
			auth: { mode: 'required', },
			filter: UserNotifier$filterMessage,
		});

		return this;
	}

	async notifyOnlineAdmins(
		userIds: Iterable<string>,
		notification: AdminNotificationInterface
	): Promise<void> {
		const admins = new Set(userIds);

		console.debug(` [notifications] Notifying online users ${admins}:`, notification);

		// @ts-ignore
		this._server.publish(this._path, notification, { internal: admins, });
	}
}
