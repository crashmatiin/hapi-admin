import { Lifecycle, Request, ResponseToolkit, ServerRoute, } from '@hapi/hapi';
import { AdminNotification, File, NotificationAdmin, } from 'invest-models';
import { outputPagination, } from '../../utils';
import { OutputPagination, } from '../../utils/utils.interfaces';
import { AdminNotificationInterface, } from '../admin-notification-interface';
import { toAdminNotification, } from '../admin-notification.converter';
import { adminNotificationSchema, } from '../admin-notification.schema';
import { CommonListQuery, listSchema, outputPaginationSchema, } from '../../schemas';

const listUserNotifications: Lifecycle.Method = async (
	request: Request,
	h: ResponseToolkit
): Promise<OutputPagination<AdminNotificationInterface>> => {
	const admin = request.auth.credentials;
	const { order = {}, } = request.query as CommonListQuery;

	const { rows, count, } = await AdminNotification.findAndCountAll({
		include: [
			File,
			{
				model: NotificationAdmin,
				where: {
					adminId: admin.id,
				},
				required: true,
			}
		],
		distinct: true,
		order: Object.entries(order),
		logging: console.log,
	});

	return outputPagination(count, rows.map(toAdminNotification));
};

export const listAdminNotificationsRoute: ServerRoute = {
	method: 'GET',
	path: '/notifications',
	handler: listUserNotifications,
	options: {
		auth: 'jwt-access',
		tags: ['api', 'notifications'],
		description: 'Unread user notifications',
		validate: {
			query: listSchema,
		},
		response: {
			schema: outputPaginationSchema('notifications', adminNotificationSchema),
		},
	},
};
