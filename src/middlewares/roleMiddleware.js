const roleMiddleware = (allowedRoles) => {

  return (req, res, next) => {

    try {

      const userRole = req.user.role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          message: "Access denied. You are not authorized."
        });
      }

      next();

    } catch (error) {

      res.status(500).json({
        message: "Role verification failed"
      });

    }

  };

};

module.exports = roleMiddleware;