import React from "react";
import { TextField } from "@material-ui/core";
import * as Yup from "yup";

export function basicInfoFormValidationsGenerator(T) {
  return {
    name: Yup.string().required(
      T.translate("shark_attack.form_validations.name.required"),
    ),
    date: Yup.string().required(
      T.translate("shark_attack.form_validations.date.required"),
    ),
    country: Yup.string().required(
      T.translate("shark_attack.form_validations.country.required"),
    ),
    year: Yup.string()
      .nullable()
      .test(
        "year",
        T.translate("shark_attack.form_validations.year.invalid"),
        (v) => !v || /^\d{4}$/.test(v),
      ),
    sex: Yup.string()
      .nullable()
      .test(
        "sex",
        T.translate("shark_attack.form_validations.sex.invalid"),
        (v) => !v || ["M", "F"].includes(v),
      ),
    age: Yup.string()
      .nullable()
      .test(
        "age",
        T.translate("shark_attack.form_validations.age.invalid"),
        (v) => !v || /^\d+$/.test(v),
      ),
    fatal_y_n: Yup.string()
      .nullable()
      .test(
        "fatal_y_n",
        T.translate("shark_attack.form_validations.fatal_y_n.invalid"),
        (v) => !v || ["Y", "N"].includes(v),
      ),
  };
}

/**
 * Fields of the shark-attack aggregate, in the order required by the deliverable.
 */
const FIELDS = [
  { id: "name", labelKey: "name" },
  { id: "date", labelKey: "date" },
  { id: "year", labelKey: "year" },
  { id: "type", labelKey: "type" },
  { id: "country", labelKey: "country" },
  { id: "area", labelKey: "area" },
  { id: "location", labelKey: "location" },
  { id: "activity", labelKey: "activity" },
  { id: "sex", labelKey: "sex", select: true, selectOptions: ["M", "F"] },
  { id: "age", labelKey: "age" },
  { id: "injury", labelKey: "injury", multiline: true },
  {
    id: "fatal_y_n",
    labelKey: "fatal_y_n",
    select: true,
    selectOptions: ["Y", "N"],
  },
  { id: "time", labelKey: "time" },
  { id: "species", labelKey: "species" },
  {
    id: "investigator_or_source",
    labelKey: "investigator_or_source",
    multiline: true,
  },
  { id: "pdf", labelKey: "pdf" },
  { id: "href_formula", labelKey: "href_formula" },
  { id: "href", labelKey: "href" },
  { id: "case_number", labelKey: "case_number" },
  { id: "case_number0", labelKey: "case_number0" },
];

/**
 * Aggregate BasicInfo form
 * @param {{dataSource,T}} props
 */
export function BasicInfo(props) {
  const { dataSource: form, T, onChange, errors, touched, canWrite } = props;
  return (
    <div>
      {FIELDS.map((field) => {
        const { id, labelKey, multiline, select, selectOptions } = field;
        const required = id === "name";
        const label = T.translate(`shark_attack.${labelKey}`);
        const isSelect = select && selectOptions;

        if (isSelect) {
          return (
            <TextField
              key={id}
              className="mt-8 mb-16"
              helperText={errors[id] && touched[id] && errors[id]}
              error={errors[id] && touched[id]}
              required={required}
              label={label}
              id={id}
              name={id}
              value={form[id]}
              onChange={onChange(id)}
              onBlur={onChange(id)}
              select
              variant="outlined"
              fullWidth
              InputProps={{
                readOnly: !canWrite(),
              }}
              SelectProps={{
                native: true,
              }}
            >
              <option value="" />
              {selectOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </TextField>
          );
        }

        return (
          <TextField
            key={id}
            className="mt-8 mb-16"
            helperText={errors[id] && touched[id] && errors[id]}
            error={errors[id] && touched[id]}
            required={required}
            label={label}
            id={id}
            name={id}
            value={form[id]}
            onChange={onChange(id)}
            onBlur={onChange(id)}
            type="text"
            multiline={multiline}
            rows={multiline ? 3 : undefined}
            variant="outlined"
            fullWidth
            InputProps={{
              readOnly: !canWrite(),
            }}
          />
        );
      })}
    </div>
  );
}
