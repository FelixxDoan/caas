import jwt from "jsonwebtoken";
import crypto from "crypto";

export const jwt_secret = process.env.JWT_SECRET || "Fi123581321";
export const TOKEN_TTL_SEC = 6 * 60 * 60; 

export const signToken = ({ sub, payload }) => {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { ...payload, sub, jti },   // sub = userId, jti = id phiên
    jwt_secret,
    { expiresIn: TOKEN_TTL_SEC }
  );
  return { token, jti };
};
