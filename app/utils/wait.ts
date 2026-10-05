/** ms 동안 대기하는 함수 */
export const wait = (ms: number) =>
	new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});
