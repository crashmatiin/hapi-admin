import { Plugin, Server, } from '@hapi/hapi';
import { AdminNotificationInterface, } from './admin-notification-interface';
import { AdminNotificationsOptions, } from './admin-notifications-options';
import { AdminNotificationsTransport$, } from './admin-notifications-transport.impl';

declare module '@hapi/hapi' {
	// eslint-disable-next-line no-shadow
	export interface Server {
		/**
		 * Sends the given notification to users that are online.
		 *
		 * @param userIds - Identifiers of users to notify.
		 * @param notification - Notification to send.
		 */
		notifyOnlineAdmins(
			userIds: Iterable<string>,
			notification: AdminNotificationInterface,
		): Promise<unknown>;
	}
}

export const AdminNotificationsTransport: Plugin<AdminNotificationsOptions> = {
	name: 'adminNotificationsTransport',
	async register(server: Server, options?: AdminNotificationsOptions): Promise<void> {
		const notifier = await new AdminNotificationsTransport$(server, options).init();

		server.decorate('server', 'notifyOnlineAdmins', notifier.notifyOnlineAdmins.bind(notifier));
	},
};
