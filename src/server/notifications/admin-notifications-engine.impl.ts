import { Server, } from '@hapi/hapi';
import { AdminNotification, AdminNotificationFile, NotificationAdmin, } from 'invest-models';
import { DraftAdminNotification, } from './admin-notification-interface';
import { toAdminNotification, } from './admin-notification.converter';

export class AdminNotificationsEngine$ {
	// eslint-disable-next-line no-useless-constructor
	constructor(private readonly _server: Server) {}

	async notifyAdmins(draft: DraftAdminNotification): Promise<AdminNotification> {
		const notification = await this.createNotification(draft);

		// @ts-ignore
		await this._server.notifyOnlineAdmins(draft.adminIds, toAdminNotification(notification));

		return notification;
	}

	private async createNotification(draft: DraftAdminNotification): Promise<AdminNotification> {
		// @ts-ignore
		const sequelize = this._server.app.db;
		const transaction = await sequelize.transaction();

		try {
			const notification = await AdminNotification.create(
				{
					notification: draft.notification,
					type: draft.type,
					data: draft.data,
					userId: draft.userId,
				},
				{
					transaction,
				}
			);
			const notificationId = notification.id;
			const { adminIds, fileIds = [], } = draft;

			await Promise.all([
				NotificationAdmin.bulkCreate(
					adminIds.map((adminId) => ({
						notificationId,
						adminId,
					})),
					{
						transaction,
					}
				),
				AdminNotificationFile.bulkCreate(
					fileIds.map((fileId) => ({
						notificationId,
						fileId,
					})),
					{
						transaction,
					}
				)
			]);

			await transaction.commit();

			return notification;
		} catch (error) {
			await transaction.rollback();
			throw error;
		}
	}
}
