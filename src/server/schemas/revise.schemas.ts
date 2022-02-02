import { BankOperationStatus, BankRevise, } from 'invest-models';
import * as Joi from 'joi';
import { guidSchema, } from '.';

export const BankReviseSchemas = Joi.object<BankRevise>({
	id: guidSchema,
	status: Joi.string().valid(...Object.values(BankOperationStatus)),
	createdAt: Joi.date(),
});
