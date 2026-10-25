import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (process.env.CI || process.env.HUSKY === '0' || !existsSync('.git')) process.exit(0);

/** git 명령 실행 함수 */
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

// hook 경로를 worktree마다 따로 저장
git('config', '--local', 'extensions.worktreeConfig', 'true');
process.env.GIT_CONFIG = git('rev-parse', '--git-path', 'config.worktree');
const error = (await import('husky')).default();
if (error) throw new Error(error);
