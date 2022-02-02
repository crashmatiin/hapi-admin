import { ILoansStatsXslx, } from 'server/core/types/loans';

export function returnTemplateLoansXlsx(data: ILoansStatsXslx): Array<Array<string | number>> {
	return [
		[`Общее число заёмщиков: ${data.stats.total}`, `Общая сумма займов: ${data.stats.sum}`],
		[
			'ФИО',
			'email',
			'Минимальная сумма',
			'Максимальная сумма',
			'Ставка',
			'Срок',
			'Статус',
			'Вид',
			'Тип погашения',
			'Тип',
			'ИНН',
			'Номер заявки',
			'Номер В/С',
			'Статус просрочки'
		],
		...data.loans.map((item) => [
			`${item.lastName} ${item.firstName} ${item.middleName}`,
			item.user.email,
			item.minGoal,
			item.maxGoal,
			item.interestRate,
			item.expiration,
			item.status,
			item.kind,
			item.repaymentType,
			item.type,
			item.user.userDocument.tin,
			item.number,
			item.userProfile ? item.userProfile.wallet.accountNumber : null,
			item.arrearsStatus
		])
	];
}
