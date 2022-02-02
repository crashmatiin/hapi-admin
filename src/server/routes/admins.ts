import { ServerRoute, } from '@hapi/hapi';
import { PermissionLevel, } from 'invest-models';
import * as Joi from 'joi';
import api from '../api';
import { buildPolicy, } from '../config/policies';
import { operationConfirm, } from '../middlewares/2fa';
import {
	adminRoleSchema,
	adminSchema,
	adminsLogsRequestSchema,
	createAdminSchema,
	listSchema,
	outputOkSchema,
	outputPaginationSchema,
	roleKeySchema,
	updateAdminSchema,
	uuidSchema,
} from '../schemas';

const routes: ServerRoute[] = [
	{
		method: 'POST',
		path: '/admins',
		handler: api.admins.createAdmin,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'admins'],
			description: 'Create new admin',
			validate: {
				payload: createAdminSchema,
			},
			response: {
				schema: outputOkSchema(adminSchema),
			},
			plugins: {
				rbac: buildPolicy('admins', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'POST',
		path: '/admins/{id}/update',
		handler: api.admins.updateAdminFields,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'admins'],
			description: 'Update admin fields',
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
				payload: updateAdminSchema,
			},
			response: {
				schema: outputOkSchema(adminSchema),
			},
			plugins: {
				rbac: buildPolicy('admins', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'GET',
		path: '/admins',
		handler: api.admins.listAdmins,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'admins'],
			description: 'List of admins',
			validate: {
				query: listSchema,
			},
			response: {
				schema: outputPaginationSchema('admins', adminSchema),
			},
			plugins: {
				rbac: buildPolicy('admins', PermissionLevel.READ),
			},
		},
	},
	{
		method: 'GET',
		path: '/admins/{id}',
		handler: api.admins.retrieveAdmin,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'admins'],
			description: 'Get admin by id',
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
			},
			response: {
				schema: outputOkSchema(adminSchema),
			},
			plugins: {
				rbac: buildPolicy('admins', PermissionLevel.READ),
			},
		},
	},
	{
		method: 'GET',
		path: '/me',
		handler: api.admins.retriveSelfPermissions,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'admins'],
			description: 'Get admin self permissions',
		},
	},
	{
		method: 'GET',
		path: '/admin-roles',
		handler: api.admins.listAdminRoles,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'admins'],
			description: 'List of admin roles',
			response: {
				schema: outputOkSchema(adminRoleSchema),
			},
			plugins: {
				rbac: buildPolicy('admins', PermissionLevel.READ),
			},
		},
	},
	{
		method: 'PUT',
		path: '/admin-roles/{key}',
		handler: api.admins.updateAdminRole,
		options: {
			auth: 'jwt-access',
			pre: [operationConfirm],
			tags: ['api', 'admins'],
			description: 'Update admin role',
			validate: {
				params: Joi.object({
					key: roleKeySchema,
				}),
				payload: adminRoleSchema,
			},
			response: {
				schema: outputOkSchema(adminRoleSchema),
			},
			plugins: {
				rbac: buildPolicy('admins', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'GET',
		path: '/admins/logs',
		handler: api.admins.listAdminsLogs,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'admins'],
			description: 'List of admins logs',
			validate: {
				query: adminsLogsRequestSchema,
			},
			plugins: {
				rbac: buildPolicy('admins', PermissionLevel.READ),
			},
		},
	},
	{
		method: 'GET',
		path: '/admins/logs/xlsx',
		handler: api.admins.listAdminsLogsXslx,
		options: {
			tags: ['api', 'admins'],
			description: 'List of admins logs in xlsx file',
			validate: {
				query: adminsLogsRequestSchema,
			},
			plugins: {
				rbac: buildPolicy('users', PermissionLevel.READ),
			},
		},
	}
];

export default routes;
