import { Lifecycle, ServerRoute, } from '@hapi/hapi';
import { NotificationUser, User, UserNotificationStatus, } from 'invest-models';
import Joi = require('joi');
import { Op, } from 'sequelize';
import { error, output, } from '../../utils';
import { Errors, } from '../../utils/errors';
import { outputOkSchema, } from '../../schemas';

interface ReadNotificationsPayload {
	ids: Array<string>;
}

const readUserNotifications: Lifecycle.Method = async (r) => {
	try {
		const admin = r.auth.credentials;
		const { ids, } = r.payload as ReadNotificationsPayload;

		await NotificationUser.update(
			{
				status: UserNotificationStatus.Read,
			},
			{
				where: {
					adminId: admin.id,
					notificationId: {
						[Op.in]: ids,
					},
				},
			}
		);

		return output({ msg: 'Ok', });
	} catch (err) {
		console.log('Failed to read admin notification', err);
		return error(Errors.InternalServerError, 'Internal server error', {});
	}
};

export const readAdminNotificationsRoute: ServerRoute = {
	method: 'PUT',
	path: '/notifications/read',
	handler: readUserNotifications,
	options: {
		auth: 'jwt-access',
		tags: ['api', 'notifications'],
		description: 'Read admin notifications',
		validate: {
			payload: Joi.object({
				ids: Joi.array().items(Joi.string().uuid()).required(),
			}),
		},
		response: {
			schema: outputOkSchema(Joi.boolean()),
		},
	},
};
