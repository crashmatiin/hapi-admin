import { ServerRoute, } from '@hapi/hapi';
import Joi = require('joi');
import { Template, } from 'invest-models';
import { docsListSchema, outputOkSchema, uuidSchema, } from '../schemas';
import api from '../api';

const routes: ServerRoute[] = [
	{
		method: 'GET',
		path: '/documents/{template}',
		handler: api.documents.getDocuments,
		options: {
			// app: {
			//   tag: ?,
			// },
			description: 'List documents by type',
			tags: ['api', 'documents'],
			validate: {
				query: docsListSchema,
				params: Joi.object({
					template: Joi.string()
						.valid(...Object.values(Template))
						.required(),
				}),
			},
		},
	},
	{
		method: 'GET',
		path: '/documents/templates',
		handler: api.documents.getTemplates,
		options: {
			description: 'List document templates',
			tags: ['api', 'documents'],
		},
	},
	{
		method: 'DELETE',
		path: '/documents/{id}',
		handler: api.documents.deleteDocument,
		options: {
			// app: {
			//   tag: ?,
			// },
			tags: ['api', 'documents'],
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
	// {
	//   method: 'POST',
	//   path: '/documents/{id}',
	//   handler: api.documents.generateDocument,
	//   options: {
	//     // app: {
	//     //   tag: ?,
	//     // },
	//     tags: ['api', 'documents'],
	//     description: 'Generate platform document',
	//     validate: {
	//       params: Joi.object({
	//         id: uuidSchema,
	//       }),
	//     },
	//     response: {
	//       schema: outputOkSchema(Joi.object({
	//         id: uuidSchema,
	//       })),
	//     },
	//   },
	// },
	// {
	//   method: 'PUT',
	//   path: '/documents/{id}',
	//   handler: api.documents.changeDocument,
	//   options: {
	//     // app: {
	//     //   tag: ?,
	//     // },
	//     tags: ['api', 'documents'],
	//     description: 'Change platform document',
	//     validate: {
	//       params: Joi.object({
	//         id: uuidSchema,
	//       }),
	//     },
	//     response: {
	//       schema: outputOkSchema(Joi.object({
	//         id: uuidSchema,
	//       })),
	//     },
	//   },
	// },
];

export default routes;
