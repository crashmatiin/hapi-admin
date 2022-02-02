import { LoggerMqRequest, } from 'mq-plugin/protocols';

export function checkLogEntry(event): LoggerMqRequest | false {
	try {
		const { route, auth, query, params, response, } = event;
		const { tag, } = route.settings.app;
		if (!(tag && response.statusCode === 200)) {
			throw Error('No logging tag was found');
		}

		return {
			tag,
			method: route?.method,
			path: route?.path,
			...auth?.credentials,
			...query,
			...params,
		};
	} catch {
		return false;
	}
}
