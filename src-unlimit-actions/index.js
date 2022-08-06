const workerFarm = require("worker-farm");
const workers = workerFarm(require.resolve("./worker.js"));

let i = 1;
while (i <= Number(5)) {
	try {
		workers();
	} catch (error) {
		continue;
	}
	i++;
}
