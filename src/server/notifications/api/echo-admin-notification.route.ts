import { AuthCredentials, Lifecycle, Request, ResponseToolkit, ServerRoute, } from '@hapi/hapi';
import { Admin, User, } from 'invest-models';
import { output, } from '../../utils';
import { AdminNotificationInterface, EchoAdminNotification, } from '../admin-notification-interface';
import { toAdminNotification, } from '../admin-notification.converter';
import { echoUserNotificationSchema, adminNotificationSchema, } from '../admin-notification.schema';
import { outputOkSchema, } from '../../schemas';
import { Output, } from '../../utils/utils.interfaces';

const echoUserNotification: Lifecycle.Method = async (
	request: Request,
	h: ResponseToolkit
): Promise<Output<AdminNotificationInterface>> => {
	const admin = request.auth.credentials as unknown as Admin;
	const echo = request.payload as EchoAdminNotification;

	const notification = await request.server.notifyAdmins({
		...echo,
		adminIds: [admin.id],
	});

	return output(toAdminNotification(notification));
};

export const echoAdminNotificationRoute: ServerRoute = {
	method: 'POST',
	path: '/notifications/echo',
	handler: echoUserNotification,
	options: {
		auth: 'jwt-access',
		tags: ['api', 'notifications', 'echo', 'test'],
		validate: {
			payload: echoUserNotificationSchema,
		},
		response: {
			schema: outputOkSchema(adminNotificationSchema),
		},
	},
};
