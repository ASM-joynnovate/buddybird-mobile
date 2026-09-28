import { File, Paths } from 'expo-file-system';

/** iOS가 앱 폴더를 바꾼 뒤에도 저장한 파일을 가리키는 주소 */
export const resolveFileUri = (uri: string) => {
	const documentRoot = Paths.document.uri.endsWith('/') ? Paths.document.uri : `${Paths.document.uri}/`;

	/** 문서 폴더 기준 주소, 폴더 밖을 가리키는 경로는 오류 */
	const resolveDocumentPath = (directory: string, relativePath: string) => {
		const decodedPath = decodeURIComponent(relativePath);
		const containsTraversal = decodedPath.split('/').some((part) => part === '..' || part === '.');
		const isInvalidPath =
			!decodedPath ||
			decodedPath.startsWith('/') ||
			containsTraversal ||
			decodedPath.includes('\\') ||
			decodedPath.includes('\0');

		if (isInvalidPath) {
			throw new Error('Invalid media path');
		}

		return documentRoot + directory + relativePath;
	};

	if (uri.startsWith('recording://')) {
		const recordingPath = uri.slice('recording://'.length);

		return resolveDocumentPath('recordings/', recordingPath);
	}

	if (uri.startsWith('photo://')) {
		// 사진 주소는 % 기호를 포함한 실제 파일 이름 그대로 저장함
		const fileName = uri.slice('photo://'.length);

		return resolveDocumentPath('photos/', encodeURIComponent(fileName));
	}

	if (!uri.startsWith('file://')) {
		return uri;
	}

	const recordingPathIndex = uri.indexOf('/recordings/');

	if (recordingPathIndex >= 0) {
		const recordingPath = uri.slice(recordingPathIndex + '/recordings/'.length);

		return resolveDocumentPath('recordings/', recordingPath);
	}

	const documentPathIndex = uri.indexOf('/Documents/');

	if (documentPathIndex >= 0) {
		const documentPath = uri.slice(documentPathIndex + '/Documents/'.length);

		return resolveDocumentPath('', documentPath);
	}

	const cachePathIndex = uri.indexOf('/Library/Caches/');

	if (cachePathIndex >= 0) {
		const cacheRoot = Paths.cache.uri.endsWith('/') ? Paths.cache.uri : `${Paths.cache.uri}/`;
		const cachedPath = uri.slice(cachePathIndex + '/Library/Caches/'.length);

		return cacheRoot + cachedPath;
	}

	return uri;
};

/** 파일 존재 여부와 크기, 읽을 수 없으면 오류 */
export const readFileInfo = (uri: string) => {
	const file = new File(resolveFileUri(uri));

	if (!file.exists) {
		// exists가 false여도 부모 폴더 목록에 있으면 접근할 수 없는 파일
		if (file.parentDirectory.list().some((entry) => entry.name === file.name)) {
			throw new Error('File is inaccessible');
		}

		return { exists: false, size: 0 };
	}

	const handle = file.open();

	try {
		handle.readBytes(1);

		return { exists: true, size: handle.size ?? file.size };
	} finally {
		handle.close();
	}
};

/** 파일이 있으면 삭제 */
export const deleteFile = (uri: string) => {
	const file = new File(uri);

	if (file.exists) {
		file.delete();
	}
};
