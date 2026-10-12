import * as yup from "yup";
import { AppError } from "@/backend/errors/app-error";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";

const loginSchema = yup.object({
  email: yup
    .string()
    .trim()
    .lowercase()
    .email("Enter a valid email address")
    .required("Email is required"),

  password: yup
    .string()
    .required("Password is required"),
}).required();

const registerSchema = yup.object({
  name: yup
    .string()
    .trim()
    .max(100, "Name cannot exceed 100 characters")
    .required("Name is required"),
  email: yup
    .string()
    .trim()
    .lowercase()
    .email("Enter a valid email address")
    .required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password cannot exceed 72 characters")
    .required("Password is required")
}).required();

async function validateInput(schema, data) {
  try {
    return await schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const errors = {};

      error.inner.forEach((item) => {
        if (item.path && !errors[item.path]) {
          errors[item.path] = item.message;
        }
      });

      throw new AppError(
        "Validation failed",
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        errors
      );
    }

    throw error;
  }
}

export function validateLoginInput(data) {
  return validateInput(loginSchema, data);
}

export function validateRegisterInput(data) {
  return validateInput(registerSchema, data);
}