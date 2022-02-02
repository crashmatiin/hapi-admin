import { Plugin, Server, } from '@hapi/hapi';
import { AdminNotification, } from 'invest-models';
import { DraftAdminNotification, } from './admin-notification-interface';
import { AdminNotificationsEngine$, } from './admin-notifications-engine.impl';

declare module '@hapi/hapi' {
	// eslint-disable-next-line no-shadow
	export interface Server {
		/**
		 * Creates notification and sends it to users.
		 *
		 * @param draft - A draft of notification to send.
		 *
		 * @returns A promise resolved to created notification instance.
		 */
		notifyAdmins(draft: DraftAdminNotification): Promise<AdminNotification>;
	}
}

export const AdminNotificationsEngine: Plugin<unknown> = {
	name: 'adminNotificationsEngine',
	register(server: Server) {
		const processor = new AdminNotificationsEngine$(server);

		server.decorate('server', 'notifyAdmins', processor.notifyAdmins.bind(processor));
	},
};
