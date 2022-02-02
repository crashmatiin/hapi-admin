import { ServerRoute, } from '@hapi/hapi';
import * as Joi from 'joi';
import { PermissionLevel, } from 'invest-models';
import { outputOkSchema, qualificationStatusSchema, uuidSchema, } from '../schemas';
import api from '../api';
import { buildPolicy, } from '../config/policies';
import { operationConfirm, } from '../middlewares/2fa';

const routes: ServerRoute[] = [
	{
		method: 'POST',
		path: '/actions/ban/{id}',
		handler: api.actions.perfomUserBan,
		options: {
			pre: [operationConfirm],
			tags: ['api', 'auth', 'investors', 'confirmed'],
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
			},
		},
	},
	{
		method: 'POST',
		path: '/actions/ban/admin/{id}',
		handler: api.actions.perfomAdminBan,
		options: {
			pre: [operationConfirm],
			tags: ['api', 'auth', 'investors', 'confirmed'],
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
			},
		},
	},
	{
		method: 'POST',
		path: '/actions/unban/admin/{id}',
		handler: api.actions.perfomAdminUnban,
		options: {
			pre: [operationConfirm],
			tags: ['api', 'auth', 'investors', 'confirmed'],
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
			},
		},
	},
	{
		method: 'POST',
		path: '/actions/unban/{id}',
		handler: api.actions.perfomUserUnban,
		options: {
			pre: [operationConfirm],
			tags: ['api', 'auth', 'investors', 'confirmed'],
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
			},
		},
	},
	{
		method: 'POST',
		path: '/actions/profile/{id}/confirm',
		handler: api.actions.profileConfirm,
		options: {
			pre: [operationConfirm],
			tags: ['api', 'auth', 'investors', 'borrowers', 'confirmed'],
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
			},
			response: {
				schema: outputOkSchema(Joi.string().example('accepted')),
			},
		},
	},
	{
		method: 'POST',
		path: '/actions/profile/{id}/term/update',
		handler: api.actions.profileChangeTermOfoffice,
		options: {
			pre: [operationConfirm],
			tags: ['api', 'auth', 'investors', 'borrowers', 'confirmed'],
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
				payload: Joi.object({
					termOfOffice: Joi.date()
						.timestamp('javascript')
						.note('Timestamp in milliseconds')
						.label('Term of office')
						.example(1547737864199),
				}),
			},
			response: {
				schema: outputOkSchema(Joi.date().example('2022-03-20T00:57:44.000Z')),
			},
		},
	},
	{
		method: 'DELETE',
		path: '/actions/delete/user/{userId}',
		handler: api.actions.deleteUser,
		options: {
			pre: [operationConfirm],
			auth: 'jwt-access',
			tags: ['api', 'users', 'confirmed'],
			description: 'Request to delete user',
			validate: {
				params: Joi.object({
					userId: Joi.string().uuid(),
				}),
			},
			response: {
				schema: outputOkSchema(
					Joi.object({
						operationId: Joi.string().uuid(),
					})
				),
			},
			plugins: {
				rbac: buildPolicy('users', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'DELETE',
		path: '/actions/delete/admin/{adminId}',
		handler: api.actions.deleteAdmin,
		options: {
			pre: [operationConfirm],
			auth: 'jwt-access',
			tags: ['api', 'admins', 'confirmed'],
			description: 'Request to delete admin',
			validate: {
				params: Joi.object({
					adminId: Joi.string().uuid(),
				}),
			},
			response: {
				schema: outputOkSchema(
					Joi.object({
						operationId: Joi.string().uuid(),
					})
				),
			},
		},
	},
	{
		method: 'POST',
		path: '/actions/profile/{profileId}/qualify',
		handler: api.actions.qualifyProfile,
		options: {
			pre: [operationConfirm],
			auth: 'jwt-access',
			tags: ['api', 'investors', 'borrowers', 'confirmed'],
			description: 'Request to qualify profile',
			validate: {
				params: Joi.object({
					profileId: Joi.string().uuid(),
				}),
				payload: Joi.object({
					qualificationStatus: qualificationStatusSchema,
				}),
			},
			plugins: {
				rbac: buildPolicy('profile', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'POST',
		path: '/actions/deposit',
		handler: api.actions.testDeposit,
		options: {
			auth: 'jwt-access',
			description: 'Request to deposit',
			validate: {
				payload: Joi.object({
					id: uuidSchema,
				}),
			},
			plugins: {
				rbac: buildPolicy('profile', PermissionLevel.WRITE),
			},
		},
	}
];

export default routes;
