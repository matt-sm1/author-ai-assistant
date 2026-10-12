
import * as yup from "yup";

export const loginSchema = yup.object({
  email: yup
    .string()
    .trim()
    .required("Email is required")
    .email("Enter a valid email address")
    .max(254, "Email is too long"),

  password: yup
    .string()
    .required("Password is required"),
});

/**
 * Validate login form input.
 *
 * Returns:
 * {
 *   values: validated values | null,
 *   errors: field error object
 * }
 */
export async function validateLogin(values) {
  try {
    const validatedValues = await loginSchema.validate(
      values,
      {
        abortEarly: false,
        stripUnknown: true,
      }
    );

    return {
      values: validatedValues,
      errors: {},
    };
  } catch (error) {
    if (!(error instanceof yup.ValidationError)) {
      throw error;
    }

    const errors = {};

    for (const issue of error.inner.length
      ? error.inner
      : [error]) {
      if (
        issue.path &&
        !errors[issue.path]
      ) {
        errors[issue.path] = issue.message;
      }
    }

    return {
      values: null,
      errors,
    };
  }
}
