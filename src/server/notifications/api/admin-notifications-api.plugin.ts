import { Plugin, Server, } from '@hapi/hapi';
import { echoAdminNotificationRoute, } from './echo-admin-notification.route';
import { listAdminNotificationsRoute, } from './admin-notifications-list.route';
import { readAdminNotificationsRoute, } from './admin-notifications-read.route';

export const AdminNotificationsApi: Plugin<unknown> = {
	name: 'adminNotificationsApi',
	dependencies: ['adminNotificationsEngine'],
	register(server: Server) {
		server.route([
			echoAdminNotificationRoute,
			listAdminNotificationsRoute,
			readAdminNotificationsRoute
		]);
	},
};
