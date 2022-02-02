import { ServerRoute, } from '@hapi/hapi';
import api from '../api';
import {
	moneyboxVirtualBalanceRequestSchema,
	moneyboxVirtualBalanceResponseSchema,
	outputOkSchema,
} from '../schemas';

const routes: ServerRoute[] = [
	{
		method: 'POST',
		path: '/moneybox/virtual_balance',
		handler: api.moneybox.moneyboxVirtualBalance,
		options: {
			description:
				'https://api.tochka.com/static/v1/tender-docs/moneybox/main/moneybox_api.html#virtual-balance',
			tags: ['api', 'auth', 'moneybox'],
			validate: {
				payload: moneyboxVirtualBalanceRequestSchema,
			},
			response: {
				schema: outputOkSchema(moneyboxVirtualBalanceResponseSchema),
			},
		},
	}
];

export default routes;
