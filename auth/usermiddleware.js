const jwt = require("jsonwebtoken");
const JWT_SECRET = require("../config.js");

function userAuthentication(req, res, next) {
    const token = req.headers["authorization"];

    if (!token) {
        res.json({ message: "Token not received to authorize" });
        return;
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(403).json({ message: "Invalid or expired token" });
    }
}

module.exports = userAuthentication;
