import jwt from "jsonwebtoken";

export class JwtAdapter {
  getSecret() {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    return secret;
  }

  sign(payload) {
    return jwt.sign(payload, this.getSecret(), {
      algorithm: "HS256",
      expiresIn: "7d",
    });
  }

  verify(token) {
    return jwt.verify(token, this.getSecret(), {
      algorithms: ["HS256"],
    });
  }
}