import { Boom, } from '@hapi/boom';
import { Request, RequestQuery, } from '@hapi/hapi';
import { BankOperation, BankOperationType, } from 'invest-models';
import { Op, Order, WhereOptions, } from 'sequelize';
import config from '../config/config';
import { IOutputOk, } from '../interfaces';
import { returnBeneficiaryReportStatsTemplate, } from '../templates/registry.template.xls';
import { SpreadsheetFormatter, } from '../utils/xlsx';
import { outputOk, outputPagination, } from '../utils';
import { handlerError, } from '../utils/error';
import { prepareFileResponse, prepareQuery, } from '../utils/helpers';

function listParam(query: RequestQuery): {
	order: Order;
	limit: number;
	offset: number;
	where: WhereOptions;
} {
	const { offset, limit, order, query: where, from, to, status, } = query;
	const orderOptions: Order = [];
	if (order) {
		for (const [key, value] of Object.entries(order)) {
			orderOptions.push([key, value as string]);
		}
	}

	const whereOptions: WhereOptions = {
		type: BankOperationType.BENEFICIARY_REGISTRY,
		...prepareQuery(where, []),
		createdAt: {
			[Op.and]: [{ [Op.gte]: from || 0, }, { [Op.lte]: to || Date.now(), }],
		},
	};
	if (status) {
		Object.assign(whereOptions, { status, });
	}

	return {
		order: orderOptions,
		limit,
		offset,
		where: whereOptions,
	};
}

export async function beneficiaryAll(r: Request) {
	try {
		const { count, rows, } = await BankOperation.findAndCountAll({
			...listParam(r.query),
			attributes: {
				exclude: ['requestData', 'responseData', 'callbackData'],
			},
		});
		return outputPagination(count, rows);
	} catch (error) {
		return handlerError('Failed get revise info', error);
	}
}

export async function beneficiary(r: Request): Promise<IOutputOk<BankOperation> | Boom> {
	try {
		const row = await BankOperation.findByPk(r.params.bankOperationId as string);
		return outputOk(row);
	} catch (error) {
		return handlerError('Failed get revise info', error);
	}
}

export async function beneficiaryReport(r: Request, h) {
	try {
		const data = await BankOperation.findAndCountAll({
			where: r.query.bankOperationId
				? {
					id: r.query.bankOperationId,
				  }
				: {
					type: BankOperationType.BENEFICIARY_REGISTRY,
				  },
		});

		const name = 'beneficiaryReport.xlsx';
		const formatter = new SpreadsheetFormatter();
		const file = await formatter.format(returnBeneficiaryReportStatsTemplate(data), { name, });
		return prepareFileResponse(file, config.files.xslxType, name, h);
	} catch (error) {
		return handlerError('Failed get revise info', error);
	}
}
