const https = require("https");
const WebSocketClient = require("websocket").client;
const axios = require("axios");
const env = {
	phone: "0925395078",
	url: "https://castrol-websocket-testp.estuary.solutions",
	apiUrl: "https://castrol-api-testp.estuary.solutions",
};

const httpsAgent = new https.Agent({
	rejectUnauthorized: false,
});
axios.defaults.httpsAgent = httpsAgent;

let livestreamId = "";
let firstRun = true;
const authInfo = {
	otp: "123456",
	userId: "",
	accessToken: "",
	refreshToken: "",
};

const reacts = ["Like", "Love", "Care", "Haha", "Wow"];

const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (array) => {
	let currentIndex = array.length,
		randomIndex;

	while (currentIndex != 0) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex],
			array[currentIndex],
		];
	}

	return array;
};
const getRandomString = (length) => {
	const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghiklmnopqrstuvwxyz".split(
		""
	);
	if (!length) {
		length = Math.floor(Math.random() * chars.length);
	}
	let result = "";
	for (let i = 0; i < length; i++) {
		result += chars[Math.floor(Math.random() * chars.length)];
	}
	return result;
};
const getRandomPhone = () => {
	const length = 9;
	const chars = "0123456789".split("");
	let result = "0";
	for (let i = 0; i < length; i++) {
		result += chars[Math.floor(Math.random() * chars.length)];
	}
	return result;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const name = getRandomString(10);
const comment = () => `This is message from ${name} in: ${new Date().toISOString()}`;

const question = () => `This is question from ${name} in: ${new Date().toISOString()}`;

const getSocketUrl = () =>
	`${env.url}/users/${authInfo.userId}?token=${authInfo.accessToken}`;
const getAuth = async () => {
	const phone = getRandomPhone();
	await axios({
		method: "POST",
		url: `${env.apiUrl}/auth/otp-code`,
		data: {
			mobile: phone,
		},
	});
	const response = await axios({
		method: "post",
		url: `${env.apiUrl}/auth/verification`,
		data: {
			mobile: phone,
			otp_code: authInfo.otp,
		},
	});
	authInfo.accessToken = response.data.data.access_token;
	authInfo.refreshToken = response.data.data.refresh_token;

	const userInfo = await axios({
		method: "get",
		url: `${env.apiUrl}/users/me`,
		headers: {
			Authorization: `Bearer ${authInfo.accessToken}`,
		},
	});
	authInfo.userId = userInfo.data.data.id;
};
const refreshAuth = async () => {
	const response = await axios({
		method: "post",
		url: `${env.apiUrl}/auth/refresh-token`,
		data: {
			refresh_token: authInfo.refreshToken,
		},
	});

	authInfo.accessToken = response.data.data.access_token;
	authInfo.refreshToken = response.data.data.refresh_token;
};

const quizAction = async (payload) => {
	try {
		await axios({
			method: "post",
			url: `${env.apiUrl}/quiz-question-answers`,
			headers: {
				Authorization: `Bearer ${authInfo.accessToken}`,
			},
			data: {
				quiz_question_id: payload.id,
				selected_answer_index: random(0, payload.answers.length - 1),
			},
		});
	} catch (error) {
		console.log("Error quiz action");
	}
};

const surveyAction = async (payload) => {
	for (const survey of payload.survey_dtos) {
		if (survey.type === "SingleChoice") {
			await axios({
				method: "post",
				url: `${env.apiUrl}/survey-question-responses`,
				headers: {
					Authorization: `Bearer ${authInfo.accessToken}`,
				},
				data: {
					selected_options: [random(0, survey.options.length - 1)],
					survey_question_id: survey.id,
				},
			});
		} else if (survey.type === "FreeText") {
			await axios({
				method: "post",
				url: `${env.apiUrl}/survey-question-responses`,
				headers: {
					Authorization: `Bearer ${authInfo.accessToken}`,
				},
				data: {
					response_text: comment(),
					survey_question_id: survey.id,
				},
			});
		}
	}
};

const run = async () => {
	if (firstRun) {
		await getAuth();
		firstRun = false;
	} else await refreshAuth();
	const client = new WebSocketClient();
	client.connect(getSocketUrl());
	client.on("connectFailed", (error) => {
		console.log("Connect Error");
	});
	client.on("connect", (connection) => {
		console.log(`WebSocket Client Connected - name: ${name}`);
		connection.on("error", (error) => {
			console.log("Connection Error");
		});
		connection.on("message", (message) => {
			if (message.type === "utf8") {
				message.utf8Data = JSON.parse(message.utf8Data);
				switch (message.utf8Data[2]) {
					case "GetLiveStream":
						livestreamId = message.utf8Data[3].id;
						connection.send(
							JSON.stringify([
								2,
								getRandomString(24),
								"Log",
								{
									message: message.utf8Data[3].id,
									timestamp_request: "2",
									timestamp_response: "3",
									action: "GetLiveStream",
									connection_id: name,
								},
							])
						);
						break;
					case "ReactLiveStream":
						break;
					case "CommentLiveStream":
						break;
					case "QuestionLiveStream":
						break;
					case "StartMiniGame":
						connection.send(
							JSON.stringify([
								2,
								getRandomString(24),
								"Log",
								{
									message: message.utf8Data[3].id,
									timestamp_request: "2",
									timestamp_response: "3",
									action: "StartMiniGame",
									connection_id: name,
								},
							])
						);
						quizAction(message.utf8Data[3]);
						break;
					case "StartSurvey":
						connection.send(
							JSON.stringify([
								2,
								getRandomString(24),
								"Log",
								{
									message: message.utf8Data[3].id,
									timestamp_request: "2",
									timestamp_response: "3",
									action: "StartSurvey",
									connection_id: name,
								},
							])
						);
						surveyAction(message.utf8Data[3]);
						break;
					case "StartCallToAction":
						connection.send(
							JSON.stringify([
								2,
								getRandomString(24),
								"Log",
								{
									message: message.utf8Data[3].id,
									timestamp_request: "2",
									timestamp_response: "3",
									action:
										"StartCallToAction: " + message.utf8Data[3].name,
									connection_id: name,
								},
							])
						);
						if (message.utf8Data[3].survey_dtos) {
							surveyAction(message.utf8Data[3]);
						}
						break;
					case "StopMiniGame":
						connection.send(
							JSON.stringify([
								2,
								getRandomString(24),
								"Log",
								{
									message: message.utf8Data[3].id,
									timestamp_request: "2",
									timestamp_response: "3",
									action: "StopMiniGame",
									connection_id: name,
								},
							])
						);
						break;
					case "StartRankingMiniGame":
						connection.send(
							JSON.stringify([
								2,
								getRandomString(24),
								"Log",
								{
									message: message.utf8Data[3].id,
									timestamp_request: "2",
									timestamp_response: "3",
									action: "StartRankingMiniGame",
									connection_id: name,
								},
							])
						);
						break;
					case "StopRankingMiniGame":
						connection.send(
							JSON.stringify([
								2,
								getRandomString(24),
								"Log",
								{
									message: message.utf8Data[3].id,
									timestamp_request: "2",
									timestamp_response: "3",
									action: "StopRankingMiniGame",
									connection_id: name,
								},
							])
						);
						break;
					case "StopSurvey":
						connection.send(
							JSON.stringify([
								2,
								getRandomString(24),
								"Log",
								{
									message: message.utf8Data[3].id,
									timestamp_request: "2",
									timestamp_response: "3",
									action: "StopSurvey",
									connection_id: name,
								},
							])
						);
						break;
					case "StopCallToAction":
						connection.send(
							JSON.stringify([
								2,
								getRandomString(24),
								"Log",
								{
									message: message.utf8Data[3].id,
									timestamp_request: "2",
									timestamp_response: "3",
									action:
										"StopCallToAction: " + message.utf8Data[3].name,
									connection_id: name,
								},
							])
						);
						break;
					default:
						break;
				}
			}
		});
		connection.send(JSON.stringify([2, getRandomString(24), "GetLiveStream", {}]));
		// React
		let reactTimer;
		const reactTimerAction = () => {
			if (connection.connected && livestreamId.length) {
				const id = getRandomString(24);
				connection.send(
					JSON.stringify([
						2,
						id,
						"ReactLiveStream",
						{
							id: livestreamId,
							reaction_type: shuffle(reacts)[0],
						},
					])
				);
				clearInterval(reactTimer);
				reactTimer = setInterval(reactTimerAction, random(3000, 10000));
			}
		};
		reactTimer = setInterval(reactTimerAction, 50);
		// Comment
		let commentTimer;
		const commentTimerAction = () => {
			if (connection.connected && livestreamId.length) {
				const id = getRandomString(24);
				connection.send(
					JSON.stringify([
						2,
						id,
						"CommentLiveStream",
						{
							id: livestreamId,
							text: comment(),
						},
					])
				);
				clearInterval(commentTimer);
				commentTimer = setInterval(commentTimerAction, random(3000, 10000));
			}
		};
		commentTimer = setInterval(commentTimerAction, 50);
		// Question
		let questionTimer;
		const questionTimerAction = () => {
			if (connection.connected && livestreamId.length) {
				const id = getRandomString(24);
				connection.send(
					JSON.stringify([
						2,
						id,
						"QuestionLiveStream",
						{
							id: livestreamId,
							text: question(),
						},
					])
				);
				clearInterval(questionTimer);
				questionTimer = setInterval(questionTimerAction, random(3000, 10000));
			}
		};
		questionTimer = setInterval(questionTimerAction, 50);

		connection.on("close", async () => {
			console.log("SLEEPING");
			await sleep(5000);
			console.log("WAKE UP");
			run();
		});
	});
};
module.exports = run;
