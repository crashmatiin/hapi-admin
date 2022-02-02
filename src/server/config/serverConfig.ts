import { ServerOptions, } from '@hapi/hapi';
import * as Qs from 'qs';
import config from './config';

const options: ServerOptions = {
	port: config.server.port,
	host: config.server.host,
	query: {
		parser: (query) => Qs.parse(query),
	},
	routes: {
		validate: {
			options: {
				// Handle all validation errors
				abortEarly: false,
			},
			// failAction: handleValidationError,
		},
		response: {
			failAction: 'log',
		},
	},
};

export default options;
