const date = new Date();
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const settings = [
        {
          key: 'minimal_loan',
          value: 500000,
          createdAt: date,
          updatedAt: date,
        },
        {
          key: 'maximal_loan',
          value: 5000000,
          createdAt: date,
          updatedAt: date,
        },
        {
          key: 'minimal_investments',
          value: 10000,
          createdAt: date,
          updatedAt: date,
        },
        {
          key: 'yearly_investments_limit_for_unqualified_user',
          value: 600000,
          createdAt: date,
          updatedAt: date,
        },
        {
          key: 'yearly_limit_maximum',
          value: 1000000000,
          createdAt: date,
          updatedAt: date,
        }
      ];
      await queryInterface.bulkInsert('Settings', settings, {
        transaction: transaction,
      });
      await transaction.commit();
    }
    catch (e) {
      await transaction.rollback();
      console.log(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete('Settings', null, { transaction, });
      await transaction.commit();
    }
    catch (e) {
      await transaction.rollback();
      console.log(e);
    }
  },
};
