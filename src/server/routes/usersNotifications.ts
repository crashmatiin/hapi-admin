import { ServerRoute, } from '@hapi/hapi';
import {
	outputPaginationSchema,
	usersNotificationsListSchema,
	userNotificatonsSchema,
	userNotificationsCreateSchema,
} from '../schemas';

import api from '../api';

const routes: ServerRoute[] = [
	{
		method: 'GET',
		path: '/users/notifications',
		handler: api.usersNotifications.listUsersNotifications,
		options: {
			tags: ['api', 'auth', 'users', 'usersNotifications'],
			app: {
				tag: 2120,
			},
			validate: {
				query: usersNotificationsListSchema,
			},
			response: {
				schema: outputPaginationSchema('usersNotifications', userNotificatonsSchema),
			},
		},
	},
	{
		method: 'POST',
		path: '/users/notifications',
		handler: api.usersNotifications.sendUsersNotification,
		options: {
			tags: ['api', 'auth', 'users', 'notifications'],
			validate: {
				payload: userNotificationsCreateSchema,
			},
		},
	},
	{
		method: 'GET',
		path: '/notifications/types',
		handler: api.usersNotifications.getNotificationTypes,
		options: {
			tags: ['api', 'auth', 'notifications'],
		},
	}
];
export default routes;
