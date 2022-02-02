import { ServerRoute, } from '@hapi/hapi';
import * as Joi from 'joi';
import { PermissionLevel, } from 'invest-models';
import {
	listSchema,
	outputOkSchema,
	outputPaginationSchema,
	userProfileSchema,
	userSchema,
	usersListSchema,
	usersLogsRequestSchema,
	usersProfilesListSchema,
	uuidSchema,
} from '../schemas';
import api from '../api';
import { buildPolicy, } from '../config/policies';

const routes: ServerRoute[] = [
	{
		method: 'GET',
		path: '/users',
		handler: api.users.listUsers,
		options: {
			tags: ['api', 'auth', 'users'],
			validate: {
				query: usersListSchema,
			},
			response: {
				schema: outputPaginationSchema('users', userSchema),
			},
		},
	},
	{
		method: 'GET',
		path: '/users/profiles',
		handler: api.users.listUsersProfiles,
		options: {
			tags: ['api', 'auth', 'users profile'],
			validate: {
				query: usersProfilesListSchema,
			},
			response: {
				schema: outputPaginationSchema('users profiles', userProfileSchema),
			},
		},
	},
	{
		method: 'GET',
		path: '/users/profile/{id}',
		options: {
			tags: ['api', 'auth', 'users'],
			handler: api.users.retrieveUserProfiles,
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
			},
			response: {
				schema: outputOkSchema(userProfileSchema),
			},
		},
	},
	{
		method: 'GET',
		path: '/users/{id}',
		options: {
			tags: ['api', 'auth', 'users'],
			handler: api.users.retrieveUser,
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
		handler: api.users.getUsersStats,
		path: '/users/stats',
		options: {
			tags: ['api', 'auth', 'stats', 'users'],
		},
	},
	{
		method: 'GET',
		path: '/users/profiles/xlsx',
		handler: api.users.listUserProfilesXslx,
		options: {
			tags: ['api', 'auth', 'users'],
			validate: {
				query: listSchema,
			},
		},
	},
	{
		method: 'GET',
		path: '/users/xlsx',
		handler: api.users.listUsersXslx,
		options: {
			tags: ['api', 'auth', 'users'],
			validate: {
				query: listSchema,
			},
		},
	},
	{
		method: 'GET',
		path: '/users/logs',
		handler: api.users.listUsersLogs,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'users'],
			description: 'List of users logs',
			validate: {
				query: usersLogsRequestSchema,
			},
			plugins: {
				rbac: buildPolicy('users', PermissionLevel.READ),
			},
		},
	},
	{
		method: 'GET',
		path: '/users/logs/xlsx',
		handler: api.users.listUsersLogsXslx,
		options: {
			tags: ['api', 'auth', 'users'],
			description: 'List of users logs in xlsx file',
			validate: {
				query: usersLogsRequestSchema,
			},
			plugins: {
				rbac: buildPolicy('users', PermissionLevel.READ),
			},
		},
	}
];
export default routes;
