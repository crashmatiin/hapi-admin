import { File, AdminNotification, } from 'invest-models';
import { AdminNotificationInterface, AdminNotificationFile, } from './admin-notification-interface';

export function toAdminNotificationFile(source: File): AdminNotificationFile {
	const { id, status, name, type, } = source;

	return {
		id,
		status,
		name,
		type,
	};
}

export function toAdminNotification(source: AdminNotification): AdminNotificationInterface {
	const { id, notification, type, data, files = [], createdAt, userId, } = source;

	return {
		id,
		notification,
		type,
		data,
		date: createdAt,
		userId,
		files: files.map((file) => toAdminNotificationFile(file)),
	};
}
