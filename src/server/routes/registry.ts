import { ServerRoute, } from '@hapi/hapi';
import { BankOperationStatus, } from 'invest-models';
import * as Joi from 'joi';
import { guidSchema, outputOkSchema, outputPaginationSchema, uuidSchema, } from '../schemas';
import { bankRegistrySchemas, } from '../schemas/registry.schemas';
import * as api from '../api/registry.handler';

export default <ServerRoute[]>[
	{
		method: 'GET',
		path: '/registry/beneficiary',
		handler: api.beneficiaryAll,
		options: {
			tags: ['api', 'registry'],
			description: 'View beneficiary registry export',
			validate: {
				query: Joi.object({
					limit: Joi.number().min(0).example(0).default(10),
					offset: Joi.number().min(0).example(0).default(0),
					query: Joi.object({}).pattern(Joi.string(), Joi.string()),
					from: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
					to: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
					order: Joi.object({}).pattern(Joi.string(), Joi.string().valid('ASC', 'DESC')),
					status: Joi.string().valid(...Object.values(BankOperationStatus)),
				}),
			},
			response: {
				schema: outputPaginationSchema('registry', bankRegistrySchemas),
			},
		},
	},
	{
		method: 'GET',
		path: '/registry/beneficiary/{bankOperationId}',
		handler: api.beneficiary,
		options: {
			id: 'api.registry.beneficiaryid',
			tags: ['api', 'registry'],
			description: 'View beneficiary registry export',
			validate: {
				params: Joi.object({
					bankOperationId: uuidSchema,
				}),
			},
			response: {
				schema: outputOkSchema(bankRegistrySchemas),
			},
		},
	},
	{
		method: 'GET',
		path: '/registry/beneficiary/xlsx',
		handler: api.beneficiaryReport,
		options: {
			tags: ['api', 'registry', 'report'],
			description: 'View beneficiary registry report',
			validate: {
				query: Joi.object({
					bankOperationId: guidSchema.required().optional(),
				}),
			},
		},
	}
];
