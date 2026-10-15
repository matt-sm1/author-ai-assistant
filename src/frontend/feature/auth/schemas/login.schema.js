import * as yup from "yup";

export const loginSchema = yup.object({
  email: yup
    .string()
    .trim()
    .lowercase()
    .required("Email or username is required")
    .max(254, "Email is too long")
    .test(
      "email-or-username",
      "Enter a valid email address or username",
      (value) => {
        if (!value) return false;
        if (value.includes("@")) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        }
        return /^[a-z0-9._-]{3,64}$/.test(value);
      }
    ),

  password: yup.string().required("Password is required"),
});

/**
 * Validate login form input.
 */
export async function validateLogin(values) {
  try {
    const validatedValues = await loginSchema.validate(values, {
      abortEarly: false,
      stripUnknown: true,
    });

    return {
      values: validatedValues,
      errors: {},
    };
  } catch (error) {
    if (!(error instanceof yup.ValidationError)) {
      throw error;
    }

    const errors = {};

    for (const issue of error.inner.length ? error.inner : [error]) {
      if (issue.path && !errors[issue.path]) {
        errors[issue.path] = issue.message;
      }
    }

    return {
      values: null,
      errors,
    };
  }
}
