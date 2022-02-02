import { Plugin, Server, } from '@hapi/hapi';
import { checkLogEntry, } from './logging-manager';

export const LoggingPlugin: Plugin<null> = {
	name: 'logging',
	register: (server: Server) => {
		server.events.on('response', (event) => {
			const entry = checkLogEntry(event);
			if (entry) {
				server.mqSend('logs:write', entry);
			}
		});
	},
};
