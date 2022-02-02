import { config, } from 'dotenv';

config();

export default {
	baseUrl: process.env.DOMAIN_NAME,
	auth: {
		jwt: {
			access: {
				secret: process.env.AUTH_JWT_ACCESS_SECRET,
				lifetime: Number(process.env.AUTH_JWT_ACCESS_LIFETIME),
			},
			refresh: {
				secret: process.env.AUTH_JWT_REFRESH_SECRET,
				lifetime: Number(process.env.AUTH_JWT_REFRESH_LIFETIME),
			},
		},
		restorePassTimeout: 120,
		restorePassTokenLive: 3600,
	},
	cors: {
		origin: process.env.CORS_ORIGINS ? (JSON.parse(process.env.CORS_ORIGINS) as string[]) : ['*'],
		maxAge: process.env.CORS_MAX_AGE ? Number(process.env.CORS_MAX_AGE) : 600,
		headers: process.env.CORS_HEADERS
			? (JSON.parse(process.env.CORS_HEADERS) as string[])
			: ['Accept", "Content-Type", "Authorization", "Confirmation'],
		credentials: process.env.CORS_ALLOW_CREDENTIALS === 'true' ? true : false,
		exposedHeaders: process.env.CORS_EXPOSE_HEADERS
			? (JSON.parse(process.env.CORS_EXPOSE_HEADERS) as string[])
			: ['content-type', 'content-length'],
	},
	debug: process.env.DEBUG === 'true' ? true : false,
	development: process.env.NODE_ENV === 'development' ? true : false,
	files: {
		xslxType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		txtType: 'text/plain',
	},
	mqUrl: process.env.RABBIT_MQ_URL,
	server: {
		port: process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 3000,
		host: process.env.SERVER_HOST ? process.env.SERVER_HOST : 'localhost',
		shutdownTimeout: process.env.SERVER_SHUTDOWN_TIMEOUT
			? Number(process.env.SERVER_SHUTDOWN_TIMEOUT)
			: 15000,
	},
	test: process.env.NODE_ENV === 'test' ? true : false,
};
