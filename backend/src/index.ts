import "dotenv/config";
import app from "./app/index.js";

const PORT = process.env.PORT

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});