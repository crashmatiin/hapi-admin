import * as Hapi from '@hapi/hapi';
import { LoggerRetrieveMqRequest, } from 'mq-plugin/protocols';

export const queryAdminsLogs = async (request: Hapi.Request): Promise<any> => {
	const response = await request.server.mqCall<LoggerRetrieveMqRequest>('logs:read', {
		tag: '2...',
		limit: Number(request.query.limit),
		offset: Number(request.query.offset),
		query: request.query.query,
		sort: request.query.order,
	});
	return response;
};
