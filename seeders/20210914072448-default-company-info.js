const date = new Date();
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkInsert('CompanyInfos', [{
        id: '00000000-0000-0000-0000-000000000000',
        name: 'ООО «Ресурс»',
        tin: '9710061734',
        kpp: '770301001',
        bankAccountNominal: '40702810300000003824',
        bankName: 'АО «Банк ТОЧКА»',
        bik: '044525604',
        createdAt: date,
        updatedAt: date,
      }], {
        transaction,
      });
      await transaction.commit();
    }
    catch (err) {
      await transaction.rollback();
      console.log(err);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete('CompanyInfo', null, { transaction });
      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      console.log(error);
    }
  },
};
