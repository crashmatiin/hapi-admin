import { File, PlatformDocument, } from 'invest-models';
import * as Hapi from '@hapi/hapi';
import { Op, WhereOptions, } from 'sequelize';
import { output, outputPagination, } from '../utils';
import { prepareQuery, } from '../utils/helpers';
import { order, } from './operations/order';
import { paginate, } from './operations/paginate';
import { Exception, handlerError, } from '../utils/error';
import { Errors, } from '../utils/errors';
import { ICreatePlatformDocument, } from '../core/types/platformDocuments';

export async function getPlatformDocuments(request: Hapi.Request) {
	try {
		const { from, to, } = request.query;

		const whereDocs: WhereOptions = {
			[Op.and]: [],
		};

		if (from) {
			whereDocs[Op.and].push({
				createdAt: {
					[Op.and]: [{ [Op.gte]: from, }, { [Op.lte]: to || Date.now(), }],
				},
			});
		}

		const { count, rows, } = await PlatformDocument.findAndCountAll({
			where: {
				...whereDocs,
				...prepareQuery(request.query.query, ['name']),
			},
			distinct: true,
			...order(request),
			...paginate(request),
		});

		return outputPagination(count, rows);
	} catch (err) {
		return handlerError('Failed to get platform documents', err);
	}
}

export async function createPlatformDocument(request: Hapi.Request) {
	try {
		const { fileId, name, type, } = request.payload as ICreatePlatformDocument;

		await File.create({
			id: fileId,
			name,
			type,
		});

		const platformDocument = await PlatformDocument.create({
			name,
			fileId,
			type,
		});

		return output(platformDocument);
	} catch (err) {
		return handlerError('Failed to creatr platform document', err);
	}
}

export async function updatePlatformDocument(request: Hapi.Request) {
	try {
		const { id, } = request.params;
		const platformDocument = await PlatformDocument.findOne({
			where: {
				id,
			},
		});

		if (!platformDocument) {
			throw new Exception(Errors.NotFound, 'Loan not found', {});
		}

		const updatedDocument = await platformDocument.update(request.payload as any);

		return output(updatedDocument);
	} catch (err) {
		return handlerError('Failed to update platform document', err);
	}
}

export async function deletePlatformDocument(request: Hapi.Request) {
	try {
		const { id, } = request.params;
		const platformDocument = await PlatformDocument.findOne({
			where: {
				id,
			},
		});

		if (!platformDocument) {
			throw new Exception(Errors.NotFound, 'Platform document not found', {});
		}

		await platformDocument.destroy();

		return output(platformDocument.id);
	} catch (err) {
		return handlerError('Failed to delete platform document', err);
	}
}
