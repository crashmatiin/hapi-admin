import { IBeneficiaryReportStats, } from '../core/types/users';

export function returnBeneficiaryReportStatsTemplate(data: IBeneficiaryReportStats) {
	return [
		[`Общее число бенефициаров: ${data.count}`],
		['Тип', 'Статус', 'Айди запроса', 'Статус успешности выполнения'],
		...data.rows.map((item) => [
			item.type,
			item.status,
			item.callbackData?.uuid,
			item.callbackData?.is_success
		])
	];
}
