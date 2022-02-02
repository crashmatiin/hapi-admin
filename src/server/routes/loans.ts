import { ServerRoute, } from '@hapi/hapi';
import * as Joi from 'joi';
import { PermissionLevel, } from 'invest-models';
import api from '../api';
import {
	outputPaginationSchema,
	uuidSchema,
	outputOkSchema,
	loanSchema,
	loansStatsSchema,
	userSchema,
	paymentSchema,
	borrowerLoansListSchema,
	loanStatusSchema,
	loansListRequestSchema,
	arrearsStatusLoanSchema,
	loanDocumentTypeCreationSchena,
	outputEmptySchema,
	updateLoanSchema,
	paymentWithStatsSchema,
} from '../schemas';
import { buildPolicy, } from '../config/policies';
import { operationConfirm, } from '../middlewares/2fa';

const routes: ServerRoute[] = [
	{
		method: 'GET',
		path: '/borrower-loans/{borrowerId}',
		handler: api.loans.listLoans,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'loans'],
			description: 'List of borrower loans',
			validate: {
				query: borrowerLoansListSchema,
				params: Joi.object({
					borrowerId: Joi.string().uuid(),
				}),
			},
			response: {
				schema: outputPaginationSchema('loans', loanSchema),
			},
		},
	},
	{
		method: 'GET',
		path: '/loans/{id}',
		handler: api.loans.retrieveLoan,
		options: {
			app: {
				tag: 2208,
			},
			auth: 'jwt-access',
			tags: ['api', 'loans'],
			description: 'Get loan by id',
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
			},
			response: {
				schema: outputOkSchema(loanSchema),
			},
		},
	},
	{
		method: 'PUT',
		path: '/loans/{id}/formation',
		handler: api.loans.formattingLoan,
		options: {
			pre: [operationConfirm],
			app: {
				tag: 2508,
			},
			tags: ['api', 'loans', 'confirmed', 'confirmed'],
			description: 'Update loan entry',
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
				payload: loanSchema,
			},
			plugins: {
				rbac: buildPolicy('loans', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'PUT',
		path: '/loans/{id}/update',
		handler: api.loans.updateLoan,
		options: {
			pre: [operationConfirm],
			app: {
				tag: 2508,
			},
			tags: ['api', 'loans', 'confirmed', 'confirmed'],
			description: 'Update loan entry',
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
				payload: updateLoanSchema,
			},
			plugins: {
				rbac: buildPolicy('loans', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'PUT',
		path: '/loans/document/{id}/check',
		handler: api.loans.checkLoanDocument,
		options: {
			app: {
				tag: 2511,
			},
			tags: ['api', 'loans'],
			description: 'Update loan entry',
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
				payload: Joi.object({
					check: Joi.bool().default(false),
				}),
			},
			plugins: {
				rbac: buildPolicy('loans', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'GET',
		path: '/loans',
		handler: api.loans.listAllLoans,
		options: {
			app: {
				tag: 2108,
			},
			auth: 'jwt-access',
			tags: ['api', 'loans'],
			description: 'List of loans',
			validate: {
				query: loansListRequestSchema,
			},
			response: {
				schema: outputPaginationSchema('loans', loanSchema),
			},
		},
	},
	{
		method: 'GET',
		path: '/loans/stats',
		handler: api.loans.getLoansStats,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'loans'],
			description: 'Get loans statistics',
			response: {
				schema: outputOkSchema(loansStatsSchema),
			},
		},
	},
	{
		method: 'GET',
		path: '/loans/investors/{id}',
		handler: api.loans.getLoanInvestors,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'loans'],
			description: 'Get loans investors',
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
		path: '/loans/payments/{loanId}',
		handler: api.loans.getLoanPaymentsWithInvestments,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'loans'],
			description: 'Get loans payments, with statistics',
			validate: {
				params: Joi.object({
					loanId: uuidSchema,
				}),
				query: Joi.object({
					userId: uuidSchema.optional(),
					scheduleVersion: Joi.number().optional(),
				}),
			},
			response: {
				schema: outputOkSchema(paymentWithStatsSchema),
			},
		},
	},
	{
		method: 'PUT',
		path: '/loans/update-status/{id}',
		handler: api.loans.updateLoanStatus,
		options: {
			pre: [operationConfirm],
			app: {
				tag: 2508,
			},
			tags: ['api', 'loans', 'confirmed', 'confirmed'],
			description: 'Update loan status',
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
				payload: Joi.object({
					loanStatus: loanStatusSchema,
				}),
			},
			response: {
				schema: outputOkSchema(loanSchema),
			},
			plugins: {
				rbac: buildPolicy('loans', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'PUT',
		path: '/loans/{id}/arrears',
		handler: api.loans.updateLoanArrearsStatus,
		options: {
			pre: [operationConfirm],
			tags: ['api', 'loans', 'confirmed'],
			description: 'Update loan arrears status',
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
				payload: Joi.object({
					arrearsStatus: arrearsStatusLoanSchema,
				}),
			},
			response: {
				schema: outputOkSchema(loanSchema),
			},
			plugins: {
				rbac: buildPolicy('loans', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'GET',
		path: '/loans/xlsx',
		handler: api.loans.listLoansXlsx,
		options: {
			auth: 'jwt-access',
			tags: ['api', 'loans'],
			description: 'Get loans list xlsx',
			validate: {
				query: loansListRequestSchema,
			},
		},
	},
	{
		method: 'DELETE',
		path: '/loans/{id}',
		handler: api.loans.deleteLoan,
		options: {
			pre: [operationConfirm],
			app: {
				tag: 2608,
			},
			tags: ['api', 'loans', 'confirmed'],
			description: 'Delete loan entry',
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
			},
			plugins: {
				rbac: buildPolicy('loans', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'PUT',
		path: '/loans/document/{fileId}',
		handler: api.loans.updateLoanDocument,
		options: {
			pre: [operationConfirm],
			tags: ['api', 'loans', 'confirmed'],
			description: 'Update loan document entry',
			validate: {
				params: Joi.object({
					fileId: uuidSchema,
				}),
				payload: Joi.object({
					id: uuidSchema,
					name: Joi.string().example('pdf.pdf'),
				}),
			},
			plugins: {
				rbac: buildPolicy('loans', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'DELETE',
		path: '/loans/document/{fileId}',
		handler: api.loans.deleteLoanDocument,
		options: {
			pre: [operationConfirm],
			tags: ['api', 'loans', 'confirmed'],
			description: 'Update loan document entry',
			validate: {
				params: Joi.object({
					fileId: uuidSchema,
				}),
			},
			plugins: {
				rbac: buildPolicy('loans', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'PUT',
		path: '/loans/{id}/penalty',
		handler: api.loans.updateLoanPenalty,
		options: {
			tags: ['api', 'loans'],
			description: 'Update loan penalty',
			validate: {
				params: Joi.object({
					id: uuidSchema,
				}),
				payload: Joi.object({
					penalty: Joi.number().example(100).label('penalty'),
				}),
			},
			response: {
				schema: outputOkSchema(loanSchema),
			},
			plugins: {
				rbac: buildPolicy('loans', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'POST',
		path: '/loans/document',
		handler: api.loans.createLoanDocument,
		options: {
			tags: ['api', 'loans'],
			pre: [operationConfirm],
			description: 'Update loan document entry',
			validate: {
				payload: Joi.object({
					fileId: uuidSchema,
					loanId: uuidSchema,
					name: Joi.string().example('pdf.pdf'),
					type: loanDocumentTypeCreationSchena,
				}),
			},
			plugins: {
				rbac: buildPolicy('loans', PermissionLevel.WRITE),
			},
		},
	},
	{
		method: 'POST',
		path: '/loans/{loanId}/generate-offer',
		handler: api.loans.generateOffers,
		options: {
			pre: [operationConfirm],
			auth: 'jwt-access',
			tags: ['api', 'loans', 'confirmed'],
			description: 'Generation of offer',
			validate: {
				params: Joi.object({
					loanId: uuidSchema,
				}),
			},
			response: {
				schema: outputEmptySchema(),
			},
		},
	}
];

export default routes;
