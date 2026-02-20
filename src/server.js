import app from "./app.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 7777;

app.listen(PORT, () => {
  console.log(`Sever listening on PORT ${PORT}`);
});
