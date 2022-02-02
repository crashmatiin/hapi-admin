import { ServerRoute, } from '@hapi/hapi';
import { PermissionLevel, } from 'invest-models';
import * as Joi from 'joi';
import api from '../api';
import { buildPolicy, } from '../config/policies';
import {
	adminIdSchema,
	emailSchema,
	jwtTokensSchema,
	outputOkSchema,
	passwordSchema,
	restorePasswordRequestSchema,
	roleSchema,
	signUpSchema,
	tokenSchema,
	totpSchema,
} from '../schemas';

const routes: ServerRoute[] = [
	{
		method: 'POST',
		path: '/auth/sign-in',
		handler: api.auth.loginAdmin,
		options: {
			auth: false,
			tags: ['api', 'auth'],
			description: 'Log in',
			validate: {
				payload: Joi.object({
					email: emailSchema.required(),
					password: passwordSchema.required(),
					totp: totpSchema.optional(),
				}).label('Admin login data'),
			},
			response: {
				schema: outputOkSchema(jwtTokensSchema),
			},
		},
	},
	{
		method: 'POST',
		path: '/auth/totp/create',
		handler: api.auth.createTOTPSecrets,
		options: {
			auth: 'simple-jwt-access',
			tags: ['api', 'auth', 'totp'],
			description: 'Create totp secrets',
		},
	},
	{
		method: 'POST',
		path: '/auth/totp/activate',
		handler: api.auth.activateTOTP,
		options: {
			auth: 'simple-jwt-access',
			tags: ['api', 'auth', 'totp'],
			description: 'Activate totp secrets',
			validate: {
				payload: Joi.object({
					totp: totpSchema.required(),
				}).label('TOTP'),
			},
		},
	},
	{
		method: 'POST',
		path: '/auth/sign-up',
		handler: api.auth.registerAdmin,
		options: {
			auth: {
				strategy: 'jwt-access',
			},
			tags: ['api', 'auth'],
			description: 'Sign up',
			validate: {
				payload: Joi.object({
					email: emailSchema.required(),
					role: roleSchema.required(),
				}).label('Create new admin'),
			},
			response: {
				schema: outputOkSchema(signUpSchema),
			},
			plugins: {
				rbac: buildPolicy('users', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'POST',
		path: '/auth/refresh-tokens',
		handler: api.auth.refreshTokens,
		options: {
			auth: 'jwt-refresh',
			tags: ['api', 'auth'],
			description: 'Refresh tokens',
			response: {
				schema: outputOkSchema(jwtTokensSchema),
			},
		},
	},
	{
		method: 'POST',
		path: '/auth/restore-password-request',
		handler: api.auth.restorePasswordRequest,
		options: {
			auth: false,
			tags: ['api', 'auth'],
			description: 'Restore password request',
			validate: {
				payload: Joi.object({
					email: emailSchema.required(),
				}),
			},
			response: {
				schema: outputOkSchema(restorePasswordRequestSchema),
			},
		},
	},
	{
		method: 'POST',
		path: '/auth/restore-password',
		handler: api.auth.restorePassword,
		options: {
			auth: false,
			tags: ['api', 'auth'],
			description: 'Restore password',
			validate: {
				payload: Joi.object({
					adminId: adminIdSchema.required(),
					token: tokenSchema.required(),
					password: passwordSchema.required(),
				}),
			},
			response: {
				schema: Joi.boolean(),
			},
		},
	},
	{
		method: 'POST',
		path: '/auth/change-password',
		handler: api.auth.changePassword,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'auth'],
			description: 'Change password',
			validate: {
				payload: Joi.object({
					oldPassword: passwordSchema.required(),
					newPassword: passwordSchema.required(),
				}),
			},
			response: {
				schema: Joi.boolean(),
			},
		},
	},
	{
		method: 'POST',
		path: '/auth/token/generate/{tokenType}/{userId}',
		handler: api.auth.generateToken,
		options: {
			tags: ['api', 'auth', 'token'],
			description: 'Generate token for authorization',
			validate: {
				params: Joi.object({
					// TODO удалить fileAccessLink после окончания разработки
					userId: Joi.string().uuid().required().label('User id'),
					tokenType: Joi.string()
						.default('fileAccess')
						.valid(...['fileAccess', 'fileAccessLink'])
						.example('fileAccess'),
				}),
			},
			response: {
				schema: outputOkSchema(
					Joi.object({
						token: Joi.string().example('Default value'),
					})
				),
			},
		},
	}
];

export default routes;
