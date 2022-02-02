import { ServerRoute, } from '@hapi/hapi';
import { BankOperationStatus, } from 'invest-models';
import * as Joi from 'joi';
import { guidSchema, outputPaginationSchema, } from '../schemas';
import { BankReviseSchemas, } from '../schemas/revise.schemas';
import * as api from '../api/revise.handler';

export default <ServerRoute[]>[
	{
		method: 'GET',
		path: '/revise/virtual_balance',
		handler: api.virtualBalance,
		options: {
			id: 'api.revise.virtual_balance',
			tags: ['api', 'revise'],
			description: 'View revise virtual balance status',
			validate: {
				query: Joi.object({
					limit: Joi.number().min(0).example(0).default(10),
					offset: Joi.number().min(0).example(0).default(0),
					query: Joi.string(),
					from: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
					to: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
					order: Joi.object({}).pattern(Joi.string(), Joi.string().valid('ASC', 'DESC')),
					status: Joi.string().valid(...Object.values(BankOperationStatus)),
				}),
			},
			response: {
				schema: outputPaginationSchema('revise', BankReviseSchemas),
			},
		},
	},
	{
		method: 'GET',
		path: '/revise/virtual_balance/xlsx',
		handler: api.virtualBalanceReport,
		options: {
			id: 'api.revise.virtual_balance.report',
			tags: ['api', 'revise', 'report'],
			description: 'View report for revise virtual balance',
			validate: {
				query: Joi.object({
					bankReviseId: guidSchema.required(),
				}),
			},
			response: {
				schema: outputPaginationSchema('revise', BankReviseSchemas),
			},
		},
	}
];
