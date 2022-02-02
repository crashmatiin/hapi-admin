import { Lifecycle, } from '@hapi/hapi';
import {
	UserProfile,
	Loan,
	User,
	LoanDocument,
	EntityAccount,
	OperationType,
	File,
	userRole,
	NotificationType,
	Payment,
	UserAddress,
	EntityDocument,
	UserDocument,
	EntityDocumentPage,
} from 'invest-models';
import * as Hapi from '@hapi/hapi';
import { IOutputOk, } from 'server/interfaces';
import { Boom, } from '@hapi/boom';
import { OperationMqRequest, } from 'mq-plugin/protocols';
import { IListLoansQueries, IListQueries, } from '../utils/utils.interfaces';
import { IPaymentWithInvestorStats, } from '../templates/templates.interfaces';
import { getOperation, prepareFileResponse, } from '../utils/helpers';
import { SpreadsheetFormatter, } from '../utils/xlsx';
import { returnTemplateLoansXlsx, } from '../../server/templates/loans.template.xls';
import config from '../config/config';
import {
	IFormattingLoan,
	IArrearsStatus,
	ILoanDocument,
	ILoanDocumentCreate,
	ILoanPenalty,
	ILoanStatus,
	updateLoan,
	ListLoanQueries,
	ListBorrowerLoansQueries,
} from '../../server/core/types/loans';
import { output, outputOk, outputPagination, } from '../utils';
import { Errors, } from '../utils/errors';
import {
	queryLoans,
	loansStats,
	queryInvestors,
	queryBorrowerLoans,
	queryPaymentsWithInvestments,
} from '../core/operations/loans';
import { Exception, handlerError, } from '../utils/error';

const listLoans: Lifecycle.Method = async (r) => {
	try {
		const { count, rows, } = await queryBorrowerLoans(
			r.query as ListBorrowerLoansQueries,
			r.params.borrowerId
		);
		return outputPagination(count, rows);
	} catch (err) {
		return handlerError('Failed to list loans', err);
	}
};

const retrieveLoan: Lifecycle.Method = async (r) => {
	try {
		const { id: loanId, } = r.params;
		const loan = await Loan.findOne({
			where: {
				id: loanId,
			},
			include: [
				{
					model: User,
					as: 'user',
					include: [{ model: UserAddress, }, { model: UserDocument, }],
				},
				{
					model: UserProfile,
					include: [
						{
							model: EntityAccount,
							include: [
								{
									model: EntityDocument,
									include: [{ model: EntityDocumentPage, }],
								}
							],
						}
					],
				},
				{
					model: LoanDocument,
					include: [{
						model: File,
						as: 'file',
						attributes: ['id', 'name', 'type'],
					}],
				},
				{
					model: User,
					as: 'investors',
				}
			],
		});
		if (!loan) {
			throw new Exception(Errors.NotFound, 'Loan not found', {});
		}

		return output(loan);
	} catch (err) {
		return handlerError('Failed to retrieve loan', err);
	}
};

export async function updateLoan(request: Hapi.Request) {
	try {
		const { id, } = request.params;
		const loan = await Loan.findOne({
			where: {
				id,
			},
		});

		if (!loan) {
			throw new Exception(Errors.NotFound, 'Loan not found', {});
		}

		const loanUpdate = await loan.update(request.payload as updateLoan);

		return loanUpdate;
	} catch (err) {
		return handlerError('Failed to formatting loan', err);
	}
}

export async function formattingLoan(r: Hapi.Request) {
	try {
		const { id: loanId, } = r.params;
		const loan = await Loan.findOne({
			where: {
				id: loanId,
			},
			include: [
				{
					model: User,
					as: 'user',
					include: [{ model: UserAddress, }],
				},
				{
					model: UserProfile,
				}
			],
		});
		if (!loan) {
			throw new Exception(Errors.NotFound, 'Loan not found', {});
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const loanUpdate = await loan.update(r.payload as IFormattingLoan);
		return output(loanUpdate);
	} catch (err) {
		return handlerError('Failed to update loan', err);
	}
}

export async function checkLoanDocument(request: Hapi.Request) {
	try {
		const { id, } = request.params;
		const { check, } = request.payload as { check: boolean };
		const loanDocument = await LoanDocument.findOne({
			where: {
				fileId: id,
			},
		});

		if (!loanDocument) {
			throw new Exception(Errors.NotFound, 'Loan document not found', {});
		}

		await loanDocument.update({
			checked: check,
		});

		return output({ id: loanDocument.id, checked: check, });
	} catch (err) {
		return handlerError('Failed to check loan document', err);
	}
}

const listAllLoans: Lifecycle.Method = async (r) => {
	try {
		const { count, rows, } = await queryLoans(r.query as ListLoanQueries);

		return outputPagination(count, rows);
	} catch (err) {
		return handlerError('Failed to list loans', err);
	}
};

const getLoansStats: Lifecycle.Method = async (r) => {
	try {
		const stats = await loansStats();
		return output(stats);
	} catch (err) {
		return handlerError('Failed to get loans stats', err);
	}
};

export async function getLoanPaymentsWithInvestments(r: Hapi.Request) {
	try {
		const { loanId, } = r.params as { loanId: string };
		const loan = await Loan.findByPk(loanId);

		if (!loan) {
			throw new Exception(Errors.NotFound, 'Loan not found', {});
		}

		const query = r.query as IListLoansQueries;

		let paymentsWithStats: { count: number; rows: Array<Payment | IPaymentWithInvestorStats> };

		if (query.userId) {
			paymentsWithStats = await queryPaymentsWithInvestments(query, loanId, query.userId);
		} else {
			paymentsWithStats = await queryPaymentsWithInvestments(query, loanId);
		}

		return outputOk(paymentsWithStats);
	} catch (err) {
		return handlerError('Failed to list payments', err);
	}
}

const getLoanInvestors: Lifecycle.Method = async (r) => {
	try {
		const loan = await Loan.findByPk(r.params.id);

		if (!loan) {
			throw new Exception(Errors.NotFound, 'Loan not found', {});
		}

		const { count, rows, } = await queryInvestors(r.query as IListQueries, r.params.id);

		return outputPagination(count, rows);
	} catch (err) {
		return handlerError('Failed to list payments', err);
	}
};

const updateLoanStatus: Lifecycle.Method = async (r) => {
	try {
		const { id: loanId, } = r.params;
		const { loanStatus, } = r.payload as ILoanStatus;
		const loan = await Loan.findOne({
			where: {
				id: loanId,
			},
		});
		if (!loan) {
			throw new Exception(Errors.NotFound, 'Loan not found', {});
		}

		const loanUpdate = await loan.update({
			status: loanStatus,
		});

		const profile = await UserProfile.findOne({
			where: {
				id: loan.profileId,
				role: userRole.BORROWER,
			},
			include: [{ model: User, }],
		});

		if (!profile) {
			throw new Exception(Errors.NotFound, 'Borrower does\'t exist', {});
		}

		await r.server.mqSend('notifications', {
			userIds: [profile.user.id],
			notification: 'Статус вашей заявки был обновлен',
			type: NotificationType.LOANSTATUSUPDATED,
			status: true,
			data: null,
		});

		return output(loanUpdate);
	} catch (err) {
		return handlerError('Failed to update loan status', err);
	}
};

const listLoansXlsx: Lifecycle.Method = async (r, h) => {
	try {
		const { rows, } = await queryLoans(r.query as ListLoanQueries);
		const borrowersStat = await loansStats();
		const name = 'Loans.xlsx';
		const formatter = new SpreadsheetFormatter();
		const file = await formatter.format(
			returnTemplateLoansXlsx({ stats: borrowersStat, loans: rows, }),
			{ name, }
		);
		return prepareFileResponse(file, config.files.xslxType, name, h);
	} catch (err) {
		return handlerError('Failed to get borrowers xlsx', err);
	}
};

const updateLoanArrearsStatus: Lifecycle.Method = async (r) => {
	try {
		const { id: loanId, } = r.params;
		const { arrearsStatus, } = r.payload as IArrearsStatus;
		const loan = await Loan.findOne({
			where: {
				id: loanId,
			},
		});
		if (!loan) {
			throw new Exception(Errors.NotFound, 'Loan not found', {});
		}

		const loanUpdate = await loan.update({
			arrearsStatus,
		});

		return output(loanUpdate);
	} catch (err) {
		return handlerError('Failed to update arrears status', err);
	}
};

const deleteLoan: Lifecycle.Method = async (r) => {
	try {
		const { id: loanId, } = r.params;
		const loan = await Loan.findOne({
			where: {
				id: loanId,
			},
			include: [
				{
					model: User,
					as: 'user',
					include: [{ model: UserAddress, }],
				},
				{
					model: UserProfile,
				},
				{
					model: LoanDocument,
				}
			],
		});
		if (!loan) {
			throw new Exception(Errors.NotFound, 'Loan not found', {});
		}

		await LoanDocument.destroy({
			where: {
				loanId,
			},
		});
		await loan.destroy();

		return output({ loanId, });
	} catch (err) {
		return handlerError('Failed to delete loan', err);
	}
};

const updateLoanDocument = async (
	request: Hapi.Request
): Promise<IOutputOk<LoanDocument> | Boom> => {
	const transaction = await request.server.app.db.transaction();
	try {
		const { fileId, } = request.params;
		const { name, id, } = request.payload as ILoanDocument;
		const loanDocument = await LoanDocument.findOne({ where: { fileId, }, });

		if (!loanDocument) {
			throw new Exception(Errors.NotFound, 'LoanDocument not found', {});
		}

		const file = await File.findOne({ where: { id, }, });
		const newLoanDocument = await LoanDocument.findOne({ where: { fileId: id, }, });
		const loan = await Loan.findOne({ where: { id: loanDocument.loanId, }, });

		if (newLoanDocument) {
			throw new Exception(Errors.AlreadyExists, 'LoanDocument with this file id already exist', {});
		}

		if (!file) {
			await File.create(
				{
					id,
					name,
					owner: loan.borrowerId,
					profileType: loan.profileType,
					type: loanDocument.type,
				},
				{ transaction, }
			);
		}

		await loanDocument.destroy({ transaction, });

		const newDoc = await LoanDocument.create(
			{
				fileId: id,
				loanId: loanDocument.loanId,
				name,
				type: loanDocument.type,
				checked: loanDocument.checked,
				privacy: 'private',
			},
			{ transaction, }
		);

		await loanDocument.destroy({ transaction, });

		transaction.commit();
		return outputOk(newDoc);
	} catch (err) {
		transaction.rollback();
		return handlerError('Failed to update loan document', err);
	}
};

const deleteLoanDocument: Lifecycle.Method = async (request) => {
	try {
		const { fileId, } = request.params;
		const loanDocument = await LoanDocument.findOne({
			where: {
				fileId,
			},
		});

		if (!loanDocument) {
			throw new Exception(Errors.NotFound, 'Loan document not found', {});
		}

		await loanDocument.destroy();

		return output({ fileId, });
	} catch (err) {
		return handlerError('Failed to delete loan document', err);
	}
};

const updateLoanPenalty: Lifecycle.Method = async (r) => {
	try {
		const { id, } = r.params;
		const { penalty, } = r.payload as ILoanPenalty;
		const loan = await Loan.findOne({
			where: {
				id,
			},
		});
		if (!loan) {
			throw new Exception(Errors.NotFound, 'Loan not found', {});
		}

		const loanUpdate = await loan.update({
			penalty,
		});

		return output(loanUpdate);
	} catch (err) {
		return handlerError('Failed to update loan penalty value', err);
	}
};

const createLoanDocument = async (
	request: Hapi.Request
): Promise<IOutputOk<LoanDocument> | Boom> => {
	const transaction = await request.server.app.db.transaction();
	try {
		const { name, fileId, loanId, type, } = request.payload as ILoanDocumentCreate;
		const loan = await Loan.findOne({ where: { id: loanId, }, });

		if (!loan) {
			throw new Exception(Errors.NotFound, 'Loan not found', {});
		}

		const loanDocument = await LoanDocument.findOne({ where: { fileId, }, });

		if (loanDocument) {
			throw new Exception(Errors.AlreadyExists, 'Loan document with this fileId already exist', {});
		}

		// FIXME await File.findCreateFind
		const file = await File.findOne({ where: { id: fileId, }, });
		if (!file) {
			await File.create(
				{
					id: fileId,
					name,
					owner: loan.borrowerId,
					profileType: loan.profileType,
					type,
				},
				{ transaction, }
			);
		}

		const newDoc = await LoanDocument.create(
			{
				fileId,
				loanId,
				name,
				type,
				checked: false,
				privacy: 'private',
			},
			{ transaction, }
		);

		transaction.commit();
		return outputOk(newDoc);
	} catch (err) {
		transaction.rollback();
		return handlerError('Failed to create loan document', err);
	}
};

const generateOffers = async (
	request: Hapi.Request
): Promise<IOutputOk<{ operationId: string }> | Boom> => {
	const transaction = await request.server.app.db.transaction();
	try {
		const { loanId, } = request.params;
		const loan = await Loan.findOne({
			where: {
				id: loanId,
			},
		});
		if (!loan) {
			throw new Exception(Errors.NotFound, 'Loan not found', {});
		}

		const operationType = OperationType.LOANCREATEOFFER;
		const operation = await getOperation(loan.profileId, operationType, transaction, {
			info: { loanId, },
		});
		await request.server.mqSend<OperationMqRequest>('operation', { operationId: operation.id, });
		await transaction.commit();
		return outputOk({ operationId: operation.id, });
	} catch (err) {
		await transaction.rollback();
		return handlerError('Failed to generate offers', err);
	}
};

export {
	listLoans,
	retrieveLoan,
	listAllLoans,
	getLoansStats,
	getLoanInvestors,
	updateLoanStatus,
	listLoansXlsx,
	updateLoanArrearsStatus,
	deleteLoan,
	updateLoanDocument,
	deleteLoanDocument,
	updateLoanPenalty,
	createLoanDocument,
	generateOffers,
};
