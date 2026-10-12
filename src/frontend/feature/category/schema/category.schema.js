
import * as yup from "yup";

export const categorySchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("Category name is required.")
    .max(100, "Category name cannot exceed 100 characters."),
});
