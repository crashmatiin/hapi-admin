import * as faker from 'faker';
import {
  UserAddress,
  Deposit,
  DepositMethod,
  DepositStatus,
  EntityAccount,
  EntityBeneficiary,
  EntityLicense,
  EntrepreneurAccount,
  Fee,
  FeeType,
  getUUID,
  Investment,
  EntityLicenseKind,
  Loan,
  LoanCommitmentType,
  LoanKindType, LoanStatus,
  LoanType,
  Payment,
  PaymentStatus,
  UserProfileStatus,
  repaymentType,
  Transaction,
  TransactionType,
  User,
  UserDocument,
  userGender,
  UserProfile,
  UserStatus,
  VerificationStatus,
  Wallet,
  Withdrawal,
  WithdrawalStatus,
  WithdrawalType,
  UserProfileRole,
  UserProfileType,
} from 'invest-models';
import * as generator from 'generate-password';
import * as fs from 'fs';
import * as path from 'path';
import { Server, } from '@hapi/hapi';
import { profileTypeRelations, } from '.';

faker.setLocale('ru');

const LIMIT = 20;

const userStatusList = [UserStatus.ACTIVE, UserStatus.BANNED];
const userGenderList = [userGender.FEMALE, userGender.MALE];
const userVerificationStatusList = [
	VerificationStatus.UNVERIFIED,
	VerificationStatus.VERIFIED,
	VerificationStatus.FOR_VERIFICATION
];
const profileStatusList = [
	UserProfileStatus.ACCEPTED,
	UserProfileStatus.REJECTED,
	UserProfileStatus.REVIEWING,
	UserProfileStatus.BANNED
];
const loanStatusList = [
  LoanStatus.ACTIVE,
  LoanStatus.CLOSED,
  LoanStatus.DECLINED,
  LoanStatus.FINANCED,
  LoanStatus.NEW,
  LoanStatus.REVIEWING,
  LoanStatus.BANK_CONFIRMATION,
];
const loanRepaymentTypeList = [repaymentType.IN_PARTS, repaymentType.IN_THE_ENDS];
const loanCommitmensList = [LoanCommitmentType.PLEDGE, LoanCommitmentType.SURETY];
const loanKindsList = [LoanKindType.CLOSE, LoanKindType.OPEN];
const loanTypeList = [
	LoanType.BAIL,
	LoanType.COMMERCIAL_CONTRACT,
	LoanType.GOVERNMENT_CONTRACT,
	LoanType.WORKING_CAPITAL
];

const getRandomInt = (min: number, max: number) =>
	Math.floor(Math.random() * (max - min + 1)) + min;

export default async (server: Server): Promise<void> => {
	const { db: sequelize, } = server.app;
	const tx = await sequelize.transaction();
	try {
		for (let i = 0; i < LIMIT; i++) {
			const email = faker.internet.email();
			const password = generator.generate({ length: 12, numbers: true, symbols: false, });

			const userData = {
				firstName: faker.name.firstName(),
				lastName: faker.name.lastName(),
				middleName: faker.name.middleName(),
				birthday: faker.date.past().toString(),
				birthPlace: faker.address.city(),
				gender: userGenderList[getRandomInt(0, 1)],
			};

			const user = await User.create(
				{
					email,
					status: userStatusList[getRandomInt(0, 1)],
					password,
					verificationStatus: userVerificationStatusList[getRandomInt(0, 2)],
					settings: {},
					...userData,
				},
				{
					transaction: tx,
				}
			);

			const profileData = {
				email,
				userId: user.id,
				phone: faker.phone.phoneNumber(),
			};

			const addressData = {
				registration: faker.address.streetAddress(true),
				isResident: true,
				isPublic: true,
			};

			const documentsData = {
				serial: faker.datatype.number(4),
				number: faker.datatype.number(6),
				departmentCode: faker.datatype.number(3),
				issuedBy: faker.commerce.department(),
				issueDate: faker.date.past().toString(),
				tin: faker.datatype.number(),
				snils: faker.datatype.number(),
			};

			await UserAddress.create(
				{
					userId: user.id,
					...addressData,
				},
				{
					transaction: tx,
				}
			);

			await UserDocument.create(
				{
					userId: user.id,
					...documentsData,
				},
				{
					transaction: tx,
				}
			);

			const wallet = await Wallet.create(
				{
					balance: faker.datatype.number(),
					invested: faker.datatype.number(),
					blocked: faker.datatype.number(),
					flow: faker.datatype.number(),
					available: faker.datatype.number(),
					requisites: {
						bankName: faker.finance.accountName(),
						bik: faker.finance.bic(),
						personalAccount: faker.finance.account(),
						settlementAccount: faker.finance.account(),
						correspondentAccount: faker.finance.account(),
					},
					accountNumber: faker.finance.account(),
				},
				{
					transaction: tx,
				}
			);

			const entityData = {
				profileId: '',
				fullName: faker.company.companyName(),
				tin: faker.finance.routingNumber(),
				ogrn: faker.finance.routingNumber(),
				registrationDate: faker.date.past().toString(),
				registrationPlace: faker.address.city(),
				kpp: faker.finance.routingNumber(),
				registration: faker.address.streetAddress(true),
				paymentCapital: faker.lorem.sentence(),
				email: faker.internet.email(),
				site: faker.internet.domainName(),
				okato: faker.datatype.number().toString(),
				okpo: faker.datatype.number().toString(),
				okved: faker.datatype.number().toString(),
				isBeneficiary: faker.datatype.boolean(),
				shortName: faker.lorem.word(),
			};

			const entrepreneurProfileInvestor = await UserProfile.create(
				{
					...profileData,
					status: profileStatusList[getRandomInt(0, 3)],
					role: UserProfileRole.INVESTOR,
					type: UserProfileType.ENTREPRENEUR,
				},
				{
					transaction: tx,
				}
			);
			const entrepreneurData = {
				profileId: entrepreneurProfileInvestor.id,
				ogrnip: faker.finance.routingNumber(),
			};
			const entrepreneurAccountInvestor = await EntrepreneurAccount.create(entrepreneurData, {
				transaction: tx,
			});

			const entityProfileInvestor = await UserProfile.create(
				{
					...profileData,
					status: profileStatusList[getRandomInt(0, 3)],
					role: UserProfileRole.INVESTOR,
					type: UserProfileType.ENTITY,
				},
				{
					transaction: tx,
				}
			);
			entityData.profileId = entityProfileInvestor.id;
			const entityAccountInvestor = await EntityAccount.create(entityData, {
				transaction: tx,
			});

			const entrepreneurProfileBorrower = await UserProfile.create(
				{
					...profileData,
					status: profileStatusList[getRandomInt(0, 3)],
					role: UserProfileRole.BORROWER,
					type: UserProfileType.ENTREPRENEUR,
				},
				{
					transaction: tx,
				}
			);
			entrepreneurData.profileId = entrepreneurProfileBorrower.id;
			const entrepreneurAccountBorrower = await EntrepreneurAccount.create(entrepreneurData, {
				transaction: tx,
			});

			const entityProfileBorrower = await UserProfile.create(
				{
					...profileData,
					status: profileStatusList[getRandomInt(0, 3)],
					role: UserProfileRole.INVESTOR,
					type: UserProfileType.ENTITY,
				},
				{
					transaction: tx,
				}
			);
			entityData.profileId = entityProfileBorrower.id;
			const entityAccountBorrower = await EntityAccount.create(entityData, {
				transaction: tx,
			});
		}

		const allProfile = await UserProfile.findAll({
			transaction: tx,
		});

		await Promise.all(
			allProfile.map(async (profile) => {
				const depositTx = await Transaction.create(
					{
						amount: faker.datatype.number(3),
						type: TransactionType.Deposit,
						walletId: profile.walletId,
					},
					{
						transaction: tx,
					}
				);

				await Deposit.create(
					{
						method: DepositMethod.BankTransfer,
						externalId: getUUID(),
						externalTransactionUid: getUUID(),
						amount: depositTx.amount,
						status: DepositStatus.Accepted,
						requestData: {},
						responseData: {},
						transactionId: depositTx.id,
						walletId: profile.walletId,
					},
					{
						transaction: tx,
					}
				);

				const withdrawTx = await Transaction.create(
					{
						amount: faker.datatype.number(3),
						type: TransactionType.Withdraw,
						walletId: profile.walletId,
					},
					{
						transaction: tx,
					}
				);

				await Withdrawal.create(
					{
						type:
							profile.role === UserProfileRole.INVESTOR
								? WithdrawalType.InvestorLeaves
								: WithdrawalType.BorrowerLeaves,
						externalTransactionUid: getUUID(),
						amount: faker.datatype.number(3),
						status: WithdrawalStatus.Accepted,
						transactionId: withdrawTx.id,
						walletId: profile.walletId,
					},
					{
						transaction: tx,
					}
				);

				await Fee.create(
					{
						userId: profile.userId,
						profileType: profileTypeRelations[profile.role][profile.type],
						amount: faker.datatype.number(3),
						type: FeeType.Withdraw,
					},
					{
						transaction: tx,
					}
				);
			})
		);

		const entityProfiles = await UserProfile.findAll({
			where: {
				type: UserProfileType.ENTITY,
			},
			include: [
				{
					model: EntityAccount,
				}
			],
			transaction: tx,
		});

		await Promise.all(
			entityProfiles.map(async (entityProfile) => {
				const beneficiaryData = {
					accountId: entityProfile.entityAccount.id,
					email: faker.internet.email(),
					phone: faker.phone.phoneNumber(),
					firstName: faker.name.firstName(),
					lastName: faker.name.lastName(),
					middleName: faker.name.middleName(),
					birthday: faker.date.past().toString(),
					birthPlace: faker.address.city(),
					gender: userGenderList[getRandomInt(0, 1)],
					tin: faker.datatype.number(),
					snils: faker.datatype.number(),
					registration: faker.address.streetAddress(true),
					serial: faker.datatype.number(4),
					number: faker.datatype.number(6),
					departmentCode: faker.datatype.number(3),
					issuedBy: faker.commerce.department(),
					issueDate: faker.date.past().toString(),
				};
				await EntityBeneficiary.create(
					{
						...beneficiaryData,
					},
					{
						transaction: tx,
					}
				);
				const licenseData = {
					accountId: entityProfile.entityAccount.id,
					kind: faker.company.companyName(),
					number: faker.datatype.number(6),
					issueDate: faker.date.past().toString(),
					issuedBy: faker.commerce.department(),
					validity: faker.date.past().toString(),
				};
				const createdLicense = await EntityLicense.create(
					{
						...licenseData,
					},
					{
						transaction: tx,
					}
				);
				await EntityLicenseKind.create(
					{
						licenseId: createdLicense.id,
						kind: faker.company.companyName(),
					},
					{
						transaction: tx,
					}
				);
			})
		);

		const borrowers = await UserProfile.findAll({
			where: {
				role: UserProfileRole.BORROWER,
				status: UserProfileStatus.ACCEPTED,
			},
			include: {
				model: User,
				attributes: ['id'],
			},
			transaction: tx,
		});

		const investors = await UserProfile.findAll({
			where: {
				role: UserProfileRole.INVESTOR,
				status: UserProfileStatus.ACCEPTED,
			},
			include: {
				model: User,
				attributes: ['id'],
			},
			transaction: tx,
		});

		for (let i = 0; i < 400; i++) {
			const minGoal = faker.datatype.number();
			const maxGoal = minGoal * getRandomInt(2, 3);
			const borrower = borrowers[getRandomInt(0, borrowers.length - 1)];
			const loan = await Loan.create(
				{
					name: faker.company.companyName(),
					status: loanStatusList[getRandomInt(0, 6)],
					term: faker.datatype.number(getRandomInt(1, 40)),
					expirationDate: faker.date.future(),
					minGoal,
					maxGoal,
					commitment: loanCommitmensList[getRandomInt(0, 1)],
					kind: loanKindsList[getRandomInt(0, 1)],
					interestRate: faker.datatype.float(1),
					rating: faker.datatype.number(1),
					repaymentType: loanRepaymentTypeList[getRandomInt(0, 1)],
					description: faker.lorem.words(),
					borrowerId: borrower.user.id,
					profileType: profileTypeRelations[borrower.role][borrower.type],
					type: loanTypeList[getRandomInt(0, 3)],
					aboutCompany: faker.lorem.paragraphs(),
					expertOpinions: faker.lorem.paragraphs(),
					riskAssessment: faker.lorem.paragraphs(),
					securitySurety: faker.lorem.paragraph(),
					surety: faker.name.firstName(),
					securityPledger: faker.lorem.paragraph(),
					pledger: faker.name.firstName(),
				},
				{
					transaction: tx,
				}
			);

			for (let j = 0; j <= 5; j++) {
				const value = Math.floor(loan.minGoal / getRandomInt(5, 10));
				const investor = investors[getRandomInt(0, investors.length - 1)];
				const investment = await Investment.create(
					{
						id: faker.datatype.uuid(),
						userId: investor.user.id,
						profileType: profileTypeRelations[investor.role][investor.type],
						value,
						loanId: loan.id,
					},
					{
						transaction: tx,
					}
				);
				for (let k = 1; k <= 5; k++) {
					await Payment.create(
						{
							paymentDate: new Date(`${k}.01.2022`),
							amount: investment.value / 10,
							duty: faker.datatype.number(2),
							percent: faker.datatype.number(2),
							remainderDuty: faker.datatype.number(3),
							status: PaymentStatus.Waiting,
							investmentId: investment.id,
							loanId: loan.id,
						},
						{
							transaction: tx,
						}
					);
				}
			}

			const loanInvestments = await Investment.sum('value', {
				where: {
					loanId: loan.id,
				},
				transaction: tx,
			});
			const loanPayments = await Payment.sum('amount', {
				where: {
					loanId: loan.id,
				},
				transaction: tx,
			});

			await loan.update(
				{
					currentFunds: loanInvestments,
					paid: loanPayments,
					debt: loanInvestments - loanPayments,
				},
				{
					transaction: tx,
				}
			);
		}

		await tx.commit();
	} catch (err) {
		await tx.rollback();
		console.log(err);
	}
};
