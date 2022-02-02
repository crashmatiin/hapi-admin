import {
	SupportReply,
	SupportRequest,
	SupportRequestStatus,
	User,
	File,
	UserDocument,
	SupportRequestFile,
	NotificationType,
} from 'invest-models';
import * as Hapi from '@hapi/hapi';
import { Lifecycle, } from '@hapi/hapi';
import { WhereOptions, Op, } from 'sequelize';
import { Boom, } from '@hapi/boom';
import config from '../config/config';
import { output, outputPagination, } from '../utils';
import { prepareFileResponse, prepareQuery, transformMultiQuery, } from '../utils/helpers';
import { order, } from './operations/order';
import { paginate, } from './operations/paginate';
import { Errors, } from '../utils/errors';
import { filterRange, } from './operations/filterRange';
import { Exception, handlerError, } from '../utils/error';
import { ICreateSupportReply, IOutputOk, } from '../interfaces';

export const listSupportRequests: Lifecycle.Method = async (r) => {
	try {
		const { status, from, to, } = r.query;

		const { query, } = r.query as {
			query: string;
		};

		const whereUserName: WhereOptions = {
			[Op.and]: [],
		};

		if (query) {
			const fullNameArr = query.split(' ');
			if (fullNameArr.length > 1) {
				fullNameArr.forEach((name) => {
					whereUserName[Op.and].push({
						[Op.or]: [{ firstName: name, }, { middleName: name, }, { lastName: name, }],
					});
				});
			}
		}

		const where: WhereOptions = {
			[Op.and]: [],
		};

		if (status) {
			where[Op.and].push(filterRange('status', transformMultiQuery(status)));
		}

		if (from || to) {
			where[Op.and].push({
				createdAt: {
					[Op.and]: [{ [Op.gte]: from || 0, }, { [Op.lte]: to || Date.now(), }],
				},
			});
		}

		const { count, rows, } = await SupportRequest.findAndCountAll({
			include: [
				{
					where:
						whereUserName[Op.and].length > 0
							? { ...whereUserName, }
							: {
								...prepareQuery(r.query.query, ['lastName', 'firstName', 'middleName', 'email']),
							  },
					model: User,
					attributes: ['id', 'lastName', 'firstName', 'middleName', 'email', 'fullName'],
					include: [
						{
							model: UserDocument,
							attributes: ['tin'],
						}
					],
				}
			],
			distinct: true,
			...paginate(r),
			...order(r),
			attributes: ['id', 'status', 'appeal', 'theme', 'createdAt', 'updatedAt'],
		});

		return outputPagination(count, rows);
	} catch (err) {
		return handlerError('Failed to list support requests', err);
	}
};

export async function retrieveSupportRequest(
	r: Hapi.Request
): Promise<IOutputOk<{ supportRequest: SupportRequest }> | Boom> {
	try {
		const { id: supportRequestId, } = r.params;
		const supportRequest = await SupportRequest.findOne({
			where: {
				id: supportRequestId,
			},
			include: [
				{
					model: User,
				},
				{
					model: File,
				}
			],
		});
		if (!supportRequest) {
			throw new Exception(Errors.NotFound, 'Support request not found', {});
		}

		return output({ supportRequest, });
	} catch (err) {
		return handlerError('Failed to retrieve support request', err);
	}
}

export const downloadSupportRequest = async (r, h) => {
	try {
		const { id: supportRequestId, } = r.params;
		const supportRequest = await SupportRequest.findByPk(supportRequestId);
		if (!supportRequest) {
			throw new Exception(Errors.NotFound, 'Support request not found', {});
		}

		return prepareFileResponse(
			supportRequest.appeal,
			config.files.txtType,
			`appeal_${supportRequest.id}.txt`,
			h
		);
	} catch (err) {
		return handlerError('Failed to retrieve support request', err);
	}
};

export const createSupportReply = async (r) => {
	try {
		const { id, } = r.params;
		const { files, answerToAppeal, } = r.payload as ICreateSupportReply;
		const supportRequest = await SupportRequest.findByPk(id, {
			include: [
				{
					model: User,
				}
			],
		});
		if (!supportRequest) {
			throw new Exception(Errors.NotFound, 'Support request not found', {});
		}

		const supportReply = await SupportReply.create({
			supportRequestId: id,
			answerToAppeal,
		});

		if (files) {
			Promise.all(
				files.map(async (file) => {
					await File.create({
						id: file.id,
						owner: supportRequest.user.id,
						name: file.name,
					});

					await SupportRequestFile.create({
						supportRequestId: supportRequest.id,
						fileId: file.id,
						supportReplyId: supportReply.id,
					});
				})
			);
		}

		await supportRequest.update({
			status: SupportRequestStatus.CLOSED,
		});
		r.server.mqSend('notifications', {
			notification: `На вашу заявку пришёл ответ: ${answerToAppeal}`,
			type: NotificationType.SUPPORTREPLY,
		});
		return output({ supportReply, });
	} catch (err) {
		return handlerError('Failed to create support reply', err);
	}
};
