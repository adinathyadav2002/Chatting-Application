import jwt from "jsonwebtoken";
import { promisify } from "util";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
import catchAsync from "../utilities/catchAsync.js";
import AppError from "../utilities/appError.js";

export const protect = catchAsync(async (req, res, next) => {
  // 1) get jwt from headers
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token)
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );

  // 2) verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) check if the user still exists
  const currentUser = await prisma.user.findUnique({
    where: { id: decoded.id },
  });
  if (!currentUser)
    return next(
      new AppError("The user belonging to token no longer exists!", 401)
    );

  // for us to use it in the next middlewares
  req.user = currentUser;
  next();
});
