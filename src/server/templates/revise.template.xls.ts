import { IVirtualBalanceReportStats, } from '../core/types/users';

export function returnVirtualBalanceReportStatsTemplate(data: IVirtualBalanceReportStats) {
	return [
		[`Общее число бенефициаров: ${data.count}`],
		['Статус', 'Айди запроса', 'Статус успешности выполнения', 'Айди транзакции', 'Дата создания'],
		...data.rows.map((item) => [
			item.status,
			item.responseData.status,
			item.responseData.responseData?.transaction_uid,
			item.responseData.createdAt
		])
	];
}
