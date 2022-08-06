const workerFarm = require("worker-farm");
const workers = workerFarm(require.resolve("./src"));

let i = 1;
while (i <= 10) {
	try {
		workers();
	} catch (error) {
		continue;
	}
	i++;
}
