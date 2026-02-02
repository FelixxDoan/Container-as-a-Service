import jwt from "jsonwebtoken";
import crypto from "crypto";

export const TOKEN_TTL_SEC = 6 * 60 * 60; // 6h

export const JWT_ISSUER = process.env.JWT_ISSUER || "micro-auth";
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "micro-gateway";

export const jwt_secret = process.env.JWT_SECRET;
if (!jwt_secret) {
  throw new Error("JWT_SECRET is required");
}

export const signToken = ({ sub, payload }) => {
  const jti = crypto.randomUUID();

  const token = jwt.sign(
    { sub, jti,  ...payload }, // payload tối giản
    jwt_secret,
    {
      expiresIn: TOKEN_TTL_SEC,
      algorithm: "HS256",
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }
  );

  return { token, jti };
};
