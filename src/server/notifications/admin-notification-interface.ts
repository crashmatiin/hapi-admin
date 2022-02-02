export interface AdminNotificationFile {
	readonly id: string;
	readonly status: string;
	readonly name: string;
	readonly type: string;
}

export interface DraftAdminNotification {
	readonly adminIds: readonly string[];
	readonly notification: string;
	readonly type: string;
	readonly data?: unknown | undefined;
	readonly userId?: unknown | undefined;
	readonly fileIds?: readonly string[] | undefined;
}

export type EchoAdminNotification = Omit<DraftAdminNotification, 'adminIds'>;

export interface AdminNotificationInterface {
	readonly id: string;
	readonly notification: string;
	readonly type: string;
	readonly data: unknown;
	readonly date: string;
	readonly files: readonly AdminNotificationFile[];
	readonly userId: string;
}
