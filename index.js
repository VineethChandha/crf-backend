import app from "./app.js";
const PORT = process.env.PORT || 1999;

app.listen(PORT, () => {
  console.log(`listening at port http://localhost:${PORT}`);
});
