
import app from "./app";

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

const server = app.listen(PORT, () => {
	console.info(` ${NODE_ENV.toUpperCase()}:${PORT}`);
	// console.log(`🏥 Health check: http://localhost:${PORT}/health`);
	// console.log(`📡 API docs: http://localhost:${PORT}/api`);
});
export default server;