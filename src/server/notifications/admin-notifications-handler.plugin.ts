import { Server, Plugin, } from '@hapi/hapi';
import { AdminNotificationsHandler$, } from './admin-notifications-handler.impl';

export const AdminNotificationsHandler: Plugin<unknown> = {
	name: 'adminNotificationsHandler',
	dependencies: ['mq', 'adminNotificationsTransport'],
	async register(server: Server): Promise<void> {
		await new AdminNotificationsHandler$(server).init();
	},
};
