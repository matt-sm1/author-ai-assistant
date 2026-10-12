import * as yup from "yup";

export const tagSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("Tag name is required")
    .max(100, "Tag name must be 100 characters or less"),
});