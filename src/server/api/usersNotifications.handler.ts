import { File, NotificationType, NotificationUser, } from 'invest-models';
import * as Hapi from '@hapi/hapi';
import { IOutputOk, } from 'server/interfaces';
import { Boom, } from '@hapi/boom';
import { OutputPagination, } from '../utils/utils.interfaces';
import { error, output, outputPagination, } from '../utils';
import { queryUsersByGroups, queryUsersNotifications, } from '../core/operations/usersNotifications';
import { handlerError, } from '../utils/error';
import { CreateUsersNotificationPayload, } from '../core/types/usersNotifications';
import { Errors, } from '../utils/errors';

export async function getNotificationTypes(): Promise<IOutputOk<Array<string>>> {
	const notificationTypes: Array<string> = Object.keys(NotificationType).map(
		(key) => NotificationType[key]
	);

	return output(notificationTypes);
}

async function listUsersNotifications(
	r: Hapi.Request
): Promise<OutputPagination<NotificationUser> | Boom> {
	try {
		const { count, rows, } = await queryUsersNotifications(r.query);

		return outputPagination(count, rows);
	} catch (err) {
		return handlerError('Failed to list users notifications', err);
	}
}

async function sendUsersNotification(
	r: Hapi.Request
): Promise<IOutputOk<{ message: string }> | Boom> {
	try {
		const { message, recipients, groups, files, broadcast, } =
			r.payload as CreateUsersNotificationPayload;
		if (!(recipients || groups || broadcast)) {
			return error(Errors.NotAcceptable, 'No recipients specified');
		}

		const userIds = [];
		if (broadcast || groups) {
			const users = await queryUsersByGroups(broadcast ? null : groups);
			userIds.push(...users.map((user) => user.id));
		} else {
			userIds.push(...recipients);
		}

		if (files) {
			files.map(async (file) => {
				await File.create({
					id: file.id,
					name: file.name,
					type: 'notification',
				});
			});
		}

		await r.server.mqSend('notifications', {
			userIds,
			notification: message,
			type: NotificationType.ADMINMESSAGE,
			fileIds: files ? files.map((file) => file.id) : [],
		});
		return output({ message: 'Notification has been sent', });
	} catch (err) {
		return handlerError('Failed to send notifications', err);
	}
}

export { listUsersNotifications, sendUsersNotification, };
