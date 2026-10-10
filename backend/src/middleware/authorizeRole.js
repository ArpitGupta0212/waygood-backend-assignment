
const HttpError = require("../utils/httpError");

function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new HttpError(401, "Authentication required."));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new HttpError(403, "You do not have permission to perform this action.")
      );
    }

    next();
  };
}

module.exports = authorizeRole;
