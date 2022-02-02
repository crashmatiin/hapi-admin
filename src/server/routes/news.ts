import { ServerRoute, } from '@hapi/hapi';
import { PermissionLevel, } from 'invest-models';
import * as Joi from 'joi';
import api from '../api';
import { buildPolicy, } from '../config/policies';
import {
	listSchema,
	newsSchema,
	outputOkSchema,
	outputPaginationSchema,
	slugSchema,
} from '../schemas';

const routes: ServerRoute[] = [
	{
		method: 'GET',
		path: '/news',
		handler: api.news.listEntries,
		options: {
			tags: ['api', 'news'],
			description: 'List all news',
			validate: {
				query: listSchema,
			},
			response: {
				schema: outputPaginationSchema('faqs', newsSchema),
			},
			plugins: {
				rbac: buildPolicy('news', PermissionLevel.READ),
			},
		},
	},
	{
		method: 'POST',
		path: '/news',
		handler: api.news.createEntry,
		options: {
			tags: ['api', 'news'],
			description: 'Create new news entry',
			app: {
				tag: 2024,
			},
			validate: {
				payload: newsSchema,
			},
			response: {
				schema: outputOkSchema(newsSchema),
			},
			plugins: {
				rbac: buildPolicy('news', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'GET',
		path: '/news/{slug}',
		handler: api.news.retrieveEntry,
		options: {
			tags: ['api', 'news'],
			description: 'Get FAQ entry by slug',
			validate: {
				params: Joi.object({
					slug: slugSchema,
				}),
			},
			response: {
				schema: outputOkSchema(newsSchema),
			},
			plugins: {
				rbac: buildPolicy('news', PermissionLevel.READ),
			},
		},
	},
	{
		method: 'PUT',
		path: '/news/{slug}',
		handler: api.news.updateEntry,
		options: {
			tags: ['api', 'news'],
			description: 'Update news entry',
			app: {
				tag: 2424, // 2016, 2416, 2616],
			},
			validate: {
				params: Joi.object({
					slug: slugSchema,
				}),
				payload: newsSchema,
			},
			plugins: {
				rbac: buildPolicy('news', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'DELETE',
		path: '/news/{slug}',
		handler: api.news.deleteEntry,
		options: {
			tags: ['api', 'news'],
			description: 'Delete news entry',
			app: {
				tag: 2624,
			},
			validate: {
				params: Joi.object({
					slug: slugSchema,
				}),
			},
			plugins: {
				rbac: buildPolicy('news', PermissionLevel.WRITE),
			},
		},
	}
];
export default routes;
