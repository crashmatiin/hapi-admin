import BigNumber from 'bignumber.js';
import {
	Loan,
	LoanArrearsStatus,
	LoanCommitmentType,
	LoanDocumentType,
	LoanKindType,
	LoanStatus,
	LoanType,
	repaymentType,
} from 'invest-models';
import { IListQueries, } from '../../utils/utils.interfaces';

export interface ListLoanQueries extends IListQueries {
  status?:
    LoanStatus.ACTIVE |
    LoanStatus.BANK_CONFIRMATION |
    LoanStatus.CLOSED |
    LoanStatus.DECLINED |
    LoanStatus.FINANCED |
    LoanStatus.NEW |
    LoanStatus.REVIEWING,
  kind?:
    LoanKindType.CLOSE |
    LoanKindType.OPEN,
  repaymentType?:
    repaymentType.IN_PARTS |
    repaymentType.IN_THE_ENDS,
  type?:
    LoanType.BAIL |
    LoanType.COMMERCIAL_CONTRACT |
    LoanType.GOVERNMENT_CONTRACT |
    LoanType.WORKING_CAPITAL,
  arrearsStatus?:
    LoanArrearsStatus.ASSIGNMENT_AGREEMENT |
    LoanArrearsStatus.IMPOSSIBILITY_OF_RECOVERY |
    LoanArrearsStatus.NO_OVERDUE_DEBT |
    LoanArrearsStatus.OVERDUE |
    LoanArrearsStatus.SUCCESSFUL_CLOSING,
  from?: number
  to?: number
}

export interface LoansStats {
	total: number;
	sum: number;
}

export interface ListBorrowerLoansQueries extends IListQueries {
  status?:
    LoanStatus.ACTIVE |
    LoanStatus.BANK_CONFIRMATION |
    LoanStatus.CLOSED |
    LoanStatus.DECLINED |
    LoanStatus.FINANCED |
    LoanStatus.NEW |
    LoanStatus.REVIEWING,
  penalty?: number
  from?: number
  to?: number
}

export interface ILoanStatus {
  loanStatus:
    LoanStatus.ACTIVE |
    LoanStatus.BANK_CONFIRMATION |
    LoanStatus.CLOSED |
    LoanStatus.DECLINED |
    LoanStatus.FINANCED |
    LoanStatus.NEW |
    LoanStatus.REVIEWING,
}
export interface ILoansStatsXslx {
	stats: LoansStats;
	loans: Loan[];
}
export interface IArrearsStatus {
  arrearsStatus:
    LoanArrearsStatus.ASSIGNMENT_AGREEMENT |
    LoanArrearsStatus.IMPOSSIBILITY_OF_RECOVERY |
    LoanArrearsStatus.NO_OVERDUE_DEBT |
    LoanArrearsStatus.OVERDUE |
    LoanArrearsStatus.SUCCESSFUL_CLOSING
}

export interface updateLoan {
	name: string;
	minGoal: number;
	maxGoal: number;
	interestRate: number;
	repaymentType: repaymentType;
	kind: LoanKindType;
	type: LoanType;
	surety: string;
	pledger: string;
}
export interface IFormattingLoan {
	id: string;
	number: number;
	name: string;
	status: LoanStatus;
	term: number;
	expiration: Date;
	currentFunds: number;
	minGoal: number;
	maxGoal: number;
	paid: number;
	debt: number;
	interestRate: number;
	rating: string;
	repaymentType: repaymentType;
	description: string;
	commitment: LoanCommitmentType;
	kind: LoanKindType;
	type: LoanType;
	aboutCompany: string;
	expertOpinions: string;
	riskAssessment: string;
	securitySurety: string;
	surety: string;
	securityPledger: string;
	pledger: string;
	contractNumber: string;
	conclusionContractDate: Date;
	expirationContractDate: Date;
	conclusion: string;
	expertOptions: string;
	expirationDate: Date;
}
export interface ILoanDocument {
	id: string;
	name: string;
}

export interface ILoanPenalty {
	penalty: number;
}
export interface ILoanDocumentCreate {
	fileId: string;
	name: string;
	loanId: string;
	type:
		| LoanDocumentType.EARLY_REPAYMENT_APP
		| LoanDocumentType.COLLECTION_AGREEMENT
		| LoanDocumentType.OFFICERS_OPINION
		| LoanDocumentType.JURISTS_OPINION
		| LoanDocumentType.DICISION_ON_THE_APP
		| LoanDocumentType.COMPANY_DOCUMENTS
		| LoanDocumentType.PROJECT_DOCUMENTS;
}
