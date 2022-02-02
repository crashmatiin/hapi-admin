import { Lifecycle, } from '@hapi/hapi';
import * as Hapi from '@hapi/hapi';
import {
	UserAddress,
	EntityBeneficiaryDocumentPage,
	UserDocumentPage,
	EntityAccount,
	EntityBeneficiary,
	EntityContact,
	EntityLicense,
	EntrepreneurAccount,
	Investment,
	EntityLicenseKind,
	Loan,
	LoanStatus,
	NotificationType,
	User,
	UserDocument,
	UserProfile,
	Wallet,
	File,
	UserProfileRole,
	userRole,
	UserProfileType,
	UserProfileStatus,
	EntityDocument,
	EntityDocumentPage,
} from 'invest-models';
import { Op, } from 'sequelize';
import { Boom, } from '@hapi/boom';
import { IOutputOk, } from 'server/interfaces';
import { returnTemplateLoansXlsx, } from '../templates/investorProjects.template.xls';
import { Exception, handlerError, } from '../utils/error';
import {
	queryStats,
	queryInvestors,
	investorsStats,
	queryInvestorProjects,
	queryInvestorProjectsHold,
} from '../core/operations/investors';
import { returnTemplate, } from '../templates/investors.template.xls';
import { output, } from '../utils';
import { Errors, } from '../utils/errors';
import { prepareFileResponse, } from '../utils/helpers';
import { SpreadsheetFormatter, } from '../utils/xlsx';

export const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const listInvestors: Lifecycle.Method = async (r) => {
	try {
		const data = await queryInvestors(r.query);
		return output(data);
	} catch (err) {
		return handlerError('Failed to list investors', err);
	}
};

export const listInvestorsXslx = async (r, h) => {
	try {
		const { limit, offset, query, order, } = r.query;
		const data = await queryStats(r.server, {
			limit,
			offset,
			query,
			order,
		});
		const name = 'Investors.xlsx';
		const formatter = new SpreadsheetFormatter();
		const file = await formatter.format(returnTemplate(data), { name, });
		return prepareFileResponse(file, XLSX_TYPE, name, h);
	} catch (err) {
		return handlerError('Failed to list investors', err);
	}
};

export const retrieveInvestor: Lifecycle.Method = async (r) => {
	try {
		const investor = await UserProfile.scope('withUpdates').findOne({
			where: {
				id: r.params.id,
				role: UserProfileRole.INVESTOR,
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

		if (!investor) {
			throw new Exception(Errors.NotFound, 'Investor not found', {});
		}

		let userOutput: Partial<UserProfile> = investor.toJSON();

		// TODO подумать как определять источник данных, но пока брать отсюда и так
		if (investor.updates) {
			userOutput = {
				...userOutput,
				...userOutput.updates,
			};
			delete userOutput.updates;
		}

		if (userOutput.user) {
			let user: Partial<User> = investor.user.toJSON();
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
			let entityAcc: Partial<EntityAccount> = investor.entityAccount.toJSON();
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
		return handlerError('Failed to retrieve investor', err);
	}
};

export const getInvestorsStats = async (r) => {
	try {
		const stats = await investorsStats(r.server, r.query);
		return output(stats);
	} catch (err) {
		return handlerError('Failed to get investors stats', err);
	}
};

export const updateInvestor = async (r: Hapi.Request): Promise<IOutputOk<UserProfile> | Boom> => {
	const transaction = await r.server.app.db.transaction();
	try {
		const reqPayload = r.payload;
		const payload = JSON.parse(JSON.stringify(reqPayload));
		const investor = await UserProfile.findOne({
			where: {
				id: r.params.id,
				role: userRole.INVESTOR,
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
							model: UserDocument.scope('withUpdates'),
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
		if (!investor) {
			throw new Exception(Errors.NotFound, 'Investor not found', {});
		}

		const user: User = await User.findByPk(investor.userId);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const investorUpdate = await investor.update(r.payload as any, { transaction, });

		await user.update(payload.user, { transaction, });

		await UserAddress.update(payload.user.address, {
			where: {
				id: investor.user.userAddress.id,
			},
			transaction,
		});

		await Wallet.update(payload.wallet, {
			where: {
				id: investor.walletId,
			},
			transaction,
		});

		await UserDocument.update(payload.user.documents, {
			where: {
				userId: investor.userId,
			},
			transaction,
		});

		if (investor.type === UserProfileType.ENTITY) {
			await EntityAccount.update(payload.entityAccount, {
				where: {
					id: investor.entityAccount.id,
				},
				transaction,
			});
		}

		if (investor.type === UserProfileType.ENTREPRENEUR) {
			await EntrepreneurAccount.update(payload.entrepreneurAccount, {
				where: {
					id: investor.entrepreneurAccount.id,
				},
				transaction,
			});
		}

		await transaction.commit();
		return output(investorUpdate);
	} catch (err) {
		await transaction.rollback();
		return handlerError('Failed to update investor', err);
	}
};

export const deleteInvestor: Lifecycle.Method = async (r) => {
	const { db: sequelize, } = r.server.app;
	const tx = await sequelize.transaction();
	try {
		const { investorId, } = r.params;

		const profile = await UserProfile.findOne({
			where: {
				id: investorId,
				role: userRole.INVESTOR,
			},
			include: [{ model: User, }],
		});

		if (!profile) {
			throw new Exception(Errors.NotFound, 'Investor does\'t exist', { investorId, });
		}

		const checkUserDebt = await UserProfile.findOne({
			where: {
				id: investorId,
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
			notification: 'Ваш профиль инвестора был удален.',
			type: NotificationType.PROFILEDELETED,
			status: true,
			data: profile.id,
		});

		await profile.destroy({ transaction: tx, });
		await tx.commit();

		return output({ investorId, });
	} catch (err) {
		await tx.rollback();
		return handlerError('Failed to delete investor', err);
	}
};

export const blockInvestor: Lifecycle.Method = async (r) => {
	try {
		const { investorId, } = r.params;
		const investor = await UserProfile.findOne({
			where: {
				id: investorId,
				role: userRole.INVESTOR,
			},
			include: [
				{
					model: User,
					include: [{ model: UserAddress, }, { model: UserDocument, }],
				},
				{
					model: Wallet,
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
		if (!investor) {
			throw new Exception(Errors.NotFound, 'Investor not found', {});
		}

		if (investor.status === UserProfileStatus.BANNED) {
			throw new Exception(Errors.StatusAlreadyAssigned, 'Investor is already banned', {});
		}

		const oldStatus = investor.status;

		const investorUpdate = await investor.update({
			status: UserProfileStatus.BANNED,
			settings: {
				oldStatus,
			},
		});

		await r.server.mqSend('notifications', {
			userIds: [investor.user.id],
			notification: 'Ваш профиль инвестора был заблокирован.',
			type: NotificationType.PROFILEBANNED,
			status: true,
			data: investor.id,
		});

		return output(investorUpdate);
	} catch (err) {
		return handlerError('Failed to block investor', err);
	}
};

export const unblockInvestor: Lifecycle.Method = async (r) => {
	try {
		const { investorId, } = r.params;
		const investor = await UserProfile.findOne({
			where: {
				id: investorId,
				role: userRole.INVESTOR,
			},
			include: [
				{
					model: User,
					include: [{ model: UserAddress, }],
				}
			],
			attributes: ['id', 'status', 'settings'],
		});
		if (!investor) {
			throw new Exception(Errors.NotFound, 'Investor not found', {});
		}

		const { oldStatus, } = investor.settings;

		if (investor.status !== UserProfileStatus.BANNED || !oldStatus) {
			throw new Exception(Errors.StatusAlreadyAssigned, 'Cannot unban this investor', {});
		}

		await investor.update({
			status: oldStatus,
			settings: {
				oldStatus: UserProfileStatus.BANNED,
			},
		});

		await r.server.mqSend('notifications', {
			userIds: [investor.user.id],
			notification: 'Ваш профиль инвестора был разблокирован.',
			type: NotificationType.PROFILEUNBANNED,
			status: true,
			data: investor.id,
		});

		return output(investor.status);
	} catch (err) {
		return handlerError('Failed to unblock investor', err);
	}
};

export const retrieveInvestorProjects: Lifecycle.Method = async (r) => {
	try {
		const data = await queryInvestorProjects(r.query);
		return output(data);
	} catch (err) {
		return handlerError('Failed to list investor projects', err);
	}
};

export const retrieveInvestorProjectsHold: Lifecycle.Method = async (r) => {
	try {
		const data = await queryInvestorProjectsHold(r.query);
		return output(data);
	} catch (err) {
		return handlerError('Failed to list investor projects (hold)', err);
	}
};

export const listInvestorProjectsXslx = async (r, h) => {
	try {
		const data = await queryInvestorProjects(r.query);
		const name = 'Investor_projects.xlsx';
		const formatter = new SpreadsheetFormatter();
		const file = await formatter.format(returnTemplateLoansXlsx(data), { name, });
		return prepareFileResponse(file, XLSX_TYPE, name, h);
	} catch (err) {
		return handlerError('Failed to list investor projects', err);
	}
};

export const listInvestorProjectsHoldXslx = async (r, h) => {
	try {
		const data = await queryInvestorProjectsHold(r.query);
		const name = 'Investor_projects_hold.xlsx';
		const formatter = new SpreadsheetFormatter();
		const file = await formatter.format(returnTemplateLoansXlsx(data), { name, });
		return prepareFileResponse(file, XLSX_TYPE, name, h);
	} catch (err) {
		return handlerError('Failed to list investor projects (hold)', err);
	}
};
