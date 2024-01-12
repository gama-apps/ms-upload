
class ValidatorMiddleware {

  /**
   * @description oAuth
   * @param req
   * @param res
   * @param next
   * @returns {Promise<*>}
   */
  async secret (req, res, next) {

    const secret = req.headers['x-secret'];
    let err;

    //  check if secret field exist
    if(!secret) {
      //  if token field doesnt exist, return 401 error.
      err = new Error('Unauthorized: Secret not provided.');
      err.code = 401;
      return next(err);
    }

    if(secret !== process.env.SECRET || typeof secret !== 'string' || secret.length < 8){
      err = new Error('Unauthorized: Invalid Secret');
      err.code = 402;
      return next(err);
    }

    next();

  }

}

module.exports = new ValidatorMiddleware();
