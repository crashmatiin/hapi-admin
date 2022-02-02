import { Request, RequestQuery, } from '@hapi/hapi';
import { BankRevise, } from 'invest-models';
import { Op, Order, WhereOptions, } from 'sequelize';
import { SpreadsheetFormatter, } from '../utils/xlsx';
import { outputPagination, } from '../utils';
import { handlerError, } from '../utils/error';
import { prepareFileResponse, prepareQuery, } from '../utils/helpers';
import config from '../config/config';
import { returnVirtualBalanceReportStatsTemplate, } from '../templates/revise.template.xls';

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

export async function virtualBalance(r: Request) {
	try {
		const { count, rows, } = await BankRevise.findAndCountAll({
			...listParam(r.query),
		});
		return outputPagination(count, rows);
	} catch (error) {
		return handlerError('Failed get revise info', error);
	}
}

export async function virtualBalanceReport(r: Request, h) {
	try {
		const data = await BankRevise.findAndCountAll({
			where: r.query.bankReviseId
				? {
					id: r.query.bankReviseId,
				  }
				: {},
		});
		const name = 'virtualBalanceReport.xlsx';
		const formatter = new SpreadsheetFormatter();
		const file = await formatter.format(returnVirtualBalanceReportStatsTemplate(data), { name, });
		return prepareFileResponse(file, config.files.xslxType, name, h);
	} catch (error) {
		return handlerError('Failed get revise info', error);
	}
}
