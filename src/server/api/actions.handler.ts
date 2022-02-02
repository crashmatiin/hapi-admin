import {
  UserAddress,
  Admin,
  adminStatus,
  UserDocumentPage,
  EntityAccount,
  Investment,
  Loan,
  LoanStatus,
  NotificationType,
  QualificationStatus,
  User,
  UserDocument,
  UserProfile,
  Wallet,
  UserStatus,
  UserProfileStatus,
  UserProfileType,
  EntityContact,
  EntityBeneficiary,
  EntityBeneficiaryDocumentPage,
  EntrepreneurAccount,
  EntityDocument,
  EntityDocumentPage,
  DocumentPageStatus,
} from 'invest-models';
import * as Hapi from '@hapi/hapi';
import { Includeable, Op, } from 'sequelize';
import { Boom, } from '@hapi/boom';
import fetch from 'node-fetch';
import { IId, IQualificationStatus, ITermOfOffice, } from '../core/types/actions';
import { Exception, handlerError, } from '../utils/error';
import { getUUID, output, outputOk, } from '../utils';
import { Errors, } from '../utils/errors';
import { IOutputOk, } from '../interfaces/index';

export async function perfomUserBan(r: Hapi.Request) {
	// Add permissions check
	try {
		const user = await User.findByPk(r.params.id);
		if (!user) {
			throw new Exception(Errors.NotFound, 'User not found', {});
		}

		if (user.status === UserStatus.BANNED) {
			throw new Exception(Errors.StatusAlreadyAssigned, 'User already banned', {});
		}

		const oldStatus = user.status;
		await user.update({
			status: UserStatus.BANNED,
			settings: {
				...user.settings,
				oldStatus,
			},
		});

		await r.server.mqSend('notifications', {
			userIds: [user.id],
			notification: 'Ваш аккаунт был заблокирован.',
			type: NotificationType.USERBANNED,
			status: true,
			data: user.id,
		});

		return output('User was banned');
	} catch (err) {
		return handlerError('Failed to ban user', err);
	}
}

export const perfomUserUnban = async (r) => {
	const user = await User.scope('withSettings').findByPk(r.params.id);
	if (!user) {
		throw new Exception(Errors.NotFound, 'User not found', {});
	}

	const { oldStatus, } = user.settings;
	if (user.status !== UserStatus.BANNED && !oldStatus) {
		throw new Exception(Errors.StatusAlreadyAssigned, 'Cannot unban this user', {});
	}

	await user.update({
		status: oldStatus,
		settings: {
			...user.settings,
			oldStatus: UserStatus.BANNED,
		},
	});

	await r.server.mqSend('notifications', {
		userIds: [user.id],
		notification: 'Ваш аккаунт был разблокирован.',
		type: NotificationType.USERUNBANNED,
		status: true,
		data: user.id,
	});

	return output('User was unbanned');
};

export async function perfomAdminBan(r: Hapi.Request) {
	const { db: sequelize, } = r.server.app;
	const tx = await sequelize.transaction();
	try {
		const admin = await Admin.findByPk(r.params.id);
		if (!admin) {
			throw new Exception(Errors.NotFound, 'Admin not found', {});
		}

		if (admin.status === adminStatus.BANNED) {
			throw new Exception(Errors.StatusAlreadyAssigned, 'Admin already banned', {});
		}

		const oldStatus = admin.status;
		await admin.update({
			transaction: tx,
			status: UserStatus.BANNED,
			settings: {
				...admin.settings,
				oldStatus,
			},
		});

		await tx.commit();
		return output('Admin was banned');
	} catch (err) {
		await tx.rollback();
		return handlerError('Failed to ban admin', err);
	}
}

export async function perfomAdminUnban(r: Hapi.Request) {
	const { db: sequelize, } = r.server.app;
	const tx = await sequelize.transaction();
	try {
		const admin = await Admin.scope('withPassword').findByPk(r.params.id);
		if (!admin) {
			throw new Exception(Errors.NotFound, 'Admin not found', {});
		}

		const { oldStatus, } = admin.settings;
		if (admin.status !== adminStatus.BANNED && !oldStatus) {
			throw new Exception(Errors.StatusAlreadyAssigned, 'Cannot unban this admin', {});
		}

		await admin.update({
			status: oldStatus,
			transaction: tx,
			settings: {
				...admin.settings,
				oldStatus: adminStatus.BANNED,
			},
		});

		await tx.commit();
		return output('Admin was unbanned');
	} catch (err) {
		await tx.rollback();
		return handlerError('Failed to unban admin', err);
	}
}

export const profileConfirm = async (
	request: Hapi.Request
): Promise<IOutputOk<UserProfileStatus> | Boom> => {
	const transaction = await request.server.app.db.transaction();
	try {
		const { id: profileId, } = request.params;
		const profileForSearch = await UserProfile.findByPk(profileId, {
			attributes: ['userId', 'type'],
		});
		const include: Includeable[] = [];
		switch (profileForSearch.type) {
		case UserProfileType.ENTITY:
			include.push({
				model: EntityAccount.scope('withUpdates'),
				required: true,
				include: [
					{
						model: EntityContact,
						required: true,
					},
					{
						model: EntityDocument.scope('withUpdates'),
						required: true,
					}
				],
			});
			break;
		case UserProfileType.ENTREPRENEUR:
			include.push({
				model: EntrepreneurAccount.scope('withUpdates'),
				required: true,
			});
			break;
		}

		const user: User = await User.scope('withUpdates').findByPk(profileForSearch.userId, {
			include: [
				{
					model: UserProfile.scope('withUpdates'),
					where: {
						id: profileId,
					},
					required: true,
					include,
				},
				{
					model: UserAddress,
					required: true,
				},
				{
					model: UserDocument.scope('withUpdates'),
					required: true,
				}
			],
			transaction,
			lock: transaction.LOCK.NO_KEY_UPDATE,
		});
		if (!user) {
			throw new Exception(Errors.NotFound, 'User profile not found');
		}

		await user.update(
			{
				...user.updates,
			},
			{ transaction, }
		);
		await user.profiles[0].update(
			{
				...user.profiles[0].updates,
				status: UserProfileStatus.ACCEPTED,
			},
			{
				transaction,
			}
		);
		await user.userDocument.update(
			{
				...user.userDocument.updates,
			},
			{
				transaction,
			}
		);
		await UserDocumentPage.update(
			{
				status: DocumentPageStatus.ACCEPTED,
			},
			{
				where: {
					documentId: user.userDocument.id,
					status: {
						[Op.in]: [DocumentPageStatus.NEW, DocumentPageStatus.VERIFIED],
					},
				},
				transaction,
			}
		);
		switch (profileForSearch.type) {
		case UserProfileType.ENTITY:
			await user.profiles[0].entityAccount.update(
				{
					...user.profiles[0].entityAccount.updates,
				},
				{ transaction, }
			);
			await EntityDocumentPage.update(
				{
					status: DocumentPageStatus.ACCEPTED,
				},
				{
					where: {
						documentId: user.profiles[0].entityAccount.entityDocument.id,
					},
					transaction,
				}
			);
			const beneficiaries = await EntityBeneficiary.findAll({
				where: {
					accountId: user.profiles[0].entityAccount.id,
				},
			});
			if (beneficiaries)
				await EntityBeneficiaryDocumentPage.update(
					{
						status: DocumentPageStatus.ACCEPTED,
					},
					{
						where: {
							documentId: {
								[Op.in]: beneficiaries.map((beneficiar) => beneficiar.id),
							},
						},
						transaction,
					}
				);
			break;
		case UserProfileType.ENTREPRENEUR:
			await user.profiles[0].entrepreneurAccount.update(
				{
					...user.profiles[0].entrepreneurAccount.updates,
				},
				{ transaction, }
			);
			break;
		}

		await request.server.mqSend('notifications', {
			userIds: [user.id],
			notification: 'Ваш аккаунт был принят.',
			type: NotificationType.PROFILEACTIVATED,
			status: true,
			data: user.profiles[0].id,
		});
		await transaction.commit();
		return outputOk(UserProfileStatus.ACCEPTED);
	} catch (err) {
		await transaction.rollback();
		return handlerError('Failed to confirm user profile', err);
	}
};

export const profileChangeTermOfoffice = async (r) => {
	try {
		const { id: profileId, } = r.params;
		const { termOfOffice, } = r.payload as ITermOfOffice;
		const profile = await UserProfile.findOne({
			where: {
				id: profileId,
				type: UserProfileType.ENTITY,
			},
			include: [{ model: EntityAccount, }],
		});
		if (!profile) {
			throw new Exception(Errors.NotFound, 'User profile not found', {});
		}

		const entityAccount = await EntityAccount.findOne({
			where: {
				id: profile.entityAccount.id,
			},
		});
		if (!entityAccount) {
			throw new Exception(Errors.NotFound, 'Entity account not found', {});
		}

		const entityAccountUpdate = await entityAccount.update({
			termOfOffice: new Date(termOfOffice).toString(),
		});

		return output(entityAccountUpdate.termOfOffice);
	} catch (err) {
		return handlerError('Failed to change term of office', err);
	}
};

export async function deleteUser(request: Hapi.Request) {
	const { db: sequelize, } = request.server.app;
	const tx = await sequelize.transaction();
	try {
		const { userId, } = request.params;

		const profile = await User.findOne({
			where: {
				id: userId,
			},
		});

		if (!profile) {
			throw new Exception(Errors.NotFound, 'User does\'t exist', { userId, });
		}

		const checkUserDebt = await User.findOne({
			where: {
				id: userId,
			},
			transaction: tx,
			include: [
				{
					model: UserProfile,
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
				}
			],
		});

		if (checkUserDebt && checkUserDebt.loans) {
			throw new Exception(Errors.Forbidden, 'User has active loans', {
				loansId: checkUserDebt.loans,
			});
		}

		await profile.destroy({ transaction: tx, });
		await tx.commit();

		return output({ userId, });
	} catch (err) {
		await tx.rollback();
		return handlerError('Failed to delete user', err);
	}
}

export async function deleteAdmin(request: Hapi.Request) {
	const { db: sequelize, } = request.server.app;
	const tx = await sequelize.transaction();
	try {
		const { adminId, } = request.params;

		const admin = await Admin.findOne({
			where: {
				id: adminId,
			},
		});

		if (!admin) {
			throw new Exception(Errors.NotFound, 'Admin does\'t exist', { adminId, });
		}

		await admin.destroy({ transaction: tx, });

		await tx.commit();
		return output({ adminId, });
	} catch (err) {
		await tx.rollback();
		return handlerError('Failed to delete user', err);
	}
}

export const qualifyProfile = async (
	r: Hapi.Request
): Promise<IOutputOk<QualificationStatus> | Boom> => {
	try {
		const { profileId, } = r.params;
		const { qualificationStatus, } = r.payload as IQualificationStatus;
		const profile = await UserProfile.findOne({
			where: {
				id: profileId,
			},
		});
		if (!profile) {
			throw new Exception(Errors.NotFound, 'Profile not found', {});
		}

		const profileUpdate = await profile.update({
			qualificationStatus,
		});

		return output(profileUpdate.qualificationStatus);
	} catch (err) {
		return handlerError('Failed to change qualification status', err);
	}
};

export const testDeposit = async (r: Hapi.Request): Promise<unknown | Boom> => {
	try {
		const { id, } = r.payload as IId;
		const profile = await UserProfile.findOne({
			where: { id, },
			include: [{ model: Wallet, }],
		});
		if (!profile) {
			throw new Exception(Errors.NotFound, 'Profile not found', {});
		}

		const method = 'POST';
		const url = 'https://stage.tochka.com/api/v1/tender-helpers/jsonrpc';

		const body = {
			id: getUUID(),
			jsonrpc: '2.0',
			method: 'transfer_money',
			params: {
				recipient_account: '40702810901500047616',
				recipient_bank_code: '044525999',
				amount: 1000000,
				purpose: profile.wallet.accountNumber,
			},
		};
		const json: string = JSON.stringify(body);
		const req: any = {
			method,
			body: json,
		};
		const response = await fetch(url, req);
		const responseBody = await response.json();

		return output(responseBody);
	} catch (err) {
		return handlerError('Failed to change qualification status', err);
	}
};
