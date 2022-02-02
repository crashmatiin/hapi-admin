export interface AdminNotificationsOptions {
	/**
	 * Notifications path on the server.
	 *
	 * Clients have to subscribe to this path in order to receive notifications.
	 *
	 * @default `/notifications'
	 */
	readonly path?: string | undefined;
}
