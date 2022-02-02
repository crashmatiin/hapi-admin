import { Lifecycle, } from '@hapi/hapi';
import { Op, } from 'sequelize';
import {
  User,
  userRole,
  UserProfile,
  Wallet,
  EntrepreneurAccount,
  EntityAccount,
  UserAddress,
  UserDocument,
  EntityBeneficiary,
  EntityLicense,
  EntityContact,
  EntityBeneficiaryDocumentPage,
  EntityLicenseKind,
  Investment,
  Loan,
  LoanStatus,
  NotificationType,
  UserDocumentPage,
  File,
  UserProfileType,
  UserProfileStatus,
  EntityDocument,
  EntityDocumentPage,
  DocumentPageStatus,
} from 'invest-models';
import { IOutputOk, } from 'server/interfaces';
import { Boom, } from '@hapi/boom';
import * as Hapi from '@hapi/hapi';
import { IBorrowerId, IBorrowerRating, } from '../core/types/borrowers';
import { output, outputPagination, } from '../utils';
import { Errors, } from '../utils/errors';
import { prepareFileResponse, } from '../utils/helpers';
import { queryBorrowers, borrowerStats, } from '../core/operations/borrowers';
import { SpreadsheetFormatter, } from '../utils/xlsx';
import config from '../config/config';
import { returnBorrowersTemplate, } from '../templates/borrowers.template.xls';
import { Exception, handlerError, } from '../utils/error';

const listBorrowers: Lifecycle.Method = async (r) => {
	try {
		const { count, rows, } = await queryBorrowers(r.query);

		return outputPagination(count, rows);
	} catch (err) {
		return handlerError('Failed to list borrowers', err);
	}
};

const retrieveBorrower: Lifecycle.Method = async (r) => {
	try {
		const { id: borrowerId, } = r.params;
		const borrower = await UserProfile.scope('withUpdates').findOne({
			where: {
				id: borrowerId,
				role: userRole.BORROWER,
			},
			include: [
				{
					model: User.scope('withUpdates'),
					include: [
						{ model: UserAddress, },
						{
							model: UserDocument,
							include: [
								{
									model: UserDocumentPage,
									include: [
										{
											model: File,
											attributes: ['name'],
										}
									],
								}
							],
						}
					],
				},
				{
					model: Wallet,
					attributes: ['requisites'],
				},
				{ model: EntrepreneurAccount, },
				{
					model: EntityAccount.scope('withUpdates'),
					include: [
						{
							model: EntityBeneficiary,
							include: [
								{
									model: EntityBeneficiaryDocumentPage,
									include: [
										{
											model: File,
											attributes: ['name'],
										}
									],
								},
								{
									model: EntityAccount,
									include: [
										{
											model: EntityLicense,
											include: [
												{
													model: EntityLicenseKind,
												}
											],
										},
										{
											model: EntityDocument,
											include: [{ model: EntityDocumentPage, }],
										}
									],
								}
							],
						},
						{ model: EntityContact, },
						{
							model: EntityDocument.scope('withUpdates'),
							include: [{
								model: EntityDocumentPage,
								include: [{ 
									model: File,
									attributes: ['name'],
								}],
							}],
						}
					],
				}
			],
		});
		if (!borrower) {
			throw new Exception(Errors.NotFound, 'Borrower not found', {});
		}

		let userOutput: Partial<UserProfile> = borrower.toJSON();

		// TODO подумать как определять источник данных, но пока брать отсюда и так
		if (borrower.updates) {
			userOutput.email = userOutput.updates.email;
			userOutput.phone = userOutput.updates.phone;
			userOutput = {
				...userOutput,
				...userOutput.updates,
			};
			delete userOutput.updates;
		}

		if (userOutput.user) {
			let user: Partial<User> = borrower.user.toJSON();
			if (user.updates) {
				user = {
					...user,
					...user.updates,
				};
				delete user.updates;
				userOutput.user = user as User;
			}
		} else {
			delete userOutput.user;
		}
		// TODO придумать нормально, мне не нравятся эти кучи костылей
		// возможно надо реализовать извелечение данных на уровне секвалайза или БД

		if (userOutput.type === UserProfileType.ENTITY) {
			let entityAcc: Partial<EntityAccount> = borrower.entityAccount.toJSON();
			entityAcc = {
				...entityAcc,
				...entityAcc.updates,
			};
			delete entityAcc.updates;

			if (entityAcc.entityDocument) {
				let entityAccDocs: Partial<EntityDocument> = entityAcc.entityDocument;
				entityAccDocs = {
					...entityAccDocs,
					...entityAccDocs.updates,
				};
				delete entityAccDocs.updates;

				entityAcc.entityDocument = entityAccDocs as EntityDocument;
			}
			userOutput.entityAccount = entityAcc as EntityAccount;
		} else {
			delete userOutput.entityAccount;
		}

		return output({
			...userOutput,
		} as unknown as UserProfile);
	} catch (err) {
		return handlerError('Failed to retrieve borrower', err);
	}
};

const getBorrowersStats: Lifecycle.Method = async (r) => {
	try {
		const stats = await borrowerStats();
		return output(stats);
	} catch (err) {
		return handlerError('Failed to get borrowers stats', err);
	}
};

const updateBorrower: Lifecycle.Method = async (
	r: Hapi.Request
): Promise<IOutputOk<UserProfile> | Boom> => {
	const transaction = await r.server.app.db.transaction();
	try {
		const { id, } = r.params;
		const reqPayload = r.payload;
		const payload = JSON.parse(JSON.stringify(reqPayload));
		const borrower = await UserProfile.findOne({
			where: {
				id,
				role: userRole.BORROWER,
			},
			include: [
				{
					model: User,
					attributes: {
						exclude: ['fullName'],
					},
					include: [
						{ model: UserAddress, },
						{
							model: UserDocument,
							include: [
								{
									model: UserDocumentPage,
									include: [
										{
											model: File,
											attributes: ['name'],
										}
									],
								}
							],
						}
					],
				},
				{
					model: Wallet,
					attributes: ['requisites'],
				},
				{ model: EntrepreneurAccount, },
				{
					model: EntityAccount,
					include: [
						{
							model: EntityBeneficiary,
							include: [
								{ model: EntityBeneficiaryDocumentPage, },
								{
									model: EntityAccount,
									include: [
										{
											model: EntityLicense,
											include: [
												{
													model: EntityLicenseKind,
												}
											],
										},
										{
											model: EntityDocument,
											include: [{ model: EntityDocumentPage, }],
										}
									],
								}
							],
						},
						{ model: EntityContact, },
						{
							model: EntityDocument,
							include: [{ model: EntityDocumentPage, }],
						}
					],
				}
			],
		});
		if (!borrower) {
			throw new Exception(Errors.NotFound, 'Borrower not found', {});
		}

		const user: User = await User.findByPk(borrower.userId);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const borrowerUpdate = await borrower.update(r.payload as any);

		await user.update(payload.user, { transaction, });

		await UserAddress.update(payload.user.address, {
			where: {
				id: borrower.user.userAddress.id,
			},
			transaction,
		});

		await Wallet.update(payload.wallet, {
			where: {
				id: borrower.walletId,
			},
			transaction,
		});

		await UserDocument.update(payload.user.documents, {
			where: {
				userId: borrower.userId,
			},
			transaction,
		});

		if (borrower.type === UserProfileType.ENTITY) {
			await EntityAccount.update(payload.entityAccount, {
				where: {
					id: borrower.entityAccount.id,
				},
				transaction,
			});
		}

		if (borrower.type === UserProfileType.ENTREPRENEUR) {
			await EntrepreneurAccount.update(payload.entrepreneurAccount, {
				where: {
					id: borrower.entrepreneurAccount.id,
				},
				transaction,
			});
		}

		await transaction.commit();
		return output(borrowerUpdate);
	} catch (err) {
		await transaction.rollback();
		return handlerError('Failed to update borrower', err);
	}
};

const listBorrowersXlsx: Lifecycle.Method = async (r, h) => {
	try {
		const { rows, } = await queryBorrowers(r.query);
		const borrowersStat = await borrowerStats();
		const name = 'Borrowers.xlsx';
		const formatter = new SpreadsheetFormatter();
		const file = await formatter.format(
			returnBorrowersTemplate(
				{
					stats: borrowersStat,
					users: rows,
				},
				userRole.BORROWER
			),
			{ name, }
		);
		return prepareFileResponse(file, config.files.xslxType, name, h);
	} catch (err) {
		return handlerError('Failed to get borrowers xlsx', err);
	}
};

const deleteBorrower: Lifecycle.Method = async (r) => {
	const { db: sequelize, } = r.server.app;
	const tx = await sequelize.transaction();
	try {
		const { borrowerId, } = r.params as IBorrowerId;

		const profile = await UserProfile.findOne({
			where: {
				id: borrowerId,
				role: userRole.BORROWER,
			},
			include: [{ model: User, }],
		});

		if (!profile) {
			throw new Exception(Errors.NotFound, 'Borrower does\'t exist', { borrowerId, });
		}

		const checkUserDebt = await UserProfile.findOne({
			where: {
				id: borrowerId,
			},
			transaction: tx,
			include: [
				{
					model: Loan,
					as: 'loans',
					where: {
						[Op.or]: {
							status: {
								[Op.not]: LoanStatus.CLOSED,
							},
							debt: {
								[Op.gt]: 0,
							},
						},
					},
					include: [
						{
							model: Investment,
							as: 'investments',
							required: false,
						}
					],
				}
			],
		});

		if (checkUserDebt && checkUserDebt.loans) {
			throw new Exception(Errors.Forbidden, 'User has active loans', {
				loansId: checkUserDebt.loans,
			});
		}

		await r.server.mqSend('notifications', {
			userIds: [profile.user.id],
			notification: 'Ваш профиль заемщика был удален.',
			type: NotificationType.PROFILEDELETED,
			status: true,
			data: profile.id,
		});

		await profile.destroy({ transaction: tx, });
		await tx.commit();

		return output({ borrowerId, });
	} catch (err) {
		await tx.rollback();
		return handlerError('Failed to delete borrower', err);
	}
};

const blockBorrower: Lifecycle.Method = async (r) => {
	try {
		const { borrowerId, } = r.params;
		const borrower = await UserProfile.findOne({
			where: {
				id: borrowerId,
				role: userRole.BORROWER,
			},
			include: [
				{
					model: User,
					include: [{ model: UserAddress, }],
				},
				{ model: Wallet, },
				{ model: EntrepreneurAccount, },
				{ model: EntityAccount, }
			],
		});
		if (!borrower) {
			throw new Exception(Errors.NotFound, 'Borrower not found', {});
		}

		if (borrower.status === UserProfileStatus.BANNED) {
			throw new Exception(Errors.StatusAlreadyAssigned, 'Borrower is already banned', {});
		}

		const oldStatus = borrower.status;

		const borrowerUpdate = await borrower.update({
			status: UserProfileStatus.BANNED,
			settings: {
				oldStatus,
			},
		});

		await r.server.mqSend('notifications', {
			userIds: [borrower.user.id],
			notification: 'Ваш профиль заемщика был заблокирован.',
			type: NotificationType.PROFILEBANNED,
			status: true,
			data: borrower.id,
		});

		return output(borrowerUpdate);
	} catch (err) {
		return handlerError('Failed to block borrower', err);
	}
};

export const unblockBorrower: Lifecycle.Method = async (r) => {
	try {
		const { borrowerId, } = r.params;
		const borrower = await UserProfile.findOne({
			where: {
				id: borrowerId,
				role: userRole.BORROWER,
			},
			include: [
				{
					model: User,
					include: [{ model: UserAddress, }],
				}
			],
			attributes: ['status', 'settings', 'id'],
		});
		if (!borrower) {
			throw new Exception(Errors.NotFound, 'Borrower not found', {});
		}

		const { oldStatus, } = borrower.settings;

		if (borrower.status !== UserProfileStatus.BANNED || !oldStatus) {
			throw new Exception(Errors.StatusAlreadyAssigned, 'Cannot unban this borrower', {});
		}

		const borrowerUpdate = await borrower.update({
			status: oldStatus,
			settings: {
				oldStatus: UserProfileStatus.BANNED,
			},
		});

		await r.server.mqSend('notifications', {
			userIds: [borrower.user.id],
			notification: 'Ваш профиль заемщика был раблокирован.',
			type: NotificationType.PROFILEUNBANNED,
			status: true,
			data: borrower.id,
		});

		return output(borrowerUpdate.status);
	} catch (err) {
		return handlerError('Failed to unblock borrower', err);
	}
};

const updateBorrowerRating: Lifecycle.Method = async (r) => {
	try {
		const { id, } = r.params;
		const { rating, } = r.payload as IBorrowerRating;
		const borrower = await UserProfile.findOne({
			where: {
				id,
				role: userRole.BORROWER,
			},
		});
		if (!borrower) {
			throw new Exception(Errors.NotFound, 'Borrower not found', {});
		}

		const borrowerUpdate = await borrower.update({
			rating,
		});
		return output(borrowerUpdate.rating);
	} catch (err) {
		return handlerError('Failed to update borrower', err);
	}
};

const getBorrowerCertificate: Lifecycle.Method = async (r) => {
	try {
		const { id, } = r.params;
		const borrower = await UserProfile.findOne({
			where: {
				id,
				role: userRole.BORROWER,
			},
		});
		if (!borrower) {
			throw new Exception(Errors.NotFound, 'Borrower not found', {});
		}

		// TODO: сделать нормальный метод на получение справки об отсутствии задолженности
		const file = await File.findOne({
			where: {
				id: '8788df02-812a-49f0-8bc3-a7a55792f447',
			},
		});

		return output(file);
	} catch (err) {
		return handlerError('Failed to get borrower certificate', err);
	}
};

export {
	listBorrowers,
	retrieveBorrower,
	updateBorrower,
	getBorrowersStats,
	listBorrowersXlsx,
	deleteBorrower,
	blockBorrower,
	updateBorrowerRating,
	getBorrowerCertificate,
};
