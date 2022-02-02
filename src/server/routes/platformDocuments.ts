import { ServerRoute, } from '@hapi/hapi';
import Joi = require('joi');
import {
	outputOkSchema,
	outputPaginationSchema,
	platfomDocsSchema,
	platformDocsListSchema,
	uuidSchema,
} from '../schemas';
import api from '../api';
import { operationConfirm, } from '../middlewares/2fa';

const routes: ServerRoute[] = [
	{
		method: 'GET',
		path: '/platform-documents',
		handler: api.platformDocuments.getPlatformDocuments,
		options: {
			app: {
				tag: 2127,
			},
			tags: ['api', 'documents', 'platform'],
			validate: {
				query: platformDocsListSchema,
			},
			response: {
				schema: outputPaginationSchema('platformDocs', platfomDocsSchema),
			},
		},
	},
	{
		method: 'POST',
		path: '/platform-documents',
		handler: api.platformDocuments.createPlatformDocument,
		options: {
			app: {
				tag: 2027,
			},
			tags: ['api', 'documents', 'platform'],
			validate: {
				payload: Joi.object({
					fileId: uuidSchema.required(),
					name: Joi.string().min(3).max(64).example('file.docx').required(),
					type: Joi.string().required(),
				}),
			},
			response: {
				schema: outputPaginationSchema('platformDocs', platfomDocsSchema),
			},
		},
	},
	{
		method: 'PUT',
		path: '/platform-documents/{id}',
		handler: api.platformDocuments.updatePlatformDocument,
		options: {
			app: {
				tag: 2427,
			},
			tags: ['api', 'documents', 'platform'],
			validate: {
				params: Joi.object({
					id: uuidSchema.required(),
				}),
				payload: Joi.object({
					name: Joi.string().min(3).max(64).example('file.docx').optional(),
					type: Joi.string().optional(),
				}),
			},
			response: {
				schema: outputPaginationSchema('platformDocs', platfomDocsSchema),
			},
		},
	},
	{
		method: 'DELETE',
		path: '/platform-documents/{id}',
		handler: api.platformDocuments.deletePlatformDocument,
		options: {
			pre: [operationConfirm],
			app: {
				tag: 2627,
			},
			tags: ['api', 'documents', 'platform'],
			description: 'Delete platform document',
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
			},
			response: {
				schema: outputOkSchema(
					Joi.object({
						id: uuidSchema,
					})
				),
			},
		},
	}
];

export default routes;
