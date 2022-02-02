import { BankOperation, BankOperationStatus, BankOperationType, } from 'invest-models';
import * as Joi from 'joi';
import { guidSchema, } from '.';

export const bankRegistrySchemas = Joi.object<BankOperation>({
	id: guidSchema,
	type: Joi.string().default(BankOperationType.BENEFICIARY_REGISTRY),
	status: Joi.string().valid(...Object.values(BankOperationStatus)),
	requestData: Joi.string(),
	responseData: Joi.string(),
	createdAt: Joi.date(),
});
