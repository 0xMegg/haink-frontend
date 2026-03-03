module.exports = {
  async getInstance() {
    return {
      validateString() {
        return {
          status: 'UNKNOWN',
          errors: [],
        };
      },
    };
  },
};
