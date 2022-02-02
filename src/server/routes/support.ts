import { ServerRoute, } from '@hapi/hapi';
import * as Joi from 'joi';
import { PermissionLevel, } from 'invest-models';
import api from '../api';
import {
	outputPaginationSchema,
	uuidSchema,
	outputOkSchema,
	supportRequestSchema,
	supportReplySchema,
	createSupportReplySchema,
	supportRequestListSchema,
} from '../schemas';
import { buildPolicy, } from '../config/policies';

const routes: ServerRoute[] = [
	{
		method: 'POST',
		path: '/support/{id}/reply',
		handler: api.support.createSupportReply,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'support'],
			description: 'Create new support reply',
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
				payload: createSupportReplySchema,
			},
			response: {
				schema: outputOkSchema(supportReplySchema),
			},
			plugins: {
				rbac: buildPolicy('support', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'GET',
		path: '/support',
		handler: api.support.listSupportRequests,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'support'],
			description: 'List of support',
			validate: {
				query: supportRequestListSchema,
			},
			response: {
				schema: outputPaginationSchema('support', supportRequestSchema),
			},
			plugins: {
				rbac: buildPolicy('support', PermissionLevel.READ),
			},
		},
	},
	{
		method: 'GET',
		path: '/support/{id}',
		handler: api.support.retrieveSupportRequest,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'support'],
			description: 'Get support by id',
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
			},
			response: {
				schema: outputOkSchema(supportRequestSchema),
			},
			plugins: {
				rbac: buildPolicy('support', PermissionLevel.READ),
			},
		},
	},

	{
		method: 'GET',
		path: '/support/{id}/txt',
		handler: api.support.downloadSupportRequest,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'support'],
			description: 'Get support by id in .txt',
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
			},
			response: {
				schema: outputOkSchema(supportRequestSchema),
			},
			plugins: {
				rbac: buildPolicy('support', PermissionLevel.READ),
			},
		},
	}
];

export default routes;
