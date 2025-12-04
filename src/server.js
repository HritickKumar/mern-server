import { PORT } from "./config/env.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
