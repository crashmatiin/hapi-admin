import {
	Admin,
	AdminRole,
	PermissionLevel,
	User,
	LoanStatus,
	repaymentType,
	UserProfileStatus,
	VerificationStatus,
	LoanType,
	SupportRequestStatus,
	LoanCommitmentType,
	LoanKindType,
	UserStatus,
	PaymentStatus,
	LoanArrearsStatus,
	UserNotificationStatus,
	UserProfileRating,
	PlatformDocument,
	QualificationStatus,
	UserProfileType,
	UserProfileRole,
	LoanDocumentType,
	Deposit,
	Withdrawal,
	DepositStatus,
	WithdrawalStatus,
	WithdrawalType,
	NotificationType,
} from 'invest-models';
import * as Joi from 'joi';
import {
	MoneyboxVirtualAccountBalance,
	VirtualBalanceMoneyboxRequest,
	VirtualBalanceMoneyboxResponse,
} from 'mq-plugin/protocols';

const usersStatusSchema = Joi.string().valid(UserStatus.ACTIVE, UserStatus.BANNED, UserStatus.NEW);

const profileStatusSchema = Joi.string().valid(
	UserProfileStatus.ACCEPTED,
	UserProfileStatus.BANNED,
	UserProfileStatus.CREATED,
	UserProfileStatus.HISTORY,
	UserProfileStatus.REJECTED,
	UserProfileStatus.REVIEWING
);

export const borrowersStatsSchema = Joi.object({
	total: Joi.number(),
	totalSum: Joi.number(),
	totalPaid: Joi.number(),
	totalDebt: Joi.number(),
	verified: Joi.number(),
	active: Joi.number(),
	banned: Joi.number(),
});

export function outputEmptySchema(): Joi.Schema {
	return Joi.object({
		ok: okSchema,
	}).label('outputEmptySchema');
}

export function outputOkSchema(res: Joi.Schema): Joi.Schema {
	return Joi.object({
		ok: okSchema,
		result: res,
	}).label('outputOkSchema');
}

export function outputPaginationSchema(title: string, item: Joi.Schema): Joi.Schema {
	return Joi.object({
		ok: Joi.boolean().example(true),
		result: Joi.object({
			count: Joi.number().integer().example(10),
			[title]: Joi.array().items(item),
		}),
	});
}

export const user = Joi.object({
	name: Joi.string(),
	email: Joi.string().email().required(),
	password: Joi.string().min(6).required(),
});

export const idSchema = Joi.number().example(10).label('id');
export const okSchema = Joi.boolean().example(true).label('Ok');
export const boolSchema = Joi.boolean().example(true).label('Boolean');
export const guidSchema = Joi.string()
	.uuid()
	.example('bfed0026-9ddf-4bf2-b941-791ca85040ff')
	.label('guid');
export const tinSchema = Joi.string()
	.regex(/^(\d{10}|\d{12})$/)
	.example('1234567890')
	.label('TIN');
export const amountSchema = Joi.number().example('123456,45').label('Amount');
export const uuidSchema = Joi.string()
	.uuid()
	.required()
	.example('34da67e3-fbf6-41e7-91f4-adc8aa35c9a0');
export const tokenSchema = Joi.string()
	.example('3e09ceed489255166ca022987d32fb46bf846fa92a29cbbd8330705d0fbd3f4e')
	.label('Token');
export const adminIdSchema = Joi.string().example('145').label('Id');
export const emailSchema = Joi.string().example('email@example.com').label('Email').max(64).min(3);
export const passwordSchema = Joi.string().example('pa@s$word').label('Password').max(256).min(8);
export const totpSchema = Joi.string().example('000000').label('One-time password').max(6).min(6);
export const roleSchema = Joi.string().example('admin').label('Role');
export const slugSchema = Joi.string()
	.min(4)
	.max(64)
	.label('Human readable entry index')
	.example('deposit-funds');
export const roleKeySchema = Joi.string().valid(
	'superadmin',
	'admin',
	'manager',
	'lawyer',
	'credit_officer'
);

export const fileUploadSchema = Joi.object({
	id: uuidSchema,
	name: Joi.string().min(3).max(64).example('file.docx'),
});
export const roleRightsSchema = Joi.number().valid(
	PermissionLevel.READ,
	PermissionLevel.WRITE,
	PermissionLevel.NONE
);

export const listSchema = Joi.object({
	limit: Joi.number().min(0).example(0).default(10),
	offset: Joi.number().min(0).example(0).default(0),
	query: Joi.string().max(256).example('exmaple'),
	order: Joi.object({}).pattern(Joi.string(), Joi.string().valid('ASC', 'DESC')),
});

export const faqSchema = Joi.object({
	slug: slugSchema,
	title: Joi.string().min(6).max(128).label('Question title').example('How to deposit funds?'),
	body: Joi.string()
		.min(6)
		.max(8192)
		.label('Question body in markdown')
		.example('Detailed explanation on how to do this, that, or the other'),
});

export const newsSchema = Joi.object({
	slug: slugSchema,
	title: Joi.string().min(6).max(128).label('Post title').example('New in version 0.19'),
	body: Joi.string()
		.min(6)
		.max(8192)
		.label('Post body')
		.example('We have added new features, fixed bugs'),
});

export const jwtTokensSchema = Joi.object({
	access: Joi.string().example(
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
	),
	refresh: Joi.string().example(
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpnZmdmZ2YiLCJpYXQiOjE1MTYyMzkwMjJ9.r-tzuuBbuYfe2birJuqAH0eYhtzkNOs2tqLMI6-NPW8'
	),
});

export const signUpSchema = Joi.object({
	password: Joi.string().example('grhK2Ms=W"Q$'),
});

export const checkAdminInfoSchema = Joi.object({
	filled: Joi.boolean(),
});

export const restorePasswordRequestSchema = Joi.object({
	expired: Joi.number().example('1629347104'),
});

export const userSchema = Joi.object<User>({
	id: Joi.string(),
	email: Joi.string(),
	// phone: Joi.string(),
	firstName: Joi.string().label('First name').max(100).min(2).example('Alexandr'),
	middleName: Joi.string().label('Middle name').max(100).min(2).example('Alexandrovich'),
	lastName: Joi.string().label('Last name').max(100).min(2).example('Alexandrov'),
	// country: Joi.string(),
	birthday: Joi.date().timestamp(),
	birthPlace: Joi.string().label('Birth place').max(100).min(2).example('Tokyo'),
	gender: Joi.string().valid('male', 'female'),
	settings: Joi.object(),
	security: Joi.object(),
	status: Joi.string().valid('new', 'active', 'inactive'),
	// role: Joi.string().valid('investor_individual',
	// 'investor_entrepreneur', 'investor_entity', 'borrower_entrepreneur', 'borrower_entity'),
	// VerificationStatus: Joi.string().valid('verfied', 'unverified'),
});

export const depositsSchema = Joi.object<Deposit>({
	id: uuidSchema,
	walletId: uuidSchema,
	method: Joi.string(),
	externalId: uuidSchema,
	externalTransactionUid: uuidSchema,
	amount: Joi.date().timestamp(),
	status: Joi.string(),
	requestData: Joi.object({
		bik: Joi.string(),
		inn: Joi.string(),
		kpp: Joi.string(),
		name: Joi.string(),
		uuid: uuidSchema,
		amount: Joi.string(),
		account: Joi.string(),
		transaction_uid: uuidSchema,
		transaction_date: Joi.date(),
		payment_destination: Joi.string(),
	}),
});

export const withdrawalSchema = Joi.object<Withdrawal>({
	id: uuidSchema,
	walletId: uuidSchema,
	externalTransactionUid: uuidSchema,
	amount: Joi.date().timestamp(),
	type: Joi.string(),
	status: Joi.string(),
	transactionId: Joi.string(),
});

export const platfomDocsSchema = Joi.object<PlatformDocument>({
	id: uuidSchema,
	fileId: uuidSchema,
	name: Joi.string().max(100).min(1),
	type: Joi.string().max(100).min(1),
});

export const userProfileSchema = Joi.object({
	id: Joi.string(),
	email: Joi.string(),
	firstName: Joi.string().label('First name').max(100).min(2).example('Alexandr'),
	middleName: Joi.string().label('Middle name').max(100).min(2).example('Alexandrovich'),
	lastName: Joi.string().label('Last name').max(100).min(2).example('Alexandrov'),
	status: Joi.string().valid('new', 'active', 'inactive', 'banned'),
	type: Joi.string().valid('individual', 'entrepreneur', 'entity'),
	role: Joi.string().valid('borrower', 'investor'),
	tin: Joi.string(),
	requisites: Joi.object(),
});

export const adminSchema = Joi.object({
	id: uuidSchema,
	email: emailSchema,
	password: passwordSchema,
	phone: Joi.string(),
	firstName: Joi.string().label('First name').max(100).min(2).example('Alexandr'),
	middleName: Joi.string().label('Middle name').max(100).min(2).example('Alexandrovich'),
	userName: Joi.string().label('Username').max(100).min(2).example('alex'),
	lastName: Joi.string().label('Last name').max(100).min(2).example('Alexandrov'),
	status: Joi.string().valid('new', 'active', 'inactive'),
	roleKey: roleKeySchema,
});

export const createAdminSchema = Joi.object<Admin>({
	email: emailSchema,
	password: passwordSchema,
	phone: Joi.string(),
	firstName: Joi.string().label('First name').max(100).min(2).example('Alexandr'),
	middleName: Joi.string().label('Middle name').max(100).min(2).example('Alexandrovich'),
	username: Joi.string().label('Username').max(100).min(2).example('alex'),
	lastName: Joi.string().label('Last name').max(100).min(2).example('Alexandrov'),
	roleKey: roleKeySchema,
});

export const updateAdminSchema = Joi.object<Admin>({
	email: emailSchema.optional(),
	id: uuidSchema.optional(),
	phone: Joi.string().optional(),
	firstName: Joi.string().label('First name').max(100).min(2).example('Alexandr').optional(),
	middleName: Joi.string().label('Middle name').max(100).min(2).example('Alexandrovich').optional(),
	username: Joi.string().label('Username').max(100).min(2).example('alex').optional(),
	lastName: Joi.string().label('Last name').max(100).min(2).example('Alexandrov').optional(),
	password: passwordSchema.optional(),
	roleKey: roleKeySchema.optional(),
});

export const globalSettingsSchema = Joi.object({
	minimal_loan: Joi.number().min(0).max(10000000000000).example(500000).label('Minimal loan'),
	maximal_loan: Joi.number().min(0).max(10000000000000).example(5000000).label('Maximum loan'),
	minimal_investments: Joi.number()
		.min(0)
		.max(10000000000000)
		.example(10000)
		.label('Minimal investments'),
	yearly_investments_limit_for_unqualified_user: Joi.number()
		.min(0)
		.max(10000000000000)
		.example(60000)
		.label('Investments limit for unqualified users'),
	yearly_limit_maximum: Joi.number()
		.min(0)
		.max(10000000000000)
		.example(1000000000)
		.label('Yearly limit'),
});

export const adminRoleSchema = Joi.object<AdminRole>({
	globalSettings: roleRightsSchema,
	news: roleRightsSchema,
	notificationsFromUsers: roleRightsSchema,
	notificationsForUsers: roleRightsSchema,
	accountsOperations: roleRightsSchema,
	signaturesVerification: roleRightsSchema,
	registryLookup: roleRightsSchema,
	reports: roleRightsSchema,
	users: roleRightsSchema,
	documentsRegistry: roleRightsSchema,
	borrowers: roleRightsSchema,
	investors: roleRightsSchema,
	support: roleRightsSchema,
	permissionLevels: roleRightsSchema,
	creditAgreements: roleRightsSchema,
	legalOpinions: roleRightsSchema,
	decisionsOnApplications: roleRightsSchema,
	platformDocuments: roleRightsSchema,
	faq: roleRightsSchema,
	rosFinVerification: roleRightsSchema,
	expressLoan: roleRightsSchema,
	admins: roleRightsSchema,
	loans: roleRightsSchema,
});

export const moneyboxVirtualBalanceRequestSchema = Joi.object<VirtualBalanceMoneyboxRequest>({
	page: Joi.number().integer().positive().default(1).optional(),
	per_page: Joi.number().integer().positive().max(500).default(50).optional(),
	show_zero: Joi.boolean().optional(),
});

export const moneyboxVirtualAccountBalanceSchema = Joi.object<MoneyboxVirtualAccountBalance>({
	virtual_account: uuidSchema,
	amount_available: Joi.number().required(),
	amount_blocked: Joi.number().required(),
	is_beneficiary: Joi.boolean().required(),
	is_beneficiary_active: Joi.boolean().required(),
});

export const moneyboxVirtualBalanceResponseSchema = Joi.object<VirtualBalanceMoneyboxResponse>({
	page: Joi.number().integer().positive().required(),
	per_page: Joi.number().integer().positive().required(),
	total_count: Joi.number().integer().min(0).required(),
	unrecognized_amount: Joi.number().required(),
	nominal_amount: Joi.number().required(),
	virtual_accounts_available: Joi.number().required(),
	virtual_accounts_blocked: Joi.number().required(),
	virtual_accounts: Joi.array().items(moneyboxVirtualAccountBalanceSchema).required(),
});

export const supportRequestStatusSchema = Joi.number().valid(
	SupportRequestStatus.NEW,
	SupportRequestStatus.ACTIVE,
	SupportRequestStatus.CLOSED
);

export const supportRequestSchema = Joi.object({
	id: uuidSchema,
	appeal: Joi.string().label('Appeal').max(1000).min(3).example('How to deposit funds?'),
	theme: Joi.string().label('Theme').max(1000).min(3).example('How to deposit funds?'),
	status: supportRequestStatusSchema,
	userId: uuidSchema,
	user: Joi.object({
		id: uuidSchema,
		firstName: Joi.string().label('First name').max(100).min(2).example('Alexandr'),
		middleName: Joi.string().label('Middle name').max(100).min(2).example('Alexandrovich'),
		lastName: Joi.string().label('Last name').max(100).min(2).example('Alexandrov'),
		email: emailSchema,
		documents: Joi.object({
			tin: Joi.number().label('Tin').example('123123123123'),
		}),
	}),
});

export const supportReplySchema = Joi.object({
	id: uuidSchema,
	answerToAppeal: Joi.string()
		.label('Answer to appeal')
		.max(1000)
		.min(3)
		.example('Detailed explanation on how to do this, that, or the other'),
	supportRequestId: uuidSchema,
});

export const createSupportReplySchema = Joi.object({
	answerToAppeal: Joi.string()
		.label('Answer to appeal')
		.max(1000)
		.min(3)
		.example('Detailed explanation on how to do this, that, or the other'),
	files: Joi.array().items(fileUploadSchema).max(3).optional(),
});

export const loanSchema = Joi.object({
  number: Joi.number(),
  name: Joi.string(),
  status: Joi.string().valid(...Object.values(LoanStatus)),
  term: Joi.number(),
  expiration: Joi.date(),
  currentFunds: Joi.number(),
  minGoal: Joi.number(),
  maxGoal: Joi.number(),
  paid: Joi.number(),
  debt: Joi.number(),
  interestRate: Joi.number(),
  rating: Joi.string(),
  repaymentType: Joi.string().valid(...Object.values(repaymentType)),
  description: Joi.string(),
  commitment: Joi.string().valid(...Object.values(LoanCommitmentType)),
  kind: Joi.string().valid(...Object.values(LoanKindType)),
  type: Joi.string().valid(...Object.values(LoanType)),
  aboutCompany: Joi.string(),
  expertOpinions: Joi.string(),
  riskAssessment: Joi.string(),
  securitySurety: Joi.string(),
  surety: Joi.string(),
  securityPledger: Joi.string(),
  pledger: Joi.string(),
  contractNumber: Joi.string(),
  conclusionContractDate: Joi.date(),
  expirationContractDate: Joi.date(),
  conclusion: Joi.string(),
  expertOptions: Joi.string(),
  expirationDate: Joi.date(),
}).label('Loan schema');

export const updateLoanSchema = Joi.object({
	name: Joi.string(),
	minGoal: Joi.number(),
	maxGoal: Joi.number(),
	interestRate: Joi.number(),
	repaymentType: Joi.string().valid(...Object.values(repaymentType)),
	kind: Joi.string().valid(...Object.values(LoanKindType)),
	type: Joi.string().valid(...Object.values(LoanType)),
	surety: Joi.string(),
	pledger: Joi.string(),
}).label('Loan schema');

const userVerificationStatusSchema = Joi.string().valid(
	VerificationStatus.UNVERIFIED,
	VerificationStatus.VERIFIED,
	VerificationStatus.FOR_VERIFICATION
);

export const borrowersListRequestSchema = listSchema.keys({
	status: Joi.string().valid(...Object.values(UserProfileStatus)),
	paidExpired: Joi.boolean(),
	verification: Joi.string().valid(...Object.values(VerificationStatus)),
	arrearsStatus: Joi.boolean(),
	from: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
	to: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
});

export const depositsListRequestSchema = listSchema.keys({
	status: Joi.string().valid(...Object.values(DepositStatus)),
	from: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
	to: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
});

export const withdrawalsListRequestSchema = listSchema.keys({
	status: Joi.string().valid(...Object.values(WithdrawalStatus)),
	type: Joi.string().valid(...Object.values(WithdrawalType)),
	from: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
	to: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
});

export const borrowersListResponseSchema = userSchema.keys({
	loans: Joi.array().items(loanSchema),
});

export const investorsListRequestSchema = listSchema.keys({
	status: Joi.string().valid(...Object.values(UserProfileStatus)),
	verification: Joi.string().valid(...Object.values(VerificationStatus)),
	query: Joi.string(),
	from: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
	to: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
	order: Joi.object({}).pattern(Joi.string(), Joi.string().valid('ASC', 'DESC')),
	limit: Joi.number().min(0).example(0).default(10),
	offset: Joi.number().min(0).example(0).default(0),
});

export const usersListSchema = listSchema.keys({
	status: Joi.string().valid(...Object.values(UserStatus)),
	paidExpired: Joi.boolean(),
	verification: Joi.string().valid(...Object.values(VerificationStatus)),
	query: Joi.string(),
	from: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
	to: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
	order: Joi.object({}).pattern(Joi.string(), Joi.string().valid('ASC', 'DESC')),
	limit: Joi.number().min(0).example(0).default(10),
	offset: Joi.number().min(0).example(0).default(0),
});

export const platformDocsListSchema = listSchema.keys({
	query: Joi.string(),
	from: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
	to: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
	order: Joi.object({}).pattern(Joi.string(), Joi.string().valid('ASC', 'DESC')),
	limit: Joi.number().min(0).example(0).default(10),
	offset: Joi.number().min(0).example(0).default(0),
});

export const usersProfilesListSchema = listSchema.keys({
	status: Joi.string().valid(...Object.values(UserProfileStatus)),
	role: Joi.string().valid('borrower', 'investor'),
	type: Joi.string().valid('individual', 'entrepreneur', 'entity'),
	verification: Joi.string().valid(...Object.values(VerificationStatus)),
	query: Joi.string(),
	from: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
	to: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
	order: Joi.object({}).pattern(Joi.string(), Joi.string().valid('ASC', 'DESC')),
	limit: Joi.number().min(0).example(0).default(10),
	offset: Joi.number().min(0).example(0).default(0),
});

export const supportRequestListSchema = listSchema.keys({
	status: Joi.alternatives().try(
		Joi.array().items(supportRequestStatusSchema),
		supportRequestStatusSchema
	),
	from: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
	to: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
	order: Joi.object({}).pattern(Joi.string(), Joi.string().valid('ASC', 'DESC')),
	limit: Joi.number().min(0).example(0).default(10),
	offset: Joi.number().min(0).example(0).default(0),
	query: Joi.string().max(256).example('exmaple'),
});

export const loansStatsSchema = Joi.object({
	total: Joi.number(),
	sum: Joi.number(),
});

export const paymentSchema = Joi.object({
	id: Joi.string(),
	paymentDate: Joi.date(),
	dateOfPayment: Joi.date(),
	amount: Joi.number(),
	duty: Joi.number(),
	percent: Joi.number(),
	remainderDuty: Joi.number(),
	status: Joi.string().valid(...Object.values(PaymentStatus)),
});

export const paymentWithStatsSchema = Joi.object({
	id: Joi.string(),
	paymentDate: Joi.date(),
	dateOfPayment: Joi.date(),
	amount: Joi.number(),
	duty: Joi.number(),
	percent: Joi.number(),
	remainderDuty: Joi.number(),
	status: Joi.string().valid(...Object.values(PaymentStatus)),
	investorsPercent: Joi.string(),
	paymentInvestorAmount: Joi.string(),
});

export const loanStatusSchema = Joi.string().valid(...Object.values(LoanStatus));

export const borrowerLoansListSchema = listSchema.keys({
	status: Joi.alternatives().try(Joi.array().items(loanStatusSchema), loanStatusSchema),
	penalty: boolSchema,
	from: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
	to: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
});

export const loanKindSchema = Joi.string().valid(LoanKindType.CLOSE, LoanKindType.OPEN);

export const loanRepaymentTypeSchema = Joi.number().valid(
	repaymentType.IN_PARTS,
	repaymentType.IN_THE_ENDS
);

export const loanTypeSchema = Joi.string().valid(
	LoanType.BAIL,
	LoanType.COMMERCIAL_CONTRACT,
	LoanType.GOVERNMENT_CONTRACT,
	LoanType.WORKING_CAPITAL
);

export const arrearsStatusLoanSchema = Joi.string().valid(
  LoanArrearsStatus.ASSIGNMENT_AGREEMENT,
  LoanArrearsStatus.IMPOSSIBILITY_OF_RECOVERY,
  LoanArrearsStatus.NO_OVERDUE_DEBT,
  LoanArrearsStatus.OVERDUE,
  LoanArrearsStatus.SUCCESSFUL_CLOSING,
);

export const loansListRequestSchema = listSchema.keys({
	status: Joi.alternatives().try(Joi.array().items(loanStatusSchema), loanStatusSchema),
	kind: Joi.alternatives().try(Joi.array().items(loanKindSchema), loanKindSchema),
	repaymentType: Joi.alternatives().try(
		Joi.array().items(loanRepaymentTypeSchema),
		loanRepaymentTypeSchema
	),
	type: Joi.alternatives().try(Joi.array().items(loanTypeSchema), loanTypeSchema),
	arrearsStatus: Joi.alternatives().try(
		Joi.array().items(arrearsStatusLoanSchema),
		arrearsStatusLoanSchema
	),
	from: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
	to: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
});

export const usersNotificationsListSchema = listSchema.keys({
	from: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
	to: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
	VerificationStatus: Joi.string().valid(...Object.values(VerificationStatus)),
	status: Joi.string().valid(...Object.values(UserStatus)),
	type: Joi.string().valid(...Object.values(NotificationType)),
	query: Joi.string().max(256).example('exmaple'),
});

const UserProfileTypeSchema = Joi.string().valid(
	UserProfileType.ENTITY,
	UserProfileType.ENTREPRENEUR,
	UserProfileType.INDIVIDUAL
);

const UserProfileRoleSchema = Joi.string().valid(
	UserProfileRole.BORROWER,
	UserProfileRole.INVESTOR
);

export const userNotificatonsSchema = Joi.object({
	id: Joi.string(),
	status: Joi.string().valid(...Object.values(UserNotificationStatus)),
	user: userSchema,
});
export const userNotificationsCreateSchema = Joi.object({
	message: Joi.string().label('Message to be sent').example('Important updates'),
	files: Joi.array().items(fileUploadSchema).max(3).optional(),
	broadcast: Joi.boolean()
		.default(false)
		.label('Determines whether this message should be broadcast to all users'),
	recipients: Joi.array().items(Joi.string()).optional(),
	groups: Joi.object({
		status: Joi.array().items(usersStatusSchema),
		VerificationStatus: Joi.array().items(userVerificationStatusSchema),
		UserProfileRole: Joi.array().items(UserProfileRoleSchema),
		UserProfileType: Joi.array().items(UserProfileTypeSchema),
	}),
});
export const userProfileRatingSchema = Joi.string().valid(
	UserProfileRating.A,
	UserProfileRating.AA,
	UserProfileRating.AAA,
	UserProfileRating.B,
	UserProfileRating.BB,
	UserProfileRating.BBB,
	UserProfileRating.C,
	UserProfileRating.D
);

export const qualificationStatusSchema = Joi.string().valid(
	QualificationStatus.VERIFIED,
	QualificationStatus.FOR_VERIFICATION,
	QualificationStatus.UNVERIFIED
);

export const investorLoansListRequestSchema = listSchema.keys({
	status: Joi.alternatives().try(Joi.array().items(loanStatusSchema), loanStatusSchema),
	arrearsStatus: Joi.alternatives().try(
		Joi.array().items(arrearsStatusLoanSchema),
		arrearsStatusLoanSchema
	),
	from: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
	to: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
});

export interface CommonListQuery {
	limit?: number;
	offset?: number;
	order?: {
		[key: string]: 'ASC' | 'DESC';
	};
	query?: string;
}

export const usersLogsRequestSchema = listSchema.keys({
	status: Joi.alternatives().try(Joi.array().items(usersStatusSchema), usersStatusSchema),
	role: Joi.alternatives().try(Joi.array().items(UserProfileRoleSchema), UserProfileRoleSchema),
	type: Joi.alternatives().try(Joi.array().items(UserProfileTypeSchema), UserProfileTypeSchema),
	verification: Joi.alternatives().try(
		Joi.array().items(userVerificationStatusSchema),
		userVerificationStatusSchema
	),
	from: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
	to: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
});

export const adminsLogsRequestSchema = listSchema.keys({
	role: Joi.alternatives().try(Joi.array().items(roleKeySchema), roleKeySchema),
	from: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
	to: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
});

export const loanDocumentTypeCreationSchena = Joi.string().valid(
	...Object.values(LoanDocumentType)
);

export const bankRequisitesPayloadSchema = Joi.object({
	bankName: Joi.string().required().max(64),
	bik: Joi.string()
		.required()
		.regex(/^[0-9]{9}/),
	settlementAccount: Joi.string()
		.required()
		.regex(/^[0-9]{20}/),
	correspondentAccount: Joi.string()
		.required()
		.regex(/^[0-9]{20}/),
});

export const investorUpdateSchema = Joi.object();

export const docsListSchema = listSchema.keys({
	from: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
	to: Joi.date().timestamp('javascript').note('Timestamp in milliseconds'),
});
