import { ServerRoute, } from '@hapi/hapi';
import * as Joi from 'joi';
import api from '../api';
import { uuidSchema, } from '../schemas';
import investments from './investments';
import { operationConfirm, } from '../middlewares/2fa';

const routes: ServerRoute[] = [
	{
		method: 'GET',
		path: '/investments',
		handler: api.investments.listInvestments,
		options: {
			tags: ['api', 'investments', 'bank'],
		},
	},
	{
		method: 'GET',
		path: '/investments/{id}',
		handler: api.investments.retrieveInvestment,
		options: {
			tags: ['api', 'investments', 'bank'],
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
			},
		},
	},
	{
		method: 'POST',
		path: '/investments',
		handler: api.investments.createInvestment,
		options: {
			pre: [operationConfirm],
			tags: ['api', 'investments', 'bank'],
			validate: {
				payload: Joi.object({
					accountNumber: Joi.string().length(5).required(),
				}),
			},
		},
	}
];
export default routes;
