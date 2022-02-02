import { IInvestorLoansXslx, } from 'server/core/types/investors';

export function returnTemplateLoansXlsx(
	data: IInvestorLoansXslx
): Array<Array<string | number | Date>> {
	return [
		[
			'ФИО',
			'Дата заключения',
			'Остаток задолженности',
			'Выплачено',
			'Сумма инвестиций',
			'Сумма займа',
			'Дата исп. дог. займа',
			'Статус прос. задолженности',
			'Номер дог. займа',
			'Статус'
		],
		...data.rows.map((item) => [
			`${item.lastName} ${item.firstName} ${item.middleName}`,
			item.conclusionContractDate,
			0,
			item.paid,
			0,
			item.currentFunds,
			item.expirationContractDate,
			item.arrearsStatus,
			item.number,
			item.status
		])
	];
}
