import { Server, } from '@hapi/hapi';
import * as Basic from '@hapi/basic';
import * as Inert from '@hapi/inert';
import * as Nes from '@hapi/nes';
import * as Vision from '@hapi/vision';
import * as Pino from 'hapi-pino';
import * as HapiRbac from 'hapi-rbac';
import * as HapiBearer from 'hapi-auth-bearer-token';
import * as HapiPulse from 'hapi-pulse';
import * as HapiSwagger from 'hapi-swagger';
import Qs from 'qs';
import { Database, DatabaseOptions, loadDatabaseConfig, } from 'invest-models';
import { Mq, } from 'mq-plugin';
import { FileService, loadFileServiceConfig, } from 'fs-plugin';
import config from './server/config/config';
import loadPinoConfig from './server/config/pino';
import loadSwaggerConfig from './server/config/swagger';
import { LoggingPlugin, } from './server/logging/logging.plugin';
import routes from './server/routes';
import { handleValidationError, responseHandler, } from './server/utils';
import { simpleTokenValidate, Token, tokenValidate, } from './server/utils/auth';

declare module '@hapi/hapi' {
	export interface PluginSpecificConfiguration {
		rbac: {
			apply: string;
			rules: {
				effect: string;
			}[];
		};
	}
}

export async function init(): Promise<Server> {
	const server = new Server({
		port: config.server.port,
		host: config.server.host,
		query: {
			parser: (query) => Qs.parse(query),
		},
		routes: {
			cors: config.cors,
			validate: {
				options: {
					// Handle all validation errors
					abortEarly: false,
				},
				failAction: handleValidationError,
			},
			response: {
				failAction: 'log',
			},
		},
	});
	server.realm.modifiers.route.prefix = '/api';
	// Регистрируем расширения
	await server.register([Basic, Nes, Inert, Vision, HapiBearer]);
	await server.register({
		plugin: Pino,
		options: loadPinoConfig(false),
	});
	await server.register({
		plugin: HapiSwagger,
		options: loadSwaggerConfig,
	});
	await server.register({
		plugin: HapiPulse,
		options: {
			timeout: 15000,
			signals: ['SIGINT'],
		},
	});
	await server.register<DatabaseOptions>({
		plugin: Database,
		options: {
			...loadDatabaseConfig(),
			dialect: 'postgres',
		},
	});
	await server.register({
		plugin: LoggingPlugin,
	});
	await server.register({
		plugin: Mq,
		options: {
			mqUrl: config.mqUrl,
		},
	});
	await server.register({
		plugin: FileService,
		options: loadFileServiceConfig(),
	});
	await server.register({
		plugin: HapiRbac,
		options: {
			responseCode: {
				onDeny: 403,
			},
		},
	});
	// JWT Auth
	server.auth.strategy('jwt-access', 'bearer-access-token', {
		validate: tokenValidate(Token.Access),
	});
	server.auth.strategy('jwt-refresh', 'bearer-access-token', {
		validate: tokenValidate(Token.Refresh),
	});
	server.auth.strategy('simple-jwt-access', 'bearer-access-token', {
		validate: simpleTokenValidate(Token.Access),
	});
	server.auth.default('jwt-access');

	// Загружаем маршруты
	server.route(routes);

	// Error handler
	server.ext('onPreResponse', responseHandler);

	// Запускаем сервер
	try {
		await server.start();
		server.log('info', `Server running at: ${server.info.uri}`);
		server.log('info', 'Node.js version ' + process.versions.node);
	} catch (err) {
		server.log('error', JSON.stringify(err));
	}

	return server;
}

try {
	// eslint-disable-next-line @typescript-eslint/no-floating-promises
	if (!config.test) init();
} catch (err) {
	console.error(err);
}
