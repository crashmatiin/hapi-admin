import * as Hapi from '@hapi/hapi';

/* eslint-disable */
export default (prettify?: boolean) => ({
	prettyPrint: prettify
		? {
				colorize: true,
				crlf: false,
				jsonPretty: false,
				translateTime: 'yyyy-mm-dd HH:MM:ss',
				ignore: 'pid,hostname,v,tags,data',
				messageFormat: '{data}',
				customPrettifiers: {
					response: { messageFormat: '{req.url} - {req.method} - code:{req.statusCode}' },
				},
		  }
		: false,
	serializers: {
		req: function customReqSerializer(req: Hapi.Request) {
			return {
				method: req.method,
				url: req.url,
				payload: req.payload,
			};
		},
		// TODO define res
		res: function customResSerializer(res: any) {
			return {
				code: res.statusCode,
				payload: res.result,
				data: res.data,
			};
		},
	},
	logPayload: true,
	logEvents: ['response', 'request'],
	logQueryParams: true,
	redact: {
		// Censoring user's credentials, auth-tokens and file's Buffer representation in payload.
		paths: [
			'payload.password',
			'payload.newPassword',
			'payload.oldPassword',
			'req.headers.authorization',
		],
		censor: '***',
	},
	timestamp: () => `,"time":"${new Date(Date.now()).toLocaleString()}"`,
});
