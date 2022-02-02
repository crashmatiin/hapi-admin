import { ServerRoute, } from '@hapi/hapi';
import { PermissionLevel, } from 'invest-models';
import * as Joi from 'joi';
import api from '../api';
import { buildPolicy, } from '../config/policies';
import {
	faqSchema,
	listSchema,
	outputOkSchema,
	outputPaginationSchema,
	slugSchema,
} from '../schemas';

const routes: ServerRoute[] = [
	{
		method: 'GET',
		path: '/faq',
		handler: api.faq.listEntries,
		options: {
			tags: ['api', 'faq'],
			description: 'List all FAQs',
			validate: {
				query: listSchema,
			},
			response: {
				schema: outputPaginationSchema('questions', faqSchema),
			},
			plugins: {
				rbac: buildPolicy('faq', PermissionLevel.READ),
			},
		},
	},
	{
		method: 'POST',
		path: '/faq',
		handler: api.faq.createEntry,
		options: {
			app: {
				tag: 2023,
			},
			tags: ['api', 'faq'],
			description: 'Create new FAQ entry',
			validate: {
				payload: faqSchema,
			},
			response: {
				schema: outputOkSchema(faqSchema),
			},
			plugins: {
				rbac: buildPolicy('faq', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'GET',
		path: '/faq/{slug}',
		handler: api.faq.retrieveEntry,
		options: {
			tags: ['api', 'faq'],
			description: 'Get FAQ entry by slug',
			validate: {
				params: Joi.object({
					slug: slugSchema,
				}),
			},
			response: {
				schema: outputOkSchema(faqSchema),
			},
			plugins: {
				rbac: buildPolicy('faq', PermissionLevel.READ),
			},
		},
	},
	{
		method: 'PUT',
		path: '/faq/{slug}',
		handler: api.faq.updateEntry,
		options: {
			app: {
				tag: 2423, // 2017, 2417, 2627
			},
			tags: ['api', 'faq'],
			description: 'Update faq entry',
			validate: {
				params: Joi.object({
					slug: slugSchema,
				}),
				payload: faqSchema,
			},
			plugins: {
				rbac: buildPolicy('faq', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'DELETE',
		path: '/faq/{slug}',
		handler: api.faq.deleteEntry,
		options: {
			app: {
				tag: 2623,
			},
			tags: ['api', 'faq'],
			description: 'Delete faq entry',
			validate: {
				params: Joi.object({
					slug: slugSchema,
				}),
			},
			plugins: {
				rbac: buildPolicy('faq', PermissionLevel.WRITE),
			},
		},
	}
];
export default routes;
