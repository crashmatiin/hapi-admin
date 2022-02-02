import { ServerRoute, } from '@hapi/hapi';
import * as Joi from 'joi';
import { PermissionLevel, } from 'invest-models';
import { buildPolicy, } from '../config/policies';
import {
	investorLoansListRequestSchema,
	investorsListRequestSchema,
	investorUpdateSchema,
	listSchema,
	loanSchema,
	outputOkSchema,
	outputPaginationSchema,
	userSchema,
	usersNotificationsListSchema,
	uuidSchema,
} from '../schemas';

import api from '../api';
import { operationConfirm, } from '../middlewares/2fa';

const routes: ServerRoute[] = [
	{
		method: 'GET',
		path: '/investors',
		handler: api.investors.listInvestors,
		options: {
			tags: ['api', 'auth', 'investors'],
			validate: {
				query: investorsListRequestSchema,
			},
			response: {
				schema: outputPaginationSchema('investors', userSchema),
			},
		},
	},
	{
		method: 'GET',
		path: '/investors/xlsx',
		handler: api.investors.listInvestorsXslx,
		options: {
			tags: ['api', 'auth', 'investors'],
			validate: {
				query: listSchema,
			},
		},
	},
	{
		method: 'GET',
		path: '/investors/{id}',
		options: {
			tags: ['api', 'auth', 'investors'],
			handler: api.investors.retrieveInvestor,
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
			},
			response: {
				schema: outputOkSchema(userSchema),
			},
		},
	},
	{
		method: 'GET',
		path: '/investors/stats',
		options: {
			tags: ['api', 'auth', 'stats', 'investors'],
			handler: api.investors.getInvestorsStats,
		},
	},
	{
		method: 'PUT',
		path: '/investors/{id}',
		handler: api.investors.updateInvestor,
		options: {
			pre: [operationConfirm],
			tags: ['api', 'investors', 'confirmed'],
			description: 'Update investor entry',
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
				payload: investorUpdateSchema,
			},
			plugins: {
				rbac: buildPolicy('investors', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'DELETE',
		path: '/investors/{investorId}',
		handler: api.investors.deleteInvestor,
		options: {
			pre: [operationConfirm],
			auth: 'jwt-access',
			tags: ['api', 'investors', 'confirmed'],
			description: 'Request to delete investor',
			validate: {
				params: Joi.object({
					investorId: uuidSchema,
				}),
			},
			response: {
				schema: outputOkSchema(
					Joi.object({
						operationId: uuidSchema,
					})
				),
			},
			plugins: {
				rbac: buildPolicy('investors', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'POST',
		path: '/investors/{investorId}/block',
		handler: api.investors.blockInvestor,
		options: {
			pre: [operationConfirm],
			auth: 'jwt-access',
			tags: ['api', 'investors', 'confirmed'],
			description: 'Request to block investor',
			validate: {
				params: Joi.object({
					investorId: Joi.string().uuid(),
				}),
			},
			plugins: {
				rbac: buildPolicy('investors', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'POST',
		path: '/investors/{investorId}/unblock',
		handler: api.investors.unblockInvestor,
		options: {
			pre: [operationConfirm],
			auth: 'jwt-access',
			tags: ['api', 'investors', 'confirmed'],
			description: 'Request to unblock investor',
			validate: {
				params: Joi.object({
					investorId: Joi.string().uuid(),
				}),
			},
			plugins: {
				rbac: buildPolicy('investors', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'GET',
		path: '/investors/{id}/projects',
		options: {
			tags: ['api', 'investors'],
			handler: api.investors.retrieveInvestorProjects,
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
				query: investorLoansListRequestSchema,
			},
			response: {
				schema: outputPaginationSchema('loans', loanSchema),
			},
		},
	},
	{
		method: 'GET',
		path: '/investors/{id}/projects/xlsx',
		handler: api.investors.listInvestorProjectsXslx,
		options: {
			tags: ['api', 'investors'],
			validate: {
				query: investorLoansListRequestSchema,
			},
		},
	},
	{
		method: 'GET',
		path: '/investors/{id}/projects/hold',
		options: {
			tags: ['api', 'investors'],
			handler: api.investors.retrieveInvestorProjectsHold,
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
				query: usersNotificationsListSchema,
			},
			response: {
				schema: outputPaginationSchema('loans', loanSchema),
			},
		},
	},
	{
		method: 'GET',
		path: '/investors/{id}/projects/hold/xlsx',
		handler: api.investors.listInvestorProjectsHoldXslx,
		options: {
			tags: ['api', 'investors'],
			validate: {
				query: usersNotificationsListSchema,
			},
		},
	}
];
export default routes;
