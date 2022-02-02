import { Document, User, File, UserProfile, Template, Wallet, UserDocument, } from 'invest-models';
import * as Hapi from '@hapi/hapi';
import { Op, WhereOptions, } from 'sequelize';
import { output, } from '../utils';
import { prepareQuery, } from '../utils/helpers';
import { order, } from './operations/order';
import { paginate, } from './operations/paginate';
import { Exception, handlerError, } from '../utils/error';
import { Errors, } from '../utils/errors';

export async function getDocuments(request: Hapi.Request) {
	try {
		const { from, to, } = request.query;
		const { template, } = request.params;

		const whereDocs: WhereOptions = {
			[Op.and]: [{ template, }],
		};

		if (from) {
			whereDocs[Op.and].push({
				createdAt: {
					[Op.and]: [{ [Op.gte]: from, }, { [Op.lte]: to || Date.now(), }],
				},
			});
		}

		const { count, rows, } = await Document.findAndCountAll({
			where: {
				...whereDocs,
				...prepareQuery(request.query.query, ['$file.name$']),
			},
			include: [
				{
					model: User,
					include: [
						{
							model: UserDocument,
							attributes: ['tin'],
						}
					],
				},
				{
					model: File,
					as: 'file',
					required: true,
					duplicating: false,
					attributes: ['name'],
				},
				{
					model: UserProfile,
					as: 'profile',
					include: [
						{
							model: Wallet,
							attributes: ['requisites', 'accountNumber'],
						},
					],
				},
			],
			...order(request),
			...paginate(request),
			attributes: ['id', 'fileId', 'userId', 'profileId', 'template', 'createdAt'],
			distinct: true,
		});

		return { count, rows, };
	} catch (err) {
		return handlerError('Failed to get platform documents', err);
	}
}

export async function deleteDocument(request: Hapi.Request) {
	try {
		const { id, } = request.params;
		const document = await Document.findOne({
			where: {
				id,
			},
		});

		if (!document) {
			throw new Exception(Errors.NotFound, 'Document not found', {});
		}

		await document.destroy();

		return output(document.id);
	} catch (err) {
		return handlerError('Failed to delete document', err);
	}
}

export async function getTemplates(request: Hapi.Request) {
	try {
		const templates = Object.values(Template);
		return { templates, };
	} catch (err) {
		return handlerError('Failed to get templates', err);
	}
}
