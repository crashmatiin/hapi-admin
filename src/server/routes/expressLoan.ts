import { ServerRoute, } from '@hapi/hapi';
import * as Joi from 'joi';
import { ExpressLoanStatus, } from 'invest-models';
import * as schemasIndex from '../schemas/index';
import * as schemas from '../schemas/expressLoan';
import * as api from '../api/expressLoan';

export default <ServerRoute[]>[
	{
		method: 'GET',
		path: '/loan/express',
		handler: api.getAll,
		options: {
			tags: ['api', 'expressLoan'],
			description: 'Get express loan list',
			app: {
				tag: 2101,
			},
			validate: {
				query: Joi.object({
					limit: Joi.number().min(0).example(0).default(10),
					offset: Joi.number().min(0).example(0).default(0),
					where: Joi.object({}).pattern(Joi.string(), Joi.string()),
					order: Joi.object({}).pattern(Joi.string(), Joi.string().valid('ASC', 'DESC')),
					from: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
					to: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
				}),
			},
			response: {
				schema: schemasIndex
					.outputPaginationSchema('expressLoan', schemas.expressLoanSchema)
					.label('Express loan list'),
			},
		},
	},
	{
		method: 'GET',
		path: '/loan/express/{id}',
		handler: api.get,
		options: {
			tags: ['api', 'expressLoan'],
			description: 'Get express loan',
			validate: {
				params: Joi.object({
					id: schemasIndex.guidSchema.required().label('Express loan id'),
				}),
			},
			response: {
				schema: schemasIndex.outputOkSchema(schemas.expressLoanSchema).label('Express loan'),
			},
		},
	},
	{
		method: 'POST',
		path: '/loan/express/{id}/resolve',
		handler: api.resolve,
		options: {
			tags: ['api', 'expressLoan'],
			description: 'Resolve express loan',
			validate: {
				params: Joi.object({
					id: schemasIndex.guidSchema.required().label('Express loan id'),
				}),
				payload: Joi.object({
					status: Joi.string()
						.valid(...Object.values(ExpressLoanStatus))
						.required()
						.example('active'),
				}).label('Express loan new status'),
			},
			response: {
				schema: schemasIndex.outputOkSchema(schemas.expressLoanSchema).label('Express loan'),
			},
		},
	},
	{
		method: 'DELETE',
		path: '/loan/express/{id}',
		handler: api.destroy,
		options: {
			tags: ['api', 'expressLoan'],
			description: 'Delete express loan',
			validate: {
				params: Joi.object({
					id: schemasIndex.guidSchema.required().label('Express loan id'),
				}),
			},
			response: {
				schema: schemasIndex.outputEmptySchema(),
			},
		},
	}
];
