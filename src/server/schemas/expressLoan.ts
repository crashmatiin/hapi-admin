import Joi from 'joi';
import { ExpressLoanFileType, } from 'invest-models';
import {
	idSchema,
	guidSchema,
	tinSchema,
	amountSchema,
	boolSchema,
	emailSchema,
} from '../schemas/index';

const expressLoanFileSchema = Joi.object({
	fileId: guidSchema.required(),
	type: Joi.string()
		.valid(...Object.values(ExpressLoanFileType))
		.required(),
	name: Joi.string().required().example('passport.pdf'),
});

export const expressLoanCreateSchema = Joi.object({
	tin: tinSchema,
	amount: amountSchema,
	gosContractTarget: boolSchema,
	gosContractExp: boolSchema,
	gosContractNumber: Joi.array(),
	expMonolopy: boolSchema,
	firstName: Joi.string(),
	middleName: Joi.string(),
	lastName: Joi.string(),
	email: emailSchema.required(),
	files: Joi.array().items(expressLoanFileSchema),
}).label('Create express loan');

export const expressLoanSchema = Joi.object({
	id: guidSchema,
	number: idSchema,
	tin: tinSchema,
	amount: amountSchema,
	gosContractTarget: boolSchema,
	gosContractExp: boolSchema,
	gosContractNumber: Joi.array(),
	expMonolopy: boolSchema,
	firstName: Joi.string(),
	middleName: Joi.string(),
	lastName: Joi.string(),
	email: emailSchema.required(),
	expressLoanFile: Joi.array().items(expressLoanFileSchema),
}).label('Express Loan');
