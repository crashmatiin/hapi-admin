import { ServerRoute, } from '@hapi/hapi';
import Joi = require('joi');
import api from '../api';
import {
	depositsListRequestSchema,
	depositsSchema,
	outputOkSchema,
	outputPaginationSchema,
	uuidSchema,
} from '../schemas';

const routes: ServerRoute[] = [
	{
		method: 'GET',
		path: '/deposits',
		handler: api.deposit.listDeposits,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'deposits'],
			description: 'List of deposits',
			validate: {
				query: depositsListRequestSchema,
			},
			response: {
				schema: outputPaginationSchema('deposits', depositsSchema),
			},
		},
	},
	{
		method: 'GET',
		path: '/deposits/{id}',
		options: {
			tags: ['api', 'deposits'],
			description: 'Retrieve, deposit',
			handler: api.deposit.retrieveDeposit,
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
			},
			response: {
				schema: outputOkSchema(depositsSchema),
			},
		},
	}
];

export default routes;
