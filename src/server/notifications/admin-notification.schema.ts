import { ObjectSchema, } from 'joi';
import * as Joi from 'joi';
import {
	EchoAdminNotification,
	AdminNotificationInterface,
	AdminNotificationFile,
} from './admin-notification-interface';

export const userNotificationFileSchema: ObjectSchema<AdminNotificationFile> = Joi.object({
	id: Joi.string().required(),
	status: Joi.string().required(),
	name: Joi.string().required(),
	type: Joi.string().required(),
});

export const adminNotificationSchema: ObjectSchema<AdminNotificationInterface> = Joi.object({
	id: Joi.string().required(),
	notification: Joi.string().required(),
	type: Joi.string().required(),
	data: Joi.any(),
	files: Joi.array().items(userNotificationFileSchema),
});

export const echoUserNotificationSchema: ObjectSchema<EchoAdminNotification> = Joi.object({
	notification: Joi.string().required(),
	type: Joi.string().required(),
	data: Joi.any(),
	files: Joi.array().items(userNotificationFileSchema),
});
