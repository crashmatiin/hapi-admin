

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tx = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`create view "historyDeposits" ("userId", "profileType", date, "operationType", income, expense, "additionalData") as
      SELECT "Profile"."userId",
             concat("Profile".role, '_', "Profile".type)::character varying(255) AS "profileType",
             "Deposit"."createdAt"                                               AS date,
             'deposit'::text                                                     AS "operationType",
             "Deposit".amount::text                                              AS income,
             NULL::text                                                          AS expense,
             json_build_object('accountNumber', "Wallet"."accountNumber")        AS "additionalData"
      FROM "Deposits" "Deposit"
               JOIN "UserProfiles" "Profile"
                    ON "Profile"."walletId"::text = "Deposit"."walletId"::text AND "Profile".status::text = 'accepted'::text
               JOIN "Wallets" "Wallet" ON "Deposit"."walletId"::text = "Wallet".id::text;`)
      await queryInterface.sequelize.query(`create view "historyWithdrawals" ("userId", "profileType", date, "operationType", income, expense, "additionalData") as
      SELECT "Profile"."userId",
             concat("Profile".role, '_', "Profile".type)::character varying(255) AS "profileType",
             "Withdraw"."createdAt"                                              AS date,
             'withdraw'::text                                                    AS "operationType",
             NULL::text                                                          AS income,
             "Withdraw".amount::text                                             AS expense,
             json_build_object('accountNumber', "Wallet"."accountNumber")        AS "additionalData"
      FROM "Withdrawals" "Withdraw"
               JOIN "UserProfiles" "Profile"
                    ON "Profile"."walletId"::text = "Withdraw"."walletId"::text AND "Profile".status::text = 'accepted'::text
               JOIN "Wallets" "Wallet" ON "Profile"."walletId"::text = "Wallet".id::text;`)
      await queryInterface.sequelize.query(`create view "historyInvestments" ("userId", "profileType", date, "operationType", income, expense, "additionalData") as
      SELECT "Profile"."userId",
             concat("Profile".role, '_', "Profile".type)::character varying(255) AS "profileType",
             "Investment"."createdAt"                                           AS date,
             'investment'::text                                                 AS "operationType",
             NULL::text                                                         AS income,
             "Investment".value::text                                           AS expense,
             json_build_object('contractNumber', "Loan"."contractNumber", 'contractDate', "Loan"."conclusionContractDate",
                               'borrower', "Loan".name, 'tin', "Documents".tin) AS "additionalData"
      FROM "Investments" "Investment"
               JOIN "Loans" "Loan" ON "Investment"."loanId"::text = "Loan".id::text
               JOIN "UserProfiles" "Profile"
                    ON "Profile"."id"::text = "Loan"."profileId" AND "Profile".status::text = 'accepted'::text
               JOIN "UserDocuments" "Documents" ON "Documents"."userId"::text = "Loan"."borrowerId"::text;`)
      await queryInterface.sequelize.query(`create view "historyInterestPaymentsInvestor" as
        select
          "Investment"."userId",
          "Investment"."profileType",
          "Payment"."updatedAt" as "date",
          'interestPayment' as "operationType",
          "Payment"."percent"::text as "income",
          null as "expense",
          json_build_object(
            'contractNumber', "Loan"."contractNumber",
            'contractDate', "Loan"."conclusionContractDate",
            'borrower', "Loan"."name",
            'tin', "Documents"."tin"
          ) as "additionalData"
        from public."Payments" as "Payment"
          inner join public."Investments" as "Investment" on "Payment"."investmentId" = "Investment"."id"
          inner join public."Loans" as "Loan" on "Payment"."loanId" = "Loan"."id"
          inner join public."UserDocuments" as "Documents" on "Documents"."userId" = "Loan"."borrowerId"
        where "Payment"."status" = 'executed'
      `)
      await queryInterface.sequelize.query(`create view "historyMainDutyPaymentsInvestor" as
        select
          "Investment"."userId",
          "Investment"."profileType",
          "Payment"."updatedAt" as "date",
          'mainDutyPayment' as "operationType",
          "Payment"."duty"::text as "income",
          null as "expense",
          json_build_object(
            'contractNumber', "Loan"."contractNumber",
            'contractDate', "Loan"."conclusionContractDate",
            'borrower', "Loan"."name",
            'tin', "Documents"."tin"
          ) as "additionalData"
        from public."Payments" as "Payment"
          inner join public."Investments" as "Investment" on "Payment"."investmentId" = "Investment"."id"
          inner join public."Loans" as "Loan" on "Payment"."loanId" = "Loan"."id"
          inner join public."UserDocuments" as "Documents" on "Documents"."userId" = "Loan"."borrowerId"
        where "Payment"."status" = 'executed'
      `)
      await queryInterface.sequelize.query(`create view "historyFees" as
        select
          "userId",
          "profileType",
          "createdAt" as "date",
          'fee' as "operationType",
          null as "income",
          "amount"::text as "expense",
          json_build_object() as "additionalData"
        from public."Fees"
      `)
      await queryInterface.sequelize.query(`create view "historyInvestor" as
        select * from "historyDeposits"
          union all
        select * from "historyWithdrawals"
          union all
        select * from "historyInvestments"
          union all
        select * from "historyInterestPaymentsInvestor"
          union all
        select * from "historyMainDutyPaymentsInvestor"
          union all
        select * from "historyFees"
        order by "date" desc
      `)
      await queryInterface.sequelize.query(`create view "historyLoanIssues" as
        select
          "Loan"."borrowerId" as "userId",
          "Loan"."profileType" as "profileType",
          "LoanIssue"."updatedAt" as "date",
          'loanIssue' as "operationType",
          "InvestmentSum"."sum"::text as "income",
          null as "expense",
          json_build_object(
            'contractNumber', "Loan"."contractNumber",
            'contractDate', "Loan"."conclusionContractDate",
                'borrower', "Loan"."name",
            'tin', "Documents"."tin"
          )
        from public."LoanIssues" as "LoanIssue"
          inner join public."Loans" as "Loan" on "Loan"."id" = "LoanIssue"."loanId"
          inner join (select
                  sum("Investment"."value"),
                  "Investment"."loanId"
                from public."Investments" as "Investment"
                group by "Investment"."loanId"
                ) as "InvestmentSum" on "InvestmentSum"."loanId" = "LoanIssue"."loanId"
          inner join public."UserDocuments" as "Documents" on "Documents"."userId" = "Loan"."borrowerId"
        where "LoanIssue"."status" = 'accepted'
      `)
      await queryInterface.sequelize.query(`create view "historyInterestPaymentsBorrower" as
        select
          "Loan"."borrowerId" as "userId",
          "Loan"."profileType" as "profileType",
          "PercentPayments"."paymentDate" as "date",
          'interestPayment' as "operationType",
          null as "income",
          "PercentPayments"."amount"::text as "expense",
          json_build_object(
            'contractNumber', "Loan"."contractNumber",
            'contractDate', "Loan"."conclusionContractDate",
            'borrower', "Loan"."name",
            'tin', "Documents"."tin"
          )
        from (
            select
              sum("percent") as "amount",
              extract(month from "paymentDate") as "month",
              "loanId",
              "paymentDate"
            from public."Payments" as "Payment"
            where "Payment"."status" = 'executed'
            group by "month", "loanId", "paymentDate"
          ) as "PercentPayments"
          inner join public."Loans" as "Loan" on "PercentPayments"."loanId" = "Loan"."id"
          inner join public."UserDocuments" as "Documents" on "Documents"."userId" = "Loan"."borrowerId"
      `)
      await queryInterface.sequelize.query(`create view "historyMainDutyPaymentsBorrower" as
        select
          "Loan"."borrowerId" as "userId",
          "Loan"."profileType" as "profileType",
          "PercentPayments"."paymentDate" as "date",
          'interestPayment' as "operationType",
          null as "income",
          "PercentPayments"."amount"::text as "expense",
          json_build_object(
            'contractNumber', "Loan"."contractNumber",
            'contractDate', "Loan"."conclusionContractDate",
            'borrower', "Loan"."name",
            'tin', "Documents"."tin"
          )
        from (
            select
              sum("duty") as "amount",
              extract(month from "paymentDate") as "month",
              "loanId",
              "paymentDate"
            from public."Payments" as "Payment"
            where "Payment"."status" = 'executed'
            group by "month", "loanId", "paymentDate"
          ) as "PercentPayments"
          inner join public."Loans" as "Loan" on "PercentPayments"."loanId" = "Loan"."id"
          inner join public."UserDocuments" as "Documents" on "Documents"."userId" = "Loan"."borrowerId"
      `)
      await queryInterface.sequelize.query(`create view "historyBorrower" as
        select * from "historyDeposits"
          union all
        select * from "historyWithdrawals"
          union all
        select * from "historyLoanIssues"
          union all
        select * from "historyInterestPaymentsBorrower"
          union all
        select * from "historyMainDutyPaymentsBorrower"
          union all
        select * from "historyFees"
        order by "date" desc
      `)
      await tx.commit();
    }
    catch (err) {
      await tx.rollback();
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tx = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`drop view "historyDeposits"`)
      await queryInterface.sequelize.query(`drop view "historyWithdrawals"`)
      await queryInterface.sequelize.query(`drop view "historyInvestments"`)
      await queryInterface.sequelize.query(`drop view "historyInterestPaymentsInvestor"`)
      await queryInterface.sequelize.query(`drop view "historyMainDutyPaymentsInvestor"`)
      await queryInterface.sequelize.query(`drop view "historyFees"`)
      await queryInterface.sequelize.query(`drop view "historyInvestor"`)
      await queryInterface.sequelize.query(`drop view "historyLoanIssues"`)
      await queryInterface.sequelize.query(`drop view "historyInterestPaymentsBorrower"`)
      await queryInterface.sequelize.query(`drop view "historyMainDutyPaymentsBorrower"`)
      await queryInterface.sequelize.query(`drop view "historyBorrower"`)
      await tx.commit();
    }
    catch (err) {
      await tx.rollback();
    }
  },
};
