import * as yup from "yup";

const optionalNullableString = (max, label) =>
  yup
    .string()
    .transform((value, originalValue) =>
      typeof originalValue === "string" && !originalValue.trim()
        ? null
        : typeof value === "string"
          ? value.trim()
          : value
    )
    .nullable()
    .optional()
    .max(max, `${label} cannot exceed ${max} characters.`);

const emailField = optionalNullableString(255, "Email").email(
  "Enter a valid email address."
);

const bioField = optionalNullableString(5000, "Bio");

const avatarUrlField = optionalNullableString(
  2048,
  "Avatar URL"
).test(
  "valid-url",
  "Avatar URL must be a valid HTTP or HTTPS URL.",
  (value) => {
    if (!value) return true;

    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }
);

export const createAuthorSchema = yup
  .object({
    name: yup
      .string()
      .trim()
      .required("Author name is required.")
      .max(150, "Author name cannot exceed 150 characters."),
    email: emailField,
    bio: bioField,
    avatar_url: avatarUrlField,
  })
  .required();

export const updateAuthorSchema = yup
  .object({
    name: yup
      .string()
      .trim()
      .optional()
      .max(150, "Author name cannot exceed 150 characters."),
    email: emailField,
    bio: bioField,
    avatar_url: avatarUrlField,
    is_active: yup
      .boolean()
      .optional()
      .typeError("Active status must be true or false."),
  })
  .test(
    "at-least-one-field",
    "Update at least one author field.",
    (value) => Boolean(value && Object.keys(value).length > 0)
  )
  .required();