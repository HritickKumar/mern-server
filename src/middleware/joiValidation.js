import Joi from "joi";

export const joiValidate = (schemas, options = { abortEarly: false }) => {
    const normalized = {};
    if (schemas) {
        if (schemas.isJoi || typeof schemas.validate === "function") {
            normalized.body = schemas;
        } else {
            normalized.body = schemas.body;
            normalized.params = schemas.params;
            normalized.query = schemas.query;
            normalized.headers = schemas.headers;
        }
    }

    return (req, res, next) => {
        try {
            const errors = [];

            for (const key of ["params", "query", "body", "headers"]) {
                const schema = normalized[key];
                if (!schema) continue;

                const { value, error } = schema.validate(req[key], {
                    abortEarly: options.abortEarly === true,
                    allowUnknown: false,
                    stripUnknown: true,
                    convert: true,           // ← ensures "1" → 1, "true" → true
                });

                if (error) {
                    errors.push({
                        part: key,
                        details: error.details.map((d) => ({
                            message: d.message,
                            path: d.path.join("."),
                        })),
                    });
                } else {
                    if (key !== "query") {
                        req[key] = value;
                    }
                }
            }

            if (errors.length) {
                return res.status(400).json({
                    success: false,
                    message: "Validation error",
                    errors,
                });
            }

            return next();
        } catch (err) {
            return next(err);
        }
    };
};