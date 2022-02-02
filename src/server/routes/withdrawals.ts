import { ServerRoute, } from '@hapi/hapi';
import Joi = require('joi');
import api from '../api';
import {
	depositsListRequestSchema,
	outputOkSchema,
	outputPaginationSchema,
	uuidSchema,
	withdrawalSchema,
	withdrawalsListRequestSchema,
} from '../schemas';

const routes: ServerRoute[] = [
	{
		method: 'GET',
		path: '/withdrawals',
		handler: api.withdraw.listWithdrawals,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'withdrawals'],
			description: 'List of withdrawals',
			validate: {
				query: withdrawalsListRequestSchema,
			},
			response: {
				schema: outputPaginationSchema('withdrawals', withdrawalSchema),
			},
		},
	},
	{
		method: 'GET',
		path: '/withdrawals/{id}',
		options: {
			tags: ['api', 'withdrawals'],
			description: 'Retrieve withdrawal',
			handler: api.withdraw.retrieveWithdrawal,
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
			},
			response: {
				schema: outputOkSchema(withdrawalSchema),
			},
		},
	}
];

export default routes;
