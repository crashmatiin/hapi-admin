import { ServerRoute, } from '@hapi/hapi';
import { PermissionLevel, } from 'invest-models';
import * as Joi from 'joi';
import { buildPolicy, } from '../config/policies';
import api from '../api';
import {
	outputPaginationSchema,
	userSchema,
	uuidSchema,
	outputOkSchema,
	borrowersListRequestSchema,
	borrowersStatsSchema,
	userProfileRatingSchema,
} from '../schemas';
import { operationConfirm, } from '../middlewares/2fa';

const routes: ServerRoute[] = [
	{
		method: 'GET',
		path: '/borrowers',
		handler: api.borrowers.listBorrowers,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'borrowers'],
			description: 'List of borrowers',
			validate: {
				query: borrowersListRequestSchema,
			},
			response: {
				schema: outputPaginationSchema('borrowers', userSchema),
			},
		},
	},
	{
		method: 'GET',
		path: '/borrowers/{id}',
		handler: api.borrowers.retrieveBorrower,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'borrowers'],
			description: 'Get borrower by id',
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
		path: '/borrowers/stats',
		handler: api.borrowers.getBorrowersStats,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'borrowers'],
			description: 'Get borrowers statistics',
			response: {
				schema: outputOkSchema(borrowersStatsSchema),
			},
		},
	},
	{
		method: 'GET',
		path: '/borrowers/xlsx',
		handler: api.borrowers.listBorrowersXlsx,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'borrowers'],
			description: 'Get borrowers list xlsx',
			validate: {
				query: borrowersListRequestSchema,
			},
		},
	},
	{
		method: 'PUT',
		path: '/borrowers/{id}',
		handler: api.borrowers.updateBorrower,
		options: {
			pre: [operationConfirm],
			tags: ['api', 'borrowers', 'confirmed'],
			description: 'Update borrower entry',
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
			},
			plugins: {
				rbac: buildPolicy('borrowers', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'DELETE',
		path: '/borrowers/{borrowerId}',
		handler: api.borrowers.deleteBorrower,
		options: {
			pre: [operationConfirm],
			auth: 'jwt-access',
			tags: ['api', 'borrowers', 'confirmed'],
			description: 'Request to delete borrower',
			validate: {
				params: Joi.object({
					borrowerId: uuidSchema,
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
				rbac: buildPolicy('borrowers', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'POST',
		path: '/borrowers/{borrowerId}/block',
		handler: api.borrowers.blockBorrower,
		options: {
			auth: 'jwt-access',
			pre: [operationConfirm],
			tags: ['api', 'borrowers', 'confirmed'],
			description: 'Request to block borrower',
			validate: {
				params: Joi.object({
					borrowerId: Joi.string().uuid(),
				}),
			},
			plugins: {
				rbac: buildPolicy('borrowers', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'POST',
		path: '/borrowers/{borrowerId}/unblock',
		handler: api.borrowers.unblockBorrower,
		options: {
			auth: 'jwt-access',
			pre: [operationConfirm],
			tags: ['api', 'borrowers', 'confirmed'],
			description: 'Request to unblock borrower',
			validate: {
				params: Joi.object({
					borrowerId: Joi.string().uuid(),
				}),
			},
			plugins: {
				rbac: buildPolicy('borrowers', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'PUT',
		path: '/borrowers/{id}/rating',
		handler: api.borrowers.updateBorrowerRating,
		options: {
			tags: ['api', 'borrowers'],
			pre: [operationConfirm],
			description: 'Update borrower rating',
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
				payload: Joi.object({
					rating: userProfileRatingSchema,
				}),
			},
			plugins: {
				rbac: buildPolicy('borrowers', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'GET',
		path: '/borrowers/{id}/certificate',
		handler: api.borrowers.getBorrowerCertificate,
		options: {
			tags: ['api', 'borrowers', 'confirmed'],
			description: 'Get certificate',
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
			},
			plugins: {
				rbac: buildPolicy('borrowers', PermissionLevel.READ),
			},
		},
	}
];

export default routes;
