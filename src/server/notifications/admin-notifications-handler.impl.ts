import { Server, } from '@hapi/hapi';
import { DraftAdminNotification, } from './admin-notification-interface';
import { queryRecipients, } from './api/admin-notification.recipients';

export class AdminNotificationsHandler$ {
	// eslint-disable-next-line no-useless-constructor
	constructor(private readonly _server: Server) {}

	async init(): Promise<this> {
		await this._server.mqSubscribe('admin-notifications', this.notifyAdmins.bind(this));
		return this;
	}

	private async notifyAdmins(_draft: DraftAdminNotification): Promise<void> {
		const adminIds = await queryRecipients(this._server);
		const draft = { ..._draft, adminIds, };
		await this._server.notifyAdmins(draft);
	}
}
