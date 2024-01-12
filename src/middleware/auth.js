const jwt = require("jsonwebtoken")
const axios = require("axios");

class AuthMiddleware {

  /**
   * @description oAuth
   * @param req
   * @param res
   * @param next
   * @returns {Promise<*>}
   */
  async token(req, res, next) {

    if (process.env.CHECK_TOKEN === "false") {
      return next();
    }

    const token = req.headers['x-token'];

    //  check if token field exist
    if (!token) {
      //  if token field doesnt exist, return 401 error.
      const err = new Error('Unauthorized: Token not provided.');
      err.code = 401;
      return next(err);
    }

    if (typeof token !== 'string') {
      //  if token field doesnt exist, return 401 error.
      const err = new Error('Unauthorized: Invalid Token Type.');
      err.code = 401;
      return next(err);
    }

    try {
      await axios.get(`${process.env.OAUTH_URL}/session`, {
        headers: {
          'x-secret': process.env.OAUTH_SECRET,
          'x-token': token
        }
      }).then((response) => {
        req.session = response.data;
        next();
      }).catch(() => {
        const err = new Error('Unauthorized: Invalid Token.');
        err.code = 503;
        res.status(403);
        return next(err);
      });
    } catch (e) {
      return next(500);
    }

  }

  async verifyJwtToken(req, res, next) {
    try {
      const secretKey = 'rskevin';
      const { token } = req.query

      const { oauthToken, url } = jwt.verify(token, secretKey);
      if (!oauthToken) throw new Error('Token no valido ')

      req.headers['x-token'] = oauthToken
      req.aws_url = url

      next();
    } catch (e) {
      return next(500);
    }
  }
}

module.exports = new AuthMiddleware();
