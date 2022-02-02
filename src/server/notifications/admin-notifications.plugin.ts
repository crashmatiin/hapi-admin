import { Plugin, Server, } from '@hapi/hapi';
import { AdminNotificationsApi, } from './api';
import { AdminNotificationsEngine, } from './admin-notifications-engine.plugin';
import { AdminNotificationsHandler, } from './admin-notifications-handler.plugin';
import { AdminNotificationsOptions, } from './admin-notifications-options';
import { AdminNotificationsTransport, } from './admin-notifications-transport.plugin';

export const AdminNotifications: Plugin<AdminNotificationsOptions> = {
	name: 'adminNotifications',
	async register(server: Server, options?: AdminNotificationsOptions): Promise<void> {
		await server.register([
			{ plugin: AdminNotificationsApi, },
			{ plugin: AdminNotificationsEngine, },
			{ plugin: AdminNotificationsHandler, },
			{ plugin: AdminNotificationsTransport, options, }
		]);
	},
};
